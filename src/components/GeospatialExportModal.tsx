import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Globe,
  MapPin,
  Layers,
  Code,
  Compass,
  FileCode,
  Database,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { playClickSound, playSuccessSound } from '../lib/soundUtils';
import {
  SpatialMeasurement,
  exportToGeoJson,
  exportToKml,
  exportToWkt,
  generateOsmContributionTags,
} from '../lib/spatialMeasurementEngine';
import { showAppToast } from './ToastNotificationCenter';

interface GeospatialExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  measurement: SpatialMeasurement;
  themeAccentHex?: string;
}

export type GisExportTab = 'geojson' | 'kml' | 'wkt' | 'osm';

export function GeospatialExportModal({
  isOpen,
  onClose,
  measurement,
  themeAccentHex = '#0284c7',
}: GeospatialExportModalProps) {
  const [activeTab, setActiveTab] = useState<GisExportTab>('geojson');
  const [hasCopied, setHasCopied] = useState(false);

  if (!isOpen) return null;

  // Format generators
  const geoJsonContent = exportToGeoJson(measurement);
  const kmlContent = exportToKml(measurement);
  const wktData = exportToWkt(measurement);
  const osmTags = generateOsmContributionTags(measurement);
  const osmJsonContent = JSON.stringify(osmTags, null, 2);

  const getActiveContent = () => {
    switch (activeTab) {
      case 'geojson':
        return geoJsonContent;
      case 'kml':
        return kmlContent;
      case 'wkt':
        return `${wktData.sqlInsertSnippet}\n\n-- WKT 3D Polygon:\n${wktData.polygon3dWkt}\n\n-- WKT 3D Point:\n${wktData.cameraPoint3dWkt}`;
      case 'osm':
        return osmJsonContent;
      default:
        return geoJsonContent;
    }
  };

  const getFileExtension = () => {
    switch (activeTab) {
      case 'geojson':
        return 'geojson';
      case 'kml':
        return 'kml';
      case 'wkt':
        return 'sql';
      case 'osm':
        return 'json';
    }
  };

  const handleCopy = () => {
    playClickSound();
    const content = getActiveContent();
    navigator.clipboard.writeText(content).then(() => {
      setHasCopied(true);
      if (typeof showAppToast === 'function') {
        showAppToast({
          title: 'Export Copied',
          message: `${activeTab.toUpperCase()} spatial payload copied to clipboard`,
          type: 'success',
        });
      }
      playSuccessSound();
      setTimeout(() => setHasCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    playClickSound();
    const content = getActiveContent();
    const ext = getFileExtension();
    const filename = `SiteView_Spatial_${measurement.id}_${activeTab}.${ext}`;
    const blob = new Blob([content], {
      type:
        activeTab === 'kml'
          ? 'application/vnd.google-earth.kml+xml'
          : 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (typeof showAppToast === 'function') {
      showAppToast({
        title: 'File Downloaded',
        message: `Saved ${filename} to local device`,
        type: 'success',
      });
    }
    playSuccessSound();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-mono">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="p-1.5 rounded-lg text-slate-950 font-bold"
              style={{ backgroundColor: themeAccentHex }}
            >
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                <span>Geographic Database & Mapping Export</span>
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/60 text-emerald-400 font-bold">
                  WGS84 3D
                </span>
              </h3>
              <p className="text-[9px] text-slate-400">
                Export real-time spatial measurements to OpenGIS, PostGIS, Google Earth & OSM
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Telemetry Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-2.5 bg-black/50 border-b border-slate-800/80 text-[9px]">
          <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800">
            <div className="text-slate-500 text-[8px] uppercase">GPS Coordinates</div>
            <div className="text-emerald-400 font-bold truncate">
              {measurement.gps.lat.toFixed(5)}°, {measurement.gps.lng.toFixed(5)}°
            </div>
            <div className="text-slate-400 text-[8px]">Alt: {measurement.gps.alt || 0}m (±{measurement.gps.accuracy}m)</div>
          </div>

          <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800">
            <div className="text-slate-500 text-[8px] uppercase">Object Dimensions</div>
            <div className="text-cyan-300 font-bold">
              {measurement.objectWidthMeters}m W × {measurement.objectHeightMeters}m H
            </div>
            <div className="text-slate-400 text-[8px]">
              Distance: <strong className="text-white">{measurement.distanceMeters}m</strong>
            </div>
          </div>

          <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800">
            <div className="text-slate-500 text-[8px] uppercase">Surface Area</div>
            <div className="text-amber-300 font-bold">
              {measurement.surfaceAreaSqMeters} m²
            </div>
            <div className="text-slate-400 text-[8px]">{measurement.surfaceAreaSqFt} sq ft</div>
          </div>

          <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800">
            <div className="text-slate-500 text-[8px] uppercase">Compass Bearing</div>
            <div className="text-indigo-300 font-bold">
              {measurement.orientation.heading}° Azimuth
            </div>
            <div className="text-slate-400 text-[8px]">
              True N: {measurement.orientation.trueNorthHeading || measurement.orientation.heading}° (±{measurement.accuracyMm}mm)
            </div>
          </div>
        </div>

        {/* Format Tabs Selector */}
        <div className="flex items-center gap-1 p-2 bg-slate-950 border-b border-slate-800/80 text-[10px]">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setActiveTab('geojson');
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'geojson'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>GeoJSON (3D)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              setActiveTab('kml');
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'kml'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Google Earth (KML)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              setActiveTab('wkt');
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'wkt'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>PostGIS (WKT)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              setActiveTab('osm');
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'osm'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>OSM Tags</span>
          </button>
        </div>

        {/* Code Content Container */}
        <div className="flex-1 p-3 overflow-y-auto bg-black/90 font-mono text-[9px] text-slate-300 leading-relaxed max-h-[420px] select-all border-b border-slate-800">
          <pre className="whitespace-pre-wrap break-all">{getActiveContent()}</pre>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-2">
          <div className="text-[9px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>OGC & WGS84 Standard Compliant</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all ${
                hasCopied
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              {hasCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-300" />
                  <span>Copy Payload</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .{getFileExtension()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
