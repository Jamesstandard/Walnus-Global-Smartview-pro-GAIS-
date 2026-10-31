import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Camera, Layers, Save, CheckCircle, Calculator, Box, RefreshCw, Eye, Sparkles, Sliders, Check, FileText, HardDrive, Thermometer, Droplets, Wind, ShieldCheck, CloudSun, Beaker, Video, Upload, CheckSquare, Settings, X, RotateCcw, Clock, Palette, Minimize2, FlaskConical, ChevronDown, ChevronUp, Image as ImageIcon, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChemicalAnalysisSupplierHUD } from './ChemicalAnalysisSupplierHUD';
import { PaintProject, ProjectMode, PROJECT_MODES_CONFIG, Survey, SurveyCapture } from '../types';
import { saveProjectOffline } from '../db';
import { surveyCaptureRepository } from '../lib/surveyCaptureRepository';
import { SurveyCaptureGallery } from './SurveyCaptureGallery';
import { ManageSurveysModal } from './ManageSurveysModal';
import { SurveysDashboard } from './SurveysDashboard';
import { SurveyWorkspace } from './SurveyWorkspace';
import { NewSurveyModal } from './NewSurveyModal';
import { generateId, formatCurrency } from '../lib/utils';
import { getStoredLocalization } from '../data/userProfileSettings';
import { LocalizationSettings } from '../types';
import { playClickSound, playSuccessSound, playAlertChime, playToggleSound } from '../lib/soundUtils';
import { CameraViewfinder } from './CameraViewfinder';
import { ProjectDesignationHoverCard } from './ProjectDesignationHoverCard';
import { ProjectModeHoverSelector } from './ProjectModeHoverSelector';
import { Neural3DGenerator } from './Neural3DGenerator';
import { MarketIntelligenceHUD } from './MarketIntelligenceHUD';
import { AnalysisRoutingView } from './AnalysisRoutingView';
import {
  WeatherCopilotSchedulerPanel
} from './WeatherCopilotSchedulerPanel';
import {
  SiteParametersInput,
  PaintTypeKey,
  QualityGrade,
  PAINT_TYPES_REGISTRY,
  QUALITY_GRADES_REGISTRY,
  calculateSiteFormulationTarget,
  FormulationTargetOutput,
} from '../lib/weatherEquationEngine';

export const ESTIMATOR_DRAFT_STORAGE_KEY = 'siteview_estimator_input_draft_v1';

export interface EstimatorDraftState {
  version: number;
  timestamp: number;
  projectName: string;
  surfaceArea: number;
  colorHex: string;
  paintType: string;
  projectMode?: ProjectMode;
  overlayMode: 'mesh' | 'paint' | 'split';
  siteParams: SiteParametersInput;
  reconstructEngine: 'poisson' | 'gaussian_splat' | 'nerf';
  reconstructSource: 'photo' | 'video';
  capturedPhoto: string | null;
  modelGenerated: boolean;
  generated3DModel: {
    modelName: string;
    polygonsCount: number;
    vertexCount: number;
    accuracyMm: number;
    surfaceAreaSqMeters: number;
  } | null;
  isWeatherPanelOpen: boolean;
}

const DEFAULT_ESTIMATOR_STATE = {
  surfaceArea: 2450,
  colorHex: '#3b82f6',
  paintType: 'Exterior Acrylic Latex',
  projectName: 'Building Façade - Sector 4',
  projectMode: 'paint' as ProjectMode,
  overlayMode: 'paint' as const,
  siteParams: {
    siteAreaSqFt: 2450,
    siteAreaSqMeters: 227.6,
    paintTypeKey: 'acrylic_latex' as PaintTypeKey,
    qualityGrade: 'standard' as QualityGrade,
    coatsCount: 2,
    surfacePorosity: 'medium' as const,
    applicationMethod: 'airless_spray' as const,
  },
  reconstructEngine: 'poisson' as const,
  reconstructSource: 'photo' as const,
  isWeatherPanelOpen: false,
};

function loadStoredEstimatorDraft(): EstimatorDraftState | null {
  try {
    const raw = localStorage.getItem(ESTIMATOR_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && (parsed.version === 1 || parsed.projectName)) {
      return parsed as EstimatorDraftState;
    }
  } catch (err) {
    console.warn('Unable to load saved estimator draft from local storage', err);
  }
  return null;
}

interface EstimatorAppProps {
  onOpenWorkspace?: () => void;
  isCopilotOpen?: boolean;
  setIsCopilotOpen?: (val: boolean | ((prev: boolean) => boolean)) => void;
  minimizedPanels?: Set<string>;
  onMinimizePanel?: (id: string) => void;
  onRestorePanel?: (id: string) => void;
}

export type WorkflowStage =
  | 'WORKSPACE'
  | 'DASHBOARD'
  | 'CAPTURE'
  | 'GALLERY'
  | 'ANALYSIS'
  | 'SPEC'
  | 'WEATHER'
  | 'MARKET_INTELLIGENCE'
  | 'MODEL_VIEWER'
  | 'PAYLOAD';

export function EstimatorApp({
  onOpenWorkspace,
  isCopilotOpen,
  setIsCopilotOpen,
  minimizedPanels,
  onMinimizePanel,
  onRestorePanel,
}: EstimatorAppProps) {
  // Restore initial state from local storage draft if available to protect against accidental refresh
  const initialDraft = useMemo(() => loadStoredEstimatorDraft(), []);

  const [activePage, setActivePage] = useState<WorkflowStage>('WORKSPACE');
  const [wants3DModel, setWants3DModel] = useState<boolean>(false);

  // SV-004 Active Survey Context, Dashboard & New Survey Modal State
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  const [isSurveysManagerOpen, setIsSurveysManagerOpen] = useState<boolean>(false);
  const [isNewSurveyModalOpen, setIsNewSurveyModalOpen] = useState<boolean>(false);

  // Initialize and persist active survey context
  useEffect(() => {
    async function initActiveSurvey() {
      try {
        const existingSurveys = await surveyCaptureRepository.getAllSurveys();
        if (existingSurveys.length > 0) {
          const active = existingSurveys.find((s) => s.status === 'active') || existingSurveys[0];
          setActiveSurvey(active);
        } else {
          const defaultSurvey: Survey = {
            id: 'srv_site_facade_01',
            projectId: 'proj_default_site',
            title: 'Building Façade Survey - Sector 4',
            status: 'active',
            description: 'Primary architectural façade photographic survey & substrate audit',
            createdAtEpochMs: Date.now(),
            lastUpdatedEpochMs: Date.now(),
            captureCount: 0,
          };
          await surveyCaptureRepository.saveSurvey(defaultSurvey);
          setActiveSurvey(defaultSurvey);
        }
      } catch (err) {
        console.warn('Failed to load or initialize active survey:', err);
      }
    }
    initActiveSurvey();
  }, []);

  const [isCameraOpen, setIsCameraOpen] = useState(true);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(initialDraft?.capturedPhoto ?? null);
  const [modelGenerated, setModelGenerated] = useState(initialDraft?.modelGenerated ?? false);
  const [surfaceArea, setSurfaceArea] = useState<number>(initialDraft?.surfaceArea ?? DEFAULT_ESTIMATOR_STATE.surfaceArea);
  const [colorHex, setColorHex] = useState<string>(initialDraft?.colorHex ?? DEFAULT_ESTIMATOR_STATE.colorHex);
  const [paintType, setPaintType] = useState<string>(initialDraft?.paintType ?? DEFAULT_ESTIMATOR_STATE.paintType);
  const [projectMode, setProjectMode] = useState<ProjectMode>(initialDraft?.projectMode ?? DEFAULT_ESTIMATOR_STATE.projectMode);
  const [projectName, setProjectName] = useState<string>(initialDraft?.projectName ?? DEFAULT_ESTIMATOR_STATE.projectName);
  const [overlayMode, setOverlayMode] = useState<'mesh' | 'paint' | 'split'>(initialDraft?.overlayMode ?? DEFAULT_ESTIMATOR_STATE.overlayMode);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Detailed Site Parameter Registry & Weather Formulation Target State
  const [siteParams, setSiteParams] = useState<SiteParametersInput>(initialDraft?.siteParams ?? DEFAULT_ESTIMATOR_STATE.siteParams);
  const [formulationTarget, setFormulationTarget] = useState<FormulationTargetOutput | null>(null);
  const [showChemicalHUD, setShowChemicalHUD] = useState<boolean>(false);
  const [isCommHudCollapsed, setIsCommHudCollapsed] = useState<boolean>(false);
  const [isBottomMenuCollapsed, setIsBottomMenuCollapsed] = useState<boolean>(false);

  // Switch page when external panel restore triggers occur
  useEffect(() => {
    const handleOpenWeather = () => setActivePage('WEATHER');
    const handleOpen3D = () => setActivePage('MODEL_VIEWER');
    const handleOpenSpec = () => setActivePage('SPEC');
    const handleOpenPayload = () => setActivePage('PAYLOAD');

    window.addEventListener('paint_sync_open_weather_page', handleOpenWeather);
    window.addEventListener('paint_sync_open_3d_page', handleOpen3D);
    window.addEventListener('paint_sync_open_spec_page', handleOpenSpec);
    window.addEventListener('paint_sync_open_payload_page', handleOpenPayload);

    return () => {
      window.removeEventListener('paint_sync_open_weather_page', handleOpenWeather);
      window.removeEventListener('paint_sync_open_3d_page', handleOpen3D);
      window.removeEventListener('paint_sync_open_spec_page', handleOpenSpec);
      window.removeEventListener('paint_sync_open_payload_page', handleOpenPayload);
    };
  }, []);

  // Notify floating buttons stack of visibility obstruction
  useEffect(() => {
    const obstructed = activePage === 'WEATHER' || isCameraOpen || activePage === 'MODEL_VIEWER';
    window.dispatchEvent(new CustomEvent('paint_sync_panels_obstructed', { detail: { obstructed } }));
  }, [activePage, isCameraOpen]);

  // Auto-Save Management State (15-Minute Silent Auto-Save Persistence Engine)
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<number>(initialDraft?.timestamp ?? Date.now());
  const [manualSaveFeedback, setManualSaveFeedback] = useState<boolean>(false);
  const [restoredBannerVisible, setRestoredBannerVisible] = useState<boolean>(false);

  const [loc, setLoc] = useState<LocalizationSettings>(getStoredLocalization);

  // Handle Project Mode Switch
  const handleSelectProjectMode = useCallback((mode: ProjectMode) => {
    playClickSound();
    setProjectMode(mode);
    const config = PROJECT_MODES_CONFIG[mode];
    if (config) {
      setPaintType(config.defaultMaterial);
      setColorHex(config.defaultHex);
      setSiteParams((prev) => ({
        ...prev,
        paintTypeKey: (mode === 'screed' ? 'floor_screed' : mode === 'plaster' ? 'wall_plaster' : 'acrylic_latex') as PaintTypeKey,
      }));
      window.dispatchEvent(
        new CustomEvent('paint_sync_project_mode_changed', {
          detail: { mode, config },
        })
      );
    }
  }, []);

  useEffect(() => {
    const handleQualityChange = (e: any) => {
      if (e.detail && e.detail.qualityGrade) {
        handleUpdateSiteParams({ qualityGrade: e.detail.qualityGrade });
      }
    };
    const handleLocChange = (e: CustomEvent<LocalizationSettings>) => {
      if (e.detail) {
        setLoc(e.detail);
      }
    };
    const handleModeSync = (e: any) => {
      if (e.detail && e.detail.mode && ['paint', 'screed', 'plaster'].includes(e.detail.mode)) {
        setProjectMode(e.detail.mode);
      }
    };
    const handleWeatherAlert = () => setActivePage('WEATHER');
    const handleNavigatePage = (e: any) => {
      if (e.detail && e.detail.page) {
        setActivePage(e.detail.page);
      }
    };
    window.addEventListener('paint_sync_quality_grade_changed', handleQualityChange);
    window.addEventListener('paint_sync_localization_updated', handleLocChange as EventListener);
    window.addEventListener('paint_sync_project_mode_changed', handleModeSync);
    window.addEventListener('paint_sync_weather_alert', handleWeatherAlert);
    window.addEventListener('paint_sync_navigate_page', handleNavigatePage);
    return () => {
      window.removeEventListener('paint_sync_quality_grade_changed', handleQualityChange);
      window.removeEventListener('paint_sync_localization_updated', handleLocChange as EventListener);
      window.removeEventListener('paint_sync_project_mode_changed', handleModeSync);
      window.removeEventListener('paint_sync_weather_alert', handleWeatherAlert);
      window.removeEventListener('paint_sync_navigate_page', handleNavigatePage);
    };
  }, []);

  // 3D Geometry Neural Reconstruction States
  const [isGenerating3D, setIsGenerating3D] = useState(false);
  const [generate3DProgress, setGenerate3DProgress] = useState(0);
  const [generate3DStatus, setGenerate3DStatus] = useState('');
  const [generated3DModel, setGenerated3DModel] = useState<{
    modelName: string;
    polygonsCount: number;
    vertexCount: number;
    accuracyMm: number;
    surfaceAreaSqMeters: number;
  } | null>(initialDraft?.generated3DModel ?? null);
  const [reconstructEngine, setReconstructEngine] = useState<'poisson' | 'gaussian_splat' | 'nerf'>(initialDraft?.reconstructEngine ?? DEFAULT_ESTIMATOR_STATE.reconstructEngine);
  const [reconstructSource, setReconstructSource] = useState<'photo' | 'video'>(initialDraft?.reconstructSource ?? DEFAULT_ESTIMATOR_STATE.reconstructSource);

  // Split Screen Interactive Comparison Wiper State
  const [splitPosition, setSplitPosition] = useState<number>(50); // 0% to 100%
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const handleSplitMove = useCallback((clientX: number) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const rawPercent = ((clientX - rect.left) / rect.width) * 100;
    const clamped = Math.max(5, Math.min(95, rawPercent));
    setSplitPosition(clamped);
  }, []);

  useEffect(() => {
    if (!isDraggingSplit) return;
    const onMouseMove = (e: MouseEvent) => {
      handleSplitMove(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleSplitMove(e.touches[0].clientX);
      }
    };
    const onEnd = () => setIsDraggingSplit(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDraggingSplit, handleSplitMove]);

  // Mutable Draft Ref to guarantee the auto-save timer always persists the exact current input fields
  const currentInputsRef = useRef({
    projectName,
    surfaceArea,
    colorHex,
    paintType,
    projectMode,
    overlayMode,
    siteParams,
    reconstructEngine,
    reconstructSource,
    capturedPhoto,
    modelGenerated,
    generated3DModel,
    isWeatherPanelOpen: activePage === 'WEATHER',
  });

  useEffect(() => {
    currentInputsRef.current = {
      projectName,
      surfaceArea,
      colorHex,
      paintType,
      projectMode,
      overlayMode,
      siteParams,
      reconstructEngine,
      reconstructSource,
      capturedPhoto,
      modelGenerated,
      generated3DModel,
      isWeatherPanelOpen: activePage === 'WEATHER',
    };
  }, [
    projectName,
    surfaceArea,
    colorHex,
    paintType,
    projectMode,
    overlayMode,
    siteParams,
    reconstructEngine,
    reconstructSource,
    capturedPhoto,
    modelGenerated,
    generated3DModel,
    activePage,
  ]);

  // Core Auto-Save Execution Method (Silent 15-Minute Cadence or Manual Trigger)
  const persistDraftToStorage = useCallback((manual = false) => {
    try {
      const now = Date.now();
      const draftData: EstimatorDraftState = {
        version: 1,
        timestamp: now,
        ...currentInputsRef.current,
      };

      try {
        localStorage.setItem(ESTIMATOR_DRAFT_STORAGE_KEY, JSON.stringify(draftData));
      } catch (quotaErr) {
        // Fallback: If localStorage quota exceeded due to large photo base64 data, strip photo to guarantee all text/numeric parameters are safely stored
        console.warn('Quota exceeded during photo draft save; persisting inputs without photo payload', quotaErr);
        const strippedDraft = { ...draftData, capturedPhoto: null };
        localStorage.setItem(ESTIMATOR_DRAFT_STORAGE_KEY, JSON.stringify(strippedDraft));
      }

      setLastSavedTimestamp(now);
      if (manual) {
        playSuccessSound();
        setManualSaveFeedback(true);
        setTimeout(() => setManualSaveFeedback(false), 2500);
      }
    } catch (err) {
      console.warn('Error executing save to localStorage', err);
    }
  }, []);

  // 15-Minute Silent Auto-Save Interval (900,000 ms) & Window Event Listeners (beforeunload & unmount)
  useEffect(() => {
    // 15 minutes in milliseconds = 15 * 60 * 1000 = 900,000 ms
    const autoSaveIntervalId = setInterval(() => {
      persistDraftToStorage(false);
    }, 15 * 60 * 1000);

    const handleBeforeUnload = () => {
      persistDraftToStorage(false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(autoSaveIntervalId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Final silent flush on unmount (e.g. switching tabs between Estimator and Mixer)
      persistDraftToStorage(false);
    };
  }, [persistDraftToStorage]);

  // Reset all fields to template defaults and purge local storage draft
  const handleClearDraft = () => {
    playClickSound();
    try {
      localStorage.removeItem(ESTIMATOR_DRAFT_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear draft from local storage', e);
    }
    setProjectName(DEFAULT_ESTIMATOR_STATE.projectName);
    setSurfaceArea(DEFAULT_ESTIMATOR_STATE.surfaceArea);
    setColorHex(DEFAULT_ESTIMATOR_STATE.colorHex);
    setPaintType(DEFAULT_ESTIMATOR_STATE.paintType);
    setOverlayMode(DEFAULT_ESTIMATOR_STATE.overlayMode);
    setSiteParams(DEFAULT_ESTIMATOR_STATE.siteParams);
    setReconstructEngine(DEFAULT_ESTIMATOR_STATE.reconstructEngine);
    setReconstructSource(DEFAULT_ESTIMATOR_STATE.reconstructSource);
    setCapturedPhoto(null);
    setModelGenerated(false);
    setGenerated3DModel(null);
    setRestoredBannerVisible(false);
    setLastSavedTimestamp(Date.now());
  };

  const handleGenerate3DGeometry = async () => {
    playClickSound();
    setIsGenerating3D(true);
    setGenerated3DModel(null);
    setGenerate3DProgress(0);
    
    const steps = [
      { prg: 10, msg: 'Initializing photogrammetry neural engine...' },
      { prg: 25, msg: 'Extracting keypoint feature matches (SIFT/ORB)...' },
      { prg: 45, msg: 'Calibrating bundle adjustment intrinsic matrix...' },
      { prg: 65, msg: 'Generating dense point cloud & depth estimation...' },
      { prg: 85, msg: 'Computing Screened Poisson Surface Reconstruction...' },
      { prg: 95, msg: 'Baking high-resolution ambient texture maps...' },
      { prg: 100, msg: '3D Geometry Mesh construction completed!' }
    ];

    for (const step of steps) {
      setGenerate3DStatus(step.msg);
      await new Promise((r) => setTimeout(r, 450));
      setGenerate3DProgress(step.prg);
    }

    playSuccessSound();
    const finalSqm = parseFloat((200 + Math.random() * 150).toFixed(1));
    const finalSqFt = Math.round(finalSqm * 10.7639);

    setGenerated3DModel({
      modelName: reconstructEngine === 'poisson' ? 'Poisson_Mesh_Splat_v2.obj' : reconstructEngine === 'gaussian_splat' ? 'Splat_Point_Cloud.ply' : 'NeRF_Surface_Volumetric.gltf',
      polygonsCount: Math.floor(35000 + Math.random() * 20000),
      vertexCount: Math.floor(18000 + Math.random() * 10000),
      accuracyMm: parseFloat((1.2 + Math.random() * 1.5).toFixed(1)),
      surfaceAreaSqMeters: finalSqm,
    });

    // Update active takeoff area measurements based on generated 3D physical model geometry!
    handleUpdateSiteParams({
      siteAreaSqMeters: finalSqm,
    });
    setSurfaceArea(finalSqFt);
    setModelGenerated(true);

    setIsGenerating3D(false);
  };

  const handleUpdateSiteParams = (updated: Partial<SiteParametersInput>) => {
    setSiteParams((prev) => {
      const next = { ...prev, ...updated };
      if (updated.siteAreaSqFt !== undefined && updated.siteAreaSqMeters === undefined) {
        next.siteAreaSqMeters = parseFloat((updated.siteAreaSqFt / 10.7639).toFixed(1));
        setSurfaceArea(updated.siteAreaSqFt);
      } else if (updated.siteAreaSqMeters !== undefined && updated.siteAreaSqFt === undefined) {
        next.siteAreaSqFt = Math.round(updated.siteAreaSqMeters * 10.7639);
        setSurfaceArea(next.siteAreaSqFt);
      }
      return next;
    });
  };

  const handlePhotoCaptured = (imageDataUrl: string) => {
    setCapturedPhoto(imageDataUrl);
    setIsCameraOpen(false);
    setModelGenerated(true);
    // Calculated surface area estimate with slight randomization based on capture
    const calculatedEstimate = Math.floor(1800 + Math.random() * 2200);
    setSurfaceArea(calculatedEstimate);
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setModelGenerated(false);
    setIsCameraOpen(true);
  };

  const handlePackageAndSync = async () => {
    if (!modelGenerated) return;

    const volume = parseFloat((surfaceArea / 350).toFixed(2)); // Standard 350 sq ft per gallon coverage

    const project: PaintProject = {
      id: generateId(),
      name: projectName,
      surfaceAreaSqFt: surfaceArea,
      paintType: paintType,
      colorName: 'Field Selected Tone',
      colorHex: colorHex,
      volumeGallons: volume,
      status: 'estimated',
      syncStatus: 'pending',
      lastUpdated: Date.now(),
      images: capturedPhoto ? [capturedPhoto] : [],
    };

    await saveProjectOffline(project);
    setSaveSuccess(true);
  };

  const PAGES_CONFIG: { id: WorkflowStage; label: string; icon: any }[] = [
    { id: 'WORKSPACE', label: 'Workspace', icon: Layers },
    { id: 'DASHBOARD', label: 'Surveys', icon: FolderOpen },
    { id: 'CAPTURE', label: 'Capture', icon: Camera },
    { id: 'GALLERY', label: 'Gallery', icon: ImageIcon },
    { id: 'ANALYSIS', label: 'Analysis', icon: Sparkles },
    { id: 'SPEC', label: 'Site Spec', icon: Sliders },
    { id: 'WEATHER', label: 'Weather', icon: CloudSun },
    { id: 'MARKET_INTELLIGENCE', label: 'Market', icon: Calculator },
    { id: 'MODEL_VIEWER', label: '3D Studio', icon: Box },
    { id: 'PAYLOAD', label: 'Payload', icon: HardDrive },
  ];

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans hardware-accelerated select-none">
      {/* Floating Tool Sidebar (Collapsible Vertical Pill on Right) */}
      <div className="fixed right-2 top-20 z-30 flex flex-col items-center gap-1.5 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 p-1.5 rounded-full shadow-xl">
        {/* Mode Toggle Button */}
        <button
          type="button"
          onClick={() => {
            const modes: ProjectMode[] = ['paint', 'screed', 'plaster'];
            const nextIdx = (modes.indexOf(projectMode) + 1) % modes.length;
            handleSelectProjectMode(modes[nextIdx]);
          }}
          title={`Switch Mode (Current: ${projectMode})`}
          className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-700/80 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>

        {/* Manual Save Trigger Button */}
        <button
          type="button"
          onClick={() => persistDraftToStorage(true)}
          title="Save Project Draft Now"
          className="w-8 h-8 rounded-full bg-emerald-950/90 hover:bg-emerald-900 text-emerald-400 border border-emerald-700/60 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
        >
          {manualSaveFeedback ? (
            <Check className="w-3.5 h-3.5 text-emerald-300 animate-bounce" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Reset Draft Button */}
        <button
          type="button"
          onClick={handleClearDraft}
          title="Reset Draft Inputs"
          className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Chemical Formulation & Supplier Integration Toggle Button */}
        <button
          type="button"
          onClick={() => setShowChemicalHUD(!showChemicalHUD)}
          title="Chemical Formulations & Global Suppliers HUD"
          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
            showChemicalHUD
              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/50'
              : 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700/80'
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5" />
        </button>

        {/* Retake Photo Button */}
        {capturedPhoto && (
          <button
            type="button"
            onClick={() => {
              handleRetake();
              setActivePage('CAPTURE');
            }}
            title="Retake Site Photo"
            className="w-8 h-8 rounded-full bg-indigo-950/90 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Primary Full-Bleed Viewport Canvas or Sheet Content Container */}
      <div className="fixed inset-0 w-full h-full z-0 overflow-hidden bg-slate-950">
        <AnimatePresence mode="wait">
          {/* PAGE: SURVEY WORKSPACE */}
          {activePage === 'WORKSPACE' && (
            <motion.div
              key="page-workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 pt-16 pb-16 z-10 bg-slate-950 overflow-hidden"
            >
              {activeSurvey ? (
                <SurveyWorkspace
                  survey={activeSurvey}
                  onUpdateSurvey={(updated) => setActiveSurvey(updated)}
                  onBackToDashboard={() => setActivePage('DASHBOARD')}
                  onLaunchCamera={() => {
                    setIsCameraOpen(true);
                    setActivePage('CAPTURE');
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <p className="text-xs font-mono text-slate-400 mb-4">No active survey selected</p>
                  <button
                    type="button"
                    onClick={() => setActivePage('DASHBOARD')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-mono text-xs font-bold"
                  >
                    Open Surveys Dashboard
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* PAGE: SURVEYS DASHBOARD */}
          {activePage === 'DASHBOARD' && (
            <motion.div
              key="page-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 pt-16 pb-16 z-10 bg-slate-950 overflow-hidden"
            >
              <SurveysDashboard
                activeSurveyId={activeSurvey?.id || null}
                onSelectSurvey={(srv) => {
                  setActiveSurvey(srv);
                  setActivePage('WORKSPACE');
                }}
                onOpenNewSurveyModal={() => setIsNewSurveyModalOpen(true)}
              />
            </motion.div>
          )}

          {/* PAGE 1: CAMERA & SPATIAL CAPTURE */}
          {activePage === 'CAPTURE' && (
            <motion.div
              key="page-capture"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 pt-20 sm:pt-24 pb-16 px-2 z-10 overflow-hidden bg-slate-950 flex flex-col justify-center items-center"
            >
              {isCameraOpen ? (
                <CameraViewfinder
                  onCapture={(img, captureRecord) => {
                    setCapturedPhoto(img);
                    if (captureRecord && activeSurvey) {
                      setActiveSurvey((prev) =>
                        prev ? { ...prev, captureCount: (prev.captureCount || 0) + 1 } : prev
                      );
                    }
                    setIsCameraOpen(false);
                    setActivePage('GALLERY');
                  }}
                  onCancel={() => setIsCameraOpen(false)}
                  activeSurvey={activeSurvey}
                  onOpenSurveysManager={() => setIsSurveysManagerOpen(true)}
                  onOpenGallery={() => {
                    setIsCameraOpen(false);
                    setActivePage('GALLERY');
                  }}
                  initialJobMode={
                    projectMode === 'screed'
                      ? 'screeding'
                      : projectMode === 'plaster'
                      ? 'plastering'
                      : 'painting'
                  }
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-slate-950">
                  <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-indigo-400 shadow-inner">
                    <Camera className="w-8 h-8" />
                  </div>
                  <h3 className="text-sm font-mono font-bold text-slate-200 mb-1">
                    Camera Viewfinder Standby
                  </h3>

                  {/* Active Survey Context Pill */}
                  {activeSurvey && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-600/70 text-indigo-300 font-mono text-xs mb-3">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Active: {activeSurvey.title}</span>
                      <button
                        type="button"
                        onClick={() => setIsSurveysManagerOpen(true)}
                        className="text-[10px] text-indigo-400 underline hover:text-indigo-200 cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  )}

                  <p className="text-xs font-mono text-slate-400 mb-6 max-w-xs">
                    {capturedPhoto
                      ? 'Photographic capture saved to survey. Launch camera to take additional records or inspect gallery.'
                      : 'Launch CameraX pipeline to view live camera preview and record site photographs.'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{capturedPhoto ? 'Take Another Photo' : 'Open Camera'}</span>
                    </button>
                    {activeSurvey && (
                      <button
                        type="button"
                        onClick={() => setActivePage('GALLERY')}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold border border-slate-700 shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <ImageIcon className="w-4 h-4 text-indigo-400" />
                        <span>View Captures Gallery ({activeSurvey.captureCount || 0})</span>
                      </button>
                    )}
                    {capturedPhoto && (
                      <button
                        type="button"
                        onClick={() => setActivePage('ANALYSIS')}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Inspect Analysis →</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* PAGE: SURVEY CAPTURE GALLERY */}
          {activePage === 'GALLERY' && activeSurvey && (
            <motion.div
              key="page-gallery"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 pt-20 sm:pt-24 pb-16 px-2 z-10 overflow-y-auto no-scrollbar bg-slate-950"
            >
              <SurveyCaptureGallery
                activeSurvey={activeSurvey}
                onLaunchCamera={() => {
                  setIsCameraOpen(true);
                  setActivePage('CAPTURE');
                }}
                onCaptureCountChange={(count) => {
                  setActiveSurvey((prev) => (prev ? { ...prev, captureCount: count } : prev));
                }}
              />
            </motion.div>
          )}

          {/* PAGE 2: ANALYSIS & ROUTING */}
          {activePage === 'ANALYSIS' && (
            <motion.div
              key="page-analysis"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 pt-20 pb-16 px-3 z-10 overflow-y-auto no-scrollbar bg-slate-950/90 backdrop-blur-md"
            >
              <div className="max-w-xl mx-auto space-y-3">
                {capturedPhoto ? (
                  <AnalysisRoutingView
                    imageSrc={capturedPhoto}
                    onSelectOption={(want3D) => {
                      setWants3DModel(want3D);
                      setActivePage(want3D ? 'MODEL_VIEWER' : 'SPEC');
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 border border-slate-800 rounded-2xl bg-slate-950/70 text-center">
                    <p className="text-xs font-mono text-slate-400 mb-4">
                      No photo captured yet for analysis routing.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCameraOpen(true);
                        setActivePage('CAPTURE');
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-mono text-xs font-bold shadow-lg flex items-center gap-1.5"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Go to Camera</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* PAGE 3: SITE & MATERIAL SPECIFICATION */}
          {activePage === 'SPEC' && (
            <motion.div
              key="page-spec"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 pt-20 pb-16 px-3 z-10 overflow-y-auto no-scrollbar bg-slate-950/90 backdrop-blur-md"
            >
              <div className="max-w-xl mx-auto space-y-3">
                <ProjectDesignationHoverCard
                  projectName={projectName}
                  onProjectNameChange={setProjectName}
                  paintType={paintType}
                  onPaintTypeChange={setPaintType}
                  colorHex={colorHex}
                  onColorHexChange={setColorHex}
                  siteParams={siteParams}
                  onUpdateSiteParams={handleUpdateSiteParams}
                  formulationTarget={formulationTarget}
                  projectMode={projectMode}
                  onMinimize={() => {}}
                />
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActivePage('WEATHER')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 font-mono text-[11px] font-semibold"
                  >
                    <CloudSun className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Weather</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setActivePage('MARKET_INTELLIGENCE');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-lg"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Market HUD →</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* PAGE 4: WEATHER COPILOT */}
          {activePage === 'WEATHER' && (
            <motion.div
              key="page-weather"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 pt-20 pb-16 px-3 z-10 overflow-y-auto no-scrollbar bg-slate-950/90 backdrop-blur-md"
            >
              <div className="max-w-xl mx-auto space-y-3">
                <WeatherCopilotSchedulerPanel
                  siteParams={siteParams}
                  onUpdateSiteParams={handleUpdateSiteParams}
                  onTargetCalculated={setFormulationTarget}
                  onClose={() => setActivePage('SPEC')}
                />
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setActivePage('SPEC')}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]"
                  >
                    ← Spec
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePage('MARKET_INTELLIGENCE')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-lg"
                  >
                    Market →
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* PAGE 5: MARKET INTELLIGENCE HUD */}
          {activePage === 'MARKET_INTELLIGENCE' && (
            <motion.div
              key="page-market-intel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 pt-20 pb-16 px-3 z-10 overflow-y-auto no-scrollbar bg-slate-950/90 backdrop-blur-md"
            >
              <div className="max-w-xl mx-auto space-y-3">
                <MarketIntelligenceHUD
                  projectMode={projectMode}
                  surfaceArea={surfaceArea}
                  show3DButton={false}
                />
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActivePage('SPEC')}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]"
                  >
                    ← Spec
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePage('PAYLOAD')}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-blue-600 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-lg"
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>Payload →</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* PAGE 6: 3D STUDIO CANVAS */}
          {activePage === 'MODEL_VIEWER' && (
            <motion.div
              key="page-3d-studio"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full h-full relative"
            >
              <Neural3DGenerator
                projectName={projectName}
                colorHex={colorHex}
                paintType={paintType}
                surfaceArea={surfaceArea}
                siteParams={siteParams}
                initialSource={reconstructSource}
                initialEngine={reconstructEngine}
                isStandaloneFullScreen={true}
                onClose={() => setActivePage('MARKET_INTELLIGENCE')}
                onUpdateMeasurements={(sqMeters, sqFt) => {
                  handleUpdateSiteParams({ siteAreaSqMeters: sqMeters });
                  setSurfaceArea(sqFt);
                  setModelGenerated(true);
                }}
                onPackageAndSync={() => {
                  handlePackageAndSync();
                  setActivePage('PAYLOAD');
                }}
                onOpenWorkspace={onOpenWorkspace}
              />
            </motion.div>
          )}

          {/* PAGE 7: PAYLOAD PACKAGE */}
          {activePage === 'PAYLOAD' && (
            <motion.div
              key="page-payload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 pt-20 pb-16 px-3 z-10 overflow-y-auto no-scrollbar bg-slate-950/90 backdrop-blur-md"
            >
              <div className="max-w-xl mx-auto space-y-3">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <HardDrive className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">
                        Site Payload Package
                      </span>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-bold">
                      Sync Ready
                    </span>
                  </div>

                  <div className="p-2.5 border border-slate-800/80 rounded-xl bg-black/70 font-mono text-[10px] text-slate-300 leading-tight">
                    <pre className="overflow-x-auto text-[10px] text-slate-400">
{`{
  "project_name": "${projectName.replace(/\s+/g, '_')}",
  "mode": "${projectMode}",
  "paint_type": "${paintType}",
  "surface_area_sqft": ${surfaceArea},
  "site_parameters": ${JSON.stringify(siteParams, null, 2).replace(/\n/g, '\n  ')}
}`}
                    </pre>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActivePage('MARKET_INTELLIGENCE')}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]"
                    >
                      ← Market HUD
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handlePackageAndSync();
                        persistDraftToStorage(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Package & Sync</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chemical Analysis & Supplier Integration HUD Modal Overlay */}
      <AnimatePresence>
        {showChemicalHUD && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-2 top-20 bottom-16 z-50 overflow-y-auto no-scrollbar max-w-2xl mx-auto shadow-2xl"
          >
            <ChemicalAnalysisSupplierHUD
              discipline={projectMode}
              paintType={paintType}
              surfaceAreaSqFt={surfaceArea}
              tempCelsius={siteParams.ambientTempCelsius}
              humidityPercent={siteParams.relativeHumidityPercent}
              onClose={() => setShowChemicalHUD(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Single Consolidated Telemetry / Comm HUD Floating Overlay (Collapsible) */}
      <AnimatePresence initial={false}>
        {!isCommHudCollapsed ? (
          <motion.div
            key="expanded-comm-hud"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={`fixed left-2 right-2 z-30 font-mono text-[10px] text-emerald-400 bg-black/90 backdrop-blur-md border border-slate-800/80 px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-2 shadow-2xl transition-all ${
              isBottomMenuCollapsed ? 'bottom-8' : 'bottom-14'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-bold uppercase text-slate-200 truncate">{projectName}</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300 uppercase">{projectMode}</span>
              <span className="text-slate-500">|</span>
              <span className="text-emerald-300 font-bold">{surfaceArea.toLocaleString()} SQFT</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
              <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-bold">
                GPS FIX
              </span>
              <button
                type="button"
                onClick={() => {
                  playToggleSound(false);
                  setIsCommHudCollapsed(true);
                }}
                title="Collapse Comm HUD"
                className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 transition-colors ml-1 cursor-pointer"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed-comm-hud"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`fixed right-2 z-30 transition-all ${
              isBottomMenuCollapsed ? 'bottom-8' : 'bottom-14'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                playToggleSound(true);
                setIsCommHudCollapsed(false);
              }}
              title="Expand Comm HUD & Telemetry"
              className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-xl font-mono text-[10px] font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer backdrop-blur-md"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>GPS FIX • {surfaceArea.toLocaleString()} SQFT</span>
              <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsible Bottom Navigation Menu & Folding Edge Ledge */}
      <AnimatePresence initial={false} mode="wait">
        {!isBottomMenuCollapsed ? (
          <motion.nav
            key="bottom-nav-expanded"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 flex flex-col font-mono shadow-2xl select-none"
          >
            {/* Top Edge Collapse Tab Handle */}
            <div className="h-3.5 flex items-center justify-center bg-slate-900/60 border-b border-slate-800/50">
              <button
                type="button"
                onClick={() => {
                  playToggleSound(false);
                  setIsBottomMenuCollapsed(true);
                }}
                title="Collapse Menu into screen edge"
                className="w-24 h-full flex items-center justify-center gap-1 text-slate-500 hover:text-slate-200 transition-colors cursor-pointer group"
              >
                <div className="w-10 h-1 rounded-full bg-slate-700 group-hover:bg-indigo-400 transition-colors" />
                <ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </button>
            </div>

            {/* Navigation Icons Row with Horizontal Scroll & Grid Snapping */}
            <div className="h-14 flex items-center gap-2 px-3 text-xs overflow-x-auto snap-x snap-mandatory no-scrollbar select-none">
              {PAGES_CONFIG.map((page) => {
                const Icon = page.icon;
                const isActive = activePage === page.id;
                return (
                  <button
                    key={page.id}
                    id={`nav-${page.id.toLowerCase()}-btn`}
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setActivePage(page.id);
                    }}
                    className={`snap-center shrink-0 min-w-[76px] py-1.5 px-2.5 rounded-lg border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      isActive 
                        ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/80 shadow-md shadow-indigo-900/40 font-bold scale-102' 
                        : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-slate-800/80 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400 scale-110' : 'text-slate-400'}`} />
                    <span className="text-[10px] tracking-tight whitespace-nowrap leading-none">{page.label}</span>
                  </button>
                );
              })}

              {/* Fold Button on Right */}
              <button
                type="button"
                onClick={() => {
                  playToggleSound(false);
                  setIsBottomMenuCollapsed(true);
                }}
                title="Fold menu into screen edge"
                className="snap-center shrink-0 min-w-[56px] py-1.5 px-2 rounded-lg bg-slate-900/40 hover:bg-slate-800/60 text-slate-500 hover:text-slate-300 border border-slate-800/60 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
                <span className="text-[9px] uppercase tracking-tight leading-none">Fold</span>
              </button>
            </div>
          </motion.nav>
        ) : (
          <motion.div
            key="bottom-nav-collapsed-ledge"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40"
          >
            <button
              type="button"
              onClick={() => {
                playToggleSound(true);
                setIsBottomMenuCollapsed(false);
              }}
              title="Expand Navigation Menu"
              className="px-3.5 py-1 rounded-t-xl bg-slate-900/95 hover:bg-slate-800 border-t border-x border-slate-700/80 backdrop-blur-md flex items-center gap-2 shadow-2xl text-slate-300 font-mono text-[10px] font-bold cursor-pointer transition-all active:scale-95 group"
            >
              {(() => {
                const currentConfig = PAGES_CONFIG.find((p) => p.id === activePage) || PAGES_CONFIG[0];
                const CurrentIcon = currentConfig.icon;
                return (
                  <>
                    <div className="flex items-center gap-1.5 text-indigo-400">
                      <CurrentIcon className="w-3.5 h-3.5" />
                      <span className="text-slate-200 uppercase tracking-wider">{currentConfig.label}</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    <div className="flex items-center gap-0.5 text-[9px] text-slate-400 group-hover:text-white">
                      <span>MENU</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </div>
                  </>
                );
              })()}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SV-003 Manage Surveys Context Modal */}
      {isSurveysManagerOpen && (
        <ManageSurveysModal
          currentProjectId="proj_default_site"
          activeSurveyId={activeSurvey?.id || null}
          onSelectSurvey={(survey) => {
            setActiveSurvey(survey);
          }}
          onClose={() => setIsSurveysManagerOpen(false)}
        />
      )}

      {/* SV-004 New Survey Creation Modal */}
      <AnimatePresence>
        {isNewSurveyModalOpen && (
          <NewSurveyModal
            currentProjectId="proj_default_site"
            onSurveyCreated={(srv) => {
              setActiveSurvey(srv);
              setIsNewSurveyModalOpen(false);
              setActivePage('WORKSPACE');
            }}
            onClose={() => setIsNewSurveyModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
