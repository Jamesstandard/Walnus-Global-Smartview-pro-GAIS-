import React, { useState, useEffect, useCallback } from 'react';
import {
  Camera,
  Image,
  Trash2,
  Maximize2,
  X,
  Tag,
  Clock,
  Layers,
  HardDrive,
  AlertTriangle,
  FileText,
  Calendar,
  CheckCircle,
  Eye,
  RefreshCw,
  Palette,
} from 'lucide-react';
import { Survey, SurveyCapture, CAPTURE_TYPE_LABELS, CaptureType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  gridStaggerContainer,
  gridStaggerItem,
} from '../lib/motionVariants';
import { surveyCaptureRepository } from '../lib/surveyCaptureRepository';
import { playClickSound, playAlertChime, playSuccessSound } from '../lib/soundUtils';
import { SurfaceVisualizerWorkspace } from './SurfaceVisualizerWorkspace';

interface SurveyCaptureGalleryProps {
  activeSurvey: Survey;
  onLaunchCamera: () => void;
  onCaptureCountChange?: (count: number) => void;
}

export function SurveyCaptureGallery({
  activeSurvey,
  onLaunchCamera,
  onCaptureCountChange,
}: SurveyCaptureGalleryProps) {
  const [captures, setCaptures] = useState<SurveyCapture[]>([]);
  const [selectedCapture, setSelectedCapture] = useState<SurveyCapture | null>(null);
  const [selectedMediaData, setSelectedMediaData] = useState<string | null>(null);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isVisualizerOpen, setIsVisualizerOpen] = useState<boolean>(false);

  const loadCaptures = useCallback(async () => {
    if (!activeSurvey?.id) return;
    try {
      const list = await surveyCaptureRepository.getCapturesForSurvey(activeSurvey.id);
      setCaptures(list);
      if (onCaptureCountChange) {
        onCaptureCountChange(list.length);
      }
    } catch (e) {
      console.warn('Failed to load captures for survey:', e);
    }
  }, [activeSurvey?.id, onCaptureCountChange]);

  useEffect(() => {
    loadCaptures();
  }, [loadCaptures]);

  // Handle viewing full-resolution media
  const handleOpenPreview = async (capture: SurveyCapture) => {
    playClickSound();
    setSelectedCapture(capture);
    setIsLoadingMedia(true);
    try {
      const data = await surveyCaptureRepository.getMediaData(capture.localPath);
      setSelectedMediaData(data || capture.thumbnailDataUrl || null);
    } catch (e) {
      console.warn('Failed to load raw media data:', e);
      setSelectedMediaData(capture.thumbnailDataUrl || null);
    } finally {
      setIsLoadingMedia(false);
    }
  };

  // Handle capture deletion
  const handleDeleteCapture = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playAlertChime('warning');
    if (!window.confirm('Delete this survey capture? The metadata and local image storage will be permanently removed.')) {
      return;
    }
    setIsDeleting(id);
    try {
      await surveyCaptureRepository.deleteCapture(id);
      playSuccessSound();
      if (selectedCapture?.id === id) {
        setSelectedCapture(null);
        setSelectedMediaData(null);
      }
      await loadCaptures();
    } catch (err) {
      console.error('Failed to delete capture:', err);
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredCaptures = captures.filter((c) => {
    if (filterType === 'ALL') return true;
    return c.captureType === filterType;
  });

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans">
      {/* Top Banner */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-700/80 flex items-center justify-center text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-mono font-bold text-slate-100">
                {activeSurvey.title}
              </h2>
              <span className="px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-700/60 text-[10px] font-mono text-indigo-300">
                {activeSurvey.id}
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400">
              Survey Capture History • {captures.length} Photographic Record{captures.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadCaptures}
            title="Refresh Captures"
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onLaunchCamera();
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Capture Photo</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {captures.length > 0 && (
        <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterType === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Captures ({captures.length})
          </button>
          {(Object.keys(CAPTURE_TYPE_LABELS) as CaptureType[]).map((type) => {
            const count = captures.filter((c) => c.captureType === type).length;
            if (count === 0) return null;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filterType === type
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {CAPTURE_TYPE_LABELS[type].label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Main Gallery Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredCaptures.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-3">
              <Camera className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-mono font-bold text-slate-200 mb-1">
              No Captures Recorded
            </h3>
            <p className="text-xs font-mono text-slate-400 max-w-sm mb-4">
              {captures.length === 0
                ? 'This survey currently has no saved photographs. Launch the camera to record your first field observation.'
                : 'No captures match the selected filter.'}
            </p>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onLaunchCamera();
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Launch Camera</span>
            </button>
          </div>
        ) : (
          <motion.div
            variants={gridStaggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
          >
            {filteredCaptures.map((capture) => {
              const typeInfo = CAPTURE_TYPE_LABELS[capture.captureType] || { label: capture.captureType };
              return (
                <motion.div
                  variants={gridStaggerItem}
                  layout="position"
                  key={capture.id}
                  onClick={() => handleOpenPreview(capture)}
                  className="group relative rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-md hover:border-indigo-500/80 transition-all cursor-pointer flex flex-col"
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-video bg-slate-950 overflow-hidden flex items-center justify-center">
                    {capture.thumbnailDataUrl ? (
                      <img
                        src={capture.thumbnailDataUrl}
                        alt="Survey Thumbnail"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="text-slate-600 flex flex-col items-center">
                        <Image className="w-6 h-6 mb-1" />
                        <span className="text-[9px] font-mono">No Thumbnail</span>
                      </div>
                    )}
                    {/* Top Type Tag */}
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-950/80 backdrop-blur-sm border border-slate-800 text-[9px] font-mono text-indigo-300">
                      {typeInfo.label}
                    </span>
                    {/* Delete Action Button */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCapture(capture.id, e)}
                      title="Delete Capture"
                      disabled={isDeleting === capture.id}
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-slate-950/80 hover:bg-rose-950 hover:text-rose-400 text-slate-400 border border-slate-800 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Metadata Footer */}
                  <div className="p-2 space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                      <span>{new Date(capture.createdAtEpochMs).toLocaleDateString()}</span>
                      <span>{new Date(capture.createdAtEpochMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {capture.notes ? (
                      <p className="text-[10px] font-mono text-slate-300 truncate">
                        {capture.notes}
                      </p>
                    ) : (
                      <p className="text-[9px] font-mono text-slate-500 truncate">
                        {capture.width && capture.height ? `${capture.width}×${capture.height} px` : capture.id}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Full-Resolution Modal Preview */}
      {selectedCapture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/95 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-700/80 flex items-center justify-center text-indigo-400">
                  <Image className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
                    {CAPTURE_TYPE_LABELS[selectedCapture.captureType]?.label || selectedCapture.captureType}
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400">
                    ID: {selectedCapture.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCapture(null);
                  setSelectedMediaData(null);
                }}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-3">
              {/* Image View */}
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[260px] max-h-[400px]">
                {isLoadingMedia ? (
                  <div className="flex flex-col items-center text-slate-400 text-xs font-mono">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mb-2" />
                    <span>Loading local offline image...</span>
                  </div>
                ) : selectedMediaData ? (
                  <img
                    src={selectedMediaData}
                    alt="Full Resolution Survey Capture"
                    className="max-h-[380px] w-auto max-w-full object-contain"
                  />
                ) : (
                  <div className="text-slate-500 text-xs font-mono">
                    Image data could not be retrieved from local storage
                  </div>
                )}
              </div>

              {/* Detailed Metadata Sheet */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] font-mono">
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-500 block">Survey Association</span>
                  <span className="text-indigo-300 font-bold block truncate">{selectedCapture.surveyId}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-500 block">Resolution</span>
                  <span className="text-slate-200 font-bold block">
                    {selectedCapture.width && selectedCapture.height
                      ? `${selectedCapture.width} × ${selectedCapture.height} px`
                      : 'Standard 1080p'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-500 block">Created Timestamp</span>
                  <span className="text-slate-200 font-bold block">
                    {new Date(selectedCapture.createdAtEpochMs).toLocaleString()}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 col-span-2">
                  <span className="text-slate-500 block">Local Filesystem Reference</span>
                  <span className="text-slate-300 font-bold block truncate">{selectedCapture.localPath}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-500 block">Sync / Storage State</span>
                  <span className="text-emerald-400 font-bold block flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span>Local Offline Room</span>
                  </span>
                </div>
              </div>

              {selectedCapture.notes && (
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300">
                  <span className="text-slate-500 text-[10px] block mb-0.5">Surveyor Notes:</span>
                  {selectedCapture.notes}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleDeleteCapture(selectedCapture.id)}
                className="px-3 py-1.5 rounded-xl border border-rose-800/80 bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Capture</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setIsVisualizerOpen(true);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Visualise & Paint Surfaces</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCapture(null);
                    setSelectedMediaData(null);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Surface Visualizer & Coating Workspace Modal (SV-006) */}
      {isVisualizerOpen && selectedCapture && (
        <SurfaceVisualizerWorkspace
          captureId={selectedCapture.id}
          imageSrc={selectedMediaData || selectedCapture.thumbnailDataUrl || ''}
          surveyTitle={activeSurvey.title}
          onClose={() => setIsVisualizerOpen(false)}
        />
      )}
    </div>
  );
}
