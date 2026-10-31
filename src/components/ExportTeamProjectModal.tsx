import React, { useState } from 'react';
import {
  Users,
  X,
  Copy,
  Download,
  Send,
  CheckCircle2,
  FileCode,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
  HardHat
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PaintProject, SiteContact } from '../types';
import { INITIAL_CONTACTS } from '../data/contacts';
import { saveMessageOffline } from '../db';
import { generateId } from '../lib/utils';
import { playClickSound } from '../lib/soundUtils';
import { showAppToast } from './ToastNotificationCenter';

interface ExportTeamProjectModalProps {
  isOpen: boolean;
  project?: PaintProject | null;
  onClose: () => void;
}

export function ExportTeamProjectModal({
  isOpen,
  project,
  onClose,
}: ExportTeamProjectModalProps) {
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

  const [selectedContactId, setSelectedContactId] = useState<string>(INITIAL_CONTACTS[0].id);
  const [copied, setCopied] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);

  if (!isOpen) return null;

  const targetContact = INITIAL_CONTACTS.find((c) => c.id === selectedContactId) || INITIAL_CONTACTS[0];

  const teamExportPackage = {
    packageType: 'WALNUS_SITEVIEW_PRO_TEAM_PACKAGE',
    version: '2.4.0',
    generatedAt: new Date().toISOString(),
    project: currentProject,
    targetRecipient: {
      id: targetContact.id,
      name: targetContact.name,
      role: targetContact.role,
      department: targetContact.department,
      phone: targetContact.phone,
    },
    fieldExecutionSpecs: {
      targetDFT_mils: 6.5,
      targetWFT_mils: 12.0,
      mixingRatio: '4:1:0.5 (Base:Binder:Viscosity Modifier)',
      wallPreparation: 'High-pressure water jetting @ 2500 PSI, dry wall substrate moisture < 4%',
      safetyMandate: 'GHS-07 Compliance, Respirator Class P3 required for airless spraying',
    },
  };

  const jsonString = JSON.stringify(teamExportPackage, null, 2);

  const handleCopy = () => {
    playClickSound();
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    showAppToast({
      title: 'Copied to Clipboard',
      message: 'Team export JSON bundle copied successfully.',
      type: 'success',
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    playClickSound();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team_export_${currentProject.id}_${targetContact.role.toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showAppToast({
      title: 'Team Bundle Downloaded',
      message: `Exported field package for ${targetContact.name} (${targetContact.role}).`,
      type: 'success',
    });
  };

  const handleTransmitToChat = async () => {
    playClickSound();
    setIsTransmitting(true);

    try {
      const chatMsg = {
        id: `msg_${generateId()}`,
        projectId: currentProject.id,
        sender: 'Engineer' as const,
        senderName: 'WALNUS System Agent',
        text: `📦 [TEAM PROJECT EXPORT] Field package generated for project "${currentProject.name}" (${currentProject.surfaceAreaSqFt} sq ft). Coating Spec: ${currentProject.paintType}. Target DFT: 6.5 mils. Target Contact: ${targetContact.name} (${targetContact.role}).`,
        timestamp: Date.now(),
        syncStatus: 'pending' as const,
        attachments: [
          {
            id: `att_${generateId()}`,
            name: `${currentProject.name}_TeamManifest.json`,
            sizeStr: `${(jsonString.length / 1024).toFixed(1)} KB`,
            type: 'json' as const,
          },
        ],
      };

      await saveMessageOffline(chatMsg);

      showAppToast({
        title: 'Team Package Transmitted',
        message: `Dispatched project bundle to ${targetContact.name}'s offline message queue.`,
        type: 'success',
      });

      onClose();
    } catch (err) {
      console.error('Failed to transmit team package:', err);
      showAppToast({
        title: 'Transmission Failed',
        message: 'Could not write to team chat queue.',
        type: 'error',
      });
    } finally {
      setIsTransmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col text-slate-100"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Export Project: Field & Engineering Team
                </h3>
                <p className="text-[11px] text-emerald-300/80 font-mono">
                  Package structural scans, formulas & thickness targets for site dispatches
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3.5 text-xs font-mono max-h-[75vh] overflow-y-auto">
            {/* Target Contact Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Target Team Recipient
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {INITIAL_CONTACTS.map((c) => {
                  const isSelected = c.id === selectedContactId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setSelectedContactId(c.id);
                      }}
                      className={`p-2 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                        isSelected
                          ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-md shadow-emerald-950'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] truncate">{c.name}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      </div>
                      <span className="text-[9px] text-emerald-400 font-semibold">{c.role}</span>
                      <span className="text-[9px] text-slate-500 truncate">{c.siteLocation}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Spec Highlights Card */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-slate-300 font-bold border-b border-slate-800 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <HardHat className="w-4 h-4 text-emerald-400" />
                  <span>Field Manifest Summary</span>
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  Ready for Dispatch
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Project:</span>
                  <span className="text-white font-semibold truncate block">{currentProject.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Surface Area:</span>
                  <span className="text-emerald-400 font-bold">{currentProject.surfaceAreaSqFt} sq ft</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Coating Specification:</span>
                  <span className="text-slate-200 truncate block">{currentProject.paintType}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Target DFT / WFT:</span>
                  <span className="text-amber-400 font-bold">6.5 mils DFT / 12.0 mils WFT</span>
                </div>
              </div>
            </div>

            {/* JSON Code Preview */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Raw Team Manifest Payload (JSON)
                </label>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? 'Copied!' : 'Copy Payload'}</span>
                </button>
              </div>
              <pre className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-emerald-300/90 overflow-x-auto max-h-36 font-mono scrollbar-thin">
                {jsonString}
              </pre>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download Package</span>
              </button>

              <button
                type="button"
                disabled={isTransmitting}
                onClick={handleTransmitToChat}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 ml-auto"
              >
                <Send className="w-4 h-4" />
                <span>Transmit to {targetContact.name}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
