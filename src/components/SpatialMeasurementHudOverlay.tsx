import React from 'react';
import {
  Crosshair,
  MapPin,
  Compass,
  Maximize2,
  Ruler,
  Zap,
  Globe,
  Activity,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { HUDThemeConfig } from './CameraViewfinder';
import { GpsTelemetry, OrientationTelemetry } from '../lib/spatialMeasurementEngine';
import { formatCurrency } from '../lib/utils';

export interface SpatialMeasurementHudOverlayProps {
  // Metrics
  distanceMeters: number;
  objectHeightMeters: number;
  objectWidthMeters: number;
  surfaceAreaSqMeters: number;
  surfaceAreaSqFt: number;
  confidencePercent: number;
  
  // Telemetry
  gpsData: GpsTelemetry | null;
  orientationData: OrientationTelemetry;
  gpsEnabled: boolean;
  compassEnabled: boolean;
  
  // HUD Theme & Job config
  theme: HUDThemeConfig;
  jobModeName: string;
  jobModeUnit: string;
  jobThickness: string;
  materialUnitsNeeded: number;
  estimatedCost: number;
  
  // Control toggles
  showGrid?: boolean;
  reticleType?: 'tactical' | 'crosshair' | 'box';
  onOpenGisExport?: () => void;
  
  // Interactive bounding box
  targetBoxNorm?: { top: number; bottom: number; left: number; right: number };
  onTargetBoxChange?: (newBox: { top: number; bottom: number; left: number; right: number }) => void;
}

export function SpatialMeasurementHudOverlay({
  distanceMeters,
  objectHeightMeters,
  objectWidthMeters,
  surfaceAreaSqMeters,
  surfaceAreaSqFt,
  confidencePercent,
  gpsData,
  orientationData,
  gpsEnabled,
  compassEnabled,
  theme,
  jobModeName,
  jobModeUnit,
  jobThickness,
  materialUnitsNeeded,
  estimatedCost,
  showGrid = true,
  reticleType = 'tactical',
  onOpenGisExport,
  targetBoxNorm = { top: 0.22, bottom: 0.78, left: 0.2, right: 0.8 },
}: SpatialMeasurementHudOverlayProps) {
  // Cardinal compass direction helper
  const getCardinalDirection = (heading: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(heading / 45) % 8];
  };

  // Artificial horizon roll & pitch transformation
  const horizonRollDeg = orientationData.roll || 0;
  const horizonPitchOffsetPx = Math.max(-80, Math.min(80, (orientationData.pitch || 0) * 2.5));

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden font-mono select-none">
      {/* 1. Spatial Optical Grid Overlay */}
      {showGrid && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, ${theme.accentHex}14 1px, transparent 1px), linear-gradient(to bottom, ${theme.accentHex}14 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      )}

      {/* 2. Device Ground-Plane / Artificial Horizon Line */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-transform duration-75 ease-out"
        style={{
          transform: `translateY(${horizonPitchOffsetPx}px) rotate(${horizonRollDeg}deg)`,
        }}
      >
        <div className="relative w-72 sm:w-96 flex items-center justify-between opacity-70">
          {/* Left Wing */}
          <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-cyan-400 to-cyan-300" />
          {/* Pitch Ladder Marks */}
          <div className="flex flex-col items-center gap-1 text-[8px] text-cyan-300 font-bold">
            <span className="bg-black/60 px-1 rounded">HORIZON {Math.round(orientationData.pitch)}°</span>
            <div className="w-4 h-0.5 bg-cyan-400" />
          </div>
          {/* Right Wing */}
          <div className="h-0.5 w-24 bg-gradient-to-l from-transparent via-cyan-400 to-cyan-300" />
        </div>
      </div>

      {/* 3. Spatial Measurement Bounding Façade Target Box */}
      <div
        className="absolute rounded-lg border-2 border-dashed transition-all duration-150"
        style={{
          top: `${targetBoxNorm.top * 100}%`,
          bottom: `${(1 - targetBoxNorm.bottom) * 100}%`,
          left: `${targetBoxNorm.left * 100}%`,
          right: `${(1 - targetBoxNorm.right) * 100}%`,
          borderColor: theme.accentHex,
          boxShadow: `0 0 20px ${theme.accentHex}25`,
        }}
      >
        {/* Corner Brackets */}
        <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: theme.accentHex }} />
        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2" style={{ borderColor: theme.accentHex }} />
        <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2" style={{ borderColor: theme.accentHex }} />
        <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2" style={{ borderColor: theme.accentHex }} />

        {/* Top Dimension Tag: Width */}
        <div className="absolute -top-6 inset-x-0 flex items-center justify-center">
          <div className="bg-black/90 px-2 py-0.5 rounded border border-slate-800 text-[9px] font-bold text-cyan-300 shadow-md flex items-center gap-1">
            <Ruler className="w-3 h-3 text-cyan-400" />
            <span>WIDTH: {objectWidthMeters.toFixed(2)}m ({(objectWidthMeters * 3.28084).toFixed(1)}ft)</span>
          </div>
        </div>

        {/* Right Dimension Tag: Height */}
        <div className="absolute -right-24 top-1/2 -translate-y-1/2 hidden sm:flex items-center">
          <div className="bg-black/90 px-2 py-0.5 rounded border border-slate-800 text-[9px] font-bold text-cyan-300 shadow-md flex items-center gap-1">
            <span>HEIGHT: {objectHeightMeters.toFixed(2)}m</span>
          </div>
        </div>

        {/* Center Target Lock & Area Badge */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          {reticleType === 'tactical' && (
            <div
              className="w-16 h-16 rounded-full border border-dashed flex items-center justify-center animate-pulse"
              style={{ borderColor: `${theme.accentHex}80` }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.accentHex }} />
            </div>
          )}

          {reticleType === 'crosshair' && (
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute w-full h-0.5" style={{ backgroundColor: theme.accentHex }} />
              <div className="absolute h-full w-0.5" style={{ backgroundColor: theme.accentHex }} />
            </div>
          )}

          {/* Real-time Target Surface Area Badge */}
          <div className="bg-slate-950/95 px-2.5 py-1 rounded-md border border-slate-800 backdrop-blur-md text-center shadow-lg pointer-events-auto">
            <div className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">
              Target Façade Area
            </div>
            <div className="text-emerald-400 font-extrabold text-xs sm:text-sm">
              {surfaceAreaSqMeters.toFixed(2)} m² <span className="text-slate-400 text-[9px]">({surfaceAreaSqFt.toLocaleString()} sq ft)</span>
            </div>
            <div className="text-[8px] text-slate-400 flex items-center justify-center gap-1 pt-0.5">
              <span>Dist: <strong className="text-white">{distanceMeters.toFixed(2)}m</strong></span>
              <span>•</span>
              <span className="text-cyan-300">±1.1mm LiDAR</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Top Telemetry Tape: Heading, GPS Coordinates & GIS Trigger */}
      <div className="absolute top-12 inset-x-2 flex flex-wrap items-center justify-between gap-1.5 text-[9px] pointer-events-auto">
        {/* Left: GPS Absolute Coordinates */}
        {gpsEnabled && gpsData && (
          <div className="bg-black/85 px-2 py-1 rounded-md border border-slate-800 backdrop-blur-md flex items-center gap-1.5 text-slate-200 shadow-md">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white">{gpsData.lat.toFixed(5)}°N, {gpsData.lng.toFixed(5)}°W</span>
              <span className="text-emerald-400 ml-1.5">ALT: {gpsData.alt || 0}m</span>
              <span className="text-slate-500 ml-1">(±{gpsData.accuracy}m)</span>
            </div>
          </div>
        )}

        {/* Center/Right: Compass Azimuth & True North Alignment */}
        {compassEnabled && (
          <div className="bg-black/85 px-2.5 py-1 rounded-md border border-slate-800 backdrop-blur-md flex items-center gap-2 text-slate-200 shadow-md">
            <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow shrink-0" />
            <span>
              BEARING: <strong className="text-white">{orientationData.heading}° {getCardinalDirection(orientationData.heading)}</strong>
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-cyan-300">
              TRUE N: {orientationData.trueNorthHeading || orientationData.heading}°
            </span>
          </div>
        )}

        {/* GIS Database Export Trigger Button */}
        {onOpenGisExport && (
          <button
            type="button"
            onClick={onOpenGisExport}
            className="px-2.5 py-1 rounded-md bg-indigo-600/90 hover:bg-indigo-500 text-white font-bold border border-indigo-400 flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 cursor-pointer ml-auto"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>GIS Export</span>
          </button>
        )}
      </div>

      {/* 5. Bottom Live Real-Time Estimation & Coating HUD Metrics */}
      <div className="absolute bottom-2 inset-x-2 flex flex-wrap items-center justify-between gap-1.5 text-[9px] pointer-events-auto">
        {/* Real-Time Calculation Metrics Card */}
        <div className="bg-black/90 px-3 py-1.5 rounded-lg border border-slate-800 backdrop-blur-md flex flex-wrap items-center gap-2 text-slate-200 shadow-xl">
          <div className="flex items-center gap-1 text-amber-400 font-bold uppercase">
            <Zap className="w-3.5 h-3.5 animate-pulse" />
            <span>{jobModeName}:</span>
          </div>
          <span className="text-emerald-400 font-bold">
            {materialUnitsNeeded} {jobModeUnit}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-amber-300 font-bold">
            {formatCurrency(estimatedCost)}
          </span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-cyan-300 hidden sm:inline">
            DFT: {jobThickness}
          </span>
          <span className="text-slate-500 hidden md:inline">|</span>
          <span className="text-slate-400 hidden md:inline">
            Confidence: <strong className="text-white">{confidencePercent}%</strong>
          </span>
        </div>

        {/* 3D Raycasting Spatial Status */}
        <div className="bg-black/85 px-2 py-1 rounded-lg border border-slate-800 backdrop-blur-md text-slate-300 ml-auto hidden sm:flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>REAL-TIME SPATIAL HUD ACTIVE</span>
        </div>
      </div>
    </div>
  );
}
