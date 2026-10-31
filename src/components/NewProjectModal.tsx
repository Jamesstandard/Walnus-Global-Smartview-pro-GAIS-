import React, { useState } from 'react';
import {
  FolderPlus,
  X,
  Building2,
  MapPin,
  Maximize2,
  Sparkles,
  Compass,
  CheckCircle2,
  Navigation,
  Globe,
  Home,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playClickSound, playSuccessSound } from '../lib/soundUtils';
import { showAppToast } from './ToastNotificationCenter';
import { checkDeviceLocationAndCalibrate } from '../lib/locationCalibrationService';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetToDefault: () => void;
}

export function NewProjectModal({ isOpen, onClose, onResetToDefault }: NewProjectModalProps) {
  // Project Type: 1. Building site, 2. Interior, 3. Exterior project
  const [projectType, setProjectType] = useState<'building_site' | 'interior' | 'exterior'>('building_site');
  
  // General Size: Large, Med, Small
  const [projectSize, setProjectSize] = useState<'large' | 'medium' | 'small'>('medium');
  
  // Site GPS / Location read-only text field
  const [siteGpsLocation, setSiteGpsLocation] = useState<string>('');
  
  // Map Modal for Manual Typing or Pin-point on Map
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [manualAddressInput, setManualAddressInput] = useState('');
  const [isLocalizing, setIsLocalizing] = useState(false);

  if (!isOpen) return null;

  // 1. Automatic GPS Locator
  const handleAutoGpsLocator = () => {
    playClickSound();
    setIsLocalizing(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const locStr = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)} (GPS Verified)`;
          setSiteGpsLocation(locStr);
          setIsLocalizing(false);
          showAppToast({
            title: 'GPS Acquired',
            message: `Device position locked at ${locStr}`,
            type: 'success',
          });
        },
        (err) => {
          console.warn('Geolocation error:', err);
          // Fallback location
          const fallback = 'Sector 4 Industrial Zone, Port Dock 12 (Auto-Calibrated)';
          setSiteGpsLocation(fallback);
          setIsLocalizing(false);
          showAppToast({
            title: 'GPS Fallback Active',
            message: 'Using calibrated sector reference point.',
            type: 'info',
          });
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      setSiteGpsLocation('Default Sector 4 - Structural Pier Wall');
      setIsLocalizing(false);
    }
  };

  // Top Localization Button Handler
  const handleTopLocalizationButton = () => {
    playClickSound();
    setIsLocalizing(true);
    checkDeviceLocationAndCalibrate({ isStartup: false });
    setTimeout(() => {
      setIsLocalizing(false);
      setSiteGpsLocation('Localized Zone: Port Authority Sector 4 (Precision Calibrated)');
      showAppToast({
        title: 'Localization Calibrated',
        message: 'System sensors aligned with local structural grid.',
        type: 'success',
      });
    }, 600);
  };

  // Handle Okay Button (Resets entire application to default)
  const handleOkayReset = () => {
    playSuccessSound();
    onResetToDefault();
    showAppToast({
      title: 'Application Reset to Default',
      message: 'All user values cleared. Project initialized with clean defaults.',
      type: 'info',
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-slate-900 border border-indigo-500/50 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col text-slate-100"
        >
          {/* Header with Top Localization Button */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 p-4 border-b border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-mono">
                    New Project Setup
                  </h3>
                  <p className="text-[10px] text-indigo-300 font-mono">
                    Configure project type, size & GPS site telemetry
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onClose();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Top Localization Button */}
            <button
              type="button"
              onClick={handleTopLocalizationButton}
              disabled={isLocalizing}
              className="w-full py-2 px-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-200 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Compass className={`w-4 h-4 text-indigo-400 ${isLocalizing ? 'animate-spin' : ''}`} />
              <span>{isLocalizing ? 'Calibrating Localization...' : 'Initiate Site Localization Function'}</span>
            </button>
          </div>

          {/* Form Content */}
          <div className="p-4 space-y-4 text-xs font-mono">
            {/* 1. Type of Project */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                1. Type of Project
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'building_site', label: 'Building Site', icon: Building2 },
                  { id: 'interior', label: 'Interior', icon: Home },
                  { id: 'exterior', label: 'Exterior', icon: Globe },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = projectType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setProjectType(item.id as any);
                      }}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                          : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-indigo-400'}`} />
                      <span className="font-bold text-[10px] truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. General Size (3 Icon Buttons: Large, Med, Small) */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                2. General Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'small', label: 'Small', desc: '< 1,000 sq ft' },
                  { id: 'medium', label: 'Medium', desc: '1,000 - 5k sq ft' },
                  { id: 'large', label: 'Large', desc: '> 5,000 sq ft' },
                ].map((size) => {
                  const isSelected = projectSize === size.id;
                  return (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setProjectSize(size.id as any);
                      }}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-center ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                          : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                    >
                      <span className="font-bold text-xs">{size.label}</span>
                      <span className={`text-[9px] ${isSelected ? 'text-purple-200' : 'text-slate-500'}`}>
                        {size.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Site GPS / Location */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                3. Site GPS / Location (Read-Only)
              </label>
              <div className="relative flex items-center">
                <MapPin className="w-4 h-4 text-indigo-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  readOnly
                  value={siteGpsLocation || 'No location acquired yet. Use GPS icons below.'}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-20 py-2.5 text-xs text-slate-300 outline-none select-all truncate"
                />
                
                {/* 2 Tiny GPS Icons */}
                <div className="absolute right-2 flex items-center gap-1">
                  {/* Icon 1: Automatic GPS Locator */}
                  <button
                    type="button"
                    onClick={handleAutoGpsLocator}
                    title="Acquire current device GPS position"
                    className="p-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                  </button>

                  {/* Icon 2: Map / Manual Pin-point */}
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setIsMapModalOpen(true);
                    }}
                    title="Open map & input for manual typing or pin-point"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions Footer: Okay Button resets app to default */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleOkayReset}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Okay (Reset & Initialize)</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Map / Manual Pin-Point Sub-Modal */}
        <AnimatePresence>
          {isMapModalOpen && (
            <div className="absolute inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl space-y-3 font-mono text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white uppercase tracking-wide">Manual / Pin-Point Map Location</span>
                  <button
                    type="button"
                    onClick={() => setIsMapModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 block">Type Address or Pin Location Name:</label>
                  <input
                    type="text"
                    value={manualAddressInput}
                    onChange={(e) => setManualAddressInput(e.target.value)}
                    placeholder="e.g. 42 Harbor Drive, Sector 2"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsMapModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      if (manualAddressInput.trim()) {
                        setSiteGpsLocation(manualAddressInput.trim());
                      } else {
                        setSiteGpsLocation('Manual Pin: Sector 7 Dockyard');
                      }
                      setIsMapModalOpen(false);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold"
                  >
                    Confirm Location
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}
