import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  Plus,
  Trash2,
  Check,
  Calendar,
  Camera,
  FolderOpen,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Survey } from '../types';
import { surveyCaptureRepository } from '../lib/surveyCaptureRepository';
import { generateId } from '../lib/utils';
import { playClickSound, playSuccessSound, playAlertChime } from '../lib/soundUtils';

interface ManageSurveysModalProps {
  currentProjectId: string;
  activeSurveyId: string | null;
  onSelectSurvey: (survey: Survey) => void;
  onClose: () => void;
}

export function ManageSurveysModal({
  currentProjectId,
  activeSurveyId,
  onSelectSurvey,
  onClose,
}: ManageSurveysModalProps) {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const loadSurveys = async () => {
    try {
      const list = await surveyCaptureRepository.getAllSurveys();
      setSurveys(list);
    } catch (e) {
      console.warn('Failed to load surveys:', e);
    }
  };

  useEffect(() => {
    loadSurveys();
  }, []);

  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    playSuccessSound();
    const cleanId = `srv_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const newSurvey: Survey = {
      id: cleanId,
      projectId: currentProjectId || 'proj_default',
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      status: 'active',
      createdAtEpochMs: Date.now(),
      lastUpdatedEpochMs: Date.now(),
      captureCount: 0,
    };

    await surveyCaptureRepository.saveSurvey(newSurvey);
    setNewTitle('');
    setNewDescription('');
    setIsCreating(false);
    await loadSurveys();
    onSelectSurvey(newSurvey);
  };

  const handleDeleteSurvey = async (survey: Survey, e: React.MouseEvent) => {
    e.stopPropagation();
    playAlertChime('warning');
    const confirmMsg = `Delete "${survey.title}"?\n\nWARNING: All ${survey.captureCount || 0} associated photo captures and local media files will be cascade deleted immediately.`;
    if (!window.confirm(confirmMsg)) return;

    setIsDeleting(survey.id);
    try {
      await surveyCaptureRepository.deleteSurvey(survey.id);
      playSuccessSound();
      await loadSurveys();
    } catch (err) {
      console.error('Failed to cascade delete survey:', err);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/90 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-700/80 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
                Survey Registry & Active Context
              </h3>
              <p className="text-[10px] font-mono text-slate-400">
                Walnus SmartView Pro™ • Milestone SV-003
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Create New Survey Form Toggle */}
          {!isCreating ? (
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setIsCreating(true);
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-indigo-700/70 bg-indigo-950/30 hover:bg-indigo-950/60 text-indigo-300 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Survey</span>
            </button>
          ) : (
            <form onSubmit={handleCreateSurvey} className="p-3 rounded-xl border border-indigo-500/60 bg-indigo-950/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-indigo-300">New Survey Details</span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs font-mono"
                >
                  Cancel
                </button>
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">
                  Survey Title / Elevation Area
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. West Exterior Elevation - Block B"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">
                  Survey Scope & Notes (Optional)
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g. Crack monitoring, exterior paint coat assessment"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                Confirm & Set as Active Survey
              </button>
            </form>
          )}

          {/* Survey List */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Registered Surveys ({surveys.length})
            </span>
            {surveys.length === 0 ? (
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-center text-slate-400 font-mono text-xs">
                No surveys registered yet. Create a survey above to begin photographic surveying.
              </div>
            ) : (
              surveys.map((survey) => {
                const isActive = activeSurveyId === survey.id;
                return (
                  <div
                    key={survey.id}
                    onClick={() => {
                      playClickSound();
                      onSelectSurvey(survey);
                      onClose();
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-indigo-950/70 border-indigo-500 text-indigo-100 shadow-md shadow-indigo-500/10'
                        : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold truncate">
                          {survey.title}
                        </span>
                        {isActive && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-600/60 text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            <span>Active</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-slate-400">
                        <span>ID: {survey.id}</span>
                        <span className="flex items-center gap-1">
                          <Camera className="w-3 h-3 text-indigo-400" />
                          <span>{survey.captureCount || 0} Captures</span>
                        </span>
                        <span>{new Date(survey.createdAtEpochMs).toLocaleDateString()}</span>
                      </div>
                      {survey.description && (
                        <p className="text-[10px] font-mono text-slate-400 truncate mt-1">
                          {survey.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSurvey(survey, e)}
                        title="Cascade Delete Survey & Captures"
                        disabled={isDeleting === survey.id}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 hover:text-rose-400 text-slate-400 border border-slate-800 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>Active context required for all camera captures</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
