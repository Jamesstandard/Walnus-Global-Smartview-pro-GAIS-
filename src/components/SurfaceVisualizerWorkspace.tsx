/**
 * SmartView Pro™ - Surface Visualizer & Coating Workspace
 * Walnus Global Ventures
 * Milestone: SV-006 Surface Selection & Coating Visualisation
 */

import React, { useState, useRef } from 'react';
import {
  X,
  Palette,
  Layers,
  Sparkles,
  Eye,
  Camera,
  Check,
  Plus,
  Trash2,
  Sliders,
  RotateCcw,
  Download,
  ShieldCheck,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  VisualizationProject,
  SurfaceSelectionRegion,
  SelectionMethod,
  WALNUS_EXTERIOR_PALETTE,
  createDefaultVisualizationProject
} from '../lib/surfaceVisualizationEngine';
import { playClickSound, playSuccessSound } from '../lib/soundUtils';

interface SurfaceVisualizerWorkspaceProps {
  captureId: string;
  imageSrc: string;
  surveyTitle: string;
  onClose: () => void;
}

export function SurfaceVisualizerWorkspace({
  captureId,
  imageSrc,
  surveyTitle,
  onClose,
}: SurfaceVisualizerWorkspaceProps) {
  const [project, setProject] = useState<VisualizationProject>(() =>
    createDefaultVisualizationProject(captureId, imageSrc)
  );

  const [viewMode, setViewMode] = useState<'preview' | 'original'>('preview');
  const [selectedRegionId, setSelectedRegionId] = useState<string>(project.regions[0]?.id || '');
  const [customColor, setCustomColor] = useState<string>('#3b82f6');
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeRegion = project.regions.find((r) => r.id === selectedRegionId) || project.regions[0];

  const handleAddRegion = (method: SelectionMethod) => {
    playClickSound();
    const newId = `reg_${Date.now()}`;
    const newReg: SurfaceSelectionRegion = {
      id: newId,
      name: `Surface Region ${project.regions.length + 1} (${method.toUpperCase()})`,
      method,
      points: [
        { x: 50 + Math.random() * 100, y: 50 + Math.random() * 100 },
        { x: 250 + Math.random() * 50, y: 50 + Math.random() * 50 },
        { x: 250 + Math.random() * 50, y: 250 + Math.random() * 50 },
        { x: 50 + Math.random() * 100, y: 250 + Math.random() * 50 },
      ],
      colorHex: customColor,
      finishType: 'Satin',
      timestamp: Date.now(),
    };

    setProject((prev) => ({
      ...prev,
      regions: [...prev.regions, newReg],
      activeMethod: method,
    }));
    setSelectedRegionId(newId);
  };

  const handleDeleteRegion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();
    setProject((prev) => ({
      ...prev,
      regions: prev.regions.filter((r) => r.id !== id),
    }));
  };

  const handleApplyColor = (hex: string) => {
    playClickSound();
    setCustomColor(hex);
    if (!activeRegion) return;
    setProject((prev) => ({
      ...prev,
      regions: prev.regions.map((r) => (r.id === activeRegion.id ? { ...r, colorHex: hex } : r)),
    }));
  };

  const handleRunAiSegmentation = () => {
    playClickSound();
    setIsAiProcessing(true);
    setTimeout(() => {
      setIsAiProcessing(false);
      playSuccessSound();
      const aiReg: SurfaceSelectionRegion = {
        id: `reg_ai_${Date.now()}`,
        name: `AI Auto-Segment Structural Plane`,
        method: 'ai_auto_segment',
        points: [
          { x: 80, y: 70 },
          { x: 320, y: 70 },
          { x: 320, y: 280 },
          { x: 80, y: 280 },
        ],
        colorHex: '#0284c7',
        finishType: 'Elastomeric',
        timestamp: Date.now(),
      };
      setProject((prev) => ({
        ...prev,
        regions: [...prev.regions, aiReg],
        activeMethod: 'ai_auto_segment',
      }));
      setSelectedRegionId(aiReg.id);
    }, 1200);
  };

  const handleSaveVisualization = () => {
    playSuccessSound();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="fixed top-[86px] inset-x-0 bottom-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 overflow-y-auto font-mono">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-7xl max-h-[96vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <header className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wider uppercase">
                  Surface Selection & Coating Visualizer
                </h2>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                  SV-006 ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Survey: <span className="text-slate-200 font-bold">{surveyTitle}</span> • {project.regions.length} Active Surfaces
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setViewMode('original');
                }}
                className={`px-3 py-1 rounded transition-all cursor-pointer font-bold ${
                  viewMode === 'original'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Original Capture
              </button>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setViewMode('preview');
                }}
                className={`px-3 py-1 rounded transition-all cursor-pointer font-bold ${
                  viewMode === 'preview'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Proposed Preview
              </button>
            </div>

            <button
              type="button"
              onClick={handleSaveVisualization}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{savedSuccess ? 'Saved!' : 'Save Preview'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Workspace Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
          
          {/* Left / Center: Interactive Canvas Visualizer */}
          <div className="lg:col-span-8 bg-black relative flex items-center justify-center p-4 overflow-hidden min-h-[400px]">
            <div className="relative max-w-full max-h-full rounded-xl overflow-hidden border-2 border-slate-800 shadow-2xl">
              <img
                src={imageSrc}
                alt="Survey Capture"
                className={`max-h-[68vh] object-contain transition-opacity duration-300 ${
                  viewMode === 'original' ? 'filter-none' : 'contrast-105'
                }`}
              />

              {/* Proposed Coating Simulation Overlay (Only in preview mode) */}
              {viewMode === 'preview' && (
                <div className="absolute inset-0 pointer-events-none">
                  {project.regions.map((reg, idx) => {
                    const isSelected = reg.id === selectedRegionId;
                    return (
                      <div
                        key={reg.id}
                        className={`absolute border-2 transition-all duration-200 flex items-center justify-center ${
                          isSelected ? 'border-cyan-400 ring-2 ring-cyan-500/50' : 'border-white/40'
                        }`}
                        style={{
                          top: `${20 + idx * 15}%`,
                          left: `${15 + idx * 20}%`,
                          width: '180px',
                          height: '140px',
                          backgroundColor: `${reg.colorHex}66`,
                          backdropFilter: 'blur(1px)',
                          borderRadius: '12px',
                        }}
                      >
                        <span className="px-2 py-0.5 rounded bg-black/80 text-[10px] text-white border border-slate-700 font-mono shadow">
                          {reg.name} ({reg.finishType})
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Floating Canvas Mode Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-950/80 border border-slate-800/50 px-6 py-3 rounded-2xl backdrop-blur-md flex items-center gap-3 text-sm shadow-xl flex-wrap justify-center">
              <span className="text-slate-400 font-mono hidden sm:inline">Selection Mode:</span>
              <button
                type="button"
                onClick={() => handleAddRegion('paint_bucket')}
                className={`px-5 py-3 rounded-xl border font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  project.activeMethod === 'paint_bucket'
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                    : 'bg-slate-900/50 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span>Paint Bucket</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddRegion('polygon_select')}
                className={`px-5 py-3 rounded-xl border font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  project.activeMethod === 'polygon_select'
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                    : 'bg-slate-900/50 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span>Polygon Select</span>
              </button>
              <button
                type="button"
                onClick={handleRunAiSegmentation}
                disabled={isAiProcessing}
                className={`px-5 py-3 rounded-xl border font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  project.activeMethod === 'ai_auto_segment'
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                    : 'bg-purple-950/80 text-purple-300 border-purple-800 hover:bg-purple-900'
                }`}
              >
                <Sparkles className={`w-5 h-5 ${isAiProcessing ? 'animate-spin' : ''}`} />
                <span>{isAiProcessing ? 'AI Segmenting...' : 'AI Auto-Segment'}</span>
              </button>
            </div>
          </div>

          {/* Right Panel: Surface Regions & Coating Assignment Inspector */}
          <div className="lg:col-span-4 bg-slate-900/90 border-l border-slate-800 p-4 flex flex-col space-y-4 overflow-y-auto">
            
            {/* Active Region Header */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Active Selected Surface</span>
              {activeRegion ? (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{activeRegion.name}</h3>
                    <p className="text-[11px] text-slate-400">Method: {activeRegion.method.toUpperCase()} • Finish: {activeRegion.finishType}</p>
                  </div>
                  <div
                    className="w-7 h-7 rounded-lg border border-slate-600 shadow"
                    style={{ backgroundColor: activeRegion.colorHex }}
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-500">No surface selected</p>
              )}
            </div>

            {/* Surface Regions List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Identified Surfaces ({project.regions.length})
                </label>
                <button
                  type="button"
                  onClick={() => handleAddRegion('paint_bucket')}
                  className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Region
                </button>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {project.regions.map((reg) => {
                  const isSelected = reg.id === selectedRegionId;
                  return (
                    <div
                      key={reg.id}
                      onClick={() => {
                        playClickSound();
                        setSelectedRegionId(reg.id);
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-4 h-4 rounded-full border border-slate-600 shrink-0"
                          style={{ backgroundColor: reg.colorHex }}
                        />
                        <span className="text-xs font-bold truncate">{reg.name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                          {reg.method}
                        </span>
                        {project.regions.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteRegion(reg.id, e)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Walnus Exterior Paint Palette & Custom Color Picker */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Walnus Global Exterior Palette
              </label>
              <div className="grid grid-cols-4 gap-2">
                {WALNUS_EXTERIOR_PALETTE.map((p) => (
                  <button
                    key={p.hex}
                    type="button"
                    onClick={() => handleApplyColor(p.hex)}
                    title={p.name}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-transform hover:scale-105 cursor-pointer ${
                      activeRegion?.colorHex === p.hex
                        ? 'border-cyan-400 ring-2 ring-cyan-500/30 bg-slate-950'
                        : 'border-slate-800 bg-slate-950/60'
                    }`}
                  >
                    <div
                      className="w-full h-7 rounded-lg shadow-inner"
                      style={{ backgroundColor: p.hex }}
                    />
                    <span className="text-[9px] text-slate-300 truncate w-full text-center">
                      {p.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom Color Input */}
              <div className="pt-2 flex items-center gap-2">
                <span className="text-xs text-slate-400">Custom HEX:</span>
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => handleApplyColor(e.target.value)}
                  className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => handleApplyColor(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                />
              </div>
            </div>

          </div>

        </div>
      </motion.div>
    </div>
  );
}
