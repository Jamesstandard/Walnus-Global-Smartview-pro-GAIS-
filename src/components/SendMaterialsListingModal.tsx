import React, { useState } from 'react';
import { SiteContact, MarketMaterialItem, PaintProject } from '../types';
import { AUTONOMOUS_MARKET_MATERIALS } from '../data/marketResearch';
import { saveMessageOffline } from '../db';
import { generateId, formatCurrency } from '../lib/utils';
import { playClickSound } from '../lib/soundUtils';
import {
  Sparkles,
  Send,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Building,
  ShieldCheck,
  Clock,
  Package,
  Layers,
  X,
  Copy,
  Check,
  Bot,
  RefreshCw,
  HardHat,
  Paintbrush,
  Briefcase,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SendMaterialsListingModalProps {
  isOpen: boolean;
  contact: SiteContact;
  project?: PaintProject | null;
  onClose: () => void;
}

export function SendMaterialsListingModal({
  isOpen,
  contact,
  project,
  onClose,
}: SendMaterialsListingModalProps) {
  const [materials, setMaterials] = useState<MarketMaterialItem[]>(AUTONOMOUS_MARKET_MATERIALS);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmissionStep, setTransmissionStep] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [agentRefreshing, setAgentRefreshing] = useState(false);

  if (!isOpen) return null;

  const totalCalculatedCost = materials.reduce(
    (sum, m) => sum + m.spotPricePerKg * m.requiredAmountKg,
    0
  );

  const handleRefreshMarketAgent = () => {
    setAgentRefreshing(true);
    setTimeout(() => {
      // Simulate minor live spot price updates from global exchanges
      setMaterials((prev) =>
        prev.map((m) => {
          const delta = (Math.random() - 0.5) * 0.15;
          const newPrice = Math.max(0.5, Math.round((m.spotPricePerKg + delta) * 100) / 100);
          return {
            ...m,
            spotPricePerKg: newPrice,
            confidenceScore: Math.min(99.9, Math.round((95 + Math.random() * 4.9) * 10) / 10),
          };
        })
      );
      setAgentRefreshing(false);
    }, 900);
  };

  const handleTransferToContact = async () => {
    setIsTransmitting(true);
    setTransferSuccess(false);

    // Sequence of transmission steps
    setTransmissionStep('Synthesizing market research indices...');
    await new Promise((r) => setTimeout(r, 600));

    setTransmissionStep(`Connecting to ${contact.name}'s Field Application HUD...`);
    await new Promise((r) => setTimeout(r, 700));

    setTransmissionStep(`Transferring ${materials.length} verified chemical listings...`);
    await new Promise((r) => setTimeout(r, 800));

    // Save offline dispatch log
    const summaryList = materials
      .map((m) => `• ${m.name}: $${m.spotPricePerKg}/kg (${m.requiredAmountKg}kg) [Supplier: ${m.supplier}]`)
      .join('\n');

    await saveMessageOffline({
      id: generateId(),
      sender: 'Estimator',
      recipient: `${contact.name} (${contact.role})`,
      text: `[AUTONOMOUS MARKET RESEARCH TRANSFER TO @${contact.name}]:\nTransferred compiled chemical listings for "${
        project?.name || 'Commercial Coating Spec'
      }" (${materials.length} items, Total Benchmark: ${formatCurrency(totalCalculatedCost)}).\n\n${summaryList}`,
      timestamp: Date.now(),
      syncStatus: 'pending',
      type: 'text',
    });

    setIsTransmitting(false);
    setTransmissionStep(null);
    setTransferSuccess(true);
  };

  const handleCopyListing = () => {
    const text = materials
      .map(
        (m) =>
          `Item: ${m.name} | CAS: ${m.casNumber} | Spot Rate: $${m.spotPricePerKg}/kg | Req: ${m.requiredAmountKg}kg | Supplier: ${m.supplier} | Lead: ${m.leadTimeDays}d`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs font-sans animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Option #1
                </span>
                <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                  Send Materials Listings
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Autonomous Market Research Agent dataset transfer to{' '}
                <span className="text-indigo-300 font-semibold">{contact.name}</span> ({contact.role})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Autonomous Agent Metric Bar */}
        <div className="px-4 py-3 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Agent Confidence: <strong className="text-emerald-400 font-bold">98.8%</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Listings: <strong className="text-white font-bold">{materials.length} Raw Materials</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span>Total Est. Raw Value: <strong className="text-emerald-300 font-bold">{formatCurrency(totalCalculatedCost)}</strong></span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefreshMarketAgent}
            disabled={agentRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 text-amber-400 ${agentRefreshing ? 'animate-spin' : ''}`} />
            <span>{agentRefreshing ? 'Scraping Exchanges...' : 'Rescan Market Spot Rates'}</span>
          </button>
        </div>

        {/* Scrollable Materials Listing Body */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
          {/* Target Recipient Banner */}
          <div className="p-3 bg-slate-900 border border-indigo-500/30 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${contact.avatarBg} flex items-center justify-center text-white font-mono font-bold text-xs shadow`}>
                {contact.initials}
              </div>
              <div>
                <div className="text-xs font-bold text-white font-mono">{contact.name}</div>
                <div className="text-[11px] text-slate-400">{contact.roleCaption} • {contact.siteLocation}</div>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              HUD Link Active
            </span>
          </div>

          {/* Transfer Status Feedback */}
          <AnimatePresence>
            {transferSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  y: -12,
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
                  setTransferSuccess(false);
                }}
                className="p-3.5 rounded-xl bg-emerald-950/95 border border-emerald-500/60 text-emerald-200 text-xs font-mono flex items-center justify-between gap-3 cursor-pointer select-none transition-transform active:scale-[0.99] hover:bg-emerald-900/90 shadow-lg"
                title="Tap notification to dismiss"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white">Materials listings successfully transferred!</div>
                    <div className="text-[11px] text-emerald-300 mt-0.5">
                      Autonomous market dataset dispatched to {contact.name}'s application HUD and logged to comms stream.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[9px] text-emerald-300 font-bold uppercase hidden sm:inline bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-500/40">
                    Tap to dismiss
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playClickSound();
                      setTransferSuccess(false);
                    }}
                    className="p-1 text-emerald-400 hover:text-white rounded hover:bg-emerald-800/60 transition-colors"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isTransmitting && (
            <div className="p-3.5 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 text-xs font-mono flex items-center gap-2.5 animate-pulse">
              <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
              <span>{transmissionStep}</span>
            </div>
          )}

          {/* Itemized Materials Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider px-1">
              <span>Autonomous Agent Benchmark Results</span>
              <button
                type="button"
                onClick={handleCopyListing}
                className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied Listing!' : 'Copy Summary'}</span>
              </button>
            </div>

            <div className="space-y-2">
              {materials.map((mat) => (
                <div
                  key={mat.id}
                  className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-white font-mono text-xs">{mat.name}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded border border-slate-700">
                        CAS {mat.casNumber}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 bg-indigo-950 text-indigo-300 rounded border border-indigo-800/60">
                        {mat.category}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1">{mat.notes}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-mono pt-0.5">
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-500" />
                        <span>Supplier: <strong className="text-slate-300">{mat.supplier}</strong></span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>Lead: <strong className="text-slate-300">{mat.leadTimeDays}d</strong></span>
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <ShieldCheck className="w-3 h-3" />
                        <span>{mat.stockAvailability}</span>
                      </span>
                    </div>
                  </div>

                  {/* Pricing & Volume Pill */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800/80">
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-400 font-mono">
                        ${mat.spotPricePerKg.toFixed(2)}/kg
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Req: {mat.requiredAmountKg} kg
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-mono">
                      {mat.marketTrend === 'up' ? (
                        <span className="text-rose-400 flex items-center">
                          <TrendingUp className="w-3 h-3 mr-0.5" /> +{mat.trendPercentage}%
                        </span>
                      ) : mat.marketTrend === 'down' ? (
                        <span className="text-emerald-400 flex items-center">
                          <TrendingDown className="w-3 h-3 mr-0.5" /> {mat.trendPercentage}%
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center">
                          <Minus className="w-3 h-3 mr-0.5" /> Stable
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] font-mono text-slate-400">
            Autonomous agent sync payload • Target: <span className="text-white font-bold">{contact.name}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleTransferToContact}
              disabled={isTransmitting}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isTransmitting ? 'Transferring Dataset...' : `Transfer Materials to ${contact.name}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
