import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { playClickSound } from '../lib/soundUtils';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({ isOpen, title, message, onConfirm, onClose }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed top-[86px] inset-x-0 bottom-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-500">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-sm font-bold text-white font-mono">{title}</h2>
          </div>
          <button 
            onClick={() => {
                playClickSound();
                onClose();
            }} 
            className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-sm font-mono text-slate-300 whitespace-pre-line">{message}</p>
        </div>
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end gap-2">
          <button
            onClick={() => {
                playClickSound();
                onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              playClickSound();
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold cursor-pointer"
          >
            Confirm Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}
