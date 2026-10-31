import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Layers,
  Sparkles,
  Palette,
  Eye,
  Sliders,
  Check,
  Compass,
  Box,
  RefreshCw,
  Info,
  Shield,
  Activity,
  Move,
  MapPin,
  Crosshair,
  Target,
  Radio,
  Zap,
  Droplets,
  CheckCircle2,
  SlidersHorizontal,
  Navigation
} from 'lucide-react';
import { LocalizationSettings, UserProfileSettings } from '../types';
import { formatLocalizedArea } from '../data/userProfileSettings';
import { playClickSound, playSuccessSound, playToggleSound } from '../lib/soundUtils';
import { formatCurrency } from '../lib/utils';
import { meshRaycastIsolate } from '../lib/backgroundIsolateWorker';

// Raycasting 2D Point-in-Polygon Hit Testing for 3D Mesh Face Selection
function isPointInPolygon(px: number, py: number, polygon: [number, number, number][]): boolean {
  return meshRaycastIsolate({ px, py, polygon });
}

function getCardinalDirection(heading: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round((heading % 360) / 45) % 8];
}

export interface BuildingFace {
  id: string;
  name: string;
  category: 'exterior_wall' | 'roof' | 'trim' | 'plinth' | 'portico';
  areaSqFt: number;
  colorHex: string;
  colorName: string;
  paintType: string;
  sheen: 'Matte' | 'Satin' | 'Semi-Gloss' | 'High-Gloss';
  dftMils: number; // Dry film thickness
  costPerSqFt: number;
}

export interface PresetColor {
  hex: string;
  name: string;
  category: 'Modern Architectural' | 'Earth & Masonry' | 'Industrial RAL' | 'Coastal Protective';
  pigmentGrade: string;
}

export const PRESET_COLOR_PALETTES: PresetColor[] = [
  // Modern Architectural
  { hex: '#1e3a8a', name: 'Apex Cobalt Blue', category: 'Modern Architectural', pigmentGrade: 'Phthalo Blue PB15:3' },
  { hex: '#3b82f6', name: 'Cerulean Sky', category: 'Modern Architectural', pigmentGrade: 'Titanium-Cobalt Blend' },
  { hex: '#0f172a', name: 'Slate Obsidian', category: 'Modern Architectural', pigmentGrade: 'Carbon Black PBk7' },
  { hex: '#475569', name: 'Industrial Graphite', category: 'Modern Architectural', pigmentGrade: 'Rutile Iron Mica' },
  { hex: '#e2e8f0', name: 'Polar Titanium White', category: 'Modern Architectural', pigmentGrade: 'Rutile TiO2 R-996' },
  { hex: '#0284c7', name: 'Marine Azure', category: 'Modern Architectural', pigmentGrade: 'Phthalo Cyan' },

  // Earth & Masonry
  { hex: '#78350f', name: 'Tuscan Terracotta', category: 'Earth & Masonry', pigmentGrade: 'Red Iron Oxide PR101' },
  { hex: '#d97706', name: 'Sedona Ochre', category: 'Earth & Masonry', pigmentGrade: 'Yellow Iron Oxide PY42' },
  { hex: '#713f12', name: 'Raw Sienna Earth', category: 'Earth & Masonry', pigmentGrade: 'Natural Earth Pigment' },
  { hex: '#14532d', name: 'Deep Forest Pine', category: 'Earth & Masonry', pigmentGrade: 'Chromium Oxide Green PG17' },
  { hex: '#3f6212', name: 'Olive Drab Masonry', category: 'Earth & Masonry', pigmentGrade: 'Iron Olive Dispersion' },
  { hex: '#a16207', name: 'Desert Sandstone', category: 'Earth & Masonry', pigmentGrade: 'Calcite Ochre' },

  // Industrial RAL
  { hex: '#2563eb', name: 'RAL 5015 Sky Blue', category: 'Industrial RAL', pigmentGrade: 'Standard RAL Spec' },
  { hex: '#94a3b8', name: 'RAL 7035 Light Grey', category: 'Industrial RAL', pigmentGrade: 'Standard RAL Spec' },
  { hex: '#1e293b', name: 'RAL 7016 Anthracite', category: 'Industrial RAL', pigmentGrade: 'Standard RAL Spec' },
  { hex: '#15803d', name: 'RAL 6005 Moss Green', category: 'Industrial RAL', pigmentGrade: 'Standard RAL Spec' },
  { hex: '#b91c1c', name: 'RAL 3020 Signal Red', category: 'Industrial RAL', pigmentGrade: 'Standard RAL Spec' },
  { hex: '#ea580c', name: 'RAL 2004 Pure Orange', category: 'Industrial RAL', pigmentGrade: 'Standard RAL Spec' },

  // Coastal Protective
  { hex: '#0e7490', name: 'Pacific Deep Teal', category: 'Coastal Protective', pigmentGrade: 'Phthalo Green-Blue' },
  { hex: '#0891b2', name: 'Coastal Aquamarine', category: 'Coastal Protective', pigmentGrade: 'High-UV Inorganic Blue' },
  { hex: '#334155', name: 'Storm Grey Barrier', category: 'Coastal Protective', pigmentGrade: 'Zinc-Reinforced Grey' },
  { hex: '#cbd5e1', name: 'Misty Coast Off-White', category: 'Coastal Protective', pigmentGrade: 'Micro-Zinc Titanium' },
];

export const PAINT_TYPE_SPECS = [
  {
    type: 'Exterior Acrylic Latex',
    desc: 'High-Elongation 55% Solids • Breathable & Crack-Bridging',
    baseRate: 34.50,
    laborRate: 1.25,
    durabilityYears: 12,
    vocLevel: 'Low (< 25 g/L)',
  },
  {
    type: 'High-Performance 2K Epoxy',
    desc: 'Solvent-Free Chemical & Moisture Resistant Barrier',
    baseRate: 48.00,
    laborRate: 1.85,
    durabilityYears: 18,
    vocLevel: 'Zero VOC',
  },
  {
    type: 'Polyurethane Enamel (Aliphatic)',
    desc: 'Ultra-UV Gloss Retention & Anti-Chalking Finish',
    baseRate: 54.00,
    laborRate: 1.95,
    durabilityYears: 20,
    vocLevel: 'Medium (< 150 g/L)',
  },
  {
    type: 'Masonry Elastomeric',
    desc: '350% Elongation Waterproof Barrier for Concrete & Stucco',
    baseRate: 39.50,
    laborRate: 1.45,
    durabilityYears: 15,
    vocLevel: 'Ultra-Low (< 10 g/L)',
  },
  {
    type: 'Fluoropolymer PVDF Finish',
    desc: 'Architectural Grade 30-Year Maximum Weathering Shield',
    baseRate: 68.00,
    laborRate: 2.30,
    durabilityYears: 30,
    vocLevel: 'Compliant (< 50 g/L)',
  },
  {
    type: 'Hydrophobic Polyaspartic Fast-Cure',
    desc: 'Rapid Return-to-Service High-Traffic Protective Layer',
    baseRate: 58.50,
    laborRate: 2.10,
    durabilityYears: 22,
    vocLevel: 'Near-Zero VOC',
  },
];

export const INITIAL_BUILDING_FACES: BuildingFace[] = [
  {
    id: 'face_north_facade',
    name: 'North Main Façade',
    category: 'exterior_wall',
    areaSqFt: 980,
    colorHex: '#3b82f6',
    colorName: 'Cerulean Sky',
    paintType: 'Exterior Acrylic Latex',
    sheen: 'Satin',
    dftMils: 4.5,
    costPerSqFt: 2.10,
  },
  {
    id: 'face_south_wing',
    name: 'South Elevation & Court',
    category: 'exterior_wall',
    areaSqFt: 720,
    colorHex: '#1e3a8a',
    colorName: 'Apex Cobalt Blue',
    paintType: 'Exterior Acrylic Latex',
    sheen: 'Satin',
    dftMils: 4.5,
    costPerSqFt: 2.10,
  },
  {
    id: 'face_east_elevation',
    name: 'East Commercial Façade',
    category: 'exterior_wall',
    areaSqFt: 450,
    colorHex: '#3b82f6',
    colorName: 'Cerulean Sky',
    paintType: 'Exterior Acrylic Latex',
    sheen: 'Satin',
    dftMils: 4.5,
    costPerSqFt: 2.10,
  },
  {
    id: 'face_west_entrance',
    name: 'West Architectural Portico',
    category: 'portico',
    areaSqFt: 300,
    colorHex: '#0f172a',
    colorName: 'Slate Obsidian',
    paintType: 'Polyurethane Enamel (Aliphatic)',
    sheen: 'Semi-Gloss',
    dftMils: 5.0,
    costPerSqFt: 2.85,
  },
  {
    id: 'face_roof_parapet',
    name: 'Rooftop Weather Parapet',
    category: 'roof',
    areaSqFt: 280,
    colorHex: '#475569',
    colorName: 'Industrial Graphite',
    paintType: 'Masonry Elastomeric',
    sheen: 'Matte',
    dftMils: 8.0,
    costPerSqFt: 2.40,
  },
  {
    id: 'face_columns_trim',
    name: 'Structural Columns & Trim',
    category: 'trim',
    areaSqFt: 180,
    colorHex: '#e2e8f0',
    colorName: 'Polar Titanium White',
    paintType: 'High-Performance 2K Epoxy',
    sheen: 'High-Gloss',
    dftMils: 6.0,
    costPerSqFt: 3.20,
  },
  {
    id: 'face_plinth_base',
    name: 'Ground Plinth & Foundation Barrier',
    category: 'plinth',
    areaSqFt: 240,
    colorHex: '#1e293b',
    colorName: 'RAL 7016 Anthracite',
    paintType: 'Masonry Elastomeric',
    sheen: 'Matte',
    dftMils: 7.5,
    costPerSqFt: 2.65,
  },
];

interface Stakeholder3DViewerProps {
  faces: BuildingFace[];
  onFacesChange: (updatedFaces: BuildingFace[]) => void;
  selectedFaceId: string | null;
  onSelectFace: (faceId: string | null) => void;
  localization: LocalizationSettings;
  isStandalone?: boolean;
}

export function Stakeholder3DViewer({
  faces,
  onFacesChange,
  selectedFaceId,
  onSelectFace,
  localization,
  isStandalone = false,
}: Stakeholder3DViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 3D Camera & Interaction State
  const [rotX, setRotX] = useState<number>(22); // Elevation angle in deg
  const [rotY, setRotY] = useState<number>(-35); // Azimuth angle in deg
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [lastMousePos, setLastMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragDistanceRef = useRef<number>(0);

  // Mesh Raycasting Front-to-Back Hit-Testing Cache Ref
  const lastProjectedPolygonsRef = useRef<
    Array<{
      id: string;
      name: string;
      projectedVertices: [number, number, number][];
      avgZ: number;
      faceData: BuildingFace;
    }>
  >([]);

  // Sensor-Assisted Spatial Alignment State (GPS, Compass, Accelerometer)
  const [geoAlignActive, setGeoAlignActive] = useState<boolean>(false);
  const [sensorGps, setSensorGps] = useState<{ lat: number; lng: number; alt: number; accuracy: number }>({
    lat: 41.8781,
    lng: -87.6298,
    alt: 182,
    accuracy: 2.8,
  });
  const [compassHeading, setCompassHeading] = useState<number>(142);
  const [sensorPitch, setSensorPitch] = useState<number>(18);
  const [sensorRoll, setSensorRoll] = useState<number>(2);
  const [declinationOffset, setDeclinationOffset] = useState<number>(0);
  
  // Display & Rendering Modes
  const [lightingMode, setLightingMode] = useState<'day' | 'golden' | 'studio' | 'night'>('day');
  const [wireframeOverlay, setWireframeOverlay] = useState<boolean>(false);
  const [showMeasurements, setShowMeasurements] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'palette' | 'materials' | 'finishes' | 'spatial'>('palette');
  const [customColor, setCustomColor] = useState<string>('#3b82f6');
  const [applyToAll, setApplyToAll] = useState<boolean>(false);

  // Geo-alignment hardware sensor binding
  useEffect(() => {
    if (!geoAlignActive) return;

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setSensorGps({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            alt: pos.coords.altitude ? Math.round(pos.coords.altitude) : 182,
            accuracy: Math.round(pos.coords.accuracy * 10) / 10,
          });
        },
        () => {},
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [geoAlignActive]);

  useEffect(() => {
    if (!geoAlignActive) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) setCompassHeading(Math.round(e.alpha));
      if (e.beta !== null) setSensorPitch(Math.round(e.beta));
      if (e.gamma !== null) setSensorRoll(Math.round(e.gamma));
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
      return () => window.removeEventListener('deviceorientation', handleOrientation, true);
    }
  }, [geoAlignActive]);

  // Sync 3D matrix camera to spatial sensors when geo-alignment is active
  useEffect(() => {
    if (geoAlignActive) {
      const targetAzimuth = -((compassHeading + declinationOffset) % 360);
      setRotY(targetAzimuth);
      setRotX(Math.max(-85, Math.min(85, sensorPitch)));
    }
  }, [geoAlignActive, compassHeading, declinationOffset, sensorPitch]);

  const selectedFace = useMemo(() => {
    return faces.find((f) => f.id === selectedFaceId) || faces[0];
  }, [faces, selectedFaceId]);

  // Auto rotation loop
  useEffect(() => {
    if (!autoRotate) return;
    const interval = setInterval(() => {
      setRotY((prev) => (prev + 0.5) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [autoRotate]);

  // Handle color swatch pick
  const handleApplyColor = (color: PresetColor | string, colorName?: string) => {
    const hex = typeof color === 'string' ? color : color.hex;
    const name = typeof color === 'string' ? (colorName || 'Custom Tone') : color.name;

    if (applyToAll) {
      const updated = faces.map((f) => ({
        ...f,
        colorHex: hex,
        colorName: name,
      }));
      onFacesChange(updated);
    } else {
      const targetId = selectedFaceId || faces[0]?.id;
      const updated = faces.map((f) =>
        f.id === targetId ? { ...f, colorHex: hex, colorName: name } : f
      );
      onFacesChange(updated);
    }
  };

  // Handle paint type switch
  const handleApplyPaintType = (paintType: string) => {
    const spec = PAINT_TYPE_SPECS.find((s) => s.type === paintType);
    const costRate = spec ? (spec.baseRate / 350) + spec.laborRate : 2.10;

    if (applyToAll) {
      const updated = faces.map((f) => ({
        ...f,
        paintType,
        costPerSqFt: Math.round(costRate * 100) / 100,
      }));
      onFacesChange(updated);
    } else {
      const targetId = selectedFaceId || faces[0]?.id;
      const updated = faces.map((f) =>
        f.id === targetId
          ? {
              ...f,
              paintType,
              costPerSqFt: Math.round(costRate * 100) / 100,
            }
          : f
      );
      onFacesChange(updated);
    }
  };

  // Handle sheen switch
  const handleApplySheen = (sheen: BuildingFace['sheen']) => {
    if (applyToAll) {
      const updated = faces.map((f) => ({ ...f, sheen }));
      onFacesChange(updated);
    } else {
      const targetId = selectedFaceId || faces[0]?.id;
      const updated = faces.map((f) =>
        f.id === targetId ? { ...f, sheen } : f
      );
      onFacesChange(updated);
    }
  };

  // Camera presets
  const setCameraPreset = (preset: 'iso' | 'front' | 'north' | 'corner' | 'top') => {
    setAutoRotate(false);
    setPan({ x: 0, y: 0 });
    switch (preset) {
      case 'iso':
        setRotX(25);
        setRotY(-40);
        setZoom(1.0);
        break;
      case 'front':
        setRotX(5);
        setRotY(0);
        setZoom(1.1);
        break;
      case 'north':
        setRotX(12);
        setRotY(-15);
        setZoom(1.2);
        break;
      case 'corner':
        setRotX(20);
        setRotY(-60);
        setZoom(1.05);
        break;
      case 'top':
        setRotX(65);
        setRotY(-30);
        setZoom(0.85);
        break;
    }
  };

  // 3D Canvas Rendering Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 640;
    const height = rect.height || 420;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear background with ambient tone
    ctx.clearRect(0, 0, width, height);

    // Background Sky Gradient according to Lighting Mode
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    if (lightingMode === 'day') {
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(0.6, '#1e293b');
      bgGrad.addColorStop(1, '#090d16');
    } else if (lightingMode === 'golden') {
      bgGrad.addColorStop(0, '#2a1708');
      bgGrad.addColorStop(0.6, '#381e11');
      bgGrad.addColorStop(1, '#130c08');
    } else if (lightingMode === 'studio') {
      bgGrad.addColorStop(0, '#18181b');
      bgGrad.addColorStop(0.6, '#27272a');
      bgGrad.addColorStop(1, '#09090b');
    } else {
      bgGrad.addColorStop(0, '#020617');
      bgGrad.addColorStop(0.6, '#0f172a');
      bgGrad.addColorStop(1, '#02040a');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Render perspective grid & ground shadow plane
    const centerX = width / 2 + pan.x;
    const centerY = height / 2 + pan.y + 40;
    const scale = Math.min(width, height) * 0.42 * zoom;

    // Convert deg to radians
    const radX = (rotX * Math.PI) / 180;
    const radY = (rotY * Math.PI) / 180;

    // 3D Matrix Projection Function
    const project = (x: number, y: number, z: number): [number, number, number] => {
      // Rotation Y (Azimuth)
      const cosY = Math.cos(radY);
      const sinY = Math.sin(radY);
      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;
      const y1 = y;

      // Rotation X (Elevation)
      const cosX = Math.cos(radX);
      const sinX = Math.sin(radX);
      const y2 = y1 * cosX - z1 * sinX;
      const z2 = y1 * sinX + z1 * cosX;
      const x2 = x1;

      // Perspective foreshortening
      const distance = 4.5;
      const fov = distance / (distance + z2);

      const screenX = centerX + x2 * scale * fov;
      const screenY = centerY - y2 * scale * fov;
      return [screenX, screenY, z2];
    };

    // Ground Grid lines
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.lineWidth = 1;
    for (let i = -4; i <= 4; i++) {
      const p1 = project(i * 0.5, -1.0, -2.0);
      const p2 = project(i * 0.5, -1.0, 2.0);
      ctx.beginPath();
      ctx.moveTo(p1[0], p1[1]);
      ctx.lineTo(p2[0], p2[1]);
      ctx.stroke();

      const q1 = project(-2.0, -1.0, i * 0.5);
      const q2 = project(2.0, -1.0, i * 0.5);
      ctx.beginPath();
      ctx.moveTo(q1[0], q1[1]);
      ctx.lineTo(q2[0], q2[1]);
      ctx.stroke();
    }

    // Ground Soft Shadow
    ctx.save();
    const shadowCenter = project(0, -0.99, 0);
    const shadowGrad = ctx.createRadialGradient(
      shadowCenter[0],
      shadowCenter[1],
      10,
      shadowCenter[0],
      shadowCenter[1],
      scale * 1.6
    );
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(shadowCenter[0], shadowCenter[1], scale * 1.4, scale * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Map building face IDs to color and sheen
    const faceMap = new Map<string, BuildingFace>();
    faces.forEach((f) => faceMap.set(f.id, f));

    const northFace = faceMap.get('face_north_facade') || faces[0];
    const southFace = faceMap.get('face_south_wing') || faces[1] || faces[0];
    const eastFace = faceMap.get('face_east_elevation') || faces[2] || faces[0];
    const westFace = faceMap.get('face_west_entrance') || faces[3] || faces[0];
    const roofFace = faceMap.get('face_roof_parapet') || faces[4] || faces[0];
    const trimFace = faceMap.get('face_columns_trim') || faces[5] || faces[0];
    const plinthFace = faceMap.get('face_plinth_base') || faces[6] || faces[0];

    // Helper to calculate shade with lighting direction
    const computeLighting = (
      normal: [number, number, number],
      baseHex: string,
      isFaceSelected: boolean
    ): string => {
      // Light Vector
      let lightDir: [number, number, number] = [0.6, 0.8, 0.4];
      let ambient = 0.35;
      let diffuseWeight = 0.65;

      if (lightingMode === 'golden') {
        lightDir = [0.8, 0.3, 0.5];
        ambient = 0.4;
      } else if (lightingMode === 'night') {
        lightDir = [0.2, 0.9, 0.3];
        ambient = 0.2;
        diffuseWeight = 0.8;
      }

      // Dot product for diffuse lighting
      const len = Math.hypot(lightDir[0], lightDir[1], lightDir[2]);
      const l = [lightDir[0] / len, lightDir[1] / len, lightDir[2] / len];
      const dot = Math.max(0, normal[0] * l[0] + normal[1] * l[1] + normal[2] * l[2]);
      const intensity = ambient + dot * diffuseWeight;

      // Parse Hex
      let c = baseHex.replace('#', '');
      if (c.length === 3) c = c.split('').map((x) => x + x).join('');
      const r = parseInt(c.substring(0, 2), 16) || 100;
      const g = parseInt(c.substring(2, 4), 16) || 100;
      const b = parseInt(c.substring(4, 6), 16) || 100;

      // Adjust with intensity
      let finalR = Math.min(255, Math.floor(r * intensity));
      let finalG = Math.min(255, Math.floor(g * intensity));
      let finalB = Math.min(255, Math.floor(b * intensity));

      if (lightingMode === 'golden') {
        finalR = Math.min(255, finalR + 25);
        finalG = Math.min(255, Math.floor(finalG * 0.95));
      } else if (lightingMode === 'night') {
        finalB = Math.min(255, finalB + 20);
      }

      if (isFaceSelected) {
        // Boost vibrancy for active selection
        finalR = Math.min(255, Math.floor(finalR * 1.15 + 20));
        finalG = Math.min(255, Math.floor(finalG * 1.15 + 20));
        finalB = Math.min(255, Math.floor(finalB * 1.15 + 20));
      }

      return `rgb(${finalR}, ${finalG}, ${finalB})`;
    };

    // Geometric Polygon Definition
    interface Polygon3D {
      id: string;
      name: string;
      vertices: [number, number, number][];
      normal: [number, number, number];
      faceData: BuildingFace;
      isAccent?: boolean;
    }

    const polygons: Polygon3D[] = [
      // 1. Foundation Plinth Base
      {
        id: plinthFace.id,
        name: plinthFace.name,
        faceData: plinthFace,
        normal: [0, 0, 1],
        vertices: [
          [-1.3, -1.0, 1.0],
          [1.3, -1.0, 1.0],
          [1.3, -0.75, 1.0],
          [-1.3, -0.75, 1.0],
        ],
      },
      {
        id: plinthFace.id,
        name: plinthFace.name,
        faceData: plinthFace,
        normal: [1, 0, 0],
        vertices: [
          [1.3, -1.0, 1.0],
          [1.3, -1.0, -1.0],
          [1.3, -0.75, -1.0],
          [1.3, -0.75, 1.0],
        ],
      },

      // 2. North Main Façade (Front Wall)
      {
        id: northFace.id,
        name: northFace.name,
        faceData: northFace,
        normal: [0, 0, 1],
        vertices: [
          [-1.2, -0.75, 0.9],
          [0.3, -0.75, 0.9],
          [0.3, 1.0, 0.9],
          [-1.2, 1.0, 0.9],
        ],
      },

      // 3. West Entrance & Architectural Portico (Protruding Front Block)
      {
        id: westFace.id,
        name: westFace.name,
        faceData: westFace,
        normal: [0, 0, 1],
        vertices: [
          [0.3, -0.75, 1.3],
          [1.2, -0.75, 1.3],
          [1.2, 0.6, 1.3],
          [0.3, 0.6, 1.3],
        ],
      },
      {
        id: westFace.id,
        name: westFace.name,
        faceData: westFace,
        normal: [-1, 0, 0],
        vertices: [
          [0.3, -0.75, 0.9],
          [0.3, -0.75, 1.3],
          [0.3, 0.6, 1.3],
          [0.3, 0.6, 0.9],
        ],
      },
      {
        id: westFace.id,
        name: westFace.name,
        faceData: westFace,
        normal: [1, 0, 0],
        vertices: [
          [1.2, -0.75, 1.3],
          [1.2, -0.75, 0.9],
          [1.2, 0.6, 0.9],
          [1.2, 0.6, 1.3],
        ],
      },
      {
        id: roofFace.id,
        name: 'Portico Canopy Roof',
        faceData: roofFace,
        normal: [0, 1, 0],
        vertices: [
          [0.3, 0.6, 1.3],
          [1.2, 0.6, 1.3],
          [1.2, 0.6, 0.9],
          [0.3, 0.6, 0.9],
        ],
      },

      // 4. East Elevation Façade (Right Wall)
      {
        id: eastFace.id,
        name: eastFace.name,
        faceData: eastFace,
        normal: [1, 0, 0],
        vertices: [
          [1.2, -0.75, 0.9],
          [1.2, -0.75, -0.9],
          [1.2, 1.0, -0.9],
          [1.2, 1.0, 0.9],
        ],
      },

      // 5. West Elevation Wall (Left Wall)
      {
        id: eastFace.id,
        name: 'West Elevation Façade',
        faceData: eastFace,
        normal: [-1, 0, 0],
        vertices: [
          [-1.2, -0.75, -0.9],
          [-1.2, -0.75, 0.9],
          [-1.2, 1.0, 0.9],
          [-1.2, 1.0, -0.9],
        ],
      },

      // 6. South Wing Elevation (Rear Wall)
      {
        id: southFace.id,
        name: southFace.name,
        faceData: southFace,
        normal: [0, 0, -1],
        vertices: [
          [1.2, -0.75, -0.9],
          [-1.2, -0.75, -0.9],
          [-1.2, 1.0, -0.9],
          [1.2, 1.0, -0.9],
        ],
      },

      // 7. Rooftop Weather Parapet (Top Roof Plane)
      {
        id: roofFace.id,
        name: roofFace.name,
        faceData: roofFace,
        normal: [0, 1, 0],
        vertices: [
          [-1.2, 1.0, 0.9],
          [1.2, 1.0, 0.9],
          [1.2, 1.0, -0.9],
          [-1.2, 1.0, -0.9],
        ],
      },

      // 8. Rooftop Crown Parapet Wall
      {
        id: trimFace.id,
        name: 'Crown Cornice & Trim',
        faceData: trimFace,
        normal: [0, 0, 1],
        vertices: [
          [-1.25, 1.0, 0.92],
          [1.25, 1.0, 0.92],
          [1.25, 1.15, 0.92],
          [-1.25, 1.15, 0.92],
        ],
        isAccent: true,
      },
      {
        id: trimFace.id,
        name: 'East Crown Cornice',
        faceData: trimFace,
        normal: [1, 0, 0],
        vertices: [
          [1.25, 1.0, 0.92],
          [1.25, 1.0, -0.92],
          [1.25, 1.15, -0.92],
          [1.25, 1.15, 0.92],
        ],
        isAccent: true,
      },

      // 9. Architectural Columns (Portico Pillars)
      {
        id: trimFace.id,
        name: trimFace.name,
        faceData: trimFace,
        normal: [0, 0, 1],
        vertices: [
          [0.4, -0.75, 1.32],
          [0.55, -0.75, 1.32],
          [0.55, 0.6, 1.32],
          [0.4, 0.6, 1.32],
        ],
        isAccent: true,
      },
      {
        id: trimFace.id,
        name: trimFace.name,
        faceData: trimFace,
        normal: [0, 0, 1],
        vertices: [
          [0.95, -0.75, 1.32],
          [1.1, -0.75, 1.32],
          [1.1, 0.6, 1.32],
          [0.95, 0.6, 1.32],
        ],
        isAccent: true,
      },
    ];

    // Sort polygons back-to-front (Painter's Algorithm)
    const projectedPolygons = polygons.map((poly) => {
      const projectedVertices = poly.vertices.map((v) => project(v[0], v[1], v[2]));
      // Calculate average camera Z depth
      const avgZ = projectedVertices.reduce((sum, v) => sum + v[2], 0) / projectedVertices.length;
      return {
        ...poly,
        projectedVertices,
        avgZ,
      };
    });

    projectedPolygons.sort((a, b) => b.avgZ - a.avgZ);

    // Cache projected polygons for interactive canvas raycasting
    lastProjectedPolygonsRef.current = projectedPolygons.map((p) => ({
      id: p.id,
      name: p.name,
      projectedVertices: p.projectedVertices,
      avgZ: p.avgZ,
      faceData: p.faceData,
    }));

    // Draw Polygons
    projectedPolygons.forEach((poly) => {
      const isSelected = selectedFaceId === poly.id;
      const fillColor = computeLighting(poly.normal, poly.faceData.colorHex, isSelected);

      ctx.save();
      ctx.beginPath();
      const first = poly.projectedVertices[0];
      ctx.moveTo(first[0], first[1]);
      for (let i = 1; i < poly.projectedVertices.length; i++) {
        ctx.lineTo(poly.projectedVertices[i][0], poly.projectedVertices[i][1]);
      }
      ctx.closePath();

      // Fill with shaded color
      ctx.fillStyle = fillColor;
      ctx.fill();

      // Architectural window cuts on main façade
      if (poly.id === northFace.id && poly.normal[2] > 0.5) {
        // Draw modern window rows
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;

        const win1_A = project(-1.0, 0.2, 0.91);
        const win1_B = project(-0.5, 0.2, 0.91);
        const win1_C = project(-0.5, 0.7, 0.91);
        const win1_D = project(-1.0, 0.7, 0.91);

        ctx.beginPath();
        ctx.moveTo(win1_A[0], win1_A[1]);
        ctx.lineTo(win1_B[0], win1_B[1]);
        ctx.lineTo(win1_C[0], win1_C[1]);
        ctx.lineTo(win1_D[0], win1_D[1]);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const win2_A = project(-0.3, 0.2, 0.91);
        const win2_B = project(0.1, 0.2, 0.91);
        const win2_C = project(0.1, 0.7, 0.91);
        const win2_D = project(-0.3, 0.7, 0.91);

        ctx.beginPath();
        ctx.moveTo(win2_A[0], win2_A[1]);
        ctx.lineTo(win2_B[0], win2_B[1]);
        ctx.lineTo(win2_C[0], win2_C[1]);
        ctx.lineTo(win2_D[0], win2_D[1]);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Border outline
      if (isSelected) {
        ctx.strokeStyle = '#38bdf8'; // Glowing cyan for active selected face
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.stroke();
      } else if (wireframeOverlay) {
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();

      // Measurement tag
      if (showMeasurements && isSelected && poly.projectedVertices.length >= 4) {
        const centerVertexX = poly.projectedVertices.reduce((s, v) => s + v[0], 0) / poly.projectedVertices.length;
        const centerVertexY = poly.projectedVertices.reduce((s, v) => s + v[1], 0) / poly.projectedVertices.length;

        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        const text = `${poly.faceData.name} • ${poly.faceData.areaSqFt} sq ft`;
        ctx.font = '10px "Courier New", monospace';
        const textWidth = ctx.measureText(text).width;

        ctx.beginPath();
        ctx.roundRect(centerVertexX - textWidth / 2 - 8, centerVertexY - 12, textWidth + 16, 22, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, centerVertexX, centerVertexY);
        ctx.restore();
      }
    });

  }, [
    faces,
    selectedFaceId,
    rotX,
    rotY,
    zoom,
    pan,
    lightingMode,
    wireframeOverlay,
    showMeasurements,
  ]);

  // Mouse & Touch Orbit/Pan Event Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setIsPanning(e.button === 2 || e.shiftKey); // Right click or Shift key enables panning
    setLastMousePos({ x: e.clientX, y: e.clientY });
    dragDistanceRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;
    dragDistanceRef.current += Math.abs(deltaX) + Math.abs(deltaY);

    if (isPanning) {
      setPan((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
    } else {
      setRotY((prev) => prev + deltaX * 0.7);
      setRotX((prev) => Math.max(-85, Math.min(85, prev - deltaY * 0.7)));
    }

    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Ignore click if user was dragging/orbiting the camera
    if (dragDistanceRef.current > 6) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Raycast front-to-back (sort by avgZ ascending as camera projection matrix maps closer surfaces to lower/front avgZ)
    const frontToBackPolygons = [...lastProjectedPolygonsRef.current].sort((a, b) => a.avgZ - b.avgZ);

    for (const poly of frontToBackPolygons) {
      if (isPointInPolygon(clickX, clickY, poly.projectedVertices)) {
        playClickSound();
        onSelectFace(poly.id);
        break;
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.max(0.4, Math.min(3.0, prev * zoomFactor)));
  };

  // Touch Support
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setLastMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - lastMousePos.x;
    const deltaY = e.touches[0].clientY - lastMousePos.y;
    setRotY((prev) => prev + deltaX * 0.8);
    setRotX((prev) => Math.max(-85, Math.min(85, prev - deltaY * 0.8)));
    setLastMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full h-full bg-slate-950 text-slate-200">
      {/* Left / Top: Interactive 3D Canvas Viewport */}
      <div className="flex-1 flex flex-col bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden relative shadow-2xl min-h-[380px] lg:min-h-[480px]">
        {/* Viewport Floating Top Bar */}
        <div className="p-3 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 backdrop-blur z-10">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              3D Structural Orbit & Swapper
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
              Orbit • Pan • Zoom Active
            </span>
          </div>

          {/* Lighting and View Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Lighting Modes */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setLightingMode('day')}
                title="Daylight Noon Sun"
                className={`p-1.5 rounded transition-all ${
                  lightingMode === 'day' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setLightingMode('golden')}
                title="Golden Hour Sunset"
                className={`p-1.5 rounded transition-all ${
                  lightingMode === 'golden' ? 'bg-orange-500/20 text-orange-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setLightingMode('night')}
                title="Architectural Night Lighting"
                className={`p-1.5 rounded transition-all ${
                  lightingMode === 'night' ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Wireframe Toggle */}
            <button
              type="button"
              onClick={() => setWireframeOverlay(!wireframeOverlay)}
              title="Toggle 3D Wireframe Mesh"
              className={`p-1.5 rounded-lg border transition-all text-[11px] font-mono flex items-center gap-1 ${
                wireframeOverlay
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mesh</span>
            </button>

            {/* Auto Rotate Toggle */}
            <button
              type="button"
              onClick={() => setAutoRotate(!autoRotate)}
              title="Toggle Auto 360° Turntable Rotation"
              className={`p-1.5 rounded-lg border transition-all text-[11px] font-mono flex items-center gap-1 ${
                autoRotate
                  ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Auto-360°</span>
            </button>
          </div>
        </div>

        {/* 3D Canvas Viewport */}
        <div
          ref={containerRef}
          className="relative flex-1 w-full h-full min-h-[320px] cursor-grab active:cursor-grabbing overflow-hidden select-none bg-slate-950"
          onContextMenu={(e) => e.preventDefault()}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleCanvasClick}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />

          {/* Floating On-Screen Camera HUD Controls */}
          <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 backdrop-blur shadow-lg">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3.0, z * 1.15))}
                title="Zoom In (+)"
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.4, z * 0.85))}
                title="Zoom Out (-)"
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCameraPreset('iso')}
                title="Reset Isometric View"
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
              >
                <Compass className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[9px] font-mono">
              <button
                type="button"
                onClick={() => setCameraPreset('north')}
                className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-center border border-slate-800/80"
              >
                Front
              </button>
              <button
                type="button"
                onClick={() => setCameraPreset('corner')}
                className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-center border border-slate-800/80"
              >
                Corner
              </button>
            </div>
          </div>

          {/* Floating Instructions & Status */}
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            <div className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur border border-slate-800/80 text-[10px] font-mono text-slate-300 flex items-center gap-2">
              <Move className="w-3 h-3 text-indigo-400" />
              <span>Drag to Orbit • Shift+Drag to Pan • Scroll to Zoom</span>
            </div>
          </div>

          {/* Active Selected Zone Badge */}
          <div className="absolute bottom-3 right-3 z-10">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/90 backdrop-blur border border-slate-700 shadow-xl flex items-center gap-2.5">
              <div
                className="w-4 h-4 rounded-full border border-white/40 shadow-sm shrink-0"
                style={{ backgroundColor: selectedFace.colorHex }}
              />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-200 leading-tight">
                  {selectedFace.name}
                </span>
                <span className="text-[9px] font-mono text-indigo-400">
                  {selectedFace.colorName} • {formatLocalizedArea(selectedFace.areaSqFt, localization)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Strip: Face / Architectural Zone Quick Selector */}
        <div className="p-2.5 bg-slate-950/90 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-mono uppercase text-slate-400 shrink-0 font-bold ml-1">
            Zones:
          </span>
          {faces.map((f) => {
            const isSelected = f.id === selectedFaceId;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onSelectFace(f.id)}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-mono shrink-0 transition-all ${
                  isSelected
                    ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/40"
                  style={{ backgroundColor: f.colorHex }}
                />
                <span className="whitespace-nowrap font-medium">{f.name}</span>
                <span className="text-[10px] text-slate-400">({f.areaSqFt} ft²)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Real-Time Color, Paint Type & Geo-Spatial Swapper Panel */}
      <div className="w-full lg:w-80 flex flex-col bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        {/* Panel Tabs Header */}
        <div className="p-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-1 overflow-x-auto">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('palette')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all ${
                activeTab === 'palette'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950'
              }`}
            >
              Colors
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('materials')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all ${
                activeTab === 'materials'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950'
              }`}
            >
              Specs
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('finishes')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all ${
                activeTab === 'finishes'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950'
              }`}
            >
              Finish
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('spatial')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1 ${
                activeTab === 'spatial'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950'
              }`}
            >
              <Compass className="w-3 h-3" />
              Geo
            </button>
          </div>

          {/* Apply to Whole Building Toggle */}
          <label className="flex items-center gap-1 text-[9px] font-mono text-slate-300 cursor-pointer bg-slate-950 px-1.5 py-1 rounded border border-slate-800 shrink-0">
            <input
              type="checkbox"
              checked={applyToAll}
              onChange={(e) => setApplyToAll(e.target.checked)}
              className="w-3 h-3 rounded accent-indigo-600"
            />
            <span>All</span>
          </label>
        </div>

        {/* Swapper Body Content */}
        <div className="p-3 space-y-3.5 overflow-y-auto flex-1 max-h-[520px]">
          {/* Target Face Raycast Focus & Isolated Measurements Header */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono uppercase text-slate-400 block font-bold">
                  {applyToAll ? 'Global Building Target' : 'Isolated Mesh Face (Raycasted)'}
                </span>
                <span className="text-xs font-bold text-slate-200 font-mono">
                  {applyToAll ? 'All Architectural Zones (7)' : selectedFace.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-5 h-5 rounded border border-slate-600 shadow-inner"
                  style={{ backgroundColor: selectedFace.colorHex }}
                />
                <span className="text-[10px] font-mono text-slate-300 font-bold">
                  {selectedFace.colorHex}
                </span>
              </div>
            </div>

            {/* Face Measurements Breakdown */}
            {!applyToAll && (
              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800/80 text-[9px] font-mono">
                <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800 text-center">
                  <span className="text-slate-500 block text-[8px] uppercase">Surface Area</span>
                  <span className="text-indigo-300 font-bold">{selectedFace.areaSqFt} sq ft</span>
                </div>
                <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800 text-center">
                  <span className="text-slate-500 block text-[8px] uppercase">Coating Vol</span>
                  <span className="text-emerald-400 font-bold">{(selectedFace.areaSqFt / 350).toFixed(1)} gal</span>
                </div>
                <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800 text-center">
                  <span className="text-slate-500 block text-[8px] uppercase">Est Cost</span>
                  <span className="text-amber-300 font-bold">{formatCurrency(selectedFace.areaSqFt * (selectedFace.costPerSqFt * 1200))}</span>
                </div>
              </div>
            )}
          </div>

          {activeTab === 'palette' && (
            /* Color Palettes */
            <div className="space-y-3">
              {/* Custom Color Input */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1 font-bold">
                  Custom Tone Hex / Picker
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      handleApplyColor(e.target.value, 'Custom Formulation');
                    }}
                    className="w-10 h-8 rounded-lg border border-slate-700 bg-slate-950 p-0.5 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                        handleApplyColor(e.target.value, 'Custom Tone');
                      }
                    }}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-200 uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Categorized Preset Palettes */}
              {(['Modern Architectural', 'Earth & Masonry', 'Industrial RAL', 'Coastal Protective'] as const).map(
                (category) => {
                  const categoryColors = PRESET_COLOR_PALETTES.filter((c) => c.category === category);
                  return (
                    <div key={category} className="space-y-1">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                        {category}
                      </span>
                      <div className="grid grid-cols-6 gap-1.5">
                        {categoryColors.map((color) => {
                          const isActive = selectedFace.colorHex.toLowerCase() === color.hex.toLowerCase();
                          return (
                            <button
                              key={color.hex}
                              type="button"
                              onClick={() => handleApplyColor(color)}
                              title={`${color.name} (${color.pigmentGrade})`}
                              className={`group relative aspect-square rounded-lg border transition-all hover:scale-110 flex items-center justify-center ${
                                isActive
                                  ? 'border-white ring-2 ring-indigo-500 shadow-md scale-105'
                                  : 'border-slate-800 hover:border-slate-500'
                              }`}
                              style={{ backgroundColor: color.hex }}
                            >
                              {isActive && <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}

          {activeTab === 'materials' && (
            /* Paint System & Resin Specifications */
            <div className="space-y-3">
              <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold">
                High-Performance Coating Resin Systems
              </label>
              {PAINT_TYPE_SPECS.map((spec) => {
                const isSelected = selectedFace.paintType === spec.type;
                return (
                  <button
                    key={spec.type}
                    type="button"
                    onClick={() => handleApplyPaintType(spec.type)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono">{spec.type}</span>
                      <span className="text-[9px] font-mono text-emerald-400">
                        {spec.durabilityYears} Yr Warranty
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">
                      {spec.desc}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-800/80 text-[9px] font-mono text-slate-400">
                      <span>VOC: {spec.vocLevel}</span>
                      <span className="text-indigo-300 font-semibold">
                        {formatCurrency(spec.baseRate * 1200)} / gal
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'finishes' && (
            /* Finishes & Sheens */
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5 font-bold">
                  Surface Sheen & Light Reflectance Value
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { sheen: 'Matte', lrv: '3-8%', desc: 'Hides imperfections, low reflection' },
                    { sheen: 'Satin', lrv: '15-25%', desc: 'Balanced scrub resistance' },
                    { sheen: 'Semi-Gloss', lrv: '35-50%', desc: 'High durability & washability' },
                    { sheen: 'High-Gloss', lrv: '70%+', desc: 'Max moisture resistance & shine' },
                  ].map((item) => (
                    <button
                      key={item.sheen}
                      type="button"
                      onClick={() => handleApplySheen(item.sheen as BuildingFace['sheen'])}
                      className={`p-2 rounded-lg text-left transition-all border ${
                        selectedFace.sheen === item.sheen
                          ? 'bg-indigo-600/30 border-indigo-500 text-white'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-xs font-bold">{item.sheen}</span>
                        <span className="text-[9px] text-indigo-300">{item.lrv}</span>
                      </div>
                      <p className="text-[8px] text-slate-400 mt-0.5">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 font-mono text-[9px]">
                <span className="text-indigo-400 font-bold block uppercase">Recommended Dry Film Thickness (DFT)</span>
                <div className="flex justify-between text-slate-300">
                  <span>Target DFT:</span>
                  <span className="font-bold text-white">3.5 Mils (88.9 µm)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Solids by Volume:</span>
                  <span className="font-bold text-emerald-400">48.5%</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Theoretical Coverage:</span>
                  <span className="font-bold text-amber-300">350 sq ft / gal</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'spatial' && (
            /* Geo-Spatial Sensor Alignment Tab */
            <div className="space-y-3 font-mono">
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-200 uppercase flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    Spatial Sensor Lock
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      playToggleSound(!geoAlignActive);
                      setGeoAlignActive(!geoAlignActive);
                    }}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                      geoAlignActive
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {geoAlignActive ? 'ACTIVE [LOCKED]' : 'ENABLE SENSORS'}
                  </button>
                </div>

                <p className="text-[9px] text-slate-400 leading-snug">
                  Uses live GPS geolocation, gyro compass bearing, and accelerometer pitch angles to automatically align 3D photogrammetry models with real-world building orientation.
                </p>
              </div>

              {/* Geo Telemetry Stats */}
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-2 text-[9px]">
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">GPS Coordinates:</span>
                  <span className="font-bold text-cyan-300">
                    {sensorGps.lat.toFixed(4)}°N, {Math.abs(sensorGps.lng).toFixed(4)}°W
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">GPS Elevation:</span>
                  <span className="font-bold text-white">{sensorGps.alt} m MSL (±{sensorGps.accuracy}m)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">Compass Bearing:</span>
                  <span className="font-bold text-amber-300">{compassHeading}° ({getCardinalDirection(compassHeading)})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Accelerometer Pitch/Roll:</span>
                  <span className="font-bold text-emerald-400">{sensorPitch}° / {sensorRoll}°</span>
                </div>
              </div>

              {/* Magnetic Declination Adjustment Slider */}
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-[9px]">
                  <span className="text-slate-400 uppercase font-bold">Declination Offset</span>
                  <span className="text-cyan-400 font-bold">{declinationOffset}°</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  value={declinationOffset}
                  onChange={(e) => setDeclinationOffset(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-500 bg-slate-800 rounded h-1.5 cursor-pointer"
                />
              </div>

              {/* Manual Snap Button */}
              <button
                type="button"
                onClick={() => {
                  playSuccessSound();
                  setRotY(-((compassHeading + declinationOffset) % 360));
                  setRotX(Math.max(-85, Math.min(85, sensorPitch)));
                }}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Target className="w-3.5 h-3.5" />
                Snap Model to Live Geo-Orientation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
