import React, { useState } from 'react';
import {
  Save,
  X,
  Copy,
  Download,
  HardDrive,
  FileCode,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PaintProject } from '../types';
import { saveProjectOffline } from '../db';
import { generateId } from '../lib/utils';
import { playClickSound } from '../lib/soundUtils';
import { showAppToast } from './ToastNotificationCenter';

interface SaveAsProjectModalProps {
  isOpen: boolean;
  project?: PaintProject | null;
  onClose: () => void;
  onProjectSaved?: (savedProject: PaintProject) => void;
}

export function SaveAsProjectModal({
  isOpen,
  project,
  onClose,
  onProjectSaved,
}: SaveAsProjectModalProps) {
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

  const [newName, setNewName] = useState(`${currentProject.name} (Revision 2)`);
  const [revisionTag, setRevisionTag] = useState('v1.2-field');
  const [saveFormat, setSaveFormat] = useState<'db' | 'file' | 'both'>('both');
  const [notes, setNotes] = useState('Field adjusted coating thickness & wall screed coverage.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSaveAs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    playClickSound();
    setIsSubmitting(true);

    try {
      const clonedProject: PaintProject = {
        ...currentProject,
        id: `proj_${generateId()}`,
        name: newName.trim(),
        syncStatus: 'pending',
        lastUpdated: Date.now(),
      };

      if (saveFormat === 'db' || saveFormat === 'both') {
        await saveProjectOffline(clonedProject);
      }

      if (saveFormat === 'file' || saveFormat === 'both') {
        // Create downloadable .svproj file
        const projectBundle = {
          fileFormat: 'SiteViewPro_Project_v2',
          exportedAt: new Date().toISOString(),
          revisionTag,
          notes,
          project: clonedProject,
        };

        const jsonStr = JSON.stringify(projectBundle, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${clonedProject.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.svproj`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      showAppToast({
        title: 'Project Saved As',
        message: `Saved as "${clonedProject.name}" (${revisionTag})`,
        type: 'success',
      });

      onProjectSaved?.(clonedProject);
      onClose();
    } catch (err) {
      console.error('Failed to execute Save As:', err);
      showAppToast({
        title: 'Save As Failed',
        message: 'Could not write project clone.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col text-slate-100"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-slate-900 p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Save className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Save Project As...
                </h3>
                <p className="text-[11px] text-cyan-300/80 font-mono">
                  Clone active project state into database or downloadable .svproj file
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

          {/* Form */}
          <form onSubmit={handleSaveAs} className="p-4 space-y-3.5 text-xs font-mono">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                New Project Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-slate-100 outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Revision Tag
                </label>
                <input
                  type="text"
                  value={revisionTag}
                  onChange={(e) => setRevisionTag(e.target.value)}
                  placeholder="e.g. v2.0-approved"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-slate-100 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Save Destination
                </label>
                <select
                  value={saveFormat}
                  onChange={(e: any) => setSaveFormat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-slate-100 outline-none transition-colors"
                >
                  <option value="both">Both Database & .svproj File</option>
                  <option value="db">IndexedDB Local Database Only</option>
                  <option value="file">Download .svproj File Only</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Revision Notes & Change Log
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg p-2.5 text-slate-100 outline-none transition-colors resize-none"
              />
            </div>

            {/* Current Summary Card */}
            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-[10px] space-y-1 text-slate-400">
              <div className="flex justify-between">
                <span>Source Project ID:</span>
                <span className="font-mono text-cyan-400">{currentProject.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Surface Area:</span>
                <span className="text-slate-200">{currentProject.surfaceAreaSqFt} sq ft</span>
              </div>
              <div className="flex justify-between">
                <span>Paint Spec:</span>
                <span className="text-slate-200 truncate max-w-[200px]">{currentProject.paintType}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onClose();
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Project Copy</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
