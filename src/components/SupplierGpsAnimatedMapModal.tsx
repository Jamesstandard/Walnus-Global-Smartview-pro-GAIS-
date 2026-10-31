import React, { useState, useEffect } from 'react';
import { LocalizedRegionalMaterial } from '../types';
import { CURRENT_JOB_SITE, LOCALIZED_REGIONAL_MATERIALS } from '../data/localizedSuppliers';
import { saveMessageOffline } from '../db';
import { generateId, formatCurrency } from '../lib/utils';
import {
  Navigation,
  MapPin,
  ExternalLink,
  Compass,
  Layers,
  Phone,
  Clock,
  Truck,
  CheckCircle2,
  X,
  Radio,
  Share2,
  Copy,
  Building2,
  PackageCheck,
  Maximize2,
  Minimize2,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  RotateCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SupplierGpsAnimatedMapModalProps {
  isOpen: boolean;
  selectedMaterial: LocalizedRegionalMaterial | null;
  onClose: () => void;
  onSelectAnotherMaterial?: (material: LocalizedRegionalMaterial) => void;
}

export function SupplierGpsAnimatedMapModal({
  isOpen,
  selectedMaterial,
  onClose,
  onSelectAnotherMaterial,
}: SupplierGpsAnimatedMapModalProps) {
  const [activeMat, setActiveMat] = useState<LocalizedRegionalMaterial | null>(selectedMaterial);
  const [mapStyle, setMapStyle] = useState<'tactical' | 'satellite' | 'grid'>('tactical');
  const [copied, setCopied] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  useEffect(() => {
    if (selectedMaterial) {
      setActiveMat(selectedMaterial);
      setDispatchSuccess(false);
    }
  }, [selectedMaterial]);

  if (!isOpen || !activeMat) return null;

  const site = CURRENT_JOB_SITE;
  const supplier = activeMat;

  // Format DMS Coordinates
  const formatDms = (lat: number, lng: number) => {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    const latDeg = Math.floor(Math.abs(lat));
    const latMin = Math.floor((Math.abs(lat) - latDeg) * 60);
    const latSec = Math.round(((Math.abs(lat) - latDeg) * 60 - latMin) * 60);

    const lngDeg = Math.floor(Math.abs(lng));
    const lngMin = Math.floor((Math.abs(lng) - lngDeg) * 60);
    const lngSec = Math.round(((Math.abs(lng) - lngDeg) * 60 - lngMin) * 60);

    return `${latDeg}°${latMin}'${latSec}"${latDir}, ${lngDeg}°${lngMin}'${lngSec}"${lngDir}`;
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(`${supplier.supplierName}, ${supplier.fullAddress} (GPS: ${supplier.gpsCoordinates.lat}, ${supplier.gpsCoordinates.lng})`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDispatchLogistics = async () => {
    setIsDispatching(true);
    setDispatchSuccess(false);

    await new Promise((r) => setTimeout(r, 900));

    // Save dispatch message into comms hub
    await saveMessageOffline({
      id: generateId(),
      sender: 'Estimator',
      recipient: 'Mixer (Factory Depot)',
      text: `[AUTONOMOUS GPS ROUTE LOGISTICS DISPATCH]:\nDirect sourcing request initiated for ${supplier.name} (${formatCurrency(supplier.spotPrice)} / ${supplier.unit}).\nSupplier: ${supplier.supplierName} (${supplier.distanceKm} km from Site, ETA ${supplier.travelTimeMins} mins).\nAddress: ${supplier.fullAddress} [GPS: ${supplier.gpsCoordinates.lat}, ${supplier.gpsCoordinates.lng}].\nStock confirmed: ${supplier.stockQuantity} units (${supplier.stockStatus}).`,
      timestamp: Date.now(),
      syncStatus: 'pending',
      type: 'text',
    });

    setIsDispatching(false);
    setDispatchSuccess(true);
  };

  // Google Maps navigation url
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${supplier.gpsCoordinates.lat},${supplier.gpsCoordinates.lng}`;

  // SVG coordinates: Map is 800 x 600
  const siteSvgX = (site.mapPinX / 100) * 800;
  const siteSvgY = (site.mapPinY / 100) * 600;
  const supplierSvgX = (supplier.mapPinX / 100) * 800;
  const supplierSvgY = (supplier.mapPinY / 100) * 600;

  // Bezier curve control point for realistic transit route
  const midX = (siteSvgX + supplierSvgX) / 2 + (supplierSvgY > siteSvgY ? -40 : 40);
  const midY = (siteSvgY + supplierSvgY) / 2 + (supplierSvgX > siteSvgX ? 35 : -35);
  const routePathD = `M ${supplierSvgX} ${supplierSvgY} Q ${midX} ${midY} ${siteSvgX} ${siteSvgY}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs font-sans animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-md">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Autonomous Regional GPS Telemetry
                </span>
                <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                  Live Supplier Geographic Radar & Routing
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                <strong className="text-indigo-300">{supplier.supplierName}</strong> • {supplier.distanceKm} km ({supplier.travelTimeMins} mins ETA)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-slate-300">
              GPS Vector: <strong className="text-emerald-300">{supplier.gpsCoordinates.lat.toFixed(4)}°N, {supplier.gpsCoordinates.lng.toFixed(4)}°E</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">{supplier.geoZone}</span>
          </div>

          {/* Map Layer Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setMapStyle('tactical')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                mapStyle === 'tactical' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tactical Radar
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('grid')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                mapStyle === 'grid' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Logistics Grid
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('satellite')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                mapStyle === 'satellite' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Topographic
            </button>
          </div>
        </div>

        {/* Dispatch Success Alert */}
        {dispatchSuccess && (
          <div className="p-3 bg-emerald-950/90 border-b border-emerald-500/50 text-xs font-mono text-emerald-200 flex items-center justify-between gap-3 animate-in fade-in shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Logistics Dispatch Telemetry Logged:</strong> Transmitted routing to Comms Hub for {supplier.supplierName} ({supplier.distanceKm} km route).
              </span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-300">
              Synced to Comms Hub
            </span>
          </div>
        )}

        {/* Main Content Body: Map + Info Sidebar */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          
          {/* LEFT: Dynamic Animated SVG Map Canvas */}
          <div className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center p-2 sm:p-4 min-h-[280px] sm:min-h-[360px]">
            
            {/* SVG Background Viewport */}
            <svg
              viewBox="0 0 800 600"
              className="w-full h-full max-h-[500px] select-none rounded-xl border border-slate-800 shadow-inner bg-slate-950"
              style={{
                backgroundImage:
                  mapStyle === 'satellite'
                    ? 'radial-gradient(ellipse at center, #091522 0%, #030712 100%)'
                    : mapStyle === 'grid'
                    ? 'linear-gradient(to right, #0f172a 1px, transparent 1px), linear-gradient(to bottom, #0f172a 1px, transparent 1px)'
                    : 'radial-gradient(circle at center, #0b1329 0%, #020617 100%)',
                backgroundSize: mapStyle === 'grid' ? '30px 30px' : 'cover',
              }}
            >
              <defs>
                {/* Radar sweep gradient */}
                <radialGradient id="radarSweep" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                  <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                </radialGradient>

                {/* Animated Dash Path Gradient */}
                <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>

                {/* Glow Filter */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Tactical Map Grid Lines */}
              <g opacity="0.25" stroke="#334155" strokeWidth="0.75" strokeDasharray="3,3">
                <line x1="0" y1="150" x2="800" y2="150" />
                <line x1="0" y1="300" x2="800" y2="300" />
                <line x1="0" y1="450" x2="800" y2="450" />
                <line x1="200" y1="0" x2="200" y2="600" />
                <line x1="400" y1="0" x2="400" y2="600" />
                <line x1="600" y1="0" x2="600" y2="600" />
              </g>

              {/* Concentric Distance Rings from Job Site */}
              <g opacity="0.3" stroke="#6366f1" strokeWidth="1" fill="none">
                <circle cx={siteSvgX} cy={siteSvgY} r="80" strokeDasharray="4,4" />
                <circle cx={siteSvgX} cy={siteSvgY} r="160" strokeDasharray="4,4" />
                <circle cx={siteSvgX} cy={siteSvgY} r="250" strokeDasharray="4,4" />
                <circle cx={siteSvgX} cy={siteSvgY} r="340" strokeDasharray="4,4" />
              </g>

              {/* Distance Ring Metric Labels */}
              <text x={siteSvgX + 85} y={siteSvgY - 5} fill="#818cf8" fontSize="10" fontFamily="monospace" opacity="0.6">
                2.5 km
              </text>
              <text x={siteSvgX + 165} y={siteSvgY - 5} fill="#818cf8" fontSize="10" fontFamily="monospace" opacity="0.6">
                5.0 km
              </text>
              <text x={siteSvgX + 255} y={siteSvgY - 5} fill="#818cf8" fontSize="10" fontFamily="monospace" opacity="0.6">
                10.0 km
              </text>

              {/* Animated Radar Sweep Sector */}
              <g transform={`translate(${siteSvgX}, ${siteSvgY})`}>
                <g className="animate-spin" style={{ animationDuration: '6s' }}>
                  <path
                    d="M 0 0 L 280 -120 A 300 300 0 0 1 280 120 Z"
                    fill="url(#radarSweep)"
                    opacity="0.6"
                  />
                  <line x1="0" y1="0" x2="300" y2="0" stroke="#38bdf8" strokeWidth="1.5" opacity="0.7" />
                </g>
              </g>

              {/* River / Geographic Terrain Vector Accent */}
              <path
                d="M -10 320 C 180 340, 240 390, 410 360 C 580 330, 680 370, 810 350"
                fill="none"
                stroke="#0284c7"
                strokeWidth="12"
                opacity="0.15"
              />
              <path
                d="M -10 320 C 180 340, 240 390, 410 360 C 580 330, 680 370, 810 350"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                opacity="0.3"
                strokeDasharray="8,4"
              />
              <text x="320" y="380" fill="#38bdf8" fontSize="9" fontFamily="monospace" opacity="0.4">
                MAIN RIVER COMMERCIAL NAVIGATION CHANNEL
              </text>

              {/* Animated Active Route Vector */}
              <path
                d={routePathD}
                fill="none"
                stroke="url(#routeGrad)"
                strokeWidth="3.5"
                strokeDasharray="8,6"
                filter="url(#glow)"
                className="animate-pulse"
                style={{
                  animationDuration: '2s',
                }}
              />

              {/* Moving Vehicle Particle on the route curve */}
              <g transform={`translate(${midX}, ${midY})`}>
                <circle r="7" fill="#10b981" filter="url(#glow)" className="animate-ping" opacity="0.7" />
                <circle r="5" fill="#10b981" />
                <circle r="2" fill="#ffffff" />
                <text x="12" y="4" fill="#6ee7b7" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  {supplier.travelTimeMins}m ETA
                </text>
              </g>

              {/* ALL OTHER REGIONAL SUPPLIER PINS (Interactive) */}
              {LOCALIZED_REGIONAL_MATERIALS.map((item) => {
                const isThisActive = item.id === supplier.id;
                const px = (item.mapPinX / 100) * 800;
                const py = (item.mapPinY / 100) * 600;

                return (
                  <g
                    key={item.id}
                    className="cursor-pointer transition-transform hover:scale-110"
                    onClick={() => {
                      setActiveMat(item);
                      if (onSelectAnotherMaterial) onSelectAnotherMaterial(item);
                    }}
                  >
                    {/* Outer ring for active */}
                    {isThisActive && (
                      <circle
                        cx={px}
                        cy={py}
                        r="22"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeDasharray="4,4"
                        className="animate-spin"
                        style={{ animationDuration: '4s' }}
                      />
                    )}

                    {/* Pin halo */}
                    <circle
                      cx={px}
                      cy={py}
                      r={isThisActive ? '13' : '9'}
                      fill={
                        isThisActive
                          ? '#10b981'
                          : item.materialType === 'paint'
                          ? '#3b82f6'
                          : item.materialType === 'plaster'
                          ? '#f59e0b'
                          : '#a855f7'
                      }
                      opacity={isThisActive ? '0.9' : '0.6'}
                      filter={isThisActive ? 'url(#glow)' : undefined}
                    />

                    <circle cx={px} cy={py} r={isThisActive ? '6' : '4'} fill="#ffffff" />

                    {/* Supplier Label Tag */}
                    <rect
                      x={px - 50}
                      y={py - (isThisActive ? 34 : 26)}
                      width="100"
                      height={isThisActive ? '18' : '14'}
                      rx="4"
                      fill={isThisActive ? '#064e3b' : '#0f172a'}
                      stroke={isThisActive ? '#10b981' : '#334155'}
                      strokeWidth="1"
                      opacity="0.9"
                    />
                    <text
                      x={px}
                      y={py - (isThisActive ? 22 : 16)}
                      textAnchor="middle"
                      fill={isThisActive ? '#6ee7b7' : '#cbd5e1'}
                      fontSize={isThisActive ? '9' : '8'}
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {item.supplierName.split(' ')[0]} ({item.distanceKm}k)
                    </text>
                  </g>
                );
              })}

              {/* CENTRAL JOB SITE PIN (Construction Site) */}
              <g transform={`translate(${siteSvgX}, ${siteSvgY})`}>
                {/* Concentric pulse */}
                <circle r="26" fill="none" stroke="#6366f1" strokeWidth="1.5" className="animate-ping" opacity="0.4" />
                <circle r="16" fill="#4f46e5" opacity="0.85" filter="url(#glow)" />
                <circle r="6" fill="#ffffff" />
                
                {/* Site badge */}
                <rect x="-65" y="22" width="130" height="20" rx="5" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.2" />
                <text x="0" y="35" textAnchor="middle" fill="#c7d2fe" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  ★ JOB SITE: SECTOR 4
                </text>
              </g>

              {/* Compass Rose Widget in Corner */}
              <g transform="translate(740, 60)" opacity="0.8">
                <circle r="22" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                <line x1="0" y1="-18" x2="0" y2="18" stroke="#ef4444" strokeWidth="1.5" />
                <line x1="-18" y1="0" x2="18" y2="0" stroke="#64748b" strokeWidth="1" />
                <text x="0" y="-8" textAnchor="middle" fill="#ef4444" fontSize="8" fontFamily="monospace" fontWeight="bold">N</text>
                <text x="0" y="15" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="monospace">S</text>
              </g>
            </svg>

            {/* Tactical overlay indicators */}
            <div className="absolute top-4 left-4 pointer-events-none text-[10px] font-mono space-y-1 bg-slate-950/80 p-2 rounded-lg border border-slate-800 text-slate-300">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>RADAR LIVE • 12.4 km REGIONAL COVERAGE</span>
              </div>
              <div className="text-slate-400">
                Origin: <strong className="text-white">{site.code}</strong> [{site.lat.toFixed(4)}, {site.lng.toFixed(4)}]
              </div>
              <div className="text-slate-400">
                Target: <strong className="text-emerald-300">{supplier.supplierName.substring(0, 24)}...</strong>
              </div>
            </div>

            {/* Map Interactive Tip Banner */}
            <div className="absolute bottom-4 right-4 text-[10px] font-mono bg-slate-900/90 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5">
              <span>Click any depot pin to switch routing</span>
            </div>
          </div>

          {/* RIGHT: Supplier Logistics & Material Specification Details Panel */}
          <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 flex flex-col justify-between overflow-y-auto space-y-4 text-xs font-sans">
            
            <div className="space-y-3.5">
              {/* Material Type Badge & Title */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      supplier.materialType === 'paint'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : supplier.materialType === 'plaster'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}
                  >
                    {supplier.materialType.toUpperCase()} MATERIAL
                  </span>
                  
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {formatCurrency(supplier.spotPrice)} / {supplier.unit}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mt-1.5 leading-snug">
                  {supplier.name}
                </h3>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">{supplier.tradeName}</div>
                <div className="text-[10px] text-slate-500 font-mono">{supplier.standardSpec}</div>
              </div>

              {/* GPS Coordinates & Distance Card */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="flex items-center gap-1.5 text-indigo-400 font-bold">
                    <Compass className="w-3.5 h-3.5" />
                    <span>GPS Coordinates</span>
                  </span>
                  <span className="text-slate-200">
                    {supplier.gpsCoordinates.lat.toFixed(5)}°, {supplier.gpsCoordinates.lng.toFixed(5)}°
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 bg-slate-900/80 p-1.5 rounded border border-slate-800/80">
                  DMS: {formatDms(supplier.gpsCoordinates.lat, supplier.gpsCoordinates.lng)}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-500">Route Distance</div>
                    <div className="font-bold text-white">{supplier.distanceKm} km ({supplier.distanceMiles} mi)</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-500">Delivery ETA</div>
                    <div className="font-bold text-emerald-400">{supplier.travelTimeMins} mins (Direct)</div>
                  </div>
                </div>
              </div>

              {/* Physical Depot & Address Card with Copy Link */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-300 font-bold font-mono text-[11px]">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{supplier.supplierName}</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    Verified Depot
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 font-sans leading-relaxed">
                  {supplier.fullAddress}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 text-[11px] font-mono flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Address Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Address</span>
                      </>
                    )}
                  </button>

                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1.5 px-3 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 rounded-lg border border-indigo-500/40 text-[11px] font-mono flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open GPS Map</span>
                  </a>
                </div>
              </div>

              {/* Inventory & Match Telemetry */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Stock Availability:</span>
                  <span className="text-emerald-300 font-bold">{supplier.stockQuantity} Units ({supplier.stockStatus})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Coverage Yield:</span>
                  <span className="text-slate-200">{supplier.coverageEstimate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Drying / Curing:</span>
                  <span className="text-slate-200">{supplier.dryingTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Min Order:</span>
                  <span className="text-slate-200">{supplier.minOrder}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleDispatchLogistics}
                disabled={isDispatching}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 disabled:opacity-50"
              >
                {isDispatching ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Transmitting Dispatch Vector...</span>
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4" />
                    <span>Dispatch Logistics to Comms Hub</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>Direct Depot Line: {supplier.phone}</span>
                <span className="text-emerald-400">● Live Satellite Link</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
