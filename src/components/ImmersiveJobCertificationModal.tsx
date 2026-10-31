import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Sparkles, CheckCircle2, ShieldCheck, Layers, ArrowRight, X, Cpu, Globe, Sliders } from 'lucide-react';
import { ProjectMode, PROJECT_MODES_CONFIG } from '../types';
import { playClickSound, playSuccessSound, playToggleSound } from '../lib/soundUtils';

interface ImmersiveJobCertificationModalProps {
  isOpen: boolean;
  currentMode: ProjectMode;
  onCertify: (mode: ProjectMode) => void;
  onClose?: () => void;
  canClose?: boolean;
}

export function ImmersiveJobCertificationModal({
  isOpen,
  currentMode,
  onCertify,
  onClose,
  canClose = true,
}: ImmersiveJobCertificationModalProps) {
  const [selectedMode, setSelectedMode] = useState<ProjectMode>(currentMode);
  const [isCertified, setIsCertified] = useState(false);

  if (!isOpen) return null;

  const modes: ProjectMode[] = ['paint', 'screed', 'plaster'];

  const handleSelect = (mode: ProjectMode) => {
    playToggleSound(true);
    setSelectedMode(mode);
  };

  const handleConfirmCertification = () => {
    playSuccessSound();
    setIsCertified(true);
    setTimeout(() => {
      onCertify(selectedMode);
      if (onClose) onClose();
    }, 400);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md font-sans hardware-accelerated">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-slate-900 border border-indigo-500/40 rounded-3xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.25)] flex flex-col"
        >
          {/* Top Header Bar */}
          <div className="bg-gradient-to-r from-slate-950 via-indigo-950/50 to-slate-900 p-4 sm:p-5 border-b border-indigo-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
                  <Bot className="w-6 h-6 animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/30">
                    AI Copilot Onboarding Gate
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Pre-Initiation Check
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white font-mono tracking-wide mt-1">
                  Immersive Job Certification & Setup
                </h2>
              </div>
            </div>

            {canClose && onClose && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onClose();
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Close Gate"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Copilot Opening Instructions Box */}
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh] smooth-scroll">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <div className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wide">
                    Copilot Opening Instructions
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                    "Welcome to <strong className="text-white font-mono">Walnus SmartView Pro</strong>. I am your AI Field Estimation Copilot. Before the application is initiated, please certify and select your primary job execution type below. This calibrates your spatial camera meshes, material calculation algorithms, and unit cost tables for exact site accuracy."
                  </p>
                </div>
              </div>
            </div>

            {/* Job Type Certification Window */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>1. Certify Job Type Option</span>
                </label>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  Required before initiation
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {modes.map((modeKey) => {
                  const config = PROJECT_MODES_CONFIG[modeKey];
                  const isSelected = selectedMode === modeKey;

                  return (
                    <button
                      key={modeKey}
                      type="button"
                      onClick={() => handleSelect(modeKey)}
                      className={`relative text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer group flex flex-col justify-between ${
                        isSelected
                          ? 'bg-gradient-to-b from-indigo-950/80 to-slate-900 border-indigo-500 text-white shadow-lg shadow-indigo-950/50 ring-1 ring-indigo-500/50'
                          : 'bg-slate-950/60 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 text-indigo-400 bg-indigo-950 p-1 rounded-full border border-indigo-500/40">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm shadow-sm">
                          {modeKey === 'paint' && '🎨'}
                          {modeKey === 'screed' && '🔨'}
                          {modeKey === 'plaster' && '🧱'}
                        </div>

                        <div>
                          <div className="font-mono font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                            {config.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-sans mt-0.5 line-clamp-2">
                            {config.shortLabel}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-500">Coverage:</span>
                        <span className="text-emerald-400 font-bold">{config.coveragePerUnit}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Certification Summary & Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleConfirmCertification}
                className={`w-full py-3.5 px-6 rounded-2xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-xl cursor-pointer active:scale-[0.98] ${
                  isCertified
                    ? 'bg-emerald-600 text-white shadow-emerald-900/50'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 hover:shadow-indigo-500/50'
                }`}
              >
                <span>Certify & Initiate SmartView Pro Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[10px] font-mono text-slate-500 text-center mt-2">
                Job certification locks initial parameters and enables live camera AR telemetry for the selected discipline.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
