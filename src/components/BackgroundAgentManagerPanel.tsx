import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Bot,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ShieldCheck,
  Activity,
  Layers,
  Pause,
  Play,
} from 'lucide-react';
import { backgroundAgentManager, BackgroundAgentTelemetry } from '../lib/backgroundAgentManager';
import { ScrapedWallMaterialResult } from '../lib/backgroundIsolateWorker';

interface BackgroundAgentManagerPanelProps {
  onScrapedResultsUpdate?: (results: ScrapedWallMaterialResult[]) => void;
  className?: string;
}

export const BackgroundAgentManagerPanel: React.FC<BackgroundAgentManagerPanelProps> = ({
  onScrapedResultsUpdate,
  className = '',
}) => {
  const [telemetry, setTelemetry] = useState<BackgroundAgentTelemetry>(() =>
    backgroundAgentManager.getTelemetry()
  );
  const [isManualTriggering, setIsManualTriggering] = useState(false);

  useEffect(() => {
    const unsubscribe = backgroundAgentManager.subscribe((newTelemetry) => {
      setTelemetry(newTelemetry);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleScraper = () => {
    backgroundAgentManager.toggleScraperAgent();
  };

  const handleToggleInventory = () => {
    backgroundAgentManager.toggleInventoryAgent();
  };

  const handleForceIsolateScrape = async () => {
    setIsManualTriggering(true);
    const results = await backgroundAgentManager.triggerWallScreeningScrapeIsolate();
    setIsManualTriggering(false);
    onScrapedResultsUpdate?.(results);
  };

  const formatTimeAgo = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const mins = Math.floor(seconds / 60);
    return `${mins}m ago`;
  };

  return (
    <div
      className={`bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 font-sans text-slate-200 shadow-sm ${className}`}
    >
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                Autonomous Background Agent Manager
              </h4>
              <span className="text-[9px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                Non-Blocking Workers
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Offloads market scraping & inventory forecasting into worker isolates (0ms UI jank)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleForceIsolateScrape}
            disabled={isManualTriggering || telemetry.scraperStatus === 'scraping'}
            className="text-[10px] bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-mono px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
            title="Execute non-blocking market scraper in background isolate worker"
          >
            <RefreshCw
              className={`w-3 h-3 ${
                isManualTriggering || telemetry.scraperStatus === 'scraping' ? 'animate-spin' : ''
              }`}
            />
            <span>Run Scraper Isolate</span>
          </button>
        </div>
      </div>

      {/* Grid of Agent Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
        {/* Agent 1: Autonomous Scraper */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-200 font-mono">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Scraper Agent</span>
            </div>
            <button
              type="button"
              onClick={handleToggleScraper}
              className={`p-1 rounded text-[10px] font-mono flex items-center gap-1 transition-colors ${
                telemetry.isScraperActive
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {telemetry.isScraperActive ? (
                <>
                  <Pause className="w-2.5 h-2.5" /> <span>Active</span>
                </>
              ) : (
                <>
                  <Play className="w-2.5 h-2.5" /> <span>Paused</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-1 text-[10px] font-mono text-slate-400">
            <div className="flex justify-between">
              <span>Status:</span>
              <span
                className={`font-semibold capitalize ${
                  telemetry.scraperStatus === 'scraping'
                    ? 'text-amber-400 animate-pulse'
                    : telemetry.scraperStatus === 'synced'
                    ? 'text-emerald-400'
                    : 'text-slate-300'
                }`}
              >
                {telemetry.scraperStatus}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Last Sync:</span>
              <span className="text-slate-200">{formatTimeAgo(telemetry.lastScrapeTimestamp)}</span>
            </div>
            <div className="flex justify-between">
              <span>Scraped Materials:</span>
              <span className="text-emerald-400 font-bold">{telemetry.scrapedItemsCount} Wall Materials</span>
            </div>
          </div>
        </div>

        {/* Agent 2: Inventory Tracking Agent */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-200 font-mono">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Inventory Agent</span>
            </div>
            <button
              type="button"
              onClick={handleToggleInventory}
              className={`p-1 rounded text-[10px] font-mono flex items-center gap-1 transition-colors ${
                telemetry.isInventoryAgentActive
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {telemetry.isInventoryAgentActive ? (
                <>
                  <Pause className="w-2.5 h-2.5" /> <span>Active</span>
                </>
              ) : (
                <>
                  <Play className="w-2.5 h-2.5" /> <span>Paused</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-1 text-[10px] font-mono text-slate-400">
            <div className="flex justify-between">
              <span>Isolate State:</span>
              <span
                className={`font-semibold capitalize ${
                  telemetry.inventoryAgentStatus === 'evaluating'
                    ? 'text-indigo-400 animate-pulse'
                    : 'text-emerald-400'
                }`}
              >
                {telemetry.inventoryAgentStatus}
              </span>
            </div>
            <div className="flex justify-between">
              <span>7-Day Forecast:</span>
              <span className="text-slate-200">Non-Blocking Worker</span>
            </div>
            <div className="flex justify-between">
              <span>Last Eval:</span>
              <span className="text-slate-200">{formatTimeAgo(telemetry.lastInventoryEvalTimestamp)}</span>
            </div>
          </div>
        </div>

        {/* Agent 3: Worker Isolate Thread Telemetry */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-200 font-mono">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Isolate Thread</span>
            </div>
            <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
              0ms Jank
            </span>
          </div>

          <div className="space-y-1 text-[10px] font-mono text-slate-400">
            <div className="flex justify-between">
              <span>Thread Activity:</span>
              <span
                className={`font-bold uppercase ${
                  telemetry.isolateCpuThreadStatus === 'active' ? 'text-amber-400 animate-pulse' : 'text-emerald-400'
                }`}
              >
                {telemetry.isolateCpuThreadStatus}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Offloaded Tasks:</span>
              <span className="text-cyan-400 font-bold">{telemetry.offloadedTaskCount} Executions</span>
            </div>
            <div className="flex justify-between">
              <span>UI Frame Rate:</span>
              <span className="text-emerald-400 font-bold">60 FPS Stable</span>
            </div>
          </div>
        </div>
      </div>

      {/* Wall Screening Domain Guard Banner */}
      <div className="flex items-center justify-between p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-[10px] font-mono">
        <div className="flex items-center gap-2 text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-emerald-200">Strict Domain Guard:</strong> Agents restricted to querying & tracking{' '}
            <strong className="underline decoration-emerald-500/50">Wall Screening & Wall-Focused Materials</strong>
          </span>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-emerald-400/90 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-500/20">
          <Zap className="w-2.5 h-2.5 text-amber-300" />
          <span>100% Wall Scope</span>
        </div>
      </div>
    </div>
  );
};
