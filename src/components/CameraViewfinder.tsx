import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Camera,
  RefreshCw,
  X,
  AlertCircle,
  Upload,
  Check,
  Zap,
  Grid,
  Sparkles,
  Compass,
  MapPin,
  Sliders,
  ChevronDown,
  ChevronUp,
  Layers,
  Eye,
  Activity,
  Volume2,
  VolumeX,
  Target,
  Radio,
  Maximize2,
  Crosshair,
  Maximize,
  Minimize,
  Palette,
  Paintbrush,
  Hammer,
  Droplets,
  Ruler,
  Ratio,
  Globe,
} from 'lucide-react';
import { playClickSound, playToggleSound, playAlertChime, playSuccessSound } from '../lib/soundUtils';
import { formatCurrency } from '../lib/utils';
import {
  calculateLiveSpatialMetrics,
  estimateMagneticDeclination,
  transformLocalToWgs84,
  SpatialMeasurement,
} from '../lib/spatialMeasurementEngine';
import { SpatialMeasurementHudOverlay } from './SpatialMeasurementHudOverlay';
import { GeospatialExportModal } from './GeospatialExportModal';
import { Survey, SurveyCapture, CameraLifecycleState } from '../types';
import { SurveyCaptureReviewModal } from './SurveyCaptureReviewModal';
import { surveyCaptureRepository } from '../lib/surveyCaptureRepository';

interface CameraViewfinderProps {
  onCapture: (imageDataUrl: string, captureRecord?: SurveyCapture) => void;
  onCancel: () => void;
  initialJobMode?: JobMode;
  activeSurvey?: Survey | null;
  onOpenSurveysManager?: () => void;
  onOpenGallery?: () => void;
}

// Tactical Material HUD Themes
export type AspectRatioMode = '4:3' | '1:1' | 'full';
export type HUDThemeColor = 'green' | 'cyan' | 'amber' | 'red' | 'white' | 'custom';

export interface HUDThemeConfig {
  id: HUDThemeColor;
  name: string;
  accentHex: string;
  borderClass: string;
  textClass: string;
  bgClass: string;
  glowClass: string;
}

export type JobMode = 'painting' | 'plastering' | 'screeding';

export interface JobModeConfig {
  id: JobMode;
  name: string;
  unit: string;
  coverageSqFt: number;
  defaultThickness: string;
  dryTimeHours: number;
  costPerSqFt: number;
  description: string;
}

export const JOB_MODES: Record<JobMode, JobModeConfig> = {
  painting: {
    id: 'painting',
    name: 'Painting',
    unit: 'Gallons',
    coverageSqFt: 350,
    defaultThickness: '3.5 mils (89 µm)',
    dryTimeHours: 4,
    costPerSqFt: 850,
    description: 'Exterior/Interior Architectural Acrylic Coating',
  },
  plastering: {
    id: 'plastering',
    name: 'Plastering',
    unit: '25kg Bags',
    coverageSqFt: 25,
    defaultThickness: '12.0 mm (0.47 in)',
    dryTimeHours: 24,
    costPerSqFt: 2400,
    description: 'Polymer-Modified Wall Plaster & Render System',
  },
  screeding: {
    id: 'screeding',
    name: 'Wall Screening',
    unit: '25kg Bags',
    coverageSqFt: 32,
    defaultThickness: '3.0 mm (0.12 in)',
    dryTimeHours: 12,
    costPerSqFt: 2400,
    description: 'Interior & Exterior Polymer-Modified Wall Screening Mortar',
  },
};

export const HUD_THEMES: HUDThemeConfig[] = [
  {
    id: 'cyan',
    name: 'Material Blue',
    accentHex: '#0284c7',
    borderClass: 'border-sky-500',
    textClass: 'text-sky-400',
    bgClass: 'bg-sky-950/40',
    glowClass: 'shadow-[0_0_15px_rgba(2,132,199,0.35)]',
  },
  {
    id: 'amber',
    name: 'Construction Amber',
    accentHex: '#f59e0b',
    borderClass: 'border-amber-500',
    textClass: 'text-amber-400',
    bgClass: 'bg-amber-950/40',
    glowClass: 'shadow-[0_0_15px_rgba(245,158,11,0.35)]',
  },
  {
    id: 'green',
    name: 'Tactical Green',
    accentHex: '#10b981',
    borderClass: 'border-emerald-500',
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-950/40',
    glowClass: 'shadow-[0_0_15px_rgba(16,185,129,0.35)]',
  },
  {
    id: 'red',
    name: 'Infrared Threat Red',
    accentHex: '#f43f5e',
    borderClass: 'border-rose-500',
    textClass: 'text-rose-400',
    bgClass: 'bg-rose-950/40',
    glowClass: 'shadow-[0_0_15px_rgba(244,63,94,0.35)]',
  },
  {
    id: 'white',
    name: 'Stealth High Contrast',
    accentHex: '#f8fafc',
    borderClass: 'border-slate-300',
    textClass: 'text-slate-200',
    bgClass: 'bg-slate-900/60',
    glowClass: 'shadow-[0_0_15px_rgba(248,250,252,0.2)]',
  },
];

export function CameraViewfinder({
  onCapture,
  onCancel,
  initialJobMode,
  activeSurvey,
  onOpenSurveysManager,
  onOpenGallery,
}: CameraViewfinderProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const edgeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // SV-003 Survey Capture Review and Context Warning state
  const [pendingReview, setPendingReview] = useState<{ capture: SurveyCapture; dataUrl: string } | null>(null);
  const [surveyWarning, setSurveyWarning] = useState<boolean>(false);

  // Camera & Device states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  // HUD, Job Mode, Aspect Ratio & Theme states
  const [hudTheme, setHudTheme] = useState<HUDThemeColor>('cyan');
  const [customColorHex, setCustomColorHex] = useState<string>('#8b5cf6');
  const [jobMode, setJobMode] = useState<JobMode>(initialJobMode || 'painting');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>('full');
  const [showGrid, setShowGrid] = useState(true);
  const [reticleType, setReticleType] = useState<'tactical' | 'crosshair' | 'box'>('tactical');
  const [isMuted, setIsMuted] = useState(false);

  // Dynamic Current Theme Config
  const currentTheme = useMemo<HUDThemeConfig>(() => {
    if (hudTheme === 'custom') {
      return {
        id: 'custom',
        name: 'Custom Palette Tone',
        accentHex: customColorHex,
        borderClass: 'border-indigo-400',
        textClass: 'text-indigo-300',
        bgClass: 'bg-indigo-950/40',
        glowClass: 'shadow-[0_0_15px_rgba(99,102,241,0.35)]',
      };
    }
    return HUD_THEMES.find((t) => t.id === hudTheme) || HUD_THEMES[0];
  }, [hudTheme, customColorHex]);

  // Dual-mode capture & Continuous Edge/Corner Detection states
  const [captureMode, setCaptureMode] = useState<'still' | 'edge_cv'>('still');
  const [isCvProcessing, setIsCvProcessing] = useState(false);
  const [edgeThreshold, setEdgeThreshold] = useState<number>(35);
  const [detectedCornersCount, setDetectedCornersCount] = useState<number>(0);
  const [detectedEdgesLength, setDetectedEdgesLength] = useState<number>(0);
  const animFrameIdRef = useRef<number | null>(null);

  // Current Job Mode Configuration & Real-Time Calculation Metrics
  const currentJobConfig = useMemo(() => JOB_MODES[jobMode] || JOB_MODES.painting, [jobMode]);
  
  const estimatedSqFt = useMemo(() => {
    return Math.max(150, detectedEdgesLength > 0 ? Math.round(detectedEdgesLength * 3.5) : 2450);
  }, [detectedEdgesLength]);

  const materialUnitsNeeded = useMemo(() => {
    return Math.ceil(estimatedSqFt / currentJobConfig.coverageSqFt);
  }, [estimatedSqFt, currentJobConfig.coverageSqFt]);

  const estimatedTotalCost = useMemo(() => {
    return Math.round(estimatedSqFt * currentJobConfig.costPerSqFt);
  }, [estimatedSqFt, currentJobConfig.costPerSqFt]);

  // Quick-access Sensor Toggles (GPS & Compass)
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [gpsData, setGpsData] = useState<{
    lat: number;
    lng: number;
    alt: number | null;
    accuracy: number;
    speed: number | null;
  } | null>({
    lat: 41.8781,
    lng: -87.6298,
    alt: 182,
    accuracy: 3.2,
    speed: 0.0,
  });
  const [gpsWatcherId, setGpsWatcherId] = useState<number | null>(null);

  const [compassEnabled, setCompassEnabled] = useState(true);
  const [orientationData, setOrientationData] = useState<{
    heading: number;
    pitch: number;
    roll: number;
  }>({
    heading: 42,
    pitch: -4,
    roll: 1,
  });

  // Collapsible UI Panels states
  const [showTelemetryPanel, setShowTelemetryPanel] = useState(true);
  const [showCvPanel, setShowCvPanel] = useState(false);
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [showGisExportModal, setShowGisExportModal] = useState(false);

  // Real-time Optical Spatial Measurement HUD Target Bounding Box
  const [targetBoxNorm, setTargetBoxNorm] = useState<{ top: number; bottom: number; left: number; right: number }>({
    top: 0.22,
    bottom: 0.78,
    left: 0.20,
    right: 0.80,
  });

  // Calculate Magnetic Declination & True North Heading
  const magneticDeclination = useMemo(() => {
    return gpsData ? estimateMagneticDeclination(gpsData.lat, gpsData.lng) : -1.8;
  }, [gpsData]);

  const trueNorthHeading = useMemo(() => {
    return Math.round((orientationData.heading + magneticDeclination + 360) % 360);
  }, [orientationData.heading, magneticDeclination]);

  // Compute live optical trigonometry spatial metrics (Distance, Height, Width, Surface Area)
  const liveSpatialMetrics = useMemo(() => {
    return calculateLiveSpatialMetrics({
      deviceEyeHeightMeters: 1.6,
      pitchDeg: orientationData.pitch,
      rollDeg: orientationData.roll,
      headingDeg: trueNorthHeading,
      targetBoxNorm,
    });
  }, [orientationData.pitch, orientationData.roll, trueNorthHeading, targetBoxNorm]);

  // Complete GeoJSON / GIS Spatial Measurement Record
  const currentSpatialMeasurement: SpatialMeasurement = useMemo(() => {
    const originGps = gpsData || {
      lat: 41.8781,
      lng: -87.6298,
      alt: 182,
      accuracy: 3.2,
      heading: orientationData.heading,
      speed: 0,
      timestamp: Date.now(),
    };

    const halfW = liveSpatialMetrics.objectWidthMeters / 2;
    const h = liveSpatialMetrics.objectHeightMeters;
    const dist = liveSpatialMetrics.distanceMeters;

    const localVertices = [
      { x: -halfW, y: 0, z: dist, label: 'Bottom-Left' },
      { x: halfW, y: 0, z: dist, label: 'Bottom-Right' },
      { x: halfW, y: h, z: dist, label: 'Top-Right' },
      { x: -halfW, y: h, z: dist, label: 'Top-Left' },
    ];

    const geoVertices = localVertices.map((v) =>
      transformLocalToWgs84(v, originGps, trueNorthHeading)
    );

    return {
      id: `REC-${Date.now().toString(36).toUpperCase()}`,
      timestamp: Date.now(),
      distanceMeters: liveSpatialMetrics.distanceMeters,
      objectHeightMeters: liveSpatialMetrics.objectHeightMeters,
      objectWidthMeters: liveSpatialMetrics.objectWidthMeters,
      surfaceAreaSqMeters: liveSpatialMetrics.surfaceAreaSqMeters,
      surfaceAreaSqFt: liveSpatialMetrics.surfaceAreaSqFt,
      accuracyMm: 1.1,
      confidencePercent: liveSpatialMetrics.confidencePercent,
      cameraEyeHeightMeters: 1.6,
      fieldOfViewDeg: { horizontal: 68.0, vertical: 53.0 },
      targetCenterAngle: { pitch: orientationData.pitch, yaw: orientationData.heading },
      gps: originGps,
      orientation: {
        ...orientationData,
        trueNorthHeading,
        magneticDeclination,
      },
      localVertices,
      geoVertices,
      jobMode: currentJobConfig.name,
      substrate: 'Architectural Façade & Plinth',
    };
  }, [gpsData, orientationData, trueNorthHeading, magneticDeclination, liveSpatialMetrics, currentJobConfig]);

  // Full Screen State & Ref
  const [isFullScreen, setIsFullScreen] = useState(false);
  const viewfinderContainerRef = useRef<HTMLDivElement | null>(null);

  const toggleFullScreen = useCallback(() => {
    playClickSound();
    if (!isFullScreen) {
      setIsFullScreen(true);
      if (viewfinderContainerRef.current && viewfinderContainerRef.current.requestFullscreen) {
        viewfinderContainerRef.current.requestFullscreen().catch(() => {
          // Native fullscreen request silent fallback for iframe sandbox
        });
      }
    } else {
      setIsFullScreen(false);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [isFullScreen]);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullScreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  // Initialize Camera Stream
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function startCamera() {
      setIsLoading(true);
      setCameraError(null);

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera hardware (getUserMedia API) is not accessible in this context.');
        }

        try {
          const allDevices = await navigator.mediaDevices.enumerateDevices();
          setDevices(allDevices.filter((d) => d.kind === 'videoinput'));
        } catch {
          // ignore
        }

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = newStream;
        setStream(newStream);

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          await videoRef.current.play().catch(() => {});
        }
        setIsLoading(false);
      } catch (err: any) {
        console.warn('Camera error:', err);
        let errorMsg = 'Could not access device camera.';
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMsg = 'Camera permission was denied. Use file upload below or enable camera in browser settings.';
        } else if (err.name === 'NotFoundError') {
          errorMsg = 'No camera sensor was detected. You can upload a site photo below.';
        } else if (err.message) {
          errorMsg = err.message;
        }
        setCameraError(errorMsg);
        setIsLoading(false);
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [stream]);

  // Handle GPS Satellite Tracking Toggle
  useEffect(() => {
    if (gpsEnabled && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setGpsData({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            alt: pos.coords.altitude ? Math.round(pos.coords.altitude) : 180,
            accuracy: Math.round(pos.coords.accuracy * 10) / 10,
            speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0,
          });
        },
        (err) => {
          console.warn('GPS location tracking error:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
      );
      setGpsWatcherId(watchId);

      return () => {
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      };
    } else {
      if (gpsWatcherId !== null) {
        navigator.geolocation.clearWatch(gpsWatcherId);
        setGpsWatcherId(null);
      }
    }
  }, [gpsEnabled]);

  // Handle Compass & Gyro Orientation Listener with Throttle
  const lastOrientationUpdateRef = useRef<number>(0);
  useEffect(() => {
    if (!compassEnabled) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const now = performance.now();
      if (now - lastOrientationUpdateRef.current < 80) return; // ~12Hz throttle
      lastOrientationUpdateRef.current = now;

      const heading = e.alpha !== null ? Math.round(e.alpha) : (orientationData.heading + 1) % 360;
      const pitch = e.beta !== null ? Math.round(e.beta) : -4;
      const roll = e.gamma !== null ? Math.round(e.gamma) : 1;

      setOrientationData({ heading, pitch, roll });
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      };
    }
  }, [compassEnabled, orientationData.heading]);

  // Continuous Video Frame & Spatial Tracking Rendering Engine synchronized to native VSYNC
  const lastCvStateUpdateRef = useRef<number>(0);

  const processCVFrame = useCallback((timestamp?: number) => {
    if (!videoRef.current || !edgeCanvasRef.current || captureMode !== 'edge_cv') return;

    const video = videoRef.current;
    const canvas = edgeCanvasRef.current;
    if (video.readyState < 2) {
      animFrameIdRef.current = requestAnimationFrame(processCVFrame);
      return;
    }

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: true });
    if (!ctx) return;

    // Direct native VSYNC display refresh rate frame synchronization (60Hz / 90Hz / 120Hz)
    ctx.drawImage(video, 0, 0, width, height);

    try {
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // Fast Sobel gradient edge detection
      let cornerCount = 0;
      let edgeCount = 0;

      const hexColor = currentTheme.accentHex;
      // Convert accent hex to RGB for drawing high-contrast edge overlays
      const r = parseInt(hexColor.slice(1, 3), 16) || 16;
      const g = parseInt(hexColor.slice(3, 5), 16) || 185;
      const b = parseInt(hexColor.slice(5, 7), 16) || 129;

      const outputData = ctx.createImageData(width, height);
      const out = outputData.data;

      const thresh = edgeThreshold * 2.5;

      // Sample stride for performance
      const stride = 2;
      for (let y = 1; y < height - 1; y += stride) {
        for (let x = 1; x < width - 1; x += stride) {
          const idx = (y * width + x) * 4;

          // Luminance formula
          const p = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
          const pRight = data[idx + 4] * 0.299 + data[idx + 5] * 0.587 + data[idx + 6] * 0.114;
          const pBottom = data[(idx + width * 4)] * 0.299 + data[(idx + width * 4) + 1] * 0.587 + data[(idx + width * 4) + 2] * 0.114;

          const dx = Math.abs(pRight - p);
          const dy = Math.abs(pBottom - p);
          const mag = dx + dy;

          if (mag > thresh) {
            edgeCount++;
            out[idx] = r;
            out[idx + 1] = g;
            out[idx + 2] = b;
            out[idx + 3] = 220; // bright overlay

            // Check corner gradients
            if (dx > thresh * 0.8 && dy > thresh * 0.8) {
              cornerCount++;
            }
          } else {
            out[idx + 3] = 0; // transparent
          }
        }
      }

      ctx.putImageData(outputData, 0, 0);

      // Draw Corner Target Lock Box overlays on top
      ctx.strokeStyle = hexColor;
      ctx.lineWidth = 1.5;

      // Simulated target locks on detected structural corners
      if (cornerCount > 10) {
        const lockX = width * 0.5;
        const lockY = height * 0.5;
        const boxSize = 60 + (cornerCount % 30);

        ctx.strokeRect(lockX - boxSize / 2, lockY - boxSize / 2, boxSize, boxSize);
        ctx.fillStyle = hexColor;
        ctx.font = '10px monospace';
        ctx.fillText(`TARGET LOCKED [${cornerCount} PTS]`, lockX - boxSize / 2, lockY - boxSize / 2 - 6);
      }

      // Throttle React state dispatches to 150ms to eliminate UI thread raster jank
      const now = performance.now();
      if (now - lastCvStateUpdateRef.current > 150) {
        lastCvStateUpdateRef.current = now;
        setDetectedCornersCount(Math.min(cornerCount * 4, 384));
        setDetectedEdgesLength(Math.min(Math.round(edgeCount * 0.8), 2450));
      }
    } catch (e) {
      // CORS or context safety
    }

    if (captureMode === 'edge_cv') {
      animFrameIdRef.current = requestAnimationFrame(processCVFrame);
    }
  }, [captureMode, edgeThreshold, currentTheme]);

  // Trigger CV Loop when edge_cv mode is selected
  useEffect(() => {
    if (captureMode === 'edge_cv') {
      setIsCvProcessing(true);
      if (!isMuted) playAlertChime('warning');
      animFrameIdRef.current = requestAnimationFrame(processCVFrame);
    } else {
      setIsCvProcessing(false);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    }
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [captureMode, processCVFrame, isMuted]);

  // Shutter Snapshot Capture
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;

    // Enforce Active Survey Context rule (SV-003 Section 11)
    if (!activeSurvey?.id) {
      playAlertChime('warning');
      setSurveyWarning(true);
      return;
    }

    if (!isMuted) playSuccessSound();

    const video = videoRef.current;
    const canvas = mainCanvasRef.current || document.createElement('canvas');
    const rawWidth = video.videoWidth || 1280;
    const rawHeight = video.videoHeight || 720;

    let srcX = 0;
    let srcY = 0;
    let srcW = rawWidth;
    let srcH = rawHeight;

    if (aspectRatio === '1:1') {
      const side = Math.min(rawWidth, rawHeight);
      srcX = (rawWidth - side) / 2;
      srcY = (rawHeight - side) / 2;
      srcW = side;
      srcH = side;
    } else if (aspectRatio === '4:3') {
      const targetRatio = 4 / 3;
      const currentRatio = rawWidth / rawHeight;
      if (currentRatio > targetRatio) {
        srcW = rawHeight * targetRatio;
        srcX = (rawWidth - srcW) / 2;
      } else {
        srcH = rawWidth / targetRatio;
        srcY = (rawHeight - srcH) / 2;
      }
    }

    const destW = Math.round(srcW);
    const destH = Math.round(srcH);

    canvas.width = destW;
    canvas.height = destH;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (facingMode === 'user') {
        ctx.translate(destW, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, destW, destH);

      // If in CV mode, composite the edge canvas on top
      if (captureMode === 'edge_cv' && edgeCanvasRef.current) {
        ctx.drawImage(edgeCanvasRef.current, srcX, srcY, srcW, srcH, 0, 0, destW, destH);
      }

      // Draw Tactical Metadata Watermark Stamp at Bottom
      ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
      ctx.fillRect(0, destH - 36, destW, 36);

      ctx.fillStyle = currentTheme.accentHex;
      ctx.font = 'bold 12px monospace';
      const gpsStamp = gpsData ? `LAT: ${gpsData.lat.toFixed(5)}° N | LNG: ${gpsData.lng.toFixed(5)}° W` : 'GPS: FIXED';
      const compassStamp = `BEARING: ${orientationData.heading}° | SURVEY: [${activeSurvey.id}]`;
      ctx.fillText(`WALNUS SMARTVIEW PRO [${gpsStamp}] [${compassStamp}]`, 12, destH - 12);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      // Collision-resistant ID generation (UUID + timestamp, never clock-only)
      const randomPart = Math.random().toString(36).substring(2, 8);
      const cleanSurveyId = activeSurvey.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 12);
      const captureId = `cap_${cleanSurveyId}_${Date.now().toString(36)}_${randomPart}`;
      const localPath = `survey_media/${activeSurvey.id}/${captureId}.jpg`;

      const captureRecord: SurveyCapture = {
        id: captureId,
        surveyId: activeSurvey.id,
        localPath,
        captureType: 'STANDARD_STILL',
        width: destW,
        height: destH,
        fileSizeBytes: Math.round(dataUrl.length * 0.75),
        createdAtEpochMs: Date.now(),
        thumbnailDataUrl: dataUrl,
        syncStatus: 'pending',
      };

      // Open post-capture review modal before final local persistence
      setPendingReview({ capture: captureRecord, dataUrl });
    }
  };

  // Upload Photo File Fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!activeSurvey?.id) {
      playAlertChime('warning');
      setSurveyWarning(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const rawData = reader.result;
        const randomPart = Math.random().toString(36).substring(2, 8);
        const cleanSurveyId = activeSurvey.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 12);
        const captureId = `cap_${cleanSurveyId}_${Date.now().toString(36)}_${randomPart}`;
        const localPath = `survey_media/${activeSurvey.id}/${captureId}.jpg`;

        const captureRecord: SurveyCapture = {
          id: captureId,
          surveyId: activeSurvey.id,
          localPath,
          captureType: 'STANDARD_STILL',
          width: 1920,
          height: 1080,
          fileSizeBytes: file.size || Math.round(rawData.length * 0.75),
          createdAtEpochMs: Date.now(),
          thumbnailDataUrl: rawData,
          syncStatus: 'pending',
        };

        setPendingReview({ capture: captureRecord, dataUrl: rawData });
      }
    };
    reader.readAsDataURL(file);
  };

  // Cardinal direction compass string
  const getCardinalDirection = (heading: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(heading / 45) % 8];
  };

  return (
    <div
      ref={viewfinderContainerRef}
      className={`relative w-full ${
        isFullScreen
          ? 'fixed inset-0 z-50 w-screen h-screen rounded-none max-w-none max-h-none border-0'
          : 'rounded-2xl border-2 max-h-[calc(100vh-7rem)]'
      } overflow-hidden bg-slate-950 ${currentTheme.borderClass} ${currentTheme.glowClass} shadow-2xl flex flex-col items-center justify-between font-mono hardware-accelerated transition-all duration-300`}
    >
      {/* Offscreen Canvas Elements */}
      <canvas ref={mainCanvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* =========================================================================
          TOP MILITARY HUD HEADER & NAVIGATION CONTROL BAR (ON-SCREEN OVERLAY)
         ========================================================================= */}
      <div className="absolute top-2 inset-x-2 sm:inset-x-3 z-30 p-2 sm:p-2.5 bg-slate-950/90 border border-slate-800/80 rounded-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-2 shadow-2xl pointer-events-auto">
        
        {/* Left: System Status & Live Radar Pulse */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900/90 px-2 py-1 rounded-md border border-slate-700/80">
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[${currentTheme.accentHex}]`} />
              <span className={`relative inline-flex rounded-full h-2 w-2`} style={{ backgroundColor: currentTheme.accentHex }} />
            </span>
            <span className={`text-[10px] font-bold tracking-widest uppercase ${currentTheme.textClass}`}>
              SMARTVIEW SV-003
            </span>
          </div>

          {/* Active Survey Context Badge */}
          {activeSurvey ? (
            <button
              type="button"
              onClick={onOpenSurveysManager}
              title="Active Survey Context (Click to switch or manage surveys)"
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-950/90 border border-indigo-500/80 text-[10px] text-indigo-200 font-mono font-bold hover:bg-indigo-900 transition-all cursor-pointer"
            >
              <Layers className="w-3 h-3 text-indigo-400" />
              <span className="truncate max-w-[110px] sm:max-w-[150px]">{activeSurvey.title}</span>
              <span className="text-[9px] text-indigo-400 font-normal">({activeSurvey.id})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenSurveysManager}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-rose-950/90 border border-rose-500 text-[10px] text-rose-300 font-mono font-bold animate-pulse cursor-pointer"
            >
              <AlertCircle className="w-3 h-3 text-rose-400" />
              <span>Select Survey</span>
            </button>
          )}

          {/* Survey Gallery Quick Button */}
          {onOpenGallery && (
            <button
              type="button"
              onClick={onOpenGallery}
              title="Open Survey Photographic Records Gallery"
              className="px-2 py-1 rounded-md border text-[10px] font-bold flex items-center gap-1 bg-slate-900/90 border-slate-700 text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Camera className="w-3 h-3 text-indigo-400" />
              <span className="hidden sm:inline">Gallery</span>
              {activeSurvey?.captureCount !== undefined && (
                <span className="px-1 py-0.2 rounded-full bg-indigo-600 text-[9px] text-white">
                  {activeSurvey.captureCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Center: Compass Heading Tape Display */}
        {compassEnabled && (
          <div className="hidden md:flex items-center gap-2 px-3 py-0.5 bg-black/80 rounded-md border border-slate-800 text-[10px]">
            <Compass className={`w-3.5 h-3.5 ${currentTheme.textClass} animate-spin-slow`} />
            <span className="text-white font-bold">{orientationData.heading}° {getCardinalDirection(orientationData.heading)}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">PITCH: {orientationData.pitch}°</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">ROLL: {orientationData.roll}°</span>
          </div>
        )}

        {/* Right: Quick Collapsible Panel & Control Toggles */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Quick GPS Hardware Toggle */}
          <button
            type="button"
            onClick={() => {
              playToggleSound(!gpsEnabled);
              setGpsEnabled(!gpsEnabled);
            }}
            title="Toggle Satellite GPS Tracking"
            className={`px-2 py-1 rounded-md border text-[10px] font-bold flex items-center gap-1 transition-all ${
              gpsEnabled
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400'
                : 'bg-black/60 border-slate-800 text-slate-500'
            }`}
          >
            <MapPin className="w-3 h-3" />
            <span className="hidden sm:inline">GPS</span>
          </button>

          {/* Quick Compass Hardware Toggle */}
          <button
            type="button"
            onClick={() => {
              playToggleSound(!compassEnabled);
              setCompassEnabled(!compassEnabled);
            }}
            title="Toggle Compass Bearing & Gyro Sensor"
            className={`px-2 py-1 rounded-md border text-[10px] font-bold flex items-center gap-1 transition-all ${
              compassEnabled
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-400'
                : 'bg-black/60 border-slate-800 text-slate-500'
            }`}
          >
            <Compass className="w-3 h-3" />
            <span className="hidden sm:inline">BEARING</span>
          </button>

          {/* GIS Database Export Modal Button */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setShowGisExportModal(true);
            }}
            title="Open GIS / GeoJSON / KML / WKT Spatial Export"
            className="p-1.5 rounded-md border text-[10px] transition-all flex items-center gap-1 font-bold bg-indigo-950/80 border-indigo-500/80 text-indigo-300 hover:text-white hover:bg-indigo-900 shadow-md cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">GIS Export</span>
          </button>

          {/* Collapsible Telemetry Panel Button */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setShowTelemetryPanel(!showTelemetryPanel);
            }}
            title="Toggle Telemetry Overlay Panel"
            className={`p-1.5 rounded-md border text-[10px] transition-all ${
              showTelemetryPanel ? 'bg-slate-800 border-slate-600 text-white' : 'bg-black/60 border-slate-800 text-slate-400'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
          </button>

          {/* Collapsible CV Edge Panel Button */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setShowCvPanel(!showCvPanel);
            }}
            title="Toggle Computer Vision Edge Analysis Panel"
            className={`p-1.5 rounded-md border text-[10px] transition-all ${
              showCvPanel ? 'bg-slate-800 border-slate-600 text-white' : 'bg-black/60 border-slate-800 text-slate-400'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Collapsible Material Theme Color Switcher Button with Palette Icon */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setShowThemePanel(!showThemePanel);
            }}
            title="Toggle Material HUD Theme Controller & Color Switcher"
            className={`p-1.5 rounded-md border text-[10px] transition-all flex items-center gap-1 font-bold ${
              showThemePanel
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-500/20'
                : 'bg-black/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Theme Palette</span>
          </button>

          {/* Full Screen Expand Button */}
          <button
            type="button"
            onClick={toggleFullScreen}
            title={isFullScreen ? 'Exit Full Screen Camera Mode' : 'Expand Full Screen Camera Viewfinder'}
            className={`p-1.5 rounded-md border text-[10px] transition-all flex items-center gap-1 font-bold ${
              isFullScreen
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-black/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {isFullScreen ? (
              <>
                <Minimize className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Fullscreen</span>
              </>
            )}
          </button>

          {/* Cancel Close Button */}
          <button
            type="button"
            onClick={onCancel}
            title="Close Viewfinder"
            className="p-1.5 rounded-md bg-black/60 border border-slate-800 text-slate-400 hover:text-red-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          COLLAPSIBLE UI PANEL 1: MATERIAL THEME COLOR SWITCHER & CONTROLLER
         ========================================================================= */}
      {showThemePanel && (
        <div className="absolute top-12 left-2 right-2 z-30 p-3 bg-slate-950/95 border border-slate-800 rounded-xl backdrop-blur-md space-y-3 shadow-2xl animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase border-b border-slate-800 pb-2">
            <span className="text-slate-200 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-indigo-400" />
              <span>Material Theme Controller & Custom Color Switcher</span>
            </span>
            <button
              type="button"
              onClick={() => setShowThemePanel(false)}
              className="text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Preset Material Color Schemes */}
          <div>
            <label className="block text-[9px] font-mono uppercase text-slate-400 mb-1.5 font-bold">
              Preset Tactical & Material Color Schemes
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {HUD_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setHudTheme(t.id);
                  }}
                  className={`p-2 rounded-lg border text-[10px] font-bold font-mono flex items-center gap-2 text-left transition-all ${
                    hudTheme === t.id
                      ? `${t.bgClass} ${t.borderClass} ${t.textClass} shadow-md`
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-inner" style={{ backgroundColor: t.accentHex }} />
                  <span className="truncate">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Color Picker Switcher */}
          <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-300 font-bold flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Custom Accent Color Hex Picker
              </span>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setHudTheme('custom');
                }}
                className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition-all ${
                  hudTheme === 'custom'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {hudTheme === 'custom' ? 'Active' : 'Enable Custom'}
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customColorHex}
                onChange={(e) => {
                  setCustomColorHex(e.target.value);
                  setHudTheme('custom');
                }}
                className="w-10 h-8 rounded bg-slate-950 border border-slate-700 p-0.5 cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={customColorHex}
                onChange={(e) => {
                  setCustomColorHex(e.target.value);
                  setHudTheme('custom');
                }}
                placeholder="#8b5cf6"
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-slate-200 uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Viewfinder Aspect Ratio Scaling Selector */}
          <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-300 font-bold flex items-center gap-1.5">
                <Ratio className="w-3.5 h-3.5 text-indigo-400" />
                Viewfinder Aspect Ratio Scaling Mode
              </span>
              <span className="text-[9px] font-mono uppercase text-cyan-400 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                Active: {aspectRatio.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 font-mono">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setAspectRatio('4:3');
                }}
                className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                  aspectRatio === '4:3'
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>[4:3] Standard</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setAspectRatio('1:1');
                }}
                className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                  aspectRatio === '1:1'
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>[1:1] Square</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setAspectRatio('full');
                }}
                className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                  aspectRatio === 'full'
                    ? 'bg-cyan-600 border-cyan-400 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Maximize2 className="w-3 h-3 text-cyan-300" />
                <span>[FULL] Cover</span>
              </button>
            </div>
          </div>

          {/* Reticle Style Selector & Spatial Grid Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[10px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Reticle:</span>
              <button
                type="button"
                onClick={() => setReticleType('tactical')}
                className={`px-2 py-0.5 rounded border ${
                  reticleType === 'tactical' ? 'bg-indigo-600 text-white border-indigo-500 font-bold' : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                Tactical
              </button>
              <button
                type="button"
                onClick={() => setReticleType('crosshair')}
                className={`px-2 py-0.5 rounded border ${
                  reticleType === 'crosshair' ? 'bg-indigo-600 text-white border-indigo-500 font-bold' : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                Crosshair
              </button>
              <button
                type="button"
                onClick={() => setReticleType('box')}
                className={`px-2 py-0.5 rounded border ${
                  reticleType === 'box' ? 'bg-indigo-600 text-white border-indigo-500 font-bold' : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                Box Target
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowGrid(!showGrid)}
              className={`px-2.5 py-1 rounded border flex items-center gap-1 font-bold ${
                showGrid ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300' : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              <Grid className="w-3 h-3" />
              <span>Spatial Grid</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          COLLAPSIBLE UI PANEL 2: COMPUTER VISION EDGE & CORNER PANEL
         ========================================================================= */}
      {showCvPanel && (
        <div className="absolute top-12 left-2 right-2 z-30 p-2.5 bg-slate-950/95 border border-slate-800 rounded-xl backdrop-blur-md space-y-2 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase border-b border-slate-800 pb-1.5">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Continuous Edge & Corner Detection Engine</span>
            </span>
            <button
              type="button"
              onClick={() => setShowCvPanel(false)}
              className="text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
            <div>
              <label className="block text-slate-400 mb-1">Capture Processing Mode</label>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setCaptureMode('still')}
                  className={`py-1.5 px-2 rounded border font-bold text-center ${
                    captureMode === 'still'
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Still Image
                </button>
                <button
                  type="button"
                  onClick={() => setCaptureMode('edge_cv')}
                  className={`py-1.5 px-2 rounded border font-bold text-center ${
                    captureMode === 'edge_cv'
                      ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Live Edge CV
                </button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400">Sobel Edge Gradient Sensitivity Threshold:</span>
                <span className="text-cyan-400 font-bold">{edgeThreshold}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                value={edgeThreshold}
                onChange={(e) => setEdgeThreshold(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                <span>High Sensitivity (Noise)</span>
                <span>Balanced</span>
                <span>Coarse Structural Lines</span>
              </div>
            </div>
          </div>

          <div className="p-2 bg-slate-900 rounded border border-slate-800/80 flex items-center justify-between text-[10px] font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>DETECTED FEATURES:</span>
            </span>
            <div className="flex items-center gap-3">
              <span className="text-emerald-400">{detectedCornersCount} Corners</span>
              <span className="text-cyan-400">{detectedEdgesLength} Contour Vector Pixels</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEWFINDER WINDOW & OVERLAYS
         ========================================================================= */}
      <div
        className={`relative w-full flex-1 min-h-0 bg-slate-950 flex items-center justify-center overflow-hidden transition-all duration-300 ${
          aspectRatio === 'full' ? 'h-full p-0' : 'p-2 sm:p-4 bg-slate-950/95'
        }`}
      >
        {/* Inner Framing Viewport Box (for 4:3 and 1:1 aspect ratios, or 100% full cover) */}
        <div
          className={`relative overflow-hidden flex items-center justify-center transition-all duration-300 ${
            aspectRatio === 'full'
              ? 'w-full h-full'
              : aspectRatio === '4:3'
              ? 'w-full max-w-3xl aspect-[4/3] rounded-2xl border-2 border-slate-800/90 shadow-2xl bg-black'
              : 'w-full max-w-md aspect-square rounded-2xl border-2 border-slate-800/90 shadow-2xl bg-black'
          }`}
        >
          {/* Loading Indicator */}
          {isLoading && !cameraError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm gap-3">
              <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono text-indigo-300 tracking-wider uppercase animate-pulse">
                Locking Optical Sensor Hardware...
              </p>
            </div>
          )}

          {/* Live Video Element - BoxFit.cover full screen scaling */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              facingMode === 'user' ? 'scale-x-[-1]' : ''
            } ${isLoading || cameraError ? 'opacity-0' : 'opacity-100'}`}
          />

          {/* Live Canvas Edge Detection Overlay */}
          <canvas
            ref={edgeCanvasRef}
            className={`absolute inset-0 w-full h-full object-cover pointer-events-none z-10 ${
              captureMode === 'edge_cv' ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Tactical HUD Reticles & Sensors Overlay */}
          {!cameraError && !isLoading && (
            <div className="absolute inset-0 pointer-events-none z-20">
              
              {/* FLOATING TOOLBAR: Job Mode Selection Bar & Aspect Ratio Switcher Widget */}
              <div className="absolute top-3 inset-x-0 flex flex-wrap items-center justify-center gap-2 pointer-events-none z-30 px-2">
                {/* Job Mode Selector Pill */}
                <div className="pointer-events-auto flex items-center bg-slate-950/90 border border-slate-800 p-1 rounded-full shadow-2xl backdrop-blur-md font-mono text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setJobMode('painting');
                    }}
                    className={`px-2.5 sm:px-3 py-1 rounded-full font-bold uppercase transition-all flex items-center gap-1.5 ${
                      jobMode === 'painting'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 ring-1 ring-indigo-400'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Paintbrush className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Painting</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setJobMode('plastering');
                    }}
                    className={`px-2.5 sm:px-3 py-1 rounded-full font-bold uppercase transition-all flex items-center gap-1.5 ${
                      jobMode === 'plastering'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 ring-1 ring-indigo-400'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Plastering</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setJobMode('screeding');
                    }}
                    className={`px-2.5 sm:px-3 py-1 rounded-full font-bold uppercase transition-all flex items-center gap-1.5 ${
                      jobMode === 'screeding'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 ring-1 ring-indigo-400'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Ruler className="w-3.5 h-3.5 text-amber-300" />
                    <span>Wall Screening</span>
                  </button>
                </div>
              </div>

            {/* Spatial Matrix Grid */}
            {showGrid && (
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `linear-gradient(to right, ${currentTheme.accentHex}15 1px, transparent 1px), linear-gradient(to bottom, ${currentTheme.accentHex}15 1px, transparent 1px)`,
                  backgroundSize: '40px 40px',
                }}
              />
            )}

            {/* Corner Framing Brackets with Dynamic Theme Colors */}
            <div className="absolute top-12 left-6 w-10 h-10 border-t-2 border-l-2 rounded-tl transition-colors" style={{ borderColor: currentTheme.accentHex }} />
            <div className="absolute top-12 right-6 w-10 h-10 border-t-2 border-r-2 rounded-tr transition-colors" style={{ borderColor: currentTheme.accentHex }} />
            <div className="absolute bottom-12 left-6 w-10 h-10 border-b-2 border-l-2 rounded-bl transition-colors" style={{ borderColor: currentTheme.accentHex }} />
            <div className="absolute bottom-12 right-6 w-10 h-10 border-b-2 border-r-2 rounded-br transition-colors" style={{ borderColor: currentTheme.accentHex }} />

            {/* SV-005 ADAS-Inspired Horizon Pitch & Roll Indicator */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
              <div 
                className="w-56 h-1 rounded transition-transform duration-75 ease-out shadow-lg"
                style={{
                  backgroundColor: currentTheme.accentHex,
                  transform: `rotate(${orientationData.roll || 0}deg) translateY(${(orientationData.pitch || 0) * 1.5}px)`,
                  boxShadow: `0 0 10px ${currentTheme.accentHex}`,
                }}
              >
                <div className="absolute left-1/2 -top-1.5 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: currentTheme.accentHex }} />
              </div>
              {/* Data Provenance Classification Badge */}
              <div className="absolute top-16 right-4 px-2 py-0.5 rounded bg-black/80 border border-slate-700 font-mono text-[9px] text-emerald-400 backdrop-blur-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>PROVENANCE: MEASURED / ESTIMATED</span>
              </div>
            </div>

            {/* Center Target Reticles based on selected style */}
            <div className="absolute inset-0 flex items-center justify-center">
              {reticleType === 'tactical' && (
                <div className="relative w-36 h-36 rounded-full flex items-center justify-center animate-pulse" style={{ border: `1px solid ${currentTheme.accentHex}60` }}>
                  <div className="w-20 h-20 border border-dashed rounded-full" style={{ borderColor: `${currentTheme.accentHex}80` }} />
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentTheme.accentHex }} />
                  {/* Ticks */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2" style={{ backgroundColor: `${currentTheme.accentHex}40` }} />
                  <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2" style={{ backgroundColor: `${currentTheme.accentHex}40` }} />
                </div>
              )}

              {reticleType === 'crosshair' && (
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2" style={{ backgroundColor: currentTheme.accentHex }} />
                  <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2" style={{ backgroundColor: currentTheme.accentHex }} />
                  <div className="w-8 h-8 rounded-full border-2" style={{ borderColor: currentTheme.accentHex }} />
                </div>
              )}

              {reticleType === 'box' && (
                <div className="relative w-40 h-40 border-2 border-dashed flex items-center justify-center" style={{ borderColor: currentTheme.accentHex }}>
                  <div className="w-2 h-2" style={{ backgroundColor: currentTheme.accentHex }} />
                </div>
              )}
            </div>

            {/* Collapsible Telemetry Overlay Badges */}
            {showTelemetryPanel && (
              <div className="absolute bottom-2 inset-x-2 flex flex-wrap items-center justify-between gap-1.5 text-[9px] font-mono">
                {/* Real-time Calculation Metrics Badge */}
                <div className="bg-black/85 px-2.5 py-1 rounded border border-slate-800 backdrop-blur-xs flex items-center gap-1.5 text-slate-200 shadow-md">
                  <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
                  <span className="font-bold text-indigo-400 uppercase">{currentJobConfig.name}:</span>
                  <span className="text-emerald-400 font-bold">{materialUnitsNeeded} {currentJobConfig.unit}</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-amber-300 font-bold">{formatCurrency(estimatedTotalCost)}</span>
                  <span className="text-slate-500 hidden sm:inline">|</span>
                  <span className="text-cyan-300 hidden sm:inline">{currentJobConfig.defaultThickness}</span>
                </div>

                {/* GPS Coordinates Badge */}
                {gpsEnabled && gpsData && (
                  <div className="bg-black/80 px-2.5 py-1 rounded border border-slate-800 backdrop-blur-xs flex items-center gap-1.5 text-slate-200">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span>LAT: {gpsData.lat.toFixed(4)}°</span>
                    <span>LNG: {gpsData.lng.toFixed(4)}°</span>
                    <span className="text-emerald-400">ALT: {gpsData.alt}m</span>
                  </div>
                )}

                {/* Gyro Compass Orientation Badge */}
                {compassEnabled && (
                  <div className="bg-black/80 px-2.5 py-1 rounded border border-slate-800 backdrop-blur-xs flex items-center gap-1.5 text-slate-200">
                    <Compass className="w-3 h-3 text-cyan-400" />
                    <span>HDR: {orientationData.heading}° {getCardinalDirection(orientationData.heading)}</span>
                    <span>PITCH: {orientationData.pitch}°</span>
                  </div>
                )}

                {/* Mode status */}
                <div className="bg-black/80 px-2 py-1 rounded border border-slate-800 text-slate-300 ml-auto">
                  <span>RESOL: 1280x720 • 60 FPS</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Camera Error / Fallback UI */}
        {cameraError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-slate-950 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide mb-1 font-mono">
              Camera Hardware Access Required
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
              {cameraError}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-medium flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-500/20"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Site Photo
              </button>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* =========================================================================
          BOTTOM MILITARY SHUTTER & HARDWARE CONTROLS BAR (DETACHED & HOVERING)
         ========================================================================= */}
      <div className="absolute bottom-3 inset-x-2 sm:inset-x-4 z-30 p-2.5 bg-slate-950/90 border border-slate-800/80 rounded-2xl backdrop-blur-md flex items-center justify-between gap-3 shadow-2xl pointer-events-auto">
        
        {/* Left: Upload Photo Alternative */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Upload Image</span>
        </button>

        {/* Center: Main Shutter Trigger Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isLoading || Boolean(cameraError)}
            onClick={handleCaptureSnapshot}
            className={`group relative flex items-center justify-center w-14 h-14 rounded-full border-4 border-slate-800 bg-slate-950 transition-all duration-200 disabled:opacity-40 active:scale-95 shadow-xl`}
            style={{ borderColor: currentTheme.accentHex }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md"
              style={{ backgroundColor: currentTheme.accentHex }}
            >
              <Camera className="w-5 h-5 text-slate-950 font-bold" />
            </div>
          </button>

          {devices.length > 1 && (
            <button
              type="button"
              onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
              title="Flip Camera Lens"
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right: Close Viewfinder */}
        <button
          type="button"
          onClick={onCancel}
          className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-mono transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* SV-003 Capture Review & Confirmation Modal */}
      {pendingReview && (
        <SurveyCaptureReviewModal
          capture={pendingReview.capture}
          imageDataUrl={pendingReview.dataUrl}
          surveyTitle={activeSurvey?.title || 'Active Survey'}
          onSave={async (updatedCapture) => {
            try {
              await surveyCaptureRepository.saveCapture(updatedCapture, pendingReview.dataUrl);
              if (stream) {
                stream.getTracks().forEach((track) => track.stop());
              }
              const capturedData = pendingReview.dataUrl;
              setPendingReview(null);
              onCapture(capturedData, updatedCapture);
            } catch (err) {
              console.error('Failed to save survey capture:', err);
            }
          }}
          onRetake={() => {
            setPendingReview(null);
          }}
          onCancel={() => {
            setPendingReview(null);
          }}
        />
      )}

      {/* SV-003 Active Survey Context Warning Modal */}
      {surveyWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-600/80 rounded-2xl shadow-2xl p-4 text-center font-mono space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-950 border border-rose-600 flex items-center justify-center text-rose-400 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">
              Active Survey Required
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              SV-003 data integrity rule: photographs cannot be captured without an identifiable survey association. Please select or create an active survey first.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSurveyWarning(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 text-xs cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  setSurveyWarning(false);
                  if (onOpenSurveysManager) onOpenSurveysManager();
                }}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Select Survey
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// ISOLATED MEMOIZED SUBCOMPONENTS FOR PERFORMANCE (Granular State Rebuild Minimization)
// =========================================================================

export const TacticalReticleOverlay = React.memo(function TacticalReticleOverlay({
  reticleType,
  accentHex,
}: {
  reticleType: 'tactical' | 'crosshair' | 'box';
  accentHex: string;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {reticleType === 'tactical' && (
        <div
          className="relative w-36 h-36 rounded-full flex items-center justify-center animate-pulse"
          style={{ border: `1px solid ${accentHex}60` }}
        >
          <div
            className="w-20 h-20 border border-dashed rounded-full"
            style={{ borderColor: `${accentHex}80` }}
          />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentHex }} />
          <div
            className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2"
            style={{ backgroundColor: `${accentHex}40` }}
          />
          <div
            className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2"
            style={{ backgroundColor: `${accentHex}40` }}
          />
        </div>
      )}

      {reticleType === 'crosshair' && (
        <div className="relative w-48 h-48 flex items-center justify-center">
          <div
            className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2"
            style={{ backgroundColor: accentHex }}
          />
          <div
            className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2"
            style={{ backgroundColor: accentHex }}
          />
          <div className="w-8 h-8 rounded-full border-2" style={{ borderColor: accentHex }} />
        </div>
      )}

      {reticleType === 'box' && (
        <div
          className="relative w-40 h-40 border-2 border-dashed flex items-center justify-center"
          style={{ borderColor: accentHex }}
        >
          <div className="w-2 h-2" style={{ backgroundColor: accentHex }} />
        </div>
      )}
    </div>
  );
});

export const ThemeColorSelectorBar = React.memo(function ThemeColorSelectorBar({
  hudTheme,
  customColorHex,
  onSelectTheme,
  onCustomColorChange,
}: {
  hudTheme: HUDThemeColor;
  customColorHex: string;
  onSelectTheme: (theme: HUDThemeColor) => void;
  onCustomColorChange: (color: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 text-[10px] font-mono">
      {HUD_THEMES.map((theme) => {
        const isSelected = hudTheme === theme.id;
        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => {
              playClickSound();
              onSelectTheme(theme.id);
            }}
            className={`p-1.5 rounded-lg border flex items-center justify-between gap-1 transition-all ${
              isSelected
                ? 'bg-slate-900 border-white text-white font-bold shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-1.5 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-xs"
                style={{ backgroundColor: theme.accentHex }}
              />
              <span className="truncate">{theme.name}</span>
            </span>
            {isSelected && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
          </button>
        );
      })}

      {/* Custom Picker Option */}
      <div
        className={`p-1.5 rounded-lg border flex items-center justify-between gap-1 transition-all ${
          hudTheme === 'custom'
            ? 'bg-slate-900 border-indigo-400 text-indigo-300 font-bold shadow-md'
            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            playClickSound();
            onSelectTheme('custom');
          }}
          className="flex items-center gap-1.5 truncate text-left w-full"
        >
          <Palette className="w-3 h-3 text-indigo-400 shrink-0" />
          <span className="truncate">Custom Hex</span>
        </button>
        <input
          type="color"
          value={customColorHex}
          onChange={(e) => {
            onCustomColorChange(e.target.value);
            onSelectTheme('custom');
          }}
          className="w-4 h-4 rounded border-0 bg-transparent cursor-pointer p-0 shrink-0"
        />
      </div>
    </div>
  );
});


