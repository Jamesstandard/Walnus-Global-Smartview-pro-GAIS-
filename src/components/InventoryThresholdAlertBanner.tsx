import React from 'react';
import { AlertTriangle, AlertCircle, ArrowRight, ShieldAlert, Truck, Sparkles, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MaterialQueueRequirement, InventoryAlertNotification } from '../types';

interface InventoryThresholdAlertBannerProps {
  alerts: InventoryAlertNotification[];
  requirements: MaterialQueueRequirement[];
  onOpenAlertsModal: () => void;
  onQuickRestockAll?: () => void;
}

export function InventoryThresholdAlertBanner({
  alerts,
  requirements,
  onOpenAlertsModal,
  onQuickRestockAll,
}: InventoryThresholdAlertBannerProps) {
  if (alerts.length === 0) {
    return (
      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2 text-emerald-300">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold uppercase tracking-wider text-[11px]">
            Inventory Levels Optimal
          </span>
          <span className="text-slate-400 hidden sm:inline text-[10px]">
            • All raw materials meet safety thresholds for current queue
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenAlertsModal}
          className="text-[10px] text-emerald-400 hover:text-emerald-300 underline font-semibold flex items-center gap-1"
        >
          <span>View Stock Matrix</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    );
  }

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
  const warningAlerts = alerts.filter((a) => a.severity === 'warning');
  const isCritical = criticalAlerts.length > 0;

  // Shortest supplier lead time among affected materials
  const affectedReqs = requirements.filter((r) => r.status === 'critical' || r.status === 'warning');
  const minLeadTime = affectedReqs.reduce((min, r) => Math.min(min, r.leadTimeDays), 99);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`rounded-xl p-3 border shadow-lg transition-all ${
        isCritical
          ? 'bg-red-950/90 border-red-500/60 shadow-red-950/50'
          : 'bg-amber-950/90 border-amber-500/60 shadow-amber-950/50'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Left: Icon & Alert Title */}
        <div className="flex items-start sm:items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
              isCritical
                ? 'bg-red-900/80 border-red-400 text-red-200 animate-pulse'
                : 'bg-amber-900/80 border-amber-400 text-amber-200'
            }`}
          >
            {isCritical ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-xs font-bold uppercase font-mono tracking-wider ${
                  isCritical ? 'text-red-200' : 'text-amber-200'
                }`}
              >
                {isCritical
                  ? `CRITICAL INVENTORY SHORTAGE (${criticalAlerts.length} Item${criticalAlerts.length > 1 ? 's' : ''})`
                  : `LOW STOCK BUFFER ALERT (${warningAlerts.length} Item${warningAlerts.length > 1 ? 's' : ''})`}
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                  isCritical
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-amber-500 text-slate-950'
                }`}
              >
                Queue At Risk
              </span>
            </div>

            <p className="text-[11px] text-slate-300 mt-0.5 font-sans leading-tight">
              {isCritical ? (
                <span>
                  <strong>{criticalAlerts[0]?.materialName}</strong> and other materials will deplete before completing current staging jobs.
                </span>
              ) : (
                <span>
                  Current queue demand will draw raw materials below the safety critical threshold.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Actions & Lead Time */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 font-mono text-xs">
          {minLeadTime < 99 && (
            <div className="hidden lg:flex items-center gap-1 text-[10px] text-slate-300 bg-slate-900/80 px-2 py-1 rounded border border-slate-700">
              <Truck className="w-3 h-3 text-emerald-400" />
              <span>Lead time: {minLeadTime}d</span>
            </div>
          )}

          {onQuickRestockAll && isCritical && (
            <button
              type="button"
              onClick={onQuickRestockAll}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-[10px] sm:text-[11px] uppercase py-1.5 px-2.5 rounded-lg border border-emerald-400 flex items-center gap-1 shadow-md transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Auto-Replenish</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenAlertsModal}
            className={`font-bold text-[10px] sm:text-[11px] uppercase py-1.5 px-3 rounded-lg border flex items-center gap-1.5 transition-all shadow-md ${
              isCritical
                ? 'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white border-red-400'
                : 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-slate-950 border-amber-300'
            }`}
          >
            <span>Inspect Alerts ({alerts.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
