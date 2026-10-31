/**
 * SmartView Pro™ - Survey Workspace Screen
 * Walnus Global Ventures
 * Milestone: SV-004 Survey Workspace & Capture Management
 *
 * Central operational workspace shell around SV-003 camera acquisition & local persistence.
 */

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Camera,
  Image,
  Ruler,
  FileText,
  Building2,
  MapPin,
  User,
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Edit,
  Trash2,
  Navigation,
  Compass,
  AlertTriangle,
  Sparkles,
  Info,
  ChevronRight,
  ShieldCheck,
  Phone,
  Tag,
  Check,
  X,
  Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Survey, SurveyCapture, CAPTURE_TYPE_LABELS } from '../types';
import { surveyCaptureRepository } from '../lib/surveyCaptureRepository';
import { SurveyCaptureGallery } from './SurveyCaptureGallery';
import { CameraViewfinder } from './CameraViewfinder';
import { playClickSound, playSuccessSound, playAlertChime } from '../lib/soundUtils';

interface SurveyWorkspaceProps {
  survey: Survey;
  onUpdateSurvey: (updated: Survey) => void;
  onBackToDashboard: () => void;
  onLaunchCamera: () => void;
}

export function SurveyWorkspace({
  survey,
  onUpdateSurvey,
  onBackToDashboard,
  onLaunchCamera,
}: SurveyWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'ACTIONS' | 'GALLERY' | 'DATA' | 'INFO'>('ACTIONS');
  const [captures, setCaptures] = useState<SurveyCapture[]>([]);
  const [isLoadingCaptures, setIsLoadingCaptures] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit Survey Modal State
  const [editTitle, setEditTitle] = useState(survey.title);
  const [editClient, setEditClient] = useState(survey.clientName || '');
  const [editAddress, setEditAddress] = useState(survey.siteAddress || '');
  const [editSurveyor, setEditSurveyor] = useState(survey.surveyorName || '');
  const [editNotes, setEditNotes] = useState(survey.notes || '');
  const [editStatus, setEditStatus] = useState<'active' | 'completed' | 'archived'>(survey.status || 'active');

  const loadCaptures = async () => {
    setIsLoadingCaptures(true);
    try {
      const list = await surveyCaptureRepository.getCapturesForSurvey(survey.id);
      setCaptures(list);
    } catch (e) {
      console.warn('Failed to load captures for workspace:', e);
    } finally {
      setIsLoadingCaptures(false);
    }
  };

  useEffect(() => {
    loadCaptures();
  }, [survey.id]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    playSuccessSound();
    const updated: Survey = {
      ...survey,
      title: editTitle.trim() || survey.title,
      clientName: editClient.trim() || undefined,
      siteAddress: editAddress.trim() || undefined,
      surveyorName: editSurveyor.trim() || undefined,
      notes: editNotes.trim() || undefined,
      status: editStatus,
      description: editNotes.trim() || survey.description,
      lastUpdatedEpochMs: Date.now(),
    };
    await surveyCaptureRepository.saveSurvey(updated);
    onUpdateSurvey(updated);
    setIsEditModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* 1. Header Bar */}
      <header className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onBackToDashboard();
            }}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer shrink-0 flex items-center gap-1 text-xs font-mono"
            title="Back to Surveys Dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Surveys</span>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold">
                SmartView Pro™
              </span>
              <span
                className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${
                  survey.status === 'active'
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    : survey.status === 'completed'
                    ? 'bg-blue-950 text-blue-400 border-blue-800'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {survey.status}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-white truncate font-mono">
              {survey.title}
            </h1>
          </div>
        </div>

        {/* Location Indicator Header Badge */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 shrink-0">
          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="truncate max-w-[200px]">
            {survey.latitude && survey.longitude
              ? `${survey.latitude}°, ${survey.longitude}°`
              : survey.siteAddress || 'Site Location Unset'}
          </span>
        </div>
      </header>

      {/* 2. Workspace Content Container with 20px Bottom Margin */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 max-w-5xl mx-auto w-full mb-[20px] pb-[20px]">
        {/* Project Context Card */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider">
                {survey.projectType || 'Field Site Survey'}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Created {new Date(survey.createdAtEpochMs).toLocaleDateString()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-1.5 truncate">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-400">Client:</span>
                <span className="font-bold text-white truncate">
                  {survey.clientName || 'Not specified'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-400">Site:</span>
                <span className="font-semibold text-slate-200 truncate">
                  {survey.siteAddress || 'Not specified'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-400">Surveyor:</span>
                <span className="text-slate-200 truncate">
                  {survey.surveyorName || 'Inspector'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <Camera className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="text-slate-400">Captures:</span>
                <span className="font-bold text-indigo-300">
                  {captures.length} Photos Saved
                </span>
              </div>
            </div>

            {survey.notes && (
              <p className="text-[11px] font-mono text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 mt-2">
                {survey.notes}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setIsEditModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5 text-indigo-400" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>

        {/* Tab Selector - 4 Horizontal Icon-Only Buttons */}
        <div className="grid grid-cols-4 bg-slate-900 p-1 rounded-xl border border-slate-800 font-mono text-xs font-bold uppercase">
          {/* 1. Workspace Icon Button */}
          <button
            type="button"
            title="Workspace"
            onClick={() => {
              playClickSound();
              setActiveTab('ACTIONS');
            }}
            className={`py-2.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
              activeTab === 'ACTIONS'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* 2. Capture / Gallery Icon Button */}
          <button
            type="button"
            title={`Captures (${captures.length})`}
            onClick={() => {
              playClickSound();
              setActiveTab('GALLERY');
            }}
            className={`py-2.5 rounded-lg transition-all flex items-center justify-center cursor-pointer relative ${
              activeTab === 'GALLERY'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Image className="w-4 h-4" />
            {captures.length > 0 && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          {/* 3. Survey Data Icon Button */}
          <button
            type="button"
            title="Survey Data"
            onClick={() => {
              playClickSound();
              setActiveTab('DATA');
            }}
            className={`py-2.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
              activeTab === 'DATA'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ruler className="w-4 h-4" />
          </button>

          {/* 4. Project Info Icon Button */}
          <button
            type="button"
            title="Project Info"
            onClick={() => {
              playClickSound();
              setActiveTab('INFO');
            }}
            className={`py-2.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
              activeTab === 'INFO'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>

        {/* Tab 1: Workspace Action Grid */}
        {activeTab === 'ACTIONS' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Action Card 1: Camera Capture */}
              <div
                onClick={() => {
                  playClickSound();
                  onLaunchCamera();
                }}
                className="group p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/40 hover:border-indigo-400 shadow-xl hover:shadow-indigo-500/10 transition-all cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    SV-003 Camera Pipeline
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-base font-mono font-bold text-white flex items-center gap-2 group-hover:text-indigo-300 transition-colors">
                    <span>Camera Capture</span>
                    <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-xs font-mono text-slate-400 mt-1">
                    Launch live camera preview to record site photographs bound to active survey.
                  </p>
                </div>
              </div>

              {/* Action Card 2: Captures Gallery */}
              <div
                onClick={() => {
                  playClickSound();
                  setActiveTab('GALLERY');
                }}
                className="group p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/60 shadow-lg transition-all cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-indigo-400 border border-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Image className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                    {captures.length} Saved
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-base font-mono font-bold text-white flex items-center gap-2 group-hover:text-indigo-300 transition-colors">
                    <span>Captures Gallery</span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-xs font-mono text-slate-400 mt-1">
                    Inspect photographs, review capture metadata, or purge unwanted records.
                  </p>
                </div>
              </div>

              {/* Action Card 3: Survey Data & Geometry */}
              <div
                onClick={() => {
                  playClickSound();
                  setActiveTab('DATA');
                }}
                className="group p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 shadow-lg transition-all cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-emerald-400 border border-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Ruler className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Structured Log
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-base font-mono font-bold text-white flex items-center gap-2 group-hover:text-emerald-300 transition-colors">
                    <span>Survey Data</span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-xs font-mono text-slate-400 mt-1">
                    Inspect substrate observations, defect notes, area metrics & spatial extension points.
                  </p>
                </div>
              </div>

              {/* Action Card 4: Project Info */}
              <div
                onClick={() => {
                  playClickSound();
                  setActiveTab('INFO');
                }}
                className="group p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 shadow-lg transition-all cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-cyan-400 border border-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                    Client Metadata
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-base font-mono font-bold text-white flex items-center gap-2 group-hover:text-cyan-300 transition-colors">
                    <span>Project Info</span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-xs font-mono text-slate-400 mt-1">
                    Manage client contacts, site address details, surveyor info & reference numbers.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Recent Captures Preview Strip */}
            {captures.length > 0 && (
              <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-300 uppercase">
                    Recent Survey Captures ({captures.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('GALLERY')}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    View All in Gallery →
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {captures.slice(0, 4).map((cap) => (
                    <div
                      key={cap.id}
                      onClick={() => setActiveTab('GALLERY')}
                      className="group relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 cursor-pointer"
                    >
                      {cap.thumbnailDataUrl ? (
                        <img
                          src={cap.thumbnailDataUrl}
                          alt="Thumbnail"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-600">
                          <Image className="w-5 h-5" />
                        </div>
                      )}
                      <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-slate-950/80 text-[8px] font-mono text-indigo-300">
                        {CAPTURES_LABELS(cap.captureType)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Gallery */}
        {activeTab === 'GALLERY' && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden min-h-[400px]">
            <SurveyCaptureGallery
              activeSurvey={survey}
              onLaunchCamera={onLaunchCamera}
              onCaptureCountChange={() => loadCaptures()}
            />
          </div>
        )}

        {/* Tab 3: Survey Data Log */}
        {activeTab === 'DATA' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-emerald-400" />
                  <span>Structured Field Observations Log</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {captures.length} Linked Captures
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase block">Substrate Type</span>
                  <strong className="text-white text-sm block mt-0.5">
                    {survey.projectType || 'Exterior Masonry & Render'}
                  </strong>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase block">Captures Count</span>
                  <strong className="text-indigo-300 text-sm block mt-0.5">
                    {captures.length} Photographs
                  </strong>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase block">Inspection Status</span>
                  <strong className="text-emerald-400 text-sm block mt-0.5 capitalize">
                    {survey.status} Field Audit
                  </strong>
                </div>
              </div>

              {/* Extension Point Banner */}
              <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-xl flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-indigo-200">
                    SV-005 ARCore Spatial Measurement Extension Point
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                    Subsequent lifecycle stages (SV-005) will attach real-time depth point clouds, surface area polygons, and crack width measurements directly onto these survey records.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Detailed Project Info */}
        {activeTab === 'INFO' && (
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Survey & Client Metadata Sheet</span>
              </span>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] flex items-center gap-1 cursor-pointer"
              >
                <Edit className="w-3 h-3 text-indigo-400" />
                <span>Edit Metadata</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase block">Survey Identifier</span>
                <strong className="text-white block mt-0.5">{survey.id}</strong>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase block">Project Reference</span>
                <strong className="text-slate-200 block mt-0.5">
                  {survey.projectReference || 'None Assigned'}
                </strong>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase block">Client Name</span>
                <strong className="text-white block mt-0.5">
                  {survey.clientName || 'Unspecified'}
                </strong>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase block">Client Contact</span>
                <strong className="text-slate-200 block mt-0.5">
                  {survey.clientContact || 'Unspecified'}
                </strong>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 sm:col-span-2">
                <span className="text-slate-500 text-[10px] uppercase block">Site Address / Location</span>
                <strong className="text-slate-200 block mt-0.5">
                  {survey.siteAddress || 'Unspecified'}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Details Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950">
                <h3 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
                  Edit Survey Information
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-4 space-y-3 font-mono text-xs overflow-y-auto flex-1">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Survey Name</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Client Name</label>
                    <input
                      type="text"
                      value={editClient}
                      onChange={(e) => setEditClient(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Survey Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Site Address</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Surveyor Name</label>
                  <input
                    type="text"
                    value={editSurveyor}
                    onChange={(e) => setEditSurveyor(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 resize-none"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CAPTURES_LABELS(type: string) {
  return CAPTURE_TYPE_LABELS[type as keyof typeof CAPTURE_TYPE_LABELS]?.label || type;
}
