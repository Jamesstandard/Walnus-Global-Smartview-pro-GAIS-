import React from 'react';
import {
  Camera,
  Video,
  Crosshair,
  FlaskConical,
  Smartphone,
  Layers,
  Sparkles,
  Check,
  Plus,
  Eye,
  Sliders,
  Play,
  RotateCw,
  Cpu,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';
import { playClickSound } from '../lib/soundUtils';
import { HardwareRAMProfile, RAM_PROFILES, HardwareMemoryStats } from '../lib/hardwareGovernor';
import { STUDIO_3D_MODES, Studio3DActiveMode, CHEMICAL_SUBSTRATE_REGISTRY } from '../lib/studio3DModes';
import { MultiViewCapture, SingleImageModelType } from '../lib/imageReconstructionEngine';

export interface Reconstruction3DModeControlsProps {
  activeStudioMode: Studio3DActiveMode;
  setActiveStudioMode: (mode: Studio3DActiveMode) => void;
  hardwareProfile: HardwareRAMProfile;
  setHardwareProfile: (profile: HardwareRAMProfile) => void;
  memoryStats: HardwareMemoryStats;

  // Mode A: Image Reconstruction
  singleImageModel: SingleImageModelType;
  setSingleImageModel: (model: SingleImageModelType) => void;
  multiViews: MultiViewCapture[];
  setMultiViews: React.Dispatch<React.SetStateAction<MultiViewCapture[]>>;
  isMultiViewEnhanced: boolean;
  setIsMultiViewEnhanced: (val: boolean | ((prev: boolean) => boolean)) => void;
  polyDecimation: number;
  setPolyDecimation: (polys: number) => void;
  textureLod: 'stucco' | 'concrete' | 'masonry' | 'smooth';
  setTextureLod: (lod: 'stucco' | 'concrete' | 'masonry' | 'smooth') => void;
  meshQualityStats: { chamferMm: number; ssim: number; viewsCount: number };

  // Mode B: Video Reconstruction / 3DGS
  splatDensity: number;
  setSplatDensity: (density: number) => void;
  quantize16BitSplats: boolean;
  setQuantize16BitSplats: (val: boolean | ((prev: boolean) => boolean)) => void;
  videoFps: 15 | 30;
  setVideoFps: (fps: 15 | 30) => void;
  keyframeInterval: number;
  setKeyframeInterval: (interval: number) => void;
  isStreamingVideo: boolean;
  currentStreamingFrame: number;
  totalStreamingFrames: number;
  streamingSplats: number;
  psnrDb: number;
  onTriggerVideoStream: () => void;

  // Mode C: Spatial Measurement HUD
  measurePointA: { x: number; y: number; z: number } | null;
  setMeasurePointA: (pt: { x: number; y: number; z: number } | null) => void;
  measurePointB: { x: number; y: number; z: number } | null;
  setMeasurePointB: (pt: { x: number; y: number; z: number } | null) => void;
  measureDistMeters: number;
  activePointPicker: 'A' | 'B';
  setActivePointPicker: (picker: 'A' | 'B') => void;

  // Mode D: Chemical Substrate Match
  selectedSubstrate: string;
  setSelectedSubstrate: (substrate: string) => void;
  siteAreaSqMeters?: number;
}

export function Reconstruction3DModeControls({
  activeStudioMode,
  setActiveStudioMode,
  hardwareProfile,
  setHardwareProfile,
  memoryStats,

  // Mode A
  singleImageModel,
  setSingleImageModel,
  multiViews,
  setMultiViews,
  isMultiViewEnhanced,
  setIsMultiViewEnhanced,
  polyDecimation,
  setPolyDecimation,
  textureLod,
  setTextureLod,
  meshQualityStats,

  // Mode B
  splatDensity,
  setSplatDensity,
  quantize16BitSplats,
  setQuantize16BitSplats,
  videoFps,
  setVideoFps,
  keyframeInterval,
  setKeyframeInterval,
  isStreamingVideo,
  currentStreamingFrame,
  totalStreamingFrames,
  streamingSplats,
  psnrDb,
  onTriggerVideoStream,

  // Mode C
  measurePointA,
  setMeasurePointA,
  measurePointB,
  setMeasurePointB,
  measureDistMeters,
  activePointPicker,
  setActivePointPicker,

  // Mode D
  selectedSubstrate,
  setSelectedSubstrate,
  siteAreaSqMeters = 227.6,
}: Reconstruction3DModeControlsProps) {
  const toggleView = (viewId: string) => {
    playClickSound();
    setMultiViews((prev) =>
      prev.map((v) => (v.id === viewId ? { ...v, isActive: !v.isActive } : v))
    );
  };

  return (
    <div className="space-y-3">
      {/* 4 Active Studio Modes Selector */}
      <div className="space-y-1">
        <label className="text-slate-400 block text-[9px] uppercase font-bold font-mono flex items-center justify-between">
          <span>Active 3D Mode</span>
          <span className="text-indigo-400 text-[8px] uppercase">
            {STUDIO_3D_MODES[activeStudioMode].badge}
          </span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-black/50 p-1 rounded-xl border border-slate-800 font-mono text-[9px]">
          {(
            [
              'image_to_3d',
              'video_to_3d_splat',
              'spatial_hud',
              'chemical_formulation',
              'studio_scene',
            ] as const
          ).map((mId) => {
            const def = STUDIO_3D_MODES[mId];
            const isActive = activeStudioMode === mId;
            return (
              <button
                key={mId}
                type="button"
                onClick={() => {
                  playClickSound();
                  setActiveStudioMode(mId);
                }}
                className={`py-1.5 px-1 rounded-lg font-bold transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>{def.shortName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Android 4GB RAM Target & Hardware Governor HUD */}
      <div className="p-2 bg-slate-950/90 border border-slate-800 rounded-xl space-y-1.5 font-mono text-[9px]">
        <div className="flex items-center justify-between">
          <span className="text-slate-300 font-bold flex items-center gap-1">
            <Smartphone className="w-3 h-3 text-cyan-400" /> Hardware RAM Governor (Android 4GB)
          </span>
          <span className="text-[8px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800/60 text-cyan-300 font-bold uppercase">
            {RAM_PROFILES[hardwareProfile].badge}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {(['android_4gb', 'balanced_mobile', 'ultra_desktop'] as const).map((pId) => (
            <button
              key={pId}
              type="button"
              onClick={() => {
                playClickSound();
                setHardwareProfile(pId);
                if (pId === 'android_4gb') {
                  setPolyDecimation(18000);
                  setSplatDensity(15000);
                  setQuantize16BitSplats(true);
                } else if (pId === 'balanced_mobile') {
                  setPolyDecimation(52000);
                  setSplatDensity(60000);
                } else {
                  setPolyDecimation(120000);
                  setSplatDensity(150000);
                  setQuantize16BitSplats(false);
                }
              }}
              className={`py-1 px-1 rounded text-[8px] font-bold uppercase transition-all cursor-pointer ${
                hardwareProfile === pId
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-black/40 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {pId === 'android_4gb' ? '4GB Android' : pId === 'balanced_mobile' ? 'Balanced' : 'Ultra'}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-800/60 text-[8px] text-slate-400">
          <div>
            Heap: <strong className="text-white">{memoryStats.usedHeapMB}MB</strong> / {memoryStats.heapLimitMB}MB
          </div>
          <div>
            VRAM: <strong className="text-cyan-300">{memoryStats.estimatedVramMB}MB</strong>
          </div>
          <div>
            Zero-Cost: <strong className="text-emerald-400">WebGL Free</strong>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE A: IMAGE RECONSTRUCTION (TripoSR / InstantMesh + Multi-View Input) */}
      {/* ========================================================================= */}
      {activeStudioMode === 'image_to_3d' && (
        <div className="space-y-2.5 p-2.5 bg-black/40 border border-indigo-900/50 rounded-xl font-mono text-[9px]">
          {/* Header */}
          <div className="flex items-center justify-between text-indigo-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-indigo-400" /> Mode A: Image Reconstruction
            </span>
            <span className="px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-[8px] text-indigo-300 uppercase">
              Open-Source Mesh
            </span>
          </div>

          {/* Model Architecture Selector: TripoSR vs InstantMesh */}
          <div>
            <label className="text-slate-400 block uppercase font-bold mb-1 text-[8px]">
              Single-Image to 3D Mesh Engine
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setSingleImageModel('triposr_lightweight');
                }}
                className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                  singleImageModel === 'triposr_lightweight'
                    ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-xs'
                    : 'bg-black/50 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-[9px] flex items-center justify-between">
                  <span>TripoSR</span>
                  <span className="text-[7px] text-emerald-400 font-normal">64MB Fast</span>
                </div>
                <div className="text-[7.5px] text-slate-400 mt-0.5 leading-tight">
                  Lightweight feed-forward NeRF/Mesh transformer.
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setSingleImageModel('instantmesh_transformer');
                }}
                className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                  singleImageModel === 'instantmesh_transformer'
                    ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-xs'
                    : 'bg-black/50 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-[9px] flex items-center justify-between">
                  <span>InstantMesh (LGM)</span>
                  <span className="text-[7px] text-indigo-300 font-normal">Deep Geometry</span>
                </div>
                <div className="text-[7.5px] text-slate-400 mt-0.5 leading-tight">
                  Multi-view diffusion + Marching Tetrahedra.
                </div>
              </button>
            </div>
          </div>

          {/* Multi-View Enhancement Suite */}
          <div className="pt-1 border-t border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-bold flex items-center gap-1 text-[8.5px]">
                <Layers className="w-3 h-3 text-cyan-400" /> Multi-View Quality Enhancement
              </span>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setIsMultiViewEnhanced((prev) => !prev);
                }}
                className={`px-1.5 py-0.5 rounded text-[7.5px] font-bold uppercase transition-all cursor-pointer ${
                  isMultiViewEnhanced
                    ? 'bg-cyan-950 border border-cyan-500 text-cyan-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isMultiViewEnhanced ? 'Multi-View Active' : 'Single-View Only'}
              </button>
            </div>

            {/* View Grid */}
            <div className="grid grid-cols-2 gap-1">
              {multiViews.map((view) => (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => toggleView(view.id)}
                  className={`p-1.5 rounded border text-left flex items-center justify-between transition-all cursor-pointer ${
                    view.isActive
                      ? 'bg-cyan-950/40 border-cyan-600/70 text-cyan-200'
                      : 'bg-black/40 border-slate-800 text-slate-500 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div>
                    <div className="font-bold text-[8.5px] leading-tight">{view.name}</div>
                    <div className="text-[7.5px] text-slate-400">{view.angleLabel}</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[7px] text-emerald-400 font-bold">
                      {(view.confidenceScore * 100).toFixed(0)}%
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full flex items-center justify-center text-[7px] mt-0.5 ${
                        view.isActive ? 'bg-cyan-500 text-black font-bold' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {view.isActive ? '✓' : ''}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Quality Metrics Banner */}
            <div className="grid grid-cols-3 gap-1 bg-black/60 p-1.5 rounded-lg border border-slate-800/80 text-[7.5px] text-slate-400">
              <div>
                SSIM Fidelity: <strong className="text-cyan-300">{meshQualityStats.ssim.toFixed(2)}</strong>
              </div>
              <div>
                Chamfer Error: <strong className="text-emerald-400">±{meshQualityStats.chamferMm}mm</strong>
              </div>
              <div>
                Active Views: <strong className="text-white">{multiViews.filter((v) => v.isActive).length}/4</strong>
              </div>
            </div>
          </div>

          {/* Mesh Density & Texture Settings */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
            <div>
              <label className="text-slate-400 block uppercase font-bold mb-1 text-[8px]">
                Decimation Poly LOD
              </label>
              <select
                value={polyDecimation}
                onChange={(e) => setPolyDecimation(Number(e.target.value))}
                className="w-full py-1 px-1.5 bg-black border border-slate-700 rounded text-slate-200 focus:outline-none cursor-pointer text-[8px]"
              >
                <option value={18000}>18k (4GB RAM Safe)</option>
                <option value={52000}>52k (Balanced)</option>
                <option value={120000}>120k (Ultra High-Res)</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 block uppercase font-bold mb-1 text-[8px]">
                Texture Material
              </label>
              <select
                value={textureLod}
                onChange={(e) => setTextureLod(e.target.value as any)}
                className="w-full py-1 px-1.5 bg-black border border-slate-700 rounded text-slate-200 focus:outline-none uppercase cursor-pointer text-[8px]"
              >
                <option value="stucco">Stucco Render</option>
                <option value="concrete">Architectural Concrete</option>
                <option value="masonry">Brick Masonry</option>
                <option value="smooth">Smooth Plaster</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE B: VIDEO RECONSTRUCTION (3D Gaussian Splatting & Streaming Frames) */}
      {/* ========================================================================= */}
      {activeStudioMode === 'video_to_3d_splat' && (
        <div className="space-y-2.5 p-2.5 bg-black/40 border border-cyan-900/50 rounded-xl font-mono text-[9px]">
          {/* Header */}
          <div className="flex items-center justify-between text-cyan-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-cyan-400" /> Mode B: Video 3DGS Pipeline
            </span>
            <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-[8px] text-cyan-300 uppercase">
              Streaming Splats
            </span>
          </div>

          {/* Streaming Frame Processing Status */}
          <div className="bg-black/60 p-2 rounded-lg border border-cyan-950 space-y-1.5">
            <div className="flex items-center justify-between text-[8px]">
              <span className="text-slate-400">Streaming Frame Ingestion:</span>
              <span className="text-emerald-400 font-bold">
                Frame {currentStreamingFrame} / {totalStreamingFrames}
              </span>
            </div>

            {/* Frame Progress Bar */}
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
                style={{
                  width: `${(currentStreamingFrame / totalStreamingFrames) * 100}%`,
                }}
              />
            </div>

            <div className="grid grid-cols-3 gap-1 pt-1 text-[7.5px] text-slate-400">
              <div>
                Splats: <strong className="text-white">{streamingSplats.toLocaleString()}</strong>
              </div>
              <div>
                Radiance PSNR: <strong className="text-cyan-300">{psnrDb} dB</strong>
              </div>
              <div>
                Trajectory: <strong className="text-emerald-400">COLMAP 6-DoF</strong>
              </div>
            </div>

            {/* Live Ingestion Trigger Button */}
            <button
              type="button"
              disabled={isStreamingVideo}
              onClick={onTriggerVideoStream}
              className={`w-full py-1.5 rounded font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isStreamingVideo
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md'
              }`}
            >
              {isStreamingVideo ? (
                <>
                  <RotateCw className="w-3 h-3 animate-spin text-cyan-300" />
                  Streaming Frame Ingestion...
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  Ingest & Process Video Stream
                </>
              )}
            </button>
          </div>

          {/* Splat Density Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-400 text-[8px]">
              <span>Splat Point Cloud Budget:</span>
              <strong className="text-white">{splatDensity.toLocaleString()} splats</strong>
            </div>
            <input
              type="range"
              min={10000}
              max={150000}
              step={5000}
              value={splatDensity}
              onChange={(e) => setSplatDensity(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded"
            />
          </div>

          {/* 16-bit Quantization & Frame Rate Controls */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
            <div>
              <label className="text-slate-400 block uppercase font-bold mb-1 text-[8px]">
                Frame Sampling Rate
              </label>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setVideoFps(15);
                  }}
                  className={`py-1 rounded text-[8px] font-bold ${
                    videoFps === 15 ? 'bg-cyan-600 text-white' : 'bg-black/50 text-slate-400 border border-slate-800'
                  }`}
                >
                  15 FPS
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setVideoFps(30);
                  }}
                  className={`py-1 rounded text-[8px] font-bold ${
                    videoFps === 30 ? 'bg-cyan-600 text-white' : 'bg-black/50 text-slate-400 border border-slate-800'
                  }`}
                >
                  30 FPS
                </button>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block uppercase font-bold mb-1 text-[8px]">
                16-Bit Quantized Splats
              </label>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setQuantize16BitSplats((prev) => !prev);
                }}
                className={`w-full py-1 px-1 rounded text-[8px] font-bold uppercase transition-all ${
                  quantize16BitSplats
                    ? 'bg-emerald-950 border border-emerald-500 text-emerald-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {quantize16BitSplats ? '75% VRAM Cut (4GB Safe)' : 'Full 32-bit Float'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE C: SPATIAL MEASUREMENT HUD */}
      {/* ========================================================================= */}
      {activeStudioMode === 'spatial_hud' && (
        <div className="space-y-2 p-2.5 bg-blue-950/30 border border-blue-800/60 rounded-xl font-mono text-[9px]">
          <div className="flex items-center justify-between text-blue-300 font-bold">
            <span className="flex items-center gap-1">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" /> Mode C: Spatial Measurement HUD
            </span>
            <span className="text-cyan-300 text-[8px] uppercase">±1.1mm LiDAR</span>
          </div>
          <div className="bg-black/50 p-2 rounded-lg border border-blue-900/50 space-y-1 text-center">
            <div className="text-slate-400 text-[8px] uppercase">Point-to-Point 3D Distance</div>
            <div className="text-emerald-400 font-bold text-base">{measureDistMeters} meters</div>
            <div className="text-slate-400 text-[8px]">
              ~{(measureDistMeters * 3.28084).toFixed(1)} ft ({Math.round(measureDistMeters * 39.3701)} in)
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[8px]">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setActivePointPicker('A');
                setMeasurePointA({ x: -11.0, y: Math.floor(Math.random() * 8), z: 7.0 });
              }}
              className={`py-1 px-1 rounded border text-center font-bold cursor-pointer ${
                activePointPicker === 'A'
                  ? 'bg-blue-600 border-blue-400 text-white'
                  : 'bg-black/40 border-slate-700 text-slate-300'
              }`}
            >
              Point A: ({measurePointA?.x.toFixed(1)}, {measurePointA?.y.toFixed(1)})
            </button>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setActivePointPicker('B');
                setMeasurePointB({ x: 11.0, y: Math.floor(Math.random() * 8) + 7, z: 7.0 });
              }}
              className={`py-1 px-1 rounded border text-center font-bold cursor-pointer ${
                activePointPicker === 'B'
                  ? 'bg-blue-600 border-blue-400 text-white'
                  : 'bg-black/40 border-slate-700 text-slate-300'
              }`}
            >
              Point B: ({measurePointB?.x.toFixed(1)}, {measurePointB?.y.toFixed(1)})
            </button>
          </div>
          <div className="text-slate-400 text-[8px] pt-0.5">
            Façade Bounding Volume: <strong>22.0m W × 15.0m H × 14.0m D</strong> (Net: <strong>{siteAreaSqMeters} m²</strong>)
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE D: CHEMICAL FORMULATION MATCHING */}
      {/* ========================================================================= */}
      {activeStudioMode === 'chemical_formulation' && (
        <div className="space-y-2 p-2.5 bg-amber-950/20 border border-amber-600/40 rounded-xl font-mono text-[9px]">
          <div className="flex items-center justify-between text-amber-300 font-bold">
            <span className="flex items-center gap-1">
              <FlaskConical className="w-3.5 h-3.5 text-amber-400" /> Mode D: Substrate Stoichiometry
            </span>
            <span className="text-amber-400 text-[8px] uppercase">Weather Equation</span>
          </div>
          <div>
            <label className="text-slate-400 block uppercase font-bold mb-1 text-[8px]">
              Target Substrate Material
            </label>
            <select
              value={selectedSubstrate}
              onChange={(e) => {
                playClickSound();
                setSelectedSubstrate(e.target.value);
              }}
              className="w-full py-1.5 px-2 bg-black border border-amber-700/60 rounded text-slate-200 focus:outline-none cursor-pointer text-[8px]"
            >
              <option value="concrete">Concrete Plinth / Foundation</option>
              <option value="stucco">Exterior Stucco Render</option>
              <option value="masonry">Architectural Brick Masonry</option>
              <option value="steel">Structural Steel & Aluminum</option>
              <option value="gypsum">Interior Gypsum Plaster</option>
            </select>
          </div>
          {(() => {
            const chem =
              CHEMICAL_SUBSTRATE_REGISTRY[selectedSubstrate] ||
              CHEMICAL_SUBSTRATE_REGISTRY.concrete;
            const requiredLiters = (siteAreaSqMeters / chem.theoreticalCoverageSqMPerLiter).toFixed(1);
            const totalCost = (siteAreaSqMeters * chem.estimatedCostPerSqM).toFixed(2);
            return (
              <div className="space-y-1.5 bg-black/60 p-2 rounded-lg border border-amber-900/40 text-[8px]">
                <div className="grid grid-cols-2 gap-1 text-slate-300">
                  <div>
                    Volume Solids: <strong className="text-white">{chem.volumeSolidsPercent}%</strong>
                  </div>
                  <div>
                    Target DFT: <strong className="text-amber-300">{chem.targetDftMicrons} µm</strong>
                  </div>
                  <div>
                    Cure Kinetics: <strong className="text-emerald-400">{chem.cureTimeHours} hrs</strong>
                  </div>
                  <div>
                    PVC Concentration: <strong className="text-cyan-300">{chem.pigmentVolumeConcentration}%</strong>
                  </div>
                </div>
                <div className="pt-1 border-t border-amber-800/40 flex justify-between text-amber-200">
                  <span>
                    Required Vol: <strong>{requiredLiters} L</strong> (~
                    {(Number(requiredLiters) * 0.264172).toFixed(1)} gal)
                  </span>
                  <span>
                    BOM: <strong>${totalCost}</strong>
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
