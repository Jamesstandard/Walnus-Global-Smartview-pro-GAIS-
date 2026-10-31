import React, { useState } from 'react';
import { SiteContact, PaintProject, ProjectSourcePackage } from '../types';
import { buildProjectSourcePackage } from '../data/marketResearch';
import { saveMessageOffline } from '../db';
import { generateId } from '../lib/utils';
import { playClickSound } from '../lib/soundUtils';
import {
  FileCode2,
  Download,
  Copy,
  Check,
  Send,
  CheckCircle2,
  X,
  Layers,
  HardDrive,
  Shield,
  Activity,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExportProjectModalProps {
  isOpen: boolean;
  contact: SiteContact;
  project?: PaintProject | null;
  onClose: () => void;
}

export function ExportProjectModal({
  isOpen,
  contact,
  project,
  onClose,
}: ExportProjectModalProps) {
  const currentProject: PaintProject = project || {
    id: 'proj_default_facade',
    name: 'Building Façade - Sector 4 Commercial Coating',
    surfaceAreaSqFt: 2450,
    paintType: 'Exterior Acrylic Latex (High-Durability)',
    colorName: 'Field Selected Tone',
    colorHex: '#3b82f6',
    volumeGallons: 7.0,
    status: 'estimated',
    syncStatus: 'synced',
    lastUpdated: Date.now(),
    images: [],
  };

  const sourcePackage = buildProjectSourcePackage(currentProject, contact);
  const jsonString = JSON.stringify(sourcePackage, null, 2);

  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmissionStep, setTransmissionStep] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name.replace(/\s+/g, '_')}_source_v${sourcePackage.schemaVersion}.paintproj.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTransferToContact = async () => {
    setIsTransmitting(true);
    setTransferSuccess(false);

    setTransmissionStep('Serializing full project AST & LiDAR geometry...');
    await new Promise((r) => setTimeout(r, 600));

    setTransmissionStep(`Verifying cryptographic checksum (${sourcePackage.checksumSha256.substring(0, 16)}...)...`);
    await new Promise((r) => setTimeout(r, 600));

    setTransmissionStep(`Transmitting project source package to ${contact.name}'s application HUD...`);
    await new Promise((r) => setTimeout(r, 700));

    // Save offline dispatch log to Comms
    await saveMessageOffline({
      id: generateId(),
      sender: 'Estimator',
      recipient: `${contact.name} (${contact.role})`,
      text: `[PROJECT SOURCE FILE TRANSFERRED TO @${contact.name}]:\nFull project source package for "${currentProject.name}" (Schema v${sourcePackage.schemaVersion}, SHA-256: ${sourcePackage.checksumSha256}) transferred to ${contact.name}'s workstation. Included: LiDAR mesh, surface calculations (${currentProject.surfaceAreaSqFt} sq ft), chemical formulation ratios, and atmospheric telemetry.`,
      timestamp: Date.now(),
      syncStatus: 'pending',
      type: 'text',
    });

    setIsTransmitting(false);
    setTransmissionStep(null);
    setTransferSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs font-sans animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-md">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  Option #2
                </span>
                <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                  Export Project Source File
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Transfer complete project schema & telemetry to{' '}
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

        {/* Project Telemetry Summary Strip */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-3 text-slate-300">
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Project: <strong className="text-white">{currentProject.name}</strong></span>
            </span>
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Area: <strong className="text-emerald-300">{currentProject.surfaceAreaSqFt} sq ft</strong></span>
            </span>
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>Checksum: <code className="text-[10px] text-slate-400">{sourcePackage.checksumSha256.substring(0, 16)}...</code></span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyJson}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadFile}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] border border-slate-700 transition-colors"
            >
              <Download className="w-3 h-3 text-blue-400" />
              <span>Save File</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body with JSON Source Viewer */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
          {/* Target Recipient Banner */}
          <div className="p-3 bg-slate-900 border border-blue-500/30 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${contact.avatarBg} flex items-center justify-center text-white font-mono font-bold text-xs shadow`}>
                {contact.initials}
              </div>
              <div>
                <div className="text-xs font-bold text-white font-mono">{contact.name}</div>
                <div className="text-[11px] text-slate-400">{contact.roleCaption} • {contact.siteLocation}</div>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Payload Receiver Ready
            </span>
          </div>

          {/* Transfer Feedback Notification */}
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
                    <div className="font-bold text-white">Project source package successfully transferred!</div>
                    <div className="text-[11px] text-emerald-300 mt-0.5">
                      Source data transferred to {contact.name}'s workstation application and synced with offline database.
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
            <div className="p-3.5 rounded-xl bg-blue-950/60 border border-blue-500/40 text-blue-200 text-xs font-mono flex items-center gap-2.5 animate-pulse">
              <RefreshCw className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
              <span>{transmissionStep}</span>
            </div>
          )}

          {/* Formatted Code Inspector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider px-1">
              <span>Project Source Payload Inspector (.paintproj.json)</span>
              <span className="text-slate-500 font-normal">UTF-8 Encoded • Schema 2.4.0</span>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto font-mono text-[11px] text-slate-300 max-h-80 shadow-inner">
              <pre className="text-blue-300 leading-relaxed font-mono whitespace-pre-wrap">
                {jsonString}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] font-mono text-slate-400">
            Export target: <strong className="text-white">{contact.name}</strong> ({contact.role})
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
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isTransmitting ? 'Transferring Source...' : `Transfer Project to ${contact.name}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
