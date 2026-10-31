import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, RotateCcw } from 'lucide-react';
import { playClickSound } from '../lib/soundUtils';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  badge?: string;
  durationMs?: number;
  revertAction?: {
    label?: string;
    tooltip?: string;
    onRevert: () => void;
  };
}

// Global dispatcher to trigger toast from anywhere in the codebase
export function showAppToast(toast: Omit<ToastItem, 'id'>) {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  window.dispatchEvent(
    new CustomEvent('paint_sync_show_toast', {
      detail: { ...toast, id },
    })
  );
  return id;
}

export function ToastNotificationCenter() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleAddToast = (e: CustomEvent<ToastItem>) => {
      if (e.detail) {
        const item = e.detail;
        setToasts((prev) => [item, ...prev.slice(0, 3)]); // Keep max 4 toasts stacked

        // Auto-dismiss timer: auto dismisses without requiring user click
        const duration = item.durationMs ?? (item.revertAction ? 8000 : 4500);
        if (duration > 0) {
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== item.id));
          }, duration);
        }
      }
    };

    window.addEventListener('paint_sync_show_toast', handleAddToast as EventListener);
    return () => {
      window.removeEventListener('paint_sync_show_toast', handleAddToast as EventListener);
    };
  }, []);

  const handleDismiss = (id: string) => {
    playClickSound();
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div
      id="global-toast-container"
      className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 max-w-md w-[92%] sm:w-full pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const isSuccess = t.type === 'success' || !t.type;
          const isWarning = t.type === 'warning';
          const isError = t.type === 'error';

          const colorClasses = isSuccess
            ? 'bg-emerald-950/95 border-emerald-500/70 text-emerald-100 shadow-emerald-950/60'
            : isWarning
            ? 'bg-amber-950/95 border-amber-500/70 text-amber-100 shadow-amber-950/60'
            : isError
            ? 'bg-rose-950/95 border-rose-500/70 text-rose-100 shadow-rose-950/60'
            : 'bg-slate-900/95 border-indigo-500/70 text-slate-100 shadow-slate-950/60';

          const iconColor = isSuccess
            ? 'text-emerald-400'
            : isWarning
            ? 'text-amber-400'
            : isError
            ? 'text-rose-400'
            : 'text-indigo-400';

          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -30, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                scale: 0.85,
                y: -20,
                transition: { duration: 0.28, ease: 'easeInOut' },
              }}
              transition={{
                type: 'spring',
                stiffness: 450,
                damping: 18,
                mass: 0.8,
              }}
              onClick={() => handleDismiss(t.id)}
              className={`pointer-events-auto cursor-pointer select-none w-full p-3 rounded-2xl border shadow-2xl backdrop-blur-md flex items-start gap-3 transition-transform active:scale-[0.98] hover:brightness-110 ${colorClasses}`}
              title="Tap notification to dismiss"
            >
              <div className={`p-1.5 rounded-xl bg-black/30 shrink-0 ${iconColor}`}>
                {isSuccess && <CheckCircle2 className="w-4 h-4" />}
                {isWarning && <AlertTriangle className="w-4 h-4" />}
                {isError && <AlertCircle className="w-4 h-4" />}
                {t.type === 'info' && <Info className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-extrabold tracking-wide truncate uppercase">
                    {t.title}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {t.revertAction && (
                      <button
                        type="button"
                        id={`toast-revert-btn-${t.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          playClickSound();
                          t.revertAction?.onRevert();
                          handleDismiss(t.id);
                        }}
                        title={t.revertAction.tooltip || 'Revert back to previous settings'}
                        className="interactive-control group inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/25 hover:bg-amber-500/40 text-amber-200 hover:text-white border border-amber-400/60 text-[10px] font-mono font-bold uppercase transition-all shadow-xs active:scale-95 cursor-pointer"
                      >
                        <RotateCcw className="w-2.5 h-2.5 text-amber-300 group-hover:-rotate-90 transition-transform duration-200" />
                        <span>{t.revertAction.label || 'Revert'}</span>
                      </button>
                    )}
                    {t.badge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-slate-300 font-bold uppercase shrink-0">
                        {t.badge}
                      </span>
                    )}
                  </div>
                </div>
                {t.message && (
                  <p className="text-[11px] text-slate-300 leading-snug mt-0.5 font-sans">
                    {t.message}
                  </p>
                )}
                <div className="mt-1 flex items-center justify-between gap-1 text-[9px] font-mono opacity-70">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    <span>Tap anywhere to dismiss</span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss(t.id);
                }}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white shrink-0 transition-colors"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
