import React, { useState, useMemo, useEffect } from 'react';
import {
  Package,
  Layers,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  Sliders,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Truck,
  Calendar,
  Clock,
  TrendingDown,
  ShieldAlert,
  ArrowRight,
  Flame,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  staggerContainer,
  staggerItem,
  gridStaggerContainer,
  gridStaggerItem,
} from '../lib/motionVariants';
import {
  RawMaterialStockItem,
  MaterialQueueRequirement,
  InventoryAlertNotification,
  PaintProject,
} from '../types';
import { formatCurrency } from '../lib/utils';
import { playClickSound } from '../lib/soundUtils';
import {
  calculateInventoryDepletionForecast,
  MaterialDepletionForecast,
  OverallForecastSummary,
} from '../data/inventoryForecasting';
import { BackgroundAgentManagerPanel } from './BackgroundAgentManagerPanel';
import { backgroundAgentManager } from '../lib/backgroundAgentManager';

interface RawMaterialsInventoryMatrixProps {
  inventory: RawMaterialStockItem[];
  requirements: MaterialQueueRequirement[];
  alerts: InventoryAlertNotification[];
  projects?: PaintProject[];
  onUpdateStock: (materialId: string, newStockKg: number) => void;
  onUpdateThreshold: (materialId: string, newThresholdKg: number) => void;
  onOpenAlertsModal: () => void;
}

export function RawMaterialsInventoryMatrix({
  inventory,
  requirements,
  alerts,
  projects = [],
  onUpdateStock,
  onUpdateThreshold,
  onOpenAlertsModal,
}: RawMaterialsInventoryMatrixProps) {
  // Main Tab Navigation: 'matrix' (Live Stock Matrix) vs 'forecast' (7-Day Depletion Predictor)
  const [activeTab, setActiveTab] = useState<'matrix' | 'forecast'>('matrix');

  // Matrix Filter Mode
  const [filterMode, setFilterMode] = useState<'all' | 'critical' | 'low'>('all');

  // Forecast Filter Mode
  const [forecastFilter, setForecastFilter] = useState<'all' | 'critical_7d' | 'lead_risk' | 'safe'>('all');

  // Forecast Production Pace Setting
  const [batchesPerDay, setBatchesPerDay] = useState<number>(1);

  const [expandedMatId, setExpandedMatId] = useState<string | null>(null);
  const [editingThresholdId, setEditingThresholdId] = useState<string | null>(null);
  const [tempThreshold, setTempThreshold] = useState<number>(0);

  // Non-blocking isolate forecast summary state
  const [forecastSummary, setForecastSummary] = useState<OverallForecastSummary>(() =>
    calculateInventoryDepletionForecast(projects, inventory, { batchesPerDay })
  );

  // Calculate 7-Day Inventory Depletion Forecast in non-blocking worker isolate
  useEffect(() => {
    let isMounted = true;
    backgroundAgentManager
      .calculateInventoryDepletionInIsolate(projects, inventory, { batchesPerDay })
      .then((summary) => {
        if (isMounted) {
          setForecastSummary(summary);
        }
      })
      .catch((err) => {
        console.error('Isolate forecast failed, fallback sync:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [projects, inventory, batchesPerDay]);

  const filteredRequirements = requirements.filter((req) => {
    if (filterMode === 'critical') return req.status === 'critical';
    if (filterMode === 'low') return req.status === 'warning' || req.status === 'critical';
    return true;
  });

  const filteredForecastMaterials = useMemo(() => {
    return forecastSummary.materialsForecast.filter((m) => {
      if (forecastFilter === 'critical_7d') return m.isCriticalWithin7Days;
      if (forecastFilter === 'lead_risk') return m.hasLeadTimeRisk;
      if (forecastFilter === 'safe') return !m.isCriticalWithin7Days;
      return true;
    });
  }, [forecastSummary, forecastFilter]);

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col space-y-3.5 shadow-sm font-sans">
      {/* Background Agent Manager Panel */}
      <BackgroundAgentManagerPanel />

      {/* Header & Primary Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            {activeTab === 'forecast' ? <Calendar className="w-4 h-4 text-amber-400" /> : <Package className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                {activeTab === 'forecast'
                  ? '7-Day Raw Materials Depletion Forecast'
                  : 'Factory Raw Material Stock & Safety Matrix'}
              </h3>
              {forecastSummary.criticalWithin7DaysCount > 0 && (
                <span className="text-[9px] font-mono bg-red-600 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse shadow-sm">
                  <Flame className="w-2.5 h-2.5" />
                  <span>{forecastSummary.criticalWithin7DaysCount} AT RISK ≤7D</span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              {activeTab === 'forecast'
                ? `Predictive depletion dates calibrated against prioritized project queue (${projects.length} batches)`
                : 'Live gravimetric inventory tracking against queue staging requirements'}
            </p>
          </div>
        </div>

        {/* Primary View Switcher Tabs: Live Matrix vs Forecast */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setActiveTab('matrix');
            }}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'matrix'
                ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Stock Matrix</span>
          </button>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setActiveTab('forecast');
            }}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all relative ${
              activeTab === 'forecast'
                ? 'bg-amber-600 text-slate-950 font-bold shadow-md shadow-amber-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Forecast</span>
            {forecastSummary.criticalWithin7DaysCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STOCK MATRIX VIEW                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <div className="space-y-3">
          {/* Subfilter controls for Matrix */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  filterMode === 'all'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({requirements.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('critical')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  filterMode === 'critical'
                    ? 'bg-red-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Critical ({criticalCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('low')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  filterMode === 'low'
                    ? 'bg-amber-600 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Low Buffer ({warningCount + criticalCount})
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenAlertsModal}
              className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 underline"
            >
              <span>View Alert History Console</span>
            </button>
          </div>

          {/* Materials List */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            {filteredRequirements.map((req) => {
              const isExpanded = expandedMatId === req.materialId;
              const isEditing = editingThresholdId === req.materialId;

              const scaleMax = Math.max(100, req.currentStockKg + req.totalRequiredKg + req.criticalThresholdKg);
              const queuePct = Math.min(100, (req.totalRequiredKg / scaleMax) * 100);
              const currentPct = Math.min(100, (req.currentStockKg / scaleMax) * 100);
              const thresholdPct = Math.min(100, (req.criticalThresholdKg / scaleMax) * 100);

              return (
                <motion.div
                  variants={staggerItem}
                  layout="position"
                  key={req.materialId}
                  className={`rounded-xl border transition-all ${
                    req.status === 'critical'
                      ? 'bg-red-950/20 border-red-500/40 hover:border-red-500/60'
                      : req.status === 'warning'
                      ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/60'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Main Material Row */}
                  <div className="p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    {/* Left: Swatch & Identity */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: req.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-100 truncate">
                            {req.materialName}
                          </span>
                          <span
                            className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded shrink-0 ${
                              req.status === 'critical'
                                ? 'bg-red-500 text-white animate-pulse'
                                : req.status === 'warning'
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {req.status === 'critical'
                              ? req.projectedRemainingKg < 0
                                ? 'Deficit Shortfall'
                                : 'Critical Buffer'
                              : req.status === 'warning'
                              ? 'Low Stock'
                              : 'Optimal'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {req.chemicalTradeName} • {formatCurrency(req.unitCostPerKg)}/kg
                        </div>
                      </div>
                    </div>

                    {/* Center: Inventory Telemetry */}
                    <div className="flex items-center gap-3 text-right font-mono shrink-0">
                      <div>
                        <div className="text-xs font-bold text-slate-200">
                          {req.currentStockKg} kg{' '}
                          <span className="text-[10px] font-normal text-slate-400">
                            / Req: {req.totalRequiredKg} kg
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-400">
                          Safety Threshold: {req.criticalThresholdKg} kg
                        </div>
                      </div>

                      {/* Stock Quick Add Buttons */}
                      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateStock(req.materialId, Math.max(0, req.currentStockKg - 25))
                          }
                          title="Consume 25 kg"
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateStock(req.materialId, parseFloat((req.currentStockKg + 50).toFixed(1)))
                          }
                          title="Restock +50 kg"
                          className="px-1.5 py-0.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold rounded"
                        >
                          +50kg
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateStock(req.materialId, parseFloat((req.currentStockKg + 200).toFixed(1)))
                          }
                          title="Restock +200 kg"
                          className="px-1.5 py-0.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold rounded"
                        >
                          +200kg
                        </button>
                      </div>

                      {/* Expand Toggle */}
                      <button
                        type="button"
                        onClick={() => setExpandedMatId(isExpanded ? null : req.materialId)}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Progress Visual Bar */}
                  <div className="px-3 pb-2.5">
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800/80 relative">
                      <div
                        className={`h-full transition-all ${
                          req.status === 'critical'
                            ? 'bg-red-500'
                            : req.status === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${currentPct}%` }}
                      />
                      <div
                        className="h-full bg-blue-500/70 absolute top-0 left-0"
                        style={{ width: `${queuePct}%` }}
                        title={`Queue Demand: ${req.totalRequiredKg} kg`}
                      />
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-amber-300 shadow"
                        style={{ left: `${thresholdPct}%` }}
                        title={`Safety Threshold: ${req.criticalThresholdKg} kg`}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
                      <span>0 kg</span>
                      <span>Safety Buffer: {req.criticalThresholdKg} kg</span>
                      <span>
                        Projected Balance:{' '}
                        <strong
                          className={
                            req.projectedRemainingKg < 0
                              ? 'text-red-400'
                              : req.projectedRemainingKg <= req.criticalThresholdKg
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }
                        >
                          {req.projectedRemainingKg} kg
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Expandable Details: Threshold adjustment, Supplier info, Affected Jobs */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-slate-800/80 p-3 bg-slate-950/60 rounded-b-xl space-y-2.5 text-xs font-mono"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                            <span className="text-slate-400">Supplier & Lead Time:</span>
                            <span className="text-slate-200 font-semibold truncate max-w-[180px]">
                              {req.supplier} ({req.leadTimeDays}d)
                            </span>
                          </div>

                          {/* Threshold Configuration */}
                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                            <span className="text-slate-400">Critical Safety Threshold:</span>
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={tempThreshold}
                                  onChange={(e) => setTempThreshold(parseFloat(e.target.value) || 0)}
                                  className="w-16 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-right font-mono text-xs text-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    onUpdateThreshold(req.materialId, tempThreshold);
                                    setEditingThresholdId(null);
                                  }}
                                  className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] uppercase font-bold"
                                >
                                  Save
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <strong className="text-amber-400">{req.criticalThresholdKg} kg</strong>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTempThreshold(req.criticalThresholdKg);
                                    setEditingThresholdId(req.materialId);
                                  }}
                                  className="text-[10px] text-slate-400 hover:text-slate-200 underline"
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Affected queue jobs */}
                        {req.affectedProjects.length > 0 && (
                          <div className="pt-2 border-t border-slate-900">
                            <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">
                              Queue Jobs Drawing From This Material:
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {req.affectedProjects.map((p) => (
                                <div
                                  key={p.projectId}
                                  className="p-1.5 bg-slate-900 rounded border border-slate-800 flex items-center justify-between text-[10px]"
                                >
                                  <span className="text-slate-300 truncate max-w-[140px]">
                                    {p.projectName}
                                  </span>
                                  <span className="text-blue-400 font-bold">{p.requiredKg} kg</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 7-DAY INVENTORY DEPLETION FORECAST VIEW                            */}
      {/* ========================================================================= */}
      {activeTab === 'forecast' && (
        <div className="space-y-3.5">
          {/* Predictive Telemetry Cards */}
          <motion.div
            variants={gridStaggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
          >
            {/* Card 1: Critical Breaches in <= 7 Days */}
            <motion.div
              variants={gridStaggerItem}
              className={`p-3 rounded-xl border flex flex-col justify-between ${
                forecastSummary.criticalWithin7DaysCount > 0
                  ? 'bg-red-950/40 border-red-500/60 shadow-lg shadow-red-950/50'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                  Critical Breaches (≤ 7 Days)
                </span>
                <ShieldAlert
                  className={`w-4 h-4 ${
                    forecastSummary.criticalWithin7DaysCount > 0
                      ? 'text-red-400 animate-pulse'
                      : 'text-slate-500'
                  }`}
                />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span
                  className={`text-2xl font-mono font-bold ${
                    forecastSummary.criticalWithin7DaysCount > 0 ? 'text-red-300' : 'text-slate-200'
                  }`}
                >
                  {forecastSummary.criticalWithin7DaysCount}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">materials at risk</span>
              </div>
              <div className="text-[9px] font-mono text-slate-400 mt-1 truncate">
                {forecastSummary.earliestBreachDate
                  ? `Earliest: ${forecastSummary.earliestBreachMaterial} on ${forecastSummary.earliestBreachDate}`
                  : 'All materials have adequate buffer for 7-day queue'}
              </div>
            </motion.div>

            {/* Card 2: Supply Chain Lead Time Risk */}
            <motion.div
              variants={gridStaggerItem}
              className={`p-3 rounded-xl border flex flex-col justify-between ${
                forecastSummary.leadTimeRiskCount > 0
                  ? 'bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-950/50'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                  Lead Time Deficits
                </span>
                <Truck
                  className={`w-4 h-4 ${
                    forecastSummary.leadTimeRiskCount > 0 ? 'text-amber-400' : 'text-slate-500'
                  }`}
                />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span
                  className={`text-2xl font-mono font-bold ${
                    forecastSummary.leadTimeRiskCount > 0 ? 'text-amber-300' : 'text-slate-200'
                  }`}
                >
                  {forecastSummary.leadTimeRiskCount}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">lead time hazards</span>
              </div>
              <div className="text-[9px] font-mono text-slate-400 mt-1 truncate">
                {forecastSummary.leadTimeRiskCount > 0
                  ? 'Delivery lead time > days to depletion: Order PO immediately'
                  : 'Replenishment lead times clear of depletion windows'}
              </div>
            </motion.div>

            {/* Card 3: Queued Batches Scheduled */}
            <motion.div
              variants={gridStaggerItem}
              className="p-3 rounded-xl border bg-slate-900/60 border-slate-800 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                  Queue Pacing Horizon
                </span>
                <Clock className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-mono font-bold text-indigo-300">
                  {forecastSummary.totalBatchesQueued}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Batches ({forecastSummary.totalQueueVolumeGallons} gal)
                </span>
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1">
                <span>Paced at {batchesPerDay} batch/day</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setBatchesPerDay(1)}
                    className={`px-1.5 py-0.2 rounded ${
                      batchesPerDay === 1
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    1/day
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchesPerDay(2)}
                    className={`px-1.5 py-0.2 rounded ${
                      batchesPerDay === 2
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    2/day
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Subfilter controls for Forecast */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-900">
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setForecastFilter('all')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  forecastFilter === 'all'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Materials ({forecastSummary.materialsForecast.length})
              </button>
              <button
                type="button"
                onClick={() => setForecastFilter('critical_7d')}
                className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                  forecastFilter === 'critical_7d'
                    ? 'bg-red-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Critical ≤ 7 Days</span>
                <span className="bg-red-950/80 px-1 rounded text-[9px]">
                  {forecastSummary.criticalWithin7DaysCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setForecastFilter('lead_risk')}
                className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                  forecastFilter === 'lead_risk'
                    ? 'bg-amber-600 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Lead Time Risk</span>
                <span className="bg-amber-950/80 text-amber-200 px-1 rounded text-[9px]">
                  {forecastSummary.leadTimeRiskCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setForecastFilter('safe')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  forecastFilter === 'safe'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Safe Buffer ({forecastSummary.materialsForecast.length - forecastSummary.criticalWithin7DaysCount})
              </button>
            </div>

            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" /> &lt; Critical Buffer
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Optimal Buffer
              </span>
            </div>
          </div>

          {/* List of Material Forecast Cards */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {filteredForecastMaterials.map((m) => {
              const isCritical = m.isCriticalWithin7Days;
              const isLeadRisk = m.hasLeadTimeRisk;
              const isStockout = m.isStockoutWithin7Days;

              return (
                <motion.div
                  variants={staggerItem}
                  layout="position"
                  key={m.materialId}
                  className={`rounded-xl border transition-all p-3.5 space-y-3 ${
                    isCritical
                      ? 'bg-gradient-to-r from-red-950/40 via-red-950/20 to-slate-950 border-red-500/70 shadow-md shadow-red-950/40'
                      : isLeadRisk
                      ? 'bg-gradient-to-r from-amber-950/30 via-slate-950 to-slate-950 border-amber-500/60 shadow-sm'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Row: Identification, Swatch & 7-Day Alert Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className="w-4 h-4 rounded-full shrink-0 shadow-md"
                        style={{ backgroundColor: m.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-100">
                            {m.materialName}
                          </span>

                          {/* Critical within 7 days badge */}
                          {isCritical ? (
                            <span className="text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-red-600 text-white flex items-center gap-1 animate-pulse shadow-sm">
                              <AlertCircle className="w-3 h-3" />
                              <span>
                                {isStockout
                                  ? `Stockout in ${m.daysToStockout} Day${m.daysToStockout === 1 ? '' : 's'} (${m.depletionDate})`
                                  : `Hits Critical in ${m.daysToCritical} Day${m.daysToCritical === 1 ? '' : 's'} (${m.criticalBreachDate})`}
                              </span>
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Safe &gt;7 Days Buffer</span>
                            </span>
                          )}

                          {/* Lead time hazard pill */}
                          {isLeadRisk && (
                            <span className="text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 flex items-center gap-1">
                              <Truck className="w-3 h-3 text-slate-950" />
                              <span>Lead Time Risk ({m.leadTimeDays}d lead time)</span>
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                          {m.chemicalTradeName} • Supplier: <strong className="text-slate-300">{m.supplier}</strong> ({m.leadTimeDays}d lead time)
                        </div>
                      </div>
                    </div>

                    {/* Stock quick restock action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center font-mono text-[10px]">
                      <span className="text-slate-400 text-[10px] mr-1 hidden sm:inline">
                        Quick Restock:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound();
                          onUpdateStock(m.materialId, parseFloat((m.currentStockKg + 50).toFixed(1)));
                        }}
                        className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-bold rounded-lg transition-colors flex items-center gap-1"
                        title="Restock 50 kg"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+50kg</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound();
                          onUpdateStock(m.materialId, parseFloat((m.currentStockKg + 200).toFixed(1)));
                        }}
                        className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-bold rounded-lg transition-colors flex items-center gap-1"
                        title="Restock 200 kg"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+200kg</span>
                      </button>
                    </div>
                  </div>

                  {/* Warning banner if critical within 7 days */}
                  {isCritical && (
                    <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-500/60 text-red-200 text-xs font-mono space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span>
                            Predicted Depletion Breach: {m.criticalBreachDate} (Day {m.daysToCritical})
                          </span>
                        </div>
                        <span className="text-[10px] bg-red-900/90 text-red-100 px-2 py-0.5 rounded border border-red-400/40">
                          Current: {m.currentStockKg} kg → Below Safety Threshold ({m.criticalThresholdKg} kg)
                        </span>
                      </div>

                      {m.triggeringBatch && (
                        <div className="text-[10px] text-red-300 flex items-center gap-1.5">
                          <span>Breach Trigger:</span>
                          <strong className="text-white">
                            Queue Position #{m.triggeringBatch.queuePosition}: "{m.triggeringBatch.projectName}"
                          </strong>
                          <span>(requires {m.triggeringBatch.requiredKg} kg)</span>
                        </div>
                      )}

                      {isLeadRisk && (
                        <div className="text-[10px] text-amber-300 bg-amber-950/60 p-1.5 rounded border border-amber-500/40 flex items-center gap-1.5 mt-1">
                          <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>
                            <strong>Supply Lead Time Warning:</strong> Supplier takes {m.leadTimeDays} days to deliver. Stock breaches safety threshold in {m.daysToCritical} day(s). Expedite PO purchase immediately to prevent manufacturing delay.
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 7-Day Visual Depletion Timeline Strip */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>7-Day Depletion Trajectory (Queue Schedule):</span>
                      <span>
                        Starting: <strong className="text-slate-200">{m.currentStockKg} kg</strong> → 7d Balance:{' '}
                        <strong
                          className={
                            m.projectedBalanceKg < 0
                              ? 'text-red-400 font-bold'
                              : m.projectedBalanceKg <= m.criticalThresholdKg
                              ? 'text-amber-400 font-bold'
                              : 'text-emerald-400'
                          }
                        >
                          {m.projectedBalanceKg} kg
                        </strong>
                      </span>
                    </div>

                    {/* Visual Day-by-Day Progression Grid */}
                    <div className="grid grid-cols-7 gap-1 bg-slate-950 p-1.5 rounded-lg border border-slate-800 font-mono text-center">
                      {m.dailyTimeline.map((day) => {
                        const isDayCritical = day.isBelowCritical;
                        const isDayDepleted = day.isDepleted;

                        return (
                          <div
                            key={day.dayNumber}
                            className={`p-1.5 rounded-md border flex flex-col justify-between transition-colors relative group ${
                              isDayDepleted
                                ? 'bg-red-950/90 border-red-500/90 text-red-200'
                                : isDayCritical
                                ? 'bg-red-950/50 border-red-500/50 text-red-300'
                                : 'bg-slate-900/70 border-slate-800 text-slate-300'
                            }`}
                            title={`Day ${day.dayNumber} (${day.dateString}): Remaining ${day.remainingStockKg} kg (${day.consumedKg} kg consumed)`}
                          >
                            <div className="flex items-center justify-between text-[9px] text-slate-400 border-b border-slate-800/80 pb-0.5">
                              <span className="font-bold">D{day.dayNumber}</span>
                              <span className="text-[8px] text-slate-500">{day.dayName}</span>
                            </div>

                            <div className="my-1">
                              <div
                                className={`text-[10px] font-bold ${
                                  isDayDepleted
                                    ? 'text-red-400'
                                    : isDayCritical
                                    ? 'text-red-300'
                                    : 'text-emerald-400'
                                }`}
                              >
                                {day.remainingStockKg}
                                <span className="text-[8px] font-normal text-slate-400">kg</span>
                              </div>
                              {day.consumedKg > 0 && (
                                <div className="text-[8px] text-blue-400">
                                  -{day.consumedKg}kg
                                </div>
                              )}
                            </div>

                            {/* Mini threshold status indicator dot */}
                            <div className="flex justify-center mt-0.5">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isDayDepleted
                                    ? 'bg-red-500 animate-ping'
                                    : isDayCritical
                                    ? 'bg-red-500'
                                    : 'bg-emerald-500'
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Telemetry Summary Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400 border-t border-slate-900 pt-2">
                    <div className="flex items-center gap-3">
                      <span>Safety Threshold: <strong className="text-amber-400">{m.criticalThresholdKg} kg</strong></span>
                      <span>Total Queue Demand: <strong className="text-blue-400">{m.totalQueueDemandKg} kg</strong></span>
                      <span>Unit Cost: <strong>{formatCurrency(m.unitCostPerKg)}/kg</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound();
                          onOpenAlertsModal();
                        }}
                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 underline"
                      >
                        <span>Supplier & Reorder Info</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      )}
    </div>
  );
}
