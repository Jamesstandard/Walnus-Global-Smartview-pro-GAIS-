import React, { useEffect, useRef, useState } from 'react';
import {
  Wrench,
  Camera,
  MapPin,
  Mic,
  Database,
  ShieldCheck,
  Shield,
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  Activity,
  Sliders,
  HardDrive,
  Info,
  Sparkles,
  Zap,
  Video,
  Radio,
  Wifi,
  Settings2,
  Volume2,
  VolumeX,
  Monitor,
  Check,
  User,
  Building2,
  Globe,
  DollarSign,
  Mail,
  Phone,
  Share2,
  Award,
  Upload,
  Copy,
  Layers,
  FileCheck,
  Cpu,
  Tv,
  Sun,
  Moon,
  Palette,
  FileSignature,
  Minimize2,
  RotateCcw,
  Pin,
  PinOff,
  Menu,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VideoConferenceSettings, UserProfileSettings, LocalizationSettings } from '../types';
import { DEFAULT_VIDEO_SETTINGS } from '../data/contacts';
import {
  getStoredUserProfile,
  saveStoredUserProfile,
  getStoredLocalization,
  saveStoredLocalization,
  SUPPORTED_CURRENCIES,
  formatLocalizedCurrency,
  formatLocalizedArea,
  formatLocalizedVolume,
  DEFAULT_USER_PROFILE,
  DEFAULT_LOCALIZATION
} from '../data/userProfileSettings';
import {
  checkDeviceLocationAndCalibrate,
  revertLocationCalibration,
  getPreCalibrationBackup,
} from '../lib/locationCalibrationService';
import {
  ThemeSettings,
  ACCENT_PRESETS,
  AccentScheme,
  ThemeMode
} from '../lib/themeEngine';
import { useTheme } from './ThemeProvider';
import {
  playClickSound,
  playToggleSound,
  playSuccessSound,
  playTabSound
} from '../lib/soundUtils';

interface AdvancedSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  videoSettings?: VideoConferenceSettings;
  onUpdateVideoSettings?: (settings: VideoConferenceSettings) => void;
}

export type PermissionStateStatus = 'granted' | 'denied' | 'prompt' | 'unsupported' | 'checking';

const NAVIGATION_ITEMS = [
  { id: 'profile', label: 'Profile & Org', icon: User, desc: 'Personal & Company Credentials' },
  { id: 'localization', label: 'Localization & Currency', icon: Globe, desc: 'Units, Currency & Geolocation' },
  { id: 'theme', label: 'Theme & Appearance', icon: Palette, desc: 'Visual Style & Sound Effects' },
  { id: 'permissions', label: 'Hardware & Permissions', icon: ShieldCheck, desc: 'Camera, GPS & Storage Telemetry' },
  { id: 'video_engine', label: 'Video Engine', icon: Video, desc: 'WebRTC, Codec & Noise Suppression' },
] as const;

export function AdvancedSettingsPanel({
  isOpen,
  onClose,
  onMinimize,
  videoSettings: initialVideoSettings,
  onUpdateVideoSettings,
}: AdvancedSettingsPanelProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'profile' | 'localization' | 'theme' | 'permissions' | 'video_engine'>('profile');
  const [isPinned, setIsPinned] = useState(false);
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);

  // Auto-save status indicator
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving'>('saved');
  const autoSaveTimerRef = useRef<any>(null);

  const triggerAutoSave = () => {
    setAutoSaveStatus('saving');
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      setAutoSaveStatus('saved');
    }, 500);
  };

  // User Profile State
  const [profile, setProfile] = useState<UserProfileSettings>(getStoredUserProfile);
  
  const handleProfileFieldChange = (field: keyof UserProfileSettings, value: any) => {
    const updated = { ...profile, [field]: value };
    setProfile(updated);
    saveStoredUserProfile(updated);
    triggerAutoSave();
  };

  const handleCompanyFieldChange = (field: keyof UserProfileSettings['company'], value: any) => {
    const updated = {
      ...profile,
      company: { ...profile.company, [field]: value }
    };
    setProfile(updated);
    saveStoredUserProfile(updated);
    triggerAutoSave();
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        handleProfileFieldChange('profilePicture', result);
        playSuccessSound();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegenerateAppId = () => {
    playClickSound();
    const newId = 'SWV-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    handleProfileFieldChange('applicationId', newId);
  };

  const handleCopyAppId = () => {
    playClickSound();
    navigator.clipboard.writeText(profile.applicationId);
    setCopiedIdToast(true);
    setTimeout(() => setCopiedIdToast(false), 2500);
  };

  // Localization State
  const [localization, setLocalization] = useState<LocalizationSettings>(getStoredLocalization);

  const handleLocalizationUpdate = (newLoc: LocalizationSettings) => {
    setLocalization(newLoc);
    saveStoredLocalization(newLoc);
    window.dispatchEvent(new CustomEvent('paint_sync_localization_updated', { detail: newLoc }));
    triggerAutoSave();
  };

  const handleCurrencySelect = (code: any) => {
    playClickSound();
    const target = SUPPORTED_CURRENCIES.find((c) => c.code === code);
    if (target) {
      handleLocalizationUpdate({
        ...localization,
        currencyCode: target.code,
        currencySymbol: target.symbol,
      });
    }
  };

  // Theme & Appearance State from Global Context Provider
  const {
    themeSettings,
    updateThemeMode,
    updateAccent,
    toggleSound,
    updateSoundVolume
  } = useTheme();

  const handleThemeModeChange = (mode: ThemeMode) => {
    playToggleSound(true);
    updateThemeMode(mode);
    triggerAutoSave();
  };

  const handleAccentChange = (accent: AccentScheme) => {
    playClickSound();
    updateAccent(accent);
    triggerAutoSave();
  };

  const handleSoundToggle = (enabled: boolean) => {
    playToggleSound(enabled);
    toggleSound(enabled);
    triggerAutoSave();
  };

  // Video Settings state
  const [videoConfig, setVideoConfig] = useState<VideoConferenceSettings>(() => {
    const saved = localStorage.getItem('paint_sync_video_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return initialVideoSettings || DEFAULT_VIDEO_SETTINGS;
  });

  const handleVideoConfigUpdate = (newConfig: VideoConferenceSettings) => {
    setVideoConfig(newConfig);
    localStorage.setItem('paint_sync_video_settings', JSON.stringify(newConfig));
    if (onUpdateVideoSettings) onUpdateVideoSettings(newConfig);
    triggerAutoSave();
  };

  // UI Toast feedback
  const [copiedIdToast, setCopiedIdToast] = useState(false);

  // Permission statuses
  const [cameraStatus, setCameraStatus] = useState<PermissionStateStatus>('checking');
  const [geoStatus, setGeoStatus] = useState<PermissionStateStatus>('checking');
  const [micStatus, setMicStatus] = useState<PermissionStateStatus>('checking');
  const [storageStatus, setStorageStatus] = useState<string>('checking');

  // Invoking status
  const [isInvokingAll, setIsInvokingAll] = useState(false);
  const [invokeMessage, setInvokeMessage] = useState<string | null>(null);

  // Live Camera Test states
  const [isTestingCamera, setIsTestingCamera] = useState(false);
  const [cameraResolution, setCameraResolution] = useState<{ width: number; height: number } | null>(null);
  const [cameraFps, setCameraFps] = useState<number | null>(null);
  const [cameraTestError, setCameraTestError] = useState<string | null>(null);
  const testVideoRef = useRef<HTMLVideoElement | null>(null);
  const testStreamRef = useRef<MediaStream | null>(null);

  // Geolocation states
  const [geoCoords, setGeoCoords] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: number;
  } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isFetchingGeo, setIsFetchingGeo] = useState(false);

  // Storage Stats
  const [storageQuota, setStorageQuota] = useState<{ usedMb: number; quotaMb: number } | null>(null);

  // Reload settings on open
  useEffect(() => {
    if (isOpen) {
      setProfile(getStoredUserProfile());
      setLocalization(getStoredLocalization());
      checkAllPermissions();
    } else {
      stopCameraTest();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleLocUpdate = (e: CustomEvent<LocalizationSettings>) => {
      if (e.detail) {
        setLocalization(e.detail);
      }
    };
    window.addEventListener('paint_sync_localization_updated', handleLocUpdate as EventListener);
    return () => {
      window.removeEventListener('paint_sync_localization_updated', handleLocUpdate as EventListener);
    };
  }, []);

  const handleTabChange = (tab: typeof activeTab) => {
    playTabSound();
    setActiveTab(tab);
    setIsNavDropdownOpen(false);
  };

  const checkAllPermissions = async () => {
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const camPerm = await navigator.permissions.query({ name: 'camera' as any });
        setCameraStatus(camPerm.state as PermissionStateStatus);
      } catch {
        setCameraStatus('prompt');
      }

      try {
        const geoPerm = await navigator.permissions.query({ name: 'geolocation' as any });
        setGeoStatus(geoPerm.state as PermissionStateStatus);
      } catch {
        setGeoStatus('prompt');
      }

      try {
        const micPerm = await navigator.permissions.query({ name: 'microphone' as any });
        setMicStatus(micPerm.state as PermissionStateStatus);
      } catch {
        setMicStatus('prompt');
      }
    } else {
      setCameraStatus('prompt');
      setGeoStatus('prompt');
      setMicStatus('prompt');
    }

    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const usedMb = estimate.usage ? Math.round((estimate.usage / (1024 * 1024)) * 10) / 10 : 0;
        const quotaMb = estimate.quota ? Math.round(estimate.quota / (1024 * 1024)) : 0;
        setStorageQuota({ usedMb, quotaMb });
        setStorageStatus('active');
      } catch {
        setStorageStatus('available');
      }
    }
  };

  const handleInvokeAllPermissions = async () => {
    playClickSound();
    setIsInvokingAll(true);
    setInvokeMessage(null);
    let successCount = 0;

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stream.getTracks().forEach((t) => t.stop());
        setCameraStatus('granted');
        setMicStatus('granted');
        successCount += 2;
      }
    } catch {
      setCameraStatus('denied');
      setMicStatus('denied');
    }

    if (navigator.geolocation) {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => {
            setGeoStatus('granted');
            successCount++;
            resolve();
          },
          () => {
            setGeoStatus('denied');
            resolve();
          },
          { timeout: 5000 }
        );
      });
    }

    setIsInvokingAll(false);
    playSuccessSound();
    setInvokeMessage(`Hardware permission diagnostics successfully completed (${successCount} sensor streams active).`);
    checkAllPermissions();
  };

  const startCameraTest = async () => {
    playClickSound();
    setCameraTestError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      testStreamRef.current = stream;
      if (testVideoRef.current) {
        testVideoRef.current.srcObject = stream;
      }
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      setCameraResolution({ width: settings.width || 1280, height: settings.height || 720 });
      setCameraFps(settings.frameRate || 30);
      setIsTestingCamera(true);
    } catch (err: any) {
      setCameraTestError(err.message || 'Unable to access camera hardware.');
    }
  };

  const stopCameraTest = () => {
    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach((t) => t.stop());
      testStreamRef.current = null;
    }
    if (testVideoRef.current) {
      testVideoRef.current.srcObject = null;
    }
    setIsTestingCamera(false);
  };

  const fetchCurrentLocation = () => {
    playClickSound();
    setIsFetchingGeo(true);
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation API is not supported.');
      setIsFetchingGeo(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
        setGeoStatus('granted');
        setIsFetchingGeo(false);
      },
      (err) => {
        setGeoError(err.message);
        setGeoStatus('denied');
        setIsFetchingGeo(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (!isOpen) return null;

  const currentNavItem = NAVIGATION_ITEMS.find((item) => item.id === activeTab) || NAVIGATION_ITEMS[0];
  const CurrentNavIcon = currentNavItem.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs font-sans hardware-accelerated">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`bg-slate-950 border border-slate-800 rounded-2xl w-full ${
            isPinned ? 'max-w-none h-full rounded-none' : 'max-w-5xl max-h-[92vh]'
          } flex flex-col shadow-2xl overflow-hidden transition-all duration-300`}
        >
          {/* Streamlined Top Header */}
          <div className="p-3 sm:p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 w-full max-w-full overflow-hidden">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md shrink-0">
                <Settings2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xs sm:text-sm font-bold text-white font-mono tracking-wide truncate sm:whitespace-normal">
                  Advanced Settings & Configurations
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {autoSaveStatus === 'saving' ? 'Auto-saving...' : 'Auto-saved ✓'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Pin & Expand Button */}
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setIsPinned(!isPinned);
                }}
                className={`p-1.5 sm:p-2 rounded-xl border transition-colors shrink-0 ${
                  isPinned
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                }`}
                title={isPinned ? 'Unpin / Normal Modal' : 'Pin & Expand Settings Panel'}
              >
                {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  if (onMinimize) onMinimize();
                  else onClose();
                }}
                className="p-1.5 sm:p-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 hover:text-white border border-indigo-500/40 transition-colors shrink-0"
                title="Minimize to Floating Tiny Icon"
              >
                <Minimize2 className="w-4 h-4 text-indigo-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onClose();
                }}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0"
                title="Close Settings"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Responsive Navigation Bar with Hamburger / Dropdown & Icon Tabs */}
          <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
            {/* Mobile / Compact Hamburger Dropdown Toggle */}
            <div className="relative md:hidden w-full">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setIsNavDropdownOpen(!isNavDropdownOpen);
                }}
                className="w-full flex items-center justify-between px-3 py-2 bg-slate-950 border border-indigo-500/40 rounded-xl text-white font-mono text-xs font-bold shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <CurrentNavIcon className="w-4 h-4 text-indigo-400" />
                  <span>{currentNavItem.label}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isNavDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isNavDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-1.5 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-900"
                  >
                    {NAVIGATION_ITEMS.map((item) => {
                      const IconComponent = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleTabChange(item.id as any)}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors font-mono text-xs ${
                            isActive
                              ? 'bg-indigo-950/80 text-indigo-300 font-bold border-l-2 border-indigo-500'
                              : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                          }`}
                        >
                          <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                          <div className="min-w-0">
                            <div className="truncate">{item.label}</div>
                            <div className="text-[9px] text-slate-500 font-sans truncate">{item.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop / Tablet Icon Tab Pills */}
            <div className="hidden md:flex items-center gap-1.5 overflow-x-auto w-full smooth-scroll">
              {NAVIGATION_ITEMS.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabChange(item.id as any)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all border whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/50 shadow-md shadow-indigo-950/50'
                        : 'bg-slate-950/60 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Main Content Area with max-h and clean padding */}
          <div className="p-3 sm:p-5 overflow-y-auto flex-1 text-xs space-y-4 smooth-scroll hardware-accelerated max-h-[75vh] sm:max-h-[80vh]">
            
            {/* =========================================================================
                TAB 1: USER PROFILE & ORGANIZATION
               ========================================================================= */}
            {activeTab === 'profile' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Profile Summary Card */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative group shrink-0">
                      <div className="w-14 h-14 rounded-xl object-cover border-2 border-indigo-500 shadow-md bg-slate-800 flex items-center justify-center text-indigo-300 font-bold text-lg">
                        {profile.profilePicture ? (
                          <img src={profile.profilePicture} alt={profile.userName} className="w-full h-full rounded-xl object-cover" />
                        ) : (
                          <User className="w-7 h-7 text-indigo-400" />
                        )}
                      </div>
                      <label
                        htmlFor="avatar-upload-input"
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center rounded-xl cursor-pointer transition-opacity text-white text-[9px] font-mono"
                      >
                        <Upload className="w-3.5 h-3.5 mb-0.5" />
                        <span>Change</span>
                      </label>
                      <input
                        id="avatar-upload-input"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileUpload}
                        className="hidden"
                      />
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white font-mono truncate">{profile.userName || 'User Name'}</h3>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-mono font-semibold border border-indigo-500/30 shrink-0">
                          {profile.position || 'Field Operations'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium truncate">
                        {profile.jobTitle || 'Lead Surface Engineer'} • {profile.department || 'Formulation Division'}
                      </p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-2 font-mono flex-wrap">
                        <span>{profile.email}</span>
                        <span>•</span>
                        <span>{profile.phone}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0 w-full md:w-auto">
                    <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-[10px] w-full md:w-auto justify-between md:justify-start">
                      <span className="text-slate-400">App ID:</span>
                      <strong className="text-indigo-300 font-bold">{profile.applicationId}</strong>
                      <button
                        type="button"
                        onClick={handleCopyAppId}
                        title="Copy Application ID"
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={handleRegenerateAppId}
                        title="Generate new Application ID"
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-300 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>
                    <AnimatePresence>
                      {copiedIdToast && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, y: -6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.85, y: -4, transition: { duration: 0.2 } }}
                          className="text-[9px] font-mono text-emerald-300 bg-emerald-950/90 px-2 py-0.5 rounded-lg border border-emerald-500/40 flex items-center gap-1"
                        >
                          <span>✓ Copied to clipboard!</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Personal Credentials Card with Leading SVG Icons on All Inputs */}
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                    <User className="w-4 h-4 text-indigo-400" />
                    <span>Personal Profile & Credentials</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Full User Name</label>
                      <div className="relative">
                        <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={profile.userName}
                          onChange={(e) => handleProfileFieldChange('userName', e.target.value)}
                          placeholder="e.g. Dr. Elena Rostova"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Job Title</label>
                      <div className="relative">
                        <Award className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={profile.jobTitle}
                          onChange={(e) => handleProfileFieldChange('jobTitle', e.target.value)}
                          placeholder="e.g. Lead Surface Engineer"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Role Position</label>
                      <div className="relative">
                        <Sliders className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={profile.position}
                          onChange={(e) => handleProfileFieldChange('position', e.target.value)}
                          placeholder="e.g. Senior Director"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Department</label>
                      <div className="relative">
                        <Layers className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={profile.department}
                          onChange={(e) => handleProfileFieldChange('department', e.target.value)}
                          placeholder="e.g. Advanced Polymers"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) => handleProfileFieldChange('email', e.target.value)}
                          placeholder="e.g. elena@apexcoatings.com"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Direct Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={profile.phone}
                          onChange={(e) => handleProfileFieldChange('phone', e.target.value)}
                          placeholder="e.g. +1 (555) 839-2041"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Accreditations & Certifications</label>
                      <div className="relative">
                        <FileCheck className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={profile.certifications}
                          onChange={(e) => handleProfileFieldChange('certifications', e.target.value)}
                          placeholder="e.g. NACE Level 3 (#94821) • SSPC C-1"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Field Dispatch Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={profile.fieldDispatchPhone}
                          onChange={(e) => handleProfileFieldChange('fieldDispatchPhone', e.target.value)}
                          placeholder="e.g. +1 (555) 839-4400"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Branding Card with Leading SVG Icons on All Inputs */}
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    <span>Company Branding & Address</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Company Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={profile.company.name}
                          onChange={(e) => handleCompanyFieldChange('name', e.target.value)}
                          placeholder="e.g. Apex Industrial Coating Solutions"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Registration / VAT No.</label>
                      <div className="relative">
                        <FileSignature className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={profile.company.legalRegistration}
                          onChange={(e) => handleCompanyFieldChange('legalRegistration', e.target.value)}
                          placeholder="e.g. VAT: #EU-93821094"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Website URL</label>
                      <div className="relative">
                        <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={profile.company.website}
                          onChange={(e) => handleCompanyFieldChange('website', e.target.value)}
                          placeholder="e.g. https://apexcoatings.com"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Street Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={profile.company.address}
                          onChange={(e) => handleCompanyFieldChange('address', e.target.value)}
                          placeholder="e.g. 742 Evergreen Industrial Park, Suite 400"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">City, State, Zip & Country</label>
                      <div className="relative">
                        <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={profile.company.cityStateZip}
                          onChange={(e) => handleCompanyFieldChange('cityStateZip', e.target.value)}
                          placeholder="e.g. Chicago, IL 60611, USA"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 2: LOCALIZATION & CURRENCY
               ========================================================================= */}
            {activeTab === 'localization' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Geolocation Auto-Calibration & Revert Card */}
                <div className="p-3.5 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/30 rounded-xl border border-emerald-500/40 space-y-2.5 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                          Startup Device Location Calibration
                        </h4>
                        <p className="text-[10px] text-slate-300 font-sans">
                          Auto-calibrates currency and measurement metrics based on your physical location.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {getPreCalibrationBackup() && (
                        <button
                          type="button"
                          id="settings-revert-calibration-btn"
                          onClick={() => {
                            playClickSound();
                            revertLocationCalibration();
                            setLocalization(getStoredLocalization());
                          }}
                          className="interactive-control inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[10px] font-mono font-bold uppercase transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                          <RotateCcw className="w-3 h-3 text-amber-300" />
                          <span>Revert Previous</span>
                        </button>
                      )}

                      <button
                        type="button"
                        id="settings-recalibrate-btn"
                        onClick={async () => {
                          playClickSound();
                          await checkDeviceLocationAndCalibrate({ force: true });
                          setLocalization(getStoredLocalization());
                        }}
                        className="interactive-control inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-mono font-bold uppercase transition-all shadow-xs cursor-pointer active:scale-95"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Calibrate Now</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-300 pt-0.5">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">Active Currency:</span>
                      <span className="font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                        {localization.currencyCode} ({localization.currencySymbol})
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">Measurement Metrics:</span>
                      <span className="font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30 uppercase">
                        {localization.unitSystem === 'metric' ? 'Metric (m², Liters, kg, °C)' : 'Imperial (sq ft, Gal, lbs, °F)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Currency Selection Grid Card */}
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>Currency & Formatting System</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">Appears across all estimates & invoices</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {SUPPORTED_CURRENCIES.map((curr) => (
                      <button
                        key={curr.code}
                        type="button"
                        onClick={() => handleCurrencySelect(curr.code)}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          localization.currencyCode === curr.code
                            ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-sm'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono">
                          <span className="font-bold text-xs">{curr.code}</span>
                          <span className="text-emerald-400 font-bold">{curr.symbol}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{curr.name}</div>
                      </button>
                    ))}
                  </div>

                  {/* Decimal & Position */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Symbol Position</label>
                      <select
                        value={localization.currencyPosition}
                        onChange={(e) => handleLocalizationUpdate({ ...localization, currencyPosition: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="prefix">Prefix (e.g. $1,250.00)</option>
                        <option value="suffix">Suffix (e.g. 1,250.00 $)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Decimal Places</label>
                      <select
                        value={localization.decimalPlaces}
                        onChange={(e) => handleLocalizationUpdate({ ...localization, decimalPlaces: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="0">0 Decimals ($1,250)</option>
                        <option value="2">2 Decimals ($1,250.00)</option>
                        <option value="3">3 Decimals ($1,250.000)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Sample Price Output</label>
                      <div className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-emerald-400 font-bold text-center">
                        {formatLocalizedCurrency(2450.75, localization)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Units & Measurements Card with Leading Icons */}
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Unit System & Default Markup Rates</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Unit System</label>
                      <select
                        value={localization.unitSystem}
                        onChange={(e) => handleLocalizationUpdate({ ...localization, unitSystem: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="imperial">Imperial (sq ft, Gallons, lbs)</option>
                        <option value="metric">Metric (m², Liters, kg)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Default Tax Rate (%)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="number"
                          step="0.1"
                          value={localization.defaultTaxRate}
                          onChange={(e) => handleLocalizationUpdate({ ...localization, defaultTaxRate: Number(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Default Margin (%)</label>
                      <div className="relative">
                        <Sliders className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="number"
                          step="0.5"
                          value={localization.defaultMarginRate}
                          onChange={(e) => handleLocalizationUpdate({ ...localization, defaultMarginRate: Number(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Default Contingency (%)</label>
                      <div className="relative">
                        <Shield className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="number"
                          step="0.5"
                          value={localization.defaultContingencyRate}
                          onChange={(e) => handleLocalizationUpdate({ ...localization, defaultContingencyRate: Number(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 3: THEME & APPEARANCE (Dark/Light + Accents + Sound FX)
               ========================================================================= */}
            {activeTab === 'theme' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Color Scheme Mode Card */}
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Palette className="w-4 h-4 text-indigo-400" />
                    <span>Color Mode (Dark / Light Theme Engine)</span>
                  </h4>

                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => handleThemeModeChange('dark')}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                        themeSettings.mode === 'dark'
                          ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Moon className="w-5 h-5 text-indigo-400" />
                      <span className="font-mono text-xs font-bold">Dark Mode</span>
                      <span className="text-[9px] text-slate-400">Eye-safe factory darkness</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleThemeModeChange('light')}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                        themeSettings.mode === 'light'
                          ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Sun className="w-5 h-5 text-amber-400" />
                      <span className="font-mono text-xs font-bold">Light Mode</span>
                      <span className="text-[9px] text-slate-400">Outdoor daylight readability</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleThemeModeChange('system')}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                        themeSettings.mode === 'system'
                          ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Monitor className="w-5 h-5 text-sky-400" />
                      <span className="font-mono text-xs font-bold">System Auto</span>
                      <span className="text-[9px] text-slate-400">Follow OS device preference</span>
                    </button>
                  </div>
                </div>

                {/* Accent Color Preset Selector Card */}
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Accent Color Schemes & Visual Personality</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {ACCENT_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleAccentChange(preset.id)}
                        className={`p-2.5 rounded-xl border flex items-center gap-3 text-left transition-all ${
                          themeSettings.accent === preset.id
                            ? 'bg-slate-950 border-indigo-500 text-white shadow-md'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-full shrink-0 shadow-sm border border-white/20 flex items-center justify-center"
                          style={{ backgroundColor: preset.colorHex }}
                        >
                          {themeSettings.accent === preset.id && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-mono font-bold text-xs text-white truncate">{preset.name}</div>
                          <div className="text-[9px] text-slate-400 truncate">{preset.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sound FX & Audio Feedback Card */}
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-indigo-400" />
                      <span>Non-Intrusive Audio Feedback & Web Audio Synthesizer</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => playSuccessSound()}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 font-mono text-[10px] font-bold transition-all"
                    >
                      Test Sound
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer">
                      <div className="flex items-center gap-2">
                        {themeSettings.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                        <div>
                          <div className="font-mono text-xs font-bold text-white">UI Sound Effects</div>
                          <div className="text-[10px] text-slate-400">Micro-clicks, toggle chimes, & success tones</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={themeSettings.soundEnabled}
                        onChange={(e) => handleSoundToggle(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                      />
                    </label>

                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Sound Volume</span>
                        <span>{Math.round(themeSettings.soundVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={themeSettings.soundVolume}
                        onChange={(e) => {
                          updateSoundVolume(Number(e.target.value));
                        }}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 4: SYSTEM HARDWARE & PERMISSIONS
               ========================================================================= */}
            {activeTab === 'permissions' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Permission Invoker Banner */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                  <div>
                    <h3 className="font-mono font-bold text-white text-xs uppercase flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <span>Hardware Sensor Diagnostic & Master Permission Invoker</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Activate camera, microphone, GPS, and offline storage permissions for seamless field operation
                    </p>
                  </div>

                  <button
                    id="invoke-all-permissions-btn"
                    type="button"
                    onClick={handleInvokeAllPermissions}
                    disabled={isInvokingAll}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition-all shadow-md flex items-center gap-2 whitespace-nowrap min-w-fit shrink-0 disabled:opacity-50"
                  >
                    {isInvokingAll ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-300" />}
                    <span>{isInvokingAll ? 'Invoking Sensors...' : 'Invoke Hardware Permissions'}</span>
                  </button>
                </div>

                <AnimatePresence>
                  {invokeMessage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: -8, transition: { duration: 0.22 } }}
                      onClick={() => setInvokeMessage(null)}
                      className="p-2.5 rounded-xl bg-indigo-950/90 border border-indigo-500/50 text-indigo-200 font-mono text-xs flex items-center justify-between cursor-pointer shadow-md select-none"
                    >
                      <span>✓ {invokeMessage}</span>
                      <span className="text-[9px] text-indigo-300 bg-indigo-900/80 px-2 py-0.5 rounded-lg border border-indigo-400/40 shrink-0">
                        Tap to dismiss
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Status Badges Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-indigo-400" />
                      <span className="font-mono text-xs font-bold text-white">Camera</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      cameraStatus === 'granted' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {cameraStatus}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      <span className="font-mono text-xs font-bold text-white">GPS GNSS</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      geoStatus === 'granted' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {geoStatus}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-sky-400" />
                      <span className="font-mono text-xs font-bold text-white">Audio Mic</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      micStatus === 'granted' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {micStatus}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-purple-400" />
                      <span className="font-mono text-xs font-bold text-white">IndexedDB</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {storageQuota ? `${storageQuota.usedMb} MB` : 'Active'}
                    </span>
                  </div>
                </div>

                {/* Camera Hardware Diagnostic */}
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-indigo-400" />
                      <span className="font-mono font-bold text-white text-xs uppercase">Live Camera Hardware Diagnostic</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isTestingCamera ? (
                        <button
                          type="button"
                          onClick={stopCameraTest}
                          className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-mono text-[11px] font-bold transition-colors"
                        >
                          Stop Stream
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={startCameraTest}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-mono text-[11px] font-bold transition-colors"
                        >
                          Start Video Test
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="relative aspect-[16/9] max-h-48 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center text-slate-500 font-mono text-xs">
                    <video
                      ref={testVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${isTestingCamera ? 'block' : 'hidden'}`}
                    />
                    {!isTestingCamera && (
                      <div className="text-center p-4">
                        <p className="text-slate-400">Camera feed standby. Click "Start Video Test" to verify WebRTC resolution & FPS.</p>
                      </div>
                    )}
                    {isTestingCamera && cameraResolution && (
                      <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/80 border border-slate-700 text-emerald-400 font-mono text-[10px]">
                        {cameraResolution.width}x{cameraResolution.height} @ {cameraFps} FPS
                      </div>
                    )}
                  </div>
                </div>

                {/* GPS Sensor Diagnostic */}
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      <span className="font-mono font-bold text-white text-xs uppercase">Live GNSS Geolocation Sensor Fix</span>
                    </div>
                    <button
                      type="button"
                      onClick={fetchCurrentLocation}
                      disabled={isFetchingGeo}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-mono text-[11px] font-bold transition-colors disabled:opacity-50"
                    >
                      {isFetchingGeo ? 'Acquiring...' : 'Fetch Live GPS Fix'}
                    </button>
                  </div>

                  {geoCoords ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                      <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Latitude</span>
                        <strong className="text-indigo-300">{geoCoords.lat.toFixed(6)}°</strong>
                      </div>
                      <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Longitude</span>
                        <strong className="text-indigo-300">{geoCoords.lng.toFixed(6)}°</strong>
                      </div>
                      <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">GPS Accuracy</span>
                        <strong className="text-emerald-400">±{Math.round(geoCoords.accuracy)} meters</strong>
                      </div>
                      <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Timestamp</span>
                        <span className="text-slate-300">{new Date(geoCoords.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-slate-400 font-mono text-xs">
                      No GPS coordinates recorded yet. Click "Fetch Live GPS Fix" to poll browser hardware.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 5: VIDEO CONFERENCING ENGINE
               ========================================================================= */}
            {activeTab === 'video_engine' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-mono font-bold text-white text-xs uppercase flex items-center gap-2">
                      <Video className="w-4 h-4 text-indigo-400" />
                      <span>Full-Duplex WebRTC Video Engine Parameters</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Configure WebRTC target resolutions, frame rates, and acoustic noise suppression filters
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Resolution & FPS Card */}
                  <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-3 shadow-sm">
                    <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                      <Monitor className="w-4 h-4 text-indigo-400" />
                      <span>Resolution & Frame Rate</span>
                    </h4>

                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 mb-1">Target Resolution</label>
                        <select
                          value={videoConfig.resolution}
                          onChange={(e) => handleVideoConfigUpdate({ ...videoConfig, resolution: e.target.value as any })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        >
                          <option value="480p">480p SD (Low Bandwidth / 3G)</option>
                          <option value="720p">720p HD (Balanced Field Standard)</option>
                          <option value="1080p">1080p Full HD (High Quality)</option>
                          <option value="4k">4K Ultra HD (Laboratory Telemetry)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 mb-1">Frame Rate</label>
                        <select
                          value={videoConfig.frameRate}
                          onChange={(e) => handleVideoConfigUpdate({ ...videoConfig, frameRate: Number(e.target.value) as any })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        >
                          <option value="15">15 FPS (Conserve Battery & Data)</option>
                          <option value="24">24 FPS (Cinematic / Standard)</option>
                          <option value="30">30 FPS (Smooth Field Video)</option>
                          <option value="60">60 FPS (High-Speed Mixer Inspection)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 mb-1">Preferred Codec</label>
                        <select
                          value={videoConfig.preferredCodec}
                          onChange={(e) => handleVideoConfigUpdate({ ...videoConfig, preferredCodec: e.target.value as any })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        >
                          <option value="VP8">VP8 (Broad Compatibility)</option>
                          <option value="VP9">VP9 (High Efficiency)</option>
                          <option value="H264">H.264 (Hardware Accelerated)</option>
                          <option value="AV1">AV1 (Next-Gen Ultra Compression)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Audio Noise Suppression Card */}
                  <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-3 shadow-sm">
                    <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                      <span>Acoustic & Noise Suppression</span>
                    </h4>

                    <div className="space-y-2">
                      <label className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer">
                        <span className="text-xs text-slate-300 font-mono">Echo Cancellation</span>
                        <input
                          type="checkbox"
                          checked={videoConfig.echoCancellation}
                          onChange={(e) => handleVideoConfigUpdate({ ...videoConfig, echoCancellation: e.target.checked })}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer">
                        <span className="text-xs text-slate-300 font-mono">Factory Noise Suppression</span>
                        <input
                          type="checkbox"
                          checked={videoConfig.noiseSuppression}
                          onChange={(e) => handleVideoConfigUpdate({ ...videoConfig, noiseSuppression: e.target.checked })}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer">
                        <span className="text-xs text-slate-300 font-mono">Auto Gain Control</span>
                        <input
                          type="checkbox"
                          checked={videoConfig.autoGainControl}
                          onChange={(e) => handleVideoConfigUpdate({ ...videoConfig, autoGainControl: e.target.checked })}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer">
                        <span className="text-xs text-slate-300 font-mono">Full-Duplex Audio Engine</span>
                        <input
                          type="checkbox"
                          checked={videoConfig.fullDuplexAudio}
                          onChange={(e) => handleVideoConfigUpdate({ ...videoConfig, fullDuplexAudio: e.target.checked })}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Clean Streamlined Footer */}
          <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2.5 shrink-0">
            <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 truncate">
              User: <strong className="text-indigo-300">{profile.userName}</strong> • App ID: <strong className="text-white">{profile.applicationId}</strong>
            </div>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors whitespace-nowrap"
            >
              Close Console
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
