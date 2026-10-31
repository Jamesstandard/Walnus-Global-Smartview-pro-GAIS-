import React, { useState } from 'react';
import { Check, X, Camera, Image, Layers, Tag, FileText, Info, ShieldCheck } from 'lucide-react';
import { CaptureType, CAPTURE_TYPE_LABELS, SurveyCapture } from '../types';
import { playClickSound, playSuccessSound } from '../lib/soundUtils';

interface SurveyCaptureReviewModalProps {
  capture: SurveyCapture;
  imageDataUrl: string;
  surveyTitle: string;
  onSave: (updatedCapture: SurveyCapture) => void;
  onRetake: () => void;
  onCancel: () => void;
}

export function SurveyCaptureReviewModal({
  capture,
  imageDataUrl,
  surveyTitle,
  onSave,
  onRetake,
  onCancel,
}: SurveyCaptureReviewModalProps) {
  const [selectedType, setSelectedType] = useState<CaptureType>(capture.captureType || 'STANDARD_STILL');
  const [notes, setNotes] = useState<string>(capture.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleConfirmSave = () => {
    setIsSaving(true);
    playSuccessSound();
    onSave({
      ...capture,
      captureType: selectedType,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/90 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-700/80 flex items-center justify-center text-indigo-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
                Capture Review & Confirmation
              </h3>
              <p className="text-[10px] font-mono text-indigo-400 truncate max-w-[280px]">
                Survey: {surveyTitle} ({capture.surveyId})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Image Preview */}
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center aspect-video max-h-[220px]">
            <img
              src={imageDataUrl}
              alt="Survey Capture"
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-sm border border-slate-700 text-[9px] font-mono text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Offline Verified</span>
            </div>
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-sm border border-slate-700 text-[9px] font-mono text-slate-300">
              {capture.width && capture.height ? `${capture.width} × ${capture.height} px` : '1080p'}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block">Capture Identifier</span>
              <span className="text-slate-200 font-bold truncate block">{capture.id}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block">Timestamp</span>
              <span className="text-slate-200 font-bold block">
                {new Date(capture.createdAtEpochMs).toLocaleTimeString()}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block">Storage Path</span>
              <span className="text-slate-300 truncate block">{capture.localPath}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block">Estimated Size</span>
              <span className="text-slate-200 font-bold block">
                {capture.fileSizeBytes ? `${Math.round(capture.fileSizeBytes / 1024)} KB` : 'Local Storage'}
              </span>
            </div>
          </div>

          {/* Capture Type Selector */}
          <div>
            <label className="text-[11px] font-mono text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              <span>Capture Classification</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(CAPTURE_TYPE_LABELS) as CaptureType[]).map((type) => {
                const isSelected = selectedType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setSelectedType(type);
                    }}
                    className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200 shadow-sm shadow-indigo-500/20'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[10px] font-mono font-bold flex items-center justify-between">
                      <span>{CAPTURE_TYPE_LABELS[type].label}</span>
                      {isSelected && <Check className="w-3 h-3 text-indigo-400" />}
                    </div>
                    <div className="text-[9px] font-mono text-slate-500 truncate mt-0.5">
                      {CAPTURE_TYPE_LABELS[type].desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label className="text-[11px] font-mono text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Field Surveyor Notes (Optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. West column joint, surface spalling noted..."
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onRetake();
            }}
            className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs transition-all cursor-pointer"
          >
            Retake Photo
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 font-mono text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleConfirmSave}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Persisting...' : 'Save to Survey'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
