import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot,
  Wrench,
  HardDrive,
  Users,
  Share2,
  Maximize2,
  X,
  Layers,
  CloudSun,
  MessageSquare,
  Calculator,
  Box,
  Beaker,
  Wifi,
  FileCode2,
  FileCode,
  Sparkles,
  Building2,
} from 'lucide-react';
import { playClickSound } from '../lib/soundUtils';

export interface MinimizedPanelItem {
  id: string;
  title: string;
  icon: any;
  gradient: string;
  borderColor: string;
}

interface FloatingMinimizedPanelsProps {
  minimizedPanels: Set<string>;
  onRestore: (id: string) => void;
  onDismiss: (id: string) => void;
}

export const PANEL_CONFIGS: Record<
  string,
  { title: string; icon: any; bg: string; border: string; text: string; category: string }
> = {
  photogrammetric_overlay: {
    title: 'Photogrammetric 3D',
    icon: Box,
    bg: 'from-indigo-600 via-purple-600 to-pink-600',
    border: 'border-indigo-500/60 shadow-indigo-500/30',
    text: 'text-indigo-200',
    category: '3D Overlay',
  },
  project_mode: {
    title: 'Execution Mode',
    icon: Layers,
    bg: 'from-indigo-700 to-purple-800',
    border: 'border-indigo-500/60 shadow-indigo-500/30',
    text: 'text-indigo-200',
    category: 'Mode Selector',
  },
  site_payload: {
    title: 'Site Payload Package',
    icon: FileCode2,
    bg: 'from-blue-600 to-indigo-700',
    border: 'border-blue-500/60 shadow-blue-500/30',
    text: 'text-blue-200',
    category: 'Data Package',
  },
  team_payload: {
    title: 'Team Payload Package',
    icon: FileCode,
    bg: 'from-emerald-600 to-teal-700',
    border: 'border-emerald-500/60 shadow-emerald-500/30',
    text: 'text-emerald-200',
    category: 'Team Package',
  },
  chat: {
    title: 'Comms Hub',
    icon: MessageSquare,
    bg: 'from-purple-600 to-indigo-700',
    border: 'border-purple-500/60 shadow-purple-500/30',
    text: 'text-purple-200',
    category: 'Field Chat',
  },
  weather: {
    title: 'Weather Copilot',
    icon: CloudSun,
    bg: 'from-cyan-600 to-blue-700',
    border: 'border-cyan-500/60 shadow-cyan-500/30',
    text: 'text-cyan-200',
    category: 'Environment',
  },
  copilot: {
    title: 'AI Co-Pilot',
    icon: Bot,
    bg: 'from-purple-600 via-indigo-600 to-pink-600',
    border: 'border-purple-500/60 shadow-purple-500/30',
    text: 'text-purple-200',
    category: 'AI Assistant',
  },
  settings: {
    title: 'Settings Console',
    icon: Wrench,
    bg: 'from-slate-700 to-slate-800',
    border: 'border-slate-600/60 shadow-slate-500/30',
    text: 'text-slate-200',
    category: 'Config',
  },
  workspace: {
    title: 'Workspace Hub',
    icon: HardDrive,
    bg: 'from-blue-600 to-indigo-600',
    border: 'border-blue-500/60 shadow-blue-500/30',
    text: 'text-blue-200',
    category: 'Docs & Drive',
  },
  contacts: {
    title: 'Contacts & Crew',
    icon: Users,
    bg: 'from-emerald-600 to-teal-700',
    border: 'border-emerald-500/60 shadow-emerald-500/30',
    text: 'text-emerald-200',
    category: 'Team Comms',
  },
  paint_spec: {
    title: 'Paint & Site Spec',
    icon: Building2,
    bg: 'from-indigo-600 to-purple-700',
    border: 'border-indigo-500/60 shadow-indigo-500/30',
    text: 'text-indigo-200',
    category: 'Specification',
  },
  publish: {
    title: '3D Stakeholder Portal',
    icon: Share2,
    bg: 'from-amber-500 to-orange-600',
    border: 'border-amber-500/60 shadow-amber-500/30',
    text: 'text-amber-200',
    category: 'Export Portal',
  },
};

export function FloatingMinimizedPanels({
  minimizedPanels,
  onRestore,
  onDismiss,
}: FloatingMinimizedPanelsProps) {
  const [isObstructed, setIsObstructed] = useState(false);

  useEffect(() => {
    const handleObstructed = (e: any) => {
      if (e.detail && typeof e.detail.obstructed === 'boolean') {
        setIsObstructed(e.detail.obstructed);
      }
    };
    window.addEventListener('paint_sync_panels_obstructed', handleObstructed as EventListener);
    return () => window.removeEventListener('paint_sync_panels_obstructed', handleObstructed as EventListener);
  }, []);

  if (!minimizedPanels || minimizedPanels.size === 0) return null;

  const panelList = Array.from(minimizedPanels);

  return (
    <motion.div
      animate={{
        y: isObstructed ? -100 : 0,
        opacity: isObstructed ? 0 : 1,
        scale: isObstructed ? 0.9 : 1,
      }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-row flex-wrap justify-center gap-2 items-center select-none pointer-events-none font-mono w-full px-4"
    >
      <AnimatePresence>
        {panelList.map((id) => {
          const config = PANEL_CONFIGS[id] || {
            title: id,
            icon: Maximize2,
            bg: 'from-indigo-600 to-slate-800',
            border: 'border-slate-600 shadow-slate-500/30',
            text: 'text-slate-200',
            category: 'Panel',
          };
          const Icon = config.icon;

          return (
            <motion.div
              key={id}
              layout
              initial={{ opacity: 0, scale: 0.7, y: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: -20 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="pointer-events-auto group relative flex items-center gap-2 cursor-pointer transition-transform duration-200 hover:scale-105"
              onClick={() => {
                playClickSound();
                onRestore(id);
              }}
            >
              {/* Hint Caption on Hover */}
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center px-2.5 py-1 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-xl backdrop-blur-md text-center transition-all animate-in fade-in slide-in-from-top-2 whitespace-nowrap">
                <span className={`text-xs font-mono font-bold ${config.text}`}>
                  {config.title}
                </span>
                <span className="text-[9px] text-slate-400">
                  Click to restore
                </span>
              </div>
              {/* Hovering Component Button Icon */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playClickSound();
                  onRestore(id);
                }}
                className={`pointer-events-auto relative flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-gradient-to-tr ${config.bg} border ${config.border} text-white shadow-2xl hover:scale-105 active:scale-95 transition-all group-hover:ring-2 group-hover:ring-white/40`}
                title={`${config.title} (${config.category}) - Click to restore`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-xs font-mono font-bold tracking-tight hidden sm:inline max-w-[130px] truncate">
                  {config.title}
                </span>
                {/* Dismiss X button */}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    playClickSound();
                    onDismiss(id);
                  }}
                  className="p-0.5 rounded-full bg-black/40 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                  title="Clear from screen"
                >
                  <X className="w-3 h-3" />
                </span>
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}

