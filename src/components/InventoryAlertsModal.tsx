import React, { useState } from 'react';
import {
  X,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  Truck,
  Plus,
  Minus,
  RotateCcw,
  Sliders,
  DollarSign,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  RefreshCw,
  TrendingDown,
  ShieldCheck,
  Building2,
  FileCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RawMaterialStockItem, MaterialQueueRequirement, InventoryAlertNotification, PaintProject } from '../types';
import { formatCurrency } from '../lib/utils';
import { playClickSound } from '../lib/soundUtils';

interface InventoryAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: RawMaterialStockItem[];
  requirements: MaterialQueueRequirement[];
  alerts: InventoryAlertNotification[];
  queuedProjects: PaintProject[];
  onUpdateStock: (materialId: string, newStockKg: number) => void;
  onUpdateThreshold: (materialId: string, newThresholdKg: number) => void;
  onQuickRestockAll: () => void;
  onResetToDefault: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export function InventoryAlertsModal({
  isOpen,
  onClose,
  inventory,
  requirements,
  alerts,
  queuedProjects,
  onUpdateStock,
  onUpdateThreshold,
  onQuickRestockAll,
  onResetToDefault,
  soundEnabled,
  onToggleSound,
}: InventoryAlertsModalProps) {
  const [activeTab, setActiveTab] = useState<'alerts' | 'matrix' | 'queue_impact'>('alerts');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [editingThresholdId, setEditingThresholdId] = useState<string | null>(null);
  const [tempThreshold, setTempThreshold] = useState<number>(0);
  const [restockSuccessMessage, setRestockSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  const totalDeficitCost = requirements
    .filter((r) => r.status === 'critical' || r.status === 'warning')
    .reduce((acc, r) => acc + r.shortfallKg * r.unitCostPerKg, 0);

  const handleQuickRestock = (materialId: string, addKg: number) => {
    const mat = inventory.find((m) => m.id === materialId);
    if (!mat) return;
    const newStock = parseFloat((mat.currentStockKg + addKg).toFixed(1));
    onUpdateStock(materialId, newStock);
    setRestockSuccessMessage(`Restocked +${addKg} kg of ${mat.name}`);
  };

  const handleAutoFillToThreshold = (req: MaterialQueueRequirement) => {
    const needed = Math.max(50, Math.ceil(req.shortfallKg + 50));
    handleQuickRestock(req.materialId, needed);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans text-slate-200"
        >
          {/* Modal Header */}
          <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  criticalCount > 0
                    ? 'bg-red-500/20 border-red-500/40 text-red-400'
                    : warningCount > 0
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                }`}
              >
                {criticalCount > 0 ? (
                  <AlertCircle className="w-6 h-6 animate-pulse" />
                ) : warningCount > 0 ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <ShieldCheck className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider font-mono">
                    Raw Material Inventory & Alert Console
                  </h2>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                      criticalCount > 0
                        ? 'bg-red-950 border-red-500 text-red-300 animate-pulse'
                        : warningCount > 0
                        ? 'bg-amber-950 border-amber-500 text-amber-300'
                        : 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    }`}
                  >
                    {criticalCount > 0
                      ? `${criticalCount} Critical Shortages`
                      : warningCount > 0
                      ? `${warningCount} Low Buffer Warnings`
                      : 'All Levels Healthy'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Real-time stock threshold monitoring evaluated against {queuedProjects.length} queued batch(es)
                </p>
              </div>
            </div>

            {/* Controls: Audio Toggle, Close */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleSound}
                title={soundEnabled ? 'Mute alert chimes' : 'Enable audio alert chimes'}
                className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors font-mono ${
                  soundEnabled
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="hidden sm:inline text-[10px] uppercase font-bold">
                  {soundEnabled ? 'Audio On' : 'Muted'}
                </span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Telemetry Summary Strip */}
          <div className="bg-slate-950/60 border-b border-slate-800 px-4 py-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase">Critical Deficits</div>
              <div className="text-sm font-bold text-red-400 mt-0.5">
                {criticalCount} Item{criticalCount !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase">Buffer Warnings</div>
              <div className="text-sm font-bold text-amber-400 mt-0.5">
                {warningCount} Item{warningCount !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase">Queued Batches</div>
              <div className="text-sm font-bold text-slate-200 mt-0.5">
                {queuedProjects.length} Projects (
                {queuedProjects.reduce((acc, p) => acc + p.volumeGallons, 0)} Gal)
              </div>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase">Est. Restock Expense</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                {formatCurrency(totalDeficitCost)}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-4 pt-3 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0 bg-slate-900">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('alerts')}
                className={`px-3 py-1.5 text-xs font-mono font-bold uppercase rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'alerts'
                    ? 'border-emerald-500 text-emerald-400 bg-slate-800/80'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Active Alerts ({alerts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('matrix')}
                className={`px-3 py-1.5 text-xs font-mono font-bold uppercase rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'matrix'
                    ? 'border-emerald-500 text-emerald-400 bg-slate-800/80'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Full Inventory Matrix ({inventory.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('queue_impact')}
                className={`px-3 py-1.5 text-xs font-mono font-bold uppercase rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'queue_impact'
                    ? 'border-emerald-500 text-emerald-400 bg-slate-800/80'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Queue Impact Breakdown</span>
              </button>
            </div>

            {/* Quick Bulk Restock Button */}
            {(criticalCount > 0 || warningCount > 0) && (
              <button
                type="button"
                onClick={onQuickRestockAll}
                className="mb-1 text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg border border-emerald-400 flex items-center gap-1 shadow-md transition-colors uppercase"
              >
                <RefreshCw className="w-3 h-3" />
                <span className="hidden sm:inline">Replenish All Shortages</span>
                <span className="sm:hidden">Replenish All</span>
              </button>
            )}
          </div>

          {/* Success Toast Bar */}
          <AnimatePresence>
            {restockSuccessMessage && (
              <motion.div
                initial={{ opacity: 0, y: -16, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  y: -10,
                  scale: 0.92,
                  transition: { duration: 0.22, ease: 'easeInOut' },
                }}
                transition={{
                  type: 'spring',
                  stiffness: 420,
                  damping: 18,
                  mass: 0.8,
                }}
                onClick={() => {
                  playClickSound();
                  setRestockSuccessMessage(null);
                }}
                className="bg-emerald-950/95 border-b border-emerald-500/60 px-4 py-2 text-xs text-emerald-200 font-mono flex items-center justify-between gap-2 cursor-pointer select-none transition-transform active:scale-[0.99] hover:bg-emerald-900/90 shadow-md"
                title="Tap notification to dismiss"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{restockSuccessMessage}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[9px] text-emerald-300 font-bold uppercase hidden sm:inline bg-emerald-900/80 px-1.5 py-0.5 rounded border border-emerald-500/40">
                    Tap to dismiss
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playClickSound();
                      setRestockSuccessMessage(null);
                    }}
                    className="p-1 text-emerald-400 hover:text-white rounded hover:bg-emerald-800/60 transition-colors"
                    title="Dismiss"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tab Content Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {/* TAB 1: ACTIVE ALERTS */}
            {activeTab === 'alerts' && (
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 space-y-2">
                    <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
                    <h3 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-wider">
                      Zero Critical Shortages Detected
                    </h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      All raw materials have sufficient stock on hand to fulfill all {queuedProjects.length} pending batches in the queue without violating safety thresholds.
                    </p>
                  </div>
                ) : (
                  alerts.map((alert) => {
                    const req = requirements.find((r) => r.materialId === alert.materialId);
                    if (!req) return null;

                    const isDeficit = req.projectedRemainingKg < 0;

                    return (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-xl border transition-all ${
                          alert.severity === 'critical'
                            ? 'bg-red-950/30 border-red-500/50 shadow-md'
                            : 'bg-amber-950/30 border-amber-500/50'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                          {/* Alert Info */}
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-3.5 h-3.5 rounded-full mt-1 shrink-0 ${
                                alert.severity === 'critical' ? 'bg-red-400 animate-pulse' : 'bg-amber-400'
                              }`}
                            />
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-sm font-bold text-white font-sans">
                                  {req.materialName}
                                </h4>
                                <span className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                                  {req.chemicalTradeName}
                                </span>
                                <span
                                  className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                                    alert.severity === 'critical'
                                      ? 'bg-red-500 text-white'
                                      : 'bg-amber-500 text-slate-950'
                                  }`}
                                >
                                  {isDeficit ? 'Critical Deficit' : 'Safety Buffer Violation'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 mt-1 font-sans">
                                {alert.message}
                              </p>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 font-mono text-xs">
                            <button
                              type="button"
                              onClick={() => handleAutoFillToThreshold(req)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg border border-emerald-400 font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Restock +{Math.max(50, Math.ceil(req.shortfallKg + 50))} kg</span>
                            </button>
                          </div>
                        </div>

                        {/* Metrics Bar & Progression */}
                        <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase block">Current Stock</span>
                            <span className="text-sm font-bold text-slate-100">{req.currentStockKg} kg</span>
                          </div>

                          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase block">Queue Demand</span>
                            <span className="text-sm font-bold text-blue-400">{req.totalRequiredKg} kg</span>
                          </div>

                          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase block">Critical Threshold</span>
                            <span className="text-sm font-bold text-amber-400">{req.criticalThresholdKg} kg</span>
                          </div>

                          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase block">
                              {req.projectedRemainingKg < 0 ? 'Production Shortfall' : 'Projected Balance'}
                            </span>
                            <span
                              className={`text-sm font-bold ${
                                req.projectedRemainingKg < 0 ? 'text-red-400' : 'text-amber-400'
                              }`}
                            >
                              {req.projectedRemainingKg < 0
                                ? `-${Math.abs(req.projectedRemainingKg)} kg DEFICIT`
                                : `${req.projectedRemainingKg} kg`}
                            </span>
                          </div>
                        </div>

                        {/* Affected Project Tags */}
                        {req.affectedProjects.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                            <span className="text-slate-500 text-[10px] uppercase">
                              Blocks {req.affectedProjects.length} Queue Job(s):
                            </span>
                            {req.affectedProjects.map((ap) => (
                              <span
                                key={ap.projectId}
                                className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300"
                              >
                                {ap.projectName} ({ap.requiredKg} kg)
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: FULL INVENTORY MATRIX */}
            {activeTab === 'matrix' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-mono text-slate-400 px-1 mb-1">
                  <span>Material / Chemical Grade</span>
                  <div className="flex gap-8">
                    <span>Stock / Queue / Safety Buffer</span>
                    <span>Quick Adjust</span>
                  </div>
                </div>

                {requirements.map((req) => {
                  const isEditing = editingThresholdId === req.materialId;

                  return (
                    <div
                      key={req.materialId}
                      className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        req.status === 'critical'
                          ? 'bg-red-950/20 border-red-500/40'
                          : req.status === 'warning'
                          ? 'bg-amber-950/20 border-amber-500/40'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      {/* Left: Swatch & Name */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: req.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-100 truncate">
                              {req.materialName}
                            </span>
                            <span
                              className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                                req.status === 'critical'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : req.status === 'warning'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {req.status === 'critical' ? 'Critical' : req.status === 'warning' ? 'Low Stock' : 'Optimal'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            {req.chemicalTradeName} • {req.supplier} ({req.leadTimeDays}d lead)
                          </div>
                        </div>
                      </div>

                      {/* Middle: Stock Breakdown Progress */}
                      <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                        <div className="text-right">
                          <div className="text-slate-200 font-bold">
                            {req.currentStockKg} kg{' '}
                            <span className="text-[10px] text-slate-500">
                              (Req: {req.totalRequiredKg} kg)
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Safety Threshold: {req.criticalThresholdKg} kg
                          </div>
                        </div>

                        {/* Right: Quick Adjust buttons (+25kg, +100kg, -25kg) */}
                        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateStock(req.materialId, Math.max(0, req.currentStockKg - 25))
                            }
                            title="Simulate 25kg draw"
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickRestock(req.materialId, 50)}
                            title="Quick restock +50kg"
                            className="px-2 py-0.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold rounded"
                          >
                            +50kg
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickRestock(req.materialId, 200)}
                            title="Quick restock +200kg"
                            className="px-2 py-0.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold rounded"
                          >
                            +200kg
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 3: QUEUE IMPACT BREAKDOWN */}
            {activeTab === 'queue_impact' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-400 font-mono">
                  Review how each queued job impacts total inventory consumption:
                </div>

                {queuedProjects.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
                    <p className="text-xs text-slate-400 font-mono">
                      No active projects in the queue.
                    </p>
                  </div>
                ) : (
                  queuedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full border border-slate-700"
                            style={{ backgroundColor: project.colorHex }}
                          />
                          <span className="text-xs font-bold text-white">{project.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            {project.paintType}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {project.volumeGallons} Gallons (~{(project.volumeGallons * 4.75).toFixed(1)} kg)
                        </span>
                      </div>

                      {/* Required materials for this single project */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-900 text-[11px] font-mono">
                        {requirements.map((req) => {
                          const projectDemand = req.affectedProjects.find(
                            (ap) => ap.projectId === project.id
                          );
                          if (!projectDemand || projectDemand.requiredKg <= 0) return null;

                          return (
                            <div
                              key={req.materialId}
                              className="bg-slate-900/60 p-1.5 rounded border border-slate-800/80 flex items-center justify-between"
                            >
                              <span className="text-slate-400 truncate max-w-[110px]">
                                {req.materialName}
                              </span>
                              <strong className="text-slate-200">
                                {projectDemand.requiredKg} kg
                              </strong>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onResetToDefault}
              className="text-xs font-mono text-slate-500 hover:text-slate-300 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Factory Inventory Benchmarks</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs uppercase px-4 py-2 rounded-lg transition-colors"
            >
              Close Console
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
