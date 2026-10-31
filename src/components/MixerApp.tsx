import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, saveProjectOffline } from '../db';
import {
  Beaker,
  Search,
  RefreshCw,
  ClipboardList,
  CheckCircle2,
  ChevronRight,
  PackageSearch,
  ListFilter,
  ArrowLeft,
  FileText,
  HardDrive,
  Plus,
  Bell,
  AlertCircle,
  AlertTriangle,
  Package,
  Layers,
  Sparkles,
  Sliders,
  Check,
  X,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Zap,
  ArrowUpDown,
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import {
  fastStaggerContainer,
  fastStaggerItem,
  gridStaggerContainer,
  gridStaggerItem,
} from '../lib/motionVariants';
import { formatCurrency, generateId } from '../lib/utils';
import { playClickSound } from '../lib/soundUtils';
import { backgroundAgentManager } from '../lib/backgroundAgentManager';
import { PaintProject, RawMaterialStockItem, LocalizationSettings } from '../types';
import { getStoredLocalization } from '../data/userProfileSettings';
import { PaintFormulationDonutChart } from './PaintFormulationDonutChart';
import { InventoryThresholdAlertBanner } from './InventoryThresholdAlertBanner';
import { InventoryAlertsModal } from './InventoryAlertsModal';
import { RawMaterialsInventoryMatrix } from './RawMaterialsInventoryMatrix';
import { RawMaterialsInventoryD3Chart } from './RawMaterialsInventoryD3Chart';
import {
  getStoredInventory,
  saveStoredInventory,
  evaluateQueueInventoryRequirements,
  generateInventoryAlerts,
  INITIAL_RAW_MATERIALS,
  calculateSingleProjectMaterials,
} from '../data/rawMaterialsInventory';
import { playAlertChime } from '../lib/soundUtils';

interface MixerAppProps {
  onOpenWorkspace?: () => void;
}

export function MixerApp({ onOpenWorkspace }: MixerAppProps) {
  const projects = useLiveQuery(() => db.projects.toArray()) || [];
  const [selectedProject, setSelectedProject] = useState<PaintProject | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [marketPrices, setMarketPrices] = useState<{ name: string; price: number }[]>([
    { name: 'Redispersible VAE Polymer Binder Powder', price: 3.15 },
    { name: 'Polymer-Modified Anti-Crack Wall Screening Mortar', price: 1.85 },
    { name: 'Micronized Marble Dust & Fine Silica (Wall Skim)', price: 0.72 },
    { name: 'HPMC Cellulosic Wall Thickener & Water Retainer', price: 7.80 },
    { name: 'Alkali-Resistant Acrylic Wall Bonding Primer', price: 2.45 },
    { name: 'Polypropylene Anti-Crack Micro-Fibres (6mm Wall)', price: 5.60 },
  ]);
  const [mobileView, setMobileView] = useState<'queue' | 'detail'>('queue');

  // Real-time Inventory State & Modal
  const [inventory, setInventory] = useState<RawMaterialStockItem[]>(() => getStoredInventory());
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dispenseSuccessMessage, setDispenseSuccessMessage] = useState<string | null>(null);
  const [prioritizeToast, setPrioritizeToast] = useState<string | null>(null);
  const [loc, setLoc] = useState<LocalizationSettings>(getStoredLocalization);

  useEffect(() => {
    const handleLocChange = (e: CustomEvent<LocalizationSettings>) => {
      if (e.detail) setLoc(e.detail);
    };
    window.addEventListener('paint_sync_localization_updated', handleLocChange as EventListener);
    return () => {
      window.removeEventListener('paint_sync_localization_updated', handleLocChange as EventListener);
    };
  }, []);

  // Reorder persistence for manufacturing queue prioritization
  const [queueOrderIds, setQueueOrderIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('factory_mixer_queue_order_v1');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load queue order', e);
    }
    return [];
  });

  const pendingProjects = projects.filter(
    (p) => p.status === 'estimated' || p.status === 'formulating' || p.status === 'mixing'
  );

  // Sequenced / Prioritized Project Queue
  const orderedProjects = useMemo(() => {
    if (pendingProjects.length <= 1) return pendingProjects;
    const idOrderMap = new Map<string, number>(queueOrderIds.map((id, idx) => [id, idx]));
    return [...pendingProjects].sort((a, b) => {
      const posA = idOrderMap.get(a.id);
      const posB = idOrderMap.get(b.id);
      if (typeof posA === 'number' && typeof posB === 'number') {
        return posA - posB;
      }
      if (typeof posA === 'number') return -1;
      if (typeof posB === 'number') return 1;
      const timeA = typeof a.lastUpdated === 'number' ? a.lastUpdated : 0;
      const timeB = typeof b.lastUpdated === 'number' ? b.lastUpdated : 0;
      return timeB - timeA;
    });
  }, [pendingProjects, queueOrderIds]);

  // Handle Drag-and-Drop Reorder of the Queue
  const handleReorderQueue = (newOrder: PaintProject[]) => {
    const newIds = newOrder.map((p) => p.id);
    setQueueOrderIds(newIds);
    try {
      localStorage.setItem('factory_mixer_queue_order_v1', JSON.stringify(newIds));
    } catch (e) {
      console.error('Failed to save queue order', e);
    }
    playClickSound();
    if (newOrder.length > 0) {
      setPrioritizeToast(`Manufacturing Queue Updated: "${newOrder[0].name}" prioritized as Batch #1`);
    }
  };

  // Quick arrow/mobile priority shift
  const handleMoveBatch = (index: number, direction: 'up' | 'down' | 'top') => {
    const current = [...orderedProjects];
    if (direction === 'top') {
      const [moved] = current.splice(index, 1);
      current.unshift(moved);
    } else if (direction === 'up' && index > 0) {
      const temp = current[index];
      current[index] = current[index - 1];
      current[index - 1] = temp;
    } else if (direction === 'down' && index < current.length - 1) {
      const temp = current[index];
      current[index] = current[index + 1];
      current[index + 1] = temp;
    }
    handleReorderQueue(current);
  };

  // Real-time Queue Requirements & Critical Alerts Calculation (calculated against prioritized order)
  const requirements = useMemo(() => {
    return evaluateQueueInventoryRequirements(orderedProjects, inventory);
  }, [orderedProjects, inventory]);

  const alerts = useMemo(() => {
    return generateInventoryAlerts(requirements);
  }, [requirements]);

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  // Sound triggering on critical alert count increase
  const prevCriticalCountRef = useRef(criticalCount);
  useEffect(() => {
    if (soundEnabled && criticalCount > prevCriticalCountRef.current && criticalCount > 0) {
      playAlertChime('critical');
    }
    prevCriticalCountRef.current = criticalCount;
  }, [criticalCount, soundEnabled]);

  useEffect(() => {
    if (!selectedProject && orderedProjects.length > 0) {
      setSelectedProject(orderedProjects[0]);
    }
  }, [orderedProjects, selectedProject]);

  const handleSelectProject = (project: PaintProject) => {
    setSelectedProject(project);
    setMobileView('detail');
  };

  const handleUpdateStock = (materialId: string, newStockKg: number) => {
    const updated = inventory.map((item) =>
      item.id === materialId ? { ...item, currentStockKg: Math.max(0, newStockKg) } : item
    );
    setInventory(updated);
    saveStoredInventory(updated);
    if (soundEnabled) {
      playAlertChime('success');
    }
  };

  const handleUpdateThreshold = (materialId: string, newThresholdKg: number) => {
    const updated = inventory.map((item) =>
      item.id === materialId ? { ...item, criticalThresholdKg: Math.max(1, newThresholdKg) } : item
    );
    setInventory(updated);
    saveStoredInventory(updated);
  };

  const handleQuickRestockAll = () => {
    const updated = inventory.map((item) => {
      const req = requirements.find((r) => r.materialId === item.id);
      if (req && (req.status === 'critical' || req.status === 'warning')) {
        const replenishment = Math.max(100, Math.ceil(req.shortfallKg + 100));
        return { ...item, currentStockKg: parseFloat((item.currentStockKg + replenishment).toFixed(1)) };
      }
      return item;
    });
    setInventory(updated);
    saveStoredInventory(updated);
    if (soundEnabled) {
      playAlertChime('success');
    }
  };

  const handleResetToDefault = () => {
    setInventory(INITIAL_RAW_MATERIALS);
    saveStoredInventory(INITIAL_RAW_MATERIALS);
  };

  const handleDispenseBatch = async () => {
    if (!selectedProject) return;

    // Deduct required materials for selected project from current inventory
    const projectMatDemands = calculateSingleProjectMaterials(selectedProject);
    const updated = inventory.map((item) => {
      const deductKg = projectMatDemands[item.id] || 0;
      return {
        ...item,
        currentStockKg: Math.max(0, parseFloat((item.currentStockKg - deductKg).toFixed(2))),
      };
    });

    setInventory(updated);
    saveStoredInventory(updated);

    // Progress project status to formulating / mixing
    const updatedProject: PaintProject = {
      ...selectedProject,
      status: 'mixing',
      lastUpdated: Date.now(),
    };
    await saveProjectOffline(updatedProject);
    setSelectedProject(updatedProject);

    setDispenseSuccessMessage(
      `Gravimetric dispense completed for "${selectedProject.name}". Inventory consumed and stock updated in real-time.`
    );

    if (soundEnabled) {
      playAlertChime('success');
    }
  };

  const handleSeedDemoProject = async () => {
    const demoBatches: PaintProject[] = [
      {
        id: generateId(),
        name: 'Facade Coating - Commercial Tower B',
        surfaceAreaSqFt: 3500,
        paintType: 'Exterior Acrylic Latex',
        colorName: 'Cobalt Architectural Blue',
        colorHex: '#2563eb',
        volumeGallons: 45,
        status: 'estimated',
        syncStatus: 'pending',
        lastUpdated: Date.now() - 3000,
        images: [],
      },
      {
        id: generateId(),
        name: 'Warehouse Floor Protection - Unit 4',
        surfaceAreaSqFt: 4800,
        paintType: 'Industrial Epoxy High-Build',
        colorName: 'Emerald Safety Floor Green',
        colorHex: '#10b981',
        volumeGallons: 60,
        status: 'estimated',
        syncStatus: 'pending',
        lastUpdated: Date.now() - 2000,
        images: [],
      },
      {
        id: generateId(),
        name: 'Architectural Railings - Sector 7',
        surfaceAreaSqFt: 1800,
        paintType: 'Aliphatic Polyurethane Gloss',
        colorName: 'Amber Safety High-Gloss',
        colorHex: '#f59e0b',
        volumeGallons: 25,
        status: 'estimated',
        syncStatus: 'pending',
        lastUpdated: Date.now() - 1000,
        images: [],
      },
    ];

    for (const b of demoBatches) {
      await saveProjectOffline(b);
    }
    setSelectedProject(demoBatches[0]);
    playClickSound();
  };

  const handleSimulateScraping = async () => {
    setIsScraping(true);
    playClickSound();
    try {
      const results = await backgroundAgentManager.triggerWallScreeningScrapeIsolate('wall screening');
      if (results && results.length > 0) {
        setMarketPrices(
          results.map((r) => ({
            name: r.name,
            price: r.spotPricePerKg,
          }))
        );
      }
    } catch (err) {
      console.error('Error executing isolate scraper in MixerApp:', err);
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-slate-900 overflow-hidden relative font-sans">
      {/* Sidebar - Project Queue (Responsive: full width on mobile if viewing queue, fixed width on md+) */}
      <aside
        className={`flex-col bg-slate-950 border-r border-slate-800 shrink-0 h-full overflow-y-auto z-10 transition-all ${
          mobileView === 'queue' ? 'flex w-full md:w-72 lg:w-80' : 'hidden md:flex md:w-72 lg:w-80'
        }`}
      >
        <div className="p-3 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-tight text-emerald-400">Factory Mixer</span>
            <span className="text-[10px] font-mono text-emerald-300 px-1.5 py-0.5 bg-emerald-950/70 border border-emerald-500/30 rounded">
              {pendingProjects.length} Ready
            </span>
          </div>
          
          {/* Top Quick Alert Trigger */}
          <button
            type="button"
            onClick={() => setIsAlertsModalOpen(true)}
            title="Real-Time Inventory Alert Console"
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10px] font-mono transition-all ${
              criticalCount > 0
                ? 'bg-red-950/90 border-red-500/60 text-red-300 shadow-md shadow-red-950/50'
                : warningCount > 0
                ? 'bg-amber-950/90 border-amber-500/60 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className={`w-3 h-3 ${criticalCount > 0 ? 'text-red-400 animate-pulse' : ''}`} />
            <span className="font-bold">
              {criticalCount > 0 ? `${criticalCount} Deficits` : warningCount > 0 ? `${warningCount} Warn` : 'Stock OK'}
            </span>
          </button>
        </div>

        <div className="p-3 sm:p-4 flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                Manufacturing Queue ({orderedProjects.length})
              </h3>
              <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                Drag handle or tap arrows to prioritize batches
              </p>
            </div>
            {orderedProjects.length > 1 && (
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                Reorderable
              </span>
            )}
          </div>

          {/* Toast Notification when queue priority changes */}
          <AnimatePresence>
            {prioritizeToast && (
              <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                onClick={() => {
                  playClickSound();
                  setPrioritizeToast(null);
                }}
                className="p-2 rounded-lg bg-indigo-950/90 border border-indigo-500/50 text-indigo-200 text-[10px] font-mono flex items-center justify-between gap-2 cursor-pointer shadow-md"
                title="Tap to dismiss"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <ArrowUpDown className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span className="truncate">{prioritizeToast}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    playClickSound();
                    setPrioritizeToast(null);
                  }}
                  className="text-indigo-400 hover:text-white p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {orderedProjects.length === 0 && (
            <div className="text-center p-4 border border-dashed border-slate-800 rounded-xl bg-slate-900/30 space-y-2.5">
              <PackageSearch className="w-7 h-7 text-slate-600 mx-auto" />
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-mono font-semibold">
                  No pending estimations
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Scan in Estimator or load a sample 3-batch queue.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSeedDemoProject}
                className="w-full bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] uppercase py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Load Sample Production Queue</span>
              </button>
            </div>
          )}

          {/* Drag-and-Drop Prioritized Queue with Motion Layout Transitions */}
          <Reorder.Group
            axis="y"
            values={orderedProjects}
            onReorder={handleReorderQueue}
            layout
            className="space-y-2 select-none"
          >
            <AnimatePresence initial={false}>
              {orderedProjects.map((p, index) => {
                const isSelected = selectedProject?.id === p.id;
                const isTopBatch = index === 0;

                return (
                  <Reorder.Item
                    key={p.id}
                    value={p}
                    id={`queue-reorder-item-${p.id}`}
                    layout
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                    transition={{
                      layout: {
                        type: 'spring',
                        damping: 28,
                        stiffness: 350,
                      },
                      opacity: { duration: 0.2 },
                    }}
                    whileDrag={{
                      scale: 1.025,
                      boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(16, 185, 129, 0.4)',
                      zIndex: 50,
                    }}
                    className={`rounded-xl border transition-colors duration-150 flex flex-col gap-2 p-2.5 sm:p-3 relative cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500/70 bg-emerald-950/30 shadow-md shadow-emerald-950/50'
                        : isTopBatch
                        ? 'border-indigo-500/50 bg-slate-900/80 hover:bg-slate-900'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900'
                    }`}
                    onClick={() => handleSelectProject(p)}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {/* Drag Handle with Grip Icon */}
                        <div
                          className="p-1 text-slate-500 hover:text-slate-300 active:text-emerald-400 cursor-grab active:cursor-grabbing rounded hover:bg-slate-800/80 touch-none shrink-0"
                          title="Drag to prioritize batch order"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>

                        {/* Sequence Badge */}
                        <span
                          className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            isTopBatch
                              ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-sm'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          #{index + 1} {isTopBatch ? 'NEXT BATCH' : 'QUEUED'}
                        </span>

                        <span className="text-xs font-semibold text-slate-200 truncate">
                          {p.name}
                        </span>
                      </div>

                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-mono tracking-tighter shrink-0 ${
                          p.status === 'mixing'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pl-5">
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                        <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          <div
                            className="w-2.5 h-2.5 rounded-sm border border-slate-700 shadow-sm shrink-0"
                            style={{ backgroundColor: p.colorHex }}
                          />
                          <span className="uppercase text-[9px]">{p.colorHex}</span>
                        </div>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-300 font-medium">{p.volumeGallons} Gal</span>
                      </div>

                      {/* Quick Move Buttons (Up, Down, Top Priority) */}
                      <div
                        className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded border border-slate-800/80 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!isTopBatch && (
                          <button
                            type="button"
                            onClick={() => handleMoveBatch(index, 'top')}
                            className="p-1 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded text-[9px] font-mono flex items-center gap-0.5"
                            title="Expedite to Batch #1"
                          >
                            <Zap className="w-2.5 h-2.5 fill-amber-400" />
                            <span className="hidden sm:inline text-[8px] font-bold">#1</span>
                          </button>
                        )}
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMoveBatch(index, 'up')}
                            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded"
                            title="Move up in queue"
                          >
                            <ArrowUp className="w-2.5 h-2.5" />
                          </button>
                        )}
                        {index < orderedProjects.length - 1 && (
                          <button
                            type="button"
                            onClick={() => handleMoveBatch(index, 'down')}
                            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded"
                            title="Move down in queue"
                          >
                            <ArrowDown className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </Reorder.Item>
                );
              })}
            </AnimatePresence>
          </Reorder.Group>
        </div>
      </aside>

      {/* Main Content - Formulation & Planning */}
      <main
        className={`flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 flex-col ${
          mobileView === 'detail' || mobileView === 'queue' ? 'flex' : 'hidden md:flex'
        }`}
      >
        {/* Mobile Back Button */}
        <div className="md:hidden mb-3">
          <button
            type="button"
            onClick={() => setMobileView('queue')}
            className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-slate-950 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Queue ({pendingProjects.length})</span>
          </button>
        </div>

        {selectedProject ? (
          <div className="space-y-4 max-w-5xl w-full mx-auto">
            {/* Real-time Inventory Alert Banner (Reactive to current queue demands) */}
            <InventoryThresholdAlertBanner
              alerts={alerts}
              requirements={requirements}
              onOpenAlertsModal={() => setIsAlertsModalOpen(true)}
              onQuickRestockAll={handleQuickRestockAll}
            />

            {/* Batch Dispense Success Toast */}
            <AnimatePresence>
              {dispenseSuccessMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -24, scale: 0.88 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{
                    opacity: 0,
                    y: -15,
                    scale: 0.92,
                    transition: { duration: 0.25, ease: 'easeInOut' },
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 420,
                    damping: 18,
                    mass: 0.8,
                  }}
                  onClick={() => {
                    playClickSound();
                    setDispenseSuccessMessage(null);
                  }}
                  className="bg-emerald-950/95 border border-emerald-500/60 p-3 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-200 font-mono shadow-lg cursor-pointer select-none transition-transform active:scale-[0.99] hover:bg-emerald-900/90"
                  title="Tap notification to dismiss"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">{dispenseSuccessMessage}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] text-emerald-300 font-bold uppercase hidden sm:inline bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-500/40">
                      Tap to dismiss
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playClickSound();
                        setDispenseSuccessMessage(null);
                      }}
                      className="p-1 text-emerald-400 hover:text-white rounded hover:bg-emerald-800/60 transition-colors"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header Card */}
            <div className="p-3.5 sm:p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-sm">
              <div className="flex items-center gap-3">
                {selectedProject.images && selectedProject.images.length > 0 ? (
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-slate-900 relative group">
                    <img
                      src={selectedProject.images[0]}
                      alt="Captured site"
                      className="w-full h-full object-cover"
                    />
                    <div
                      className="absolute inset-0 mix-blend-multiply opacity-50 pointer-events-none"
                      style={{ backgroundColor: selectedProject.colorHex }}
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-lg border border-slate-800 bg-slate-900 flex items-center justify-center shrink-0">
                    <Beaker className="w-6 h-6 text-emerald-400" />
                  </div>
                )}
                <div>
                  <h1 className="text-sm sm:text-base font-bold text-slate-100 uppercase tracking-wider">
                    {selectedProject.name}
                  </h1>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Target: {selectedProject.volumeGallons} Gallons • {selectedProject.paintType}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-auto bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                <div className="text-right">
                  <div className="text-[9px] font-mono text-slate-500 uppercase">Target Hex</div>
                  <div className="text-xs font-mono font-semibold text-slate-200 uppercase">
                    {selectedProject.colorHex}
                  </div>
                </div>
                <div
                  className="w-9 h-9 rounded-lg border border-slate-700 shadow-md shrink-0"
                  style={{ backgroundColor: selectedProject.colorHex }}
                />
              </div>
            </div>

            {/* Formulation Donut Chart: Weight Percentage of Each Raw Material */}
            <PaintFormulationDonutChart
              project={selectedProject}
              marketPrices={marketPrices}
            />

            {/* Live Raw Materials Inventory levels vs thresholds real-time D3 chart */}
            <RawMaterialsInventoryD3Chart
              inventory={inventory}
              requirements={requirements}
            />

            {/* Live Raw Materials Inventory Matrix (Interactive realtime tracking against queue with 7-Day Forecast) */}
            <RawMaterialsInventoryMatrix
              inventory={inventory}
              requirements={requirements}
              alerts={alerts}
              projects={orderedProjects}
              onUpdateStock={handleUpdateStock}
              onUpdateThreshold={handleUpdateThreshold}
              onOpenAlertsModal={() => setIsAlertsModalOpen(true)}
            />

            {/* Responsive 2-Column or Stacking Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Column 1: Market & Formulation */}
              <div className="space-y-4 flex flex-col">
                {/* Pricing Scraper Module */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col flex-1 shadow-sm">
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">
                      Raw Material Market Watch
                    </div>
                    <button
                      type="button"
                      onClick={handleSimulateScraping}
                      disabled={isScraping}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 active:bg-slate-800 border border-slate-700 text-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-mono uppercase tracking-wider disabled:opacity-50 transition-colors"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${isScraping ? 'animate-spin text-emerald-400' : ''}`}
                      />
                      <span>Sync Prices</span>
                    </button>
                  </div>

                  <div className="flex-1 space-y-1.5">
                    {marketPrices.length > 0 ? (
                      <motion.div
                        variants={fastStaggerContainer}
                        initial="hidden"
                        animate="show"
                        className="space-y-1.5"
                      >
                        {marketPrices.map((item) => (
                          <motion.div
                            variants={fastStaggerItem}
                            key={item.name}
                            className="flex justify-between items-center p-2.5 hover:bg-slate-900/60 rounded-lg text-xs border border-slate-900/80 transition-colors"
                          >
                            <span className="text-slate-300 font-medium">{item.name}</span>
                            <span className="font-mono font-semibold text-emerald-400">
                              {formatCurrency(item.price)}/kg
                            </span>
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (
                      <div className="text-center py-6 border border-dashed border-slate-800/80 rounded-lg bg-slate-900/20">
                        <p className="text-[11px] text-slate-500 font-mono">
                          Initiate scraping agent for live raw material costs.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 text-[9px] text-slate-500 font-mono flex items-center justify-between">
                    <span>Scraped via Real-Time API Gateway</span>
                    <span className="text-emerald-500">Live Feeds</span>
                  </div>
                </div>

                {/* Formulation Workflow */}
                {marketPrices.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm"
                  >
                    <div className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider mb-3 flex items-center gap-2">
                      <ClipboardList className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Precision Mixing Sequence</span>
                    </div>
                    <motion.div
                      variants={fastStaggerContainer}
                      initial="hidden"
                      animate="show"
                      className="space-y-2.5"
                    >
                      {[
                        'Add Base Solvent/Water matrix to main industrial vat.',
                        'Slowly disperse Titanium Dioxide under high-shear agitation.',
                        'Introduce Acrylic Resin polymer binder.',
                        'Inject Custom Tint Pigment PB15 to match target hex spectrophotometry.',
                        'QC verification for Krebs-Stormer viscosity and Delta-E color tolerance.',
                      ].map((step, idx) => (
                        <motion.div
                          variants={fastStaggerItem}
                          key={idx}
                          className="flex gap-2.5 items-start p-2.5 bg-slate-900/50 rounded-lg border border-slate-800/60"
                        >
                          <div className="w-5 h-5 rounded-md bg-emerald-900/50 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold font-mono text-[10px] shrink-0">
                            {idx + 1}
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug">{step}</p>
                        </motion.div>
                      ))}
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-3">
                        <div className="h-full bg-emerald-500 w-full" />
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </div>

              {/* Column 2: Bulk Planning, Dispense & Logistics */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col space-y-4 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">
                  Packaging & Gravimetric Batch Execution
                </div>

                <motion.div
                  variants={gridStaggerContainer}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  <motion.div variants={gridStaggerItem} className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-center">
                    <span className="block text-2xl font-mono font-bold text-white">
                      {Math.ceil(selectedProject.volumeGallons / 55)}
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase font-mono mt-1 block tracking-wider">
                      55-Gal Steel Drums
                    </span>
                  </motion.div>
                  <motion.div variants={gridStaggerItem} className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-center">
                    <span className="block text-2xl font-mono font-bold text-emerald-400">
                      {formatCurrency(selectedProject.volumeGallons * 18.5)}
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase font-mono mt-1 block tracking-wider">
                      Est. Material Cost
                    </span>
                  </motion.div>
                </motion.div>

                <div className="space-y-2">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">
                    Mandatory Safety HazMat Labels:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="bg-orange-950/30 border border-orange-500/30 p-2.5 rounded-lg">
                      <div className="text-[9px] text-orange-400 font-bold font-mono uppercase">
                        GHS-07 HAZARD
                      </div>
                      <div className="text-[9px] text-orange-200/70 leading-tight mt-0.5 uppercase tracking-tight font-mono">
                        Harmful / Eye Irritant
                      </div>
                    </div>
                    <div className="bg-red-950/30 border border-red-500/30 p-2.5 rounded-lg">
                      <div className="text-[9px] text-red-400 font-bold font-mono uppercase">
                        UN-1263 PACKAGING
                      </div>
                      <div className="text-[9px] text-red-200/70 leading-tight mt-0.5 uppercase tracking-tight font-mono">
                        Class 3 Liquid
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg space-y-2">
                  <div className="text-[9px] text-slate-400 uppercase font-bold font-mono">
                    Batch Pipeline Status
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                    <span className="text-[10px] text-slate-300 font-mono">Spec Ingest Complete</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        selectedProject.status === 'mixing'
                          ? 'bg-emerald-400'
                          : 'bg-indigo-500 animate-pulse'
                      }`}
                    />
                    <span className="text-[10px] text-slate-200 font-semibold font-mono">
                      {selectedProject.status === 'mixing'
                        ? 'Gravimetric Batch Active in Mixer'
                        : 'Drum Staging & Gravimetric Dispense Ready'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-700" />
                    <span className="text-[10px] text-slate-500 font-mono">Final Quality QC Sign-Off</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {/* Confirm & Dispense Button (Consumes inventory in real-time) */}
                  <button
                    type="button"
                    onClick={handleDispenseBatch}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-mono text-xs font-semibold uppercase py-2.5 rounded-lg border border-emerald-500/40 transition-colors shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm Gravimetric Dispense & Deduct Stock</span>
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAlertsModalOpen(true)}
                      className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs font-semibold uppercase py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Bell className="w-3.5 h-3.5 text-amber-400" />
                      <span>Alert Requisition Hub</span>
                    </button>

                    {onOpenWorkspace && (
                      <button
                        type="button"
                        onClick={onOpenWorkspace}
                        className="w-full bg-blue-950 hover:bg-blue-900 border border-blue-500/50 text-blue-200 hover:text-white font-mono text-xs font-semibold uppercase py-2 rounded-lg transition-colors shadow-md flex items-center justify-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span>Google Docs Export</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-800/60 border border-slate-700/60 flex items-center justify-center">
              <Beaker className="w-8 h-8 text-emerald-500/50" />
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider font-mono text-slate-300 mb-1">
                Select an estimation payload
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Pick a project from the incoming queue on the left to configure formulation, raw material costs, and packaging.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSeedDemoProject}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-semibold uppercase py-2 px-4 rounded-lg flex items-center gap-2 shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Load Sample Formulation Payload</span>
            </button>
          </div>
        )}
      </main>

      {/* Real-time Inventory Alert & Requisition Console Modal */}
      <InventoryAlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        inventory={inventory}
        requirements={requirements}
        alerts={alerts}
        queuedProjects={pendingProjects}
        onUpdateStock={handleUpdateStock}
        onUpdateThreshold={handleUpdateThreshold}
        onQuickRestockAll={handleQuickRestockAll}
        onResetToDefault={handleResetToDefault}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />
    </div>
  );
}
