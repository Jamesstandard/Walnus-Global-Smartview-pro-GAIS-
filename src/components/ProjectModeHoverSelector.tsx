import React from 'react';
import { motion } from 'motion/react';
import { Minimize2, X } from 'lucide-react';
import { ProjectMode, PROJECT_MODES_CONFIG } from '../types';
import { playClickSound, playToggleSound } from '../lib/soundUtils';

interface ProjectModeHoverSelectorProps {
  currentMode: ProjectMode;
  onSelectMode: (mode: ProjectMode) => void;
  onMinimize?: () => void;
  onClose?: () => void;
  className?: string;
  compact?: boolean;
}

export function ProjectModeHoverSelector({
  currentMode,
  onSelectMode,
  onMinimize,
  onClose,
  className = '',
  compact = false,
}: ProjectModeHoverSelectorProps) {
  const modes: ProjectMode[] = ['paint', 'screed', 'plaster'];

  const handleModeClick = (mode: ProjectMode) => {
    if (mode === currentMode) return;
    playToggleSound(true);
    onSelectMode(mode);
  };

  return (
    <div className={`relative z-20 ${className}`}>
      {/* Floating Tactical Pill Container */}
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-1.5 sm:p-2 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between gap-1.5 mb-1.5 px-2">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-300 tracking-wider">
              Project Execution Mode
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[9px] font-mono text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-700/50 hidden sm:inline">
              AUTO-CONFIGURES
            </span>

            {onMinimize && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onMinimize();
                }}
                className="p-1 rounded-md bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 hover:text-white border border-indigo-500/40 transition-colors"
                title="Minimize Execution Mode Selector"
              >
                <Minimize2 className="w-3 h-3" />
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onClose();
                }}
                className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
                title="Close Execution Mode Panel"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Hovering Row of Miniature Mode Buttons */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {modes.map((modeKey) => {
            const config = PROJECT_MODES_CONFIG[modeKey];
            const isActive = currentMode === modeKey;

            return (
              <button
                key={modeKey}
                id={`project-mode-btn-${modeKey}`}
                type="button"
                onClick={() => handleModeClick(modeKey)}
                title={`Configure Workspace for ${config.name} (${config.discipline})`}
                className={`relative group flex flex-col items-center justify-center text-center p-2 sm:p-2.5 rounded-xl border transition-all duration-200 cursor-pointer select-none active:scale-95 ${
                  isActive
                    ? 'border-indigo-400/80 text-white shadow-lg bg-slate-950/90'
                    : 'border-slate-800/80 hover:border-slate-600/80 text-slate-400 hover:text-slate-200 bg-slate-950/50 hover:bg-slate-900/60'
                }`}
              >
                {/* Active Glowing Animated Pill Background */}
                {isActive && (
                  <motion.div
                    layoutId="activeModeSelectorPill"
                    className="absolute inset-0 rounded-xl bg-gradient-to-b from-indigo-600/30 to-indigo-950/50 border border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.25)] -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}

                {/* Miniature SVG Icon Container */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 transition-transform group-hover:scale-110 shadow-sm ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-indigo-500/30 border border-indigo-400/40'
                      : 'bg-slate-800/80 text-slate-400 border border-slate-700/60'
                  }`}
                >
                  {modeKey === 'paint' && (
                    /* Paint Roller SVG */
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h14a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                      <path d="M6 10v4a2 2 0 0 0 2 2h8a2 2 0 0 1 2 2v2" />
                      <circle cx="18" cy="20" r="1" />
                    </svg>
                  )}

                  {modeKey === 'screed' && (
                    /* Wall Screening Trowel & Smoothing Blade SVG */
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="6" width="18" height="5" rx="1" />
                      <path d="M12 11v6" />
                      <path d="M7 17h10" />
                      <path d="M5 21h14" />
                      <circle cx="12" cy="8.5" r="0.5" fill="currentColor" />
                    </svg>
                  )}

                  {modeKey === 'plaster' && (
                    /* Plaster Wall Float / Finishing Trowel SVG */
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 13h18l-3 7H6l-3-7z" />
                      <path d="M12 13V5" />
                      <path d="M9 5h6" />
                      <circle cx="12" cy="3" r="1" />
                    </svg>
                  )}
                </div>

                {/* Mode Label */}
                <div className="font-mono font-bold text-xs leading-tight">
                  {config.name}
                </div>

                {!compact && (
                  <>
                    <div className="text-[9px] font-sans text-slate-400 mt-0.5 truncate max-w-[120px]">
                      {config.shortLabel}
                    </div>
                    <div className={`mt-1 text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase font-semibold ${
                      isActive
                        ? 'bg-indigo-900/60 border-indigo-400/40 text-indigo-200'
                        : 'bg-slate-900/80 border-slate-800 text-slate-500'
                    }`}>
                      {config.unit}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Mode Telemetry Bar */}
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1.5 text-[9px] font-mono text-slate-400 px-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">BENCHMARK:</span>
            <span className="text-emerald-400 font-bold">{PROJECT_MODES_CONFIG[currentMode].coveragePerUnit}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">DEPTH:</span>
            <span className="text-cyan-300 font-bold">{PROJECT_MODES_CONFIG[currentMode].defaultThickness}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">DISCIPLINE:</span>
            <span className="text-amber-300 font-bold">{PROJECT_MODES_CONFIG[currentMode].discipline}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
