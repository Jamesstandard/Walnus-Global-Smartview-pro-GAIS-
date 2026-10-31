/**
 * SmartView Pro™ - New Survey Creation Modal
 * Walnus Global Ventures
 * Milestone: SV-004 Survey Workspace & Capture Management
 *
 * Provides rapid field entry for project surveys with optional non-blocking GPS acquisition.
 */

import React, { useState } from 'react';
import {
  X,
  Layers,
  MapPin,
  User,
  Building2,
  FileText,
  Navigation,
  Compass,
  Check,
  Sparkles,
  Phone,
  Tag,
  Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Survey } from '../types';
import { surveyCaptureRepository } from '../lib/surveyCaptureRepository';
import { playClickSound, playSuccessSound, playAlertChime } from '../lib/soundUtils';

interface NewSurveyModalProps {
  currentProjectId?: string;
  onSurveyCreated: (survey: Survey) => void;
  onClose: () => void;
}

export function NewSurveyModal({
  currentProjectId = 'proj_default_site',
  onSurveyCreated,
  onClose,
}: NewSurveyModalProps) {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [surveyorName, setSurveyorName] = useState('Principal Field Surveyor');
  const [notes, setNotes] = useState('');
  const [projectReference, setProjectReference] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [projectType, setProjectType] = useState('Paint Coating Survey');

  // GPS State (Non-blocking)
  const [isLocating, setIsLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);

  const handleAcquireGps = () => {
    playClickSound();
    if (!navigator.geolocation) {
      setGpsStatusMessage('Geolocation not supported by device browser');
      return;
    }

    setIsLocating(true);
    setGpsStatusMessage('Acquiring satellite fix...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setCoords({ lat, lng });
        setGpsStatusMessage(`GPS Fixed: ${lat}°, ${lng}°`);
        playSuccessSound();
      },
      (err) => {
        setIsLocating(false);
        setGpsStatusMessage(`GPS Unavailable (${err.message}). Manual address preserved.`);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    playSuccessSound();
    const surveyId = `srv_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const newSurvey: Survey = {
      id: surveyId,
      projectId: currentProjectId,
      title: title.trim(),
      clientName: clientName.trim() || 'Unspecified Client',
      siteAddress: siteAddress.trim() || 'Unspecified Site Location',
      surveyorName: surveyorName.trim() || 'Field Inspector',
      notes: notes.trim() || undefined,
      projectReference: projectReference.trim() || undefined,
      clientContact: clientContact.trim() || undefined,
      projectType,
      latitude: coords?.lat,
      longitude: coords?.lng,
      status: 'active',
      description: notes.trim() || `${projectType} for ${clientName || 'site'}`,
      createdAtEpochMs: Date.now(),
      lastUpdatedEpochMs: Date.now(),
      captureCount: 0,
    };

    await surveyCaptureRepository.saveSurvey(newSurvey);
    onSurveyCreated(newSurvey);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/90 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-700/80 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
                Initiate New Field Survey
              </h3>
              <p className="text-[10px] font-mono text-slate-400">
                Walnus SmartView Pro™ • Survey Entry Subsystem
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3.5 flex-1 font-sans">
          {/* Section 1: Survey Title & Project Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                Project / Survey Name *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Building Façade Survey - Sector 4"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                Discipline Type
              </label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                <option value="Paint Coating Survey">Paint Coating Survey</option>
                <option value="Screed Substrate Audit">Screed Substrate Audit</option>
                <option value="Plaster & Render Inspection">Plaster & Render Inspection</option>
                <option value="Structural Facade Survey">Structural Façade Survey</option>
              </select>
            </div>
          </div>

          {/* Section 2: Client & Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-indigo-400" />
                <span>Client / Organization *</span>
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Apex Engineering Corp"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-indigo-400" />
                <span>Client Contact / Phone</span>
              </label>
              <input
                type="text"
                value={clientContact}
                onChange={(e) => setClientContact(e.target.value)}
                placeholder="e.g. Eng. David Miller (+234 803 123 4567)"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Section 3: Site Location & GPS Non-blocking Fix */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-indigo-400" />
                <span>Site Address / Location *</span>
              </label>
              <button
                type="button"
                onClick={handleAcquireGps}
                disabled={isLocating}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/80 cursor-pointer disabled:opacity-50 transition-all"
              >
                <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{coords ? 'Re-acquire GPS' : 'Acquire GPS Coordinates'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={siteAddress}
              onChange={(e) => setSiteAddress(e.target.value)}
              placeholder="e.g. Plot 14, Commercial District, Ikeja, Lagos"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {gpsStatusMessage && (
              <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 pl-1">
                <Compass className="w-3 h-3 text-cyan-400" />
                <span>{gpsStatusMessage}</span>
              </div>
            )}
          </div>

          {/* Section 4: Surveyor & Project Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-indigo-400" />
                <span>Surveyor Name</span>
              </label>
              <input
                type="text"
                value={surveyorName}
                onChange={(e) => setSurveyorName(e.target.value)}
                placeholder="e.g. Field Inspector"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-indigo-400" />
                <span>Project Reference ID</span>
              </label>
              <input
                type="text"
                value={projectReference}
                onChange={(e) => setProjectReference(e.target.value)}
                placeholder="e.g. PRJ-2026-BLK-04"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Section 5: Notes & Observations */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-indigo-400" />
              <span>Survey Scope & Field Notes</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Initial substrate inspection, crack monitoring & exterior coat adhesion audit"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Create & Open Workspace</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
