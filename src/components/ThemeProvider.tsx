import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ThemeSettings,
  getStoredThemeSettings,
  saveStoredThemeSettings,
  applyThemeSettings,
  ThemeMode,
  AccentScheme,
  UIElevationMode
} from '../lib/themeEngine';

interface ThemeContextType {
  themeSettings: ThemeSettings;
  updateThemeMode: (mode: ThemeMode) => void;
  updateAccent: (accent: AccentScheme) => void;
  updateElevation: (elevation: UIElevationMode) => void;
  toggleSound: (enabled: boolean) => void;
  updateSoundVolume: (volume: number) => void;
  toggleReducedMotion: (enabled: boolean) => void;
  toggleCompactDensity: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(getStoredThemeSettings);

  useEffect(() => {
    // Apply on load/change
    applyThemeSettings(themeSettings);

    // Setup window system listener for live OS updates if in system mode
    const systemMedia = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = () => {
      if (themeSettings.mode === 'system') {
        applyThemeSettings(themeSettings);
      }
    };

    systemMedia.addEventListener('change', handleSystemThemeChange);
    return () => {
      systemMedia.removeEventListener('change', handleSystemThemeChange);
    };
  }, [themeSettings]);

  // Synchronize with external changes (e.g. from AdvancedSettingsPanel triggering dispatchEvent)
  useEffect(() => {
    const handleExternalThemeUpdate = (e: any) => {
      if (e.detail) {
        setThemeSettings(e.detail);
      }
    };
    window.addEventListener('paint_sync_theme_updated', handleExternalThemeUpdate);
    return () => {
      window.removeEventListener('paint_sync_theme_updated', handleExternalThemeUpdate);
    };
  }, []);

  const updateSettings = (newSettings: ThemeSettings) => {
    setThemeSettings(newSettings);
    saveStoredThemeSettings(newSettings);
  };

  const updateThemeMode = (mode: ThemeMode) => {
    updateSettings({ ...themeSettings, mode });
  };

  const updateAccent = (accent: AccentScheme) => {
    updateSettings({ ...themeSettings, accent });
  };

  const updateElevation = (elevation: UIElevationMode) => {
    updateSettings({ ...themeSettings, elevation });
  };

  const toggleSound = (soundEnabled: boolean) => {
    updateSettings({ ...themeSettings, soundEnabled });
  };

  const updateSoundVolume = (soundVolume: number) => {
    updateSettings({ ...themeSettings, soundVolume });
  };

  const toggleReducedMotion = (reducedMotion: boolean) => {
    updateSettings({ ...themeSettings, reducedMotion });
  };

  const toggleCompactDensity = (compactDensity: boolean) => {
    updateSettings({ ...themeSettings, compactDensity });
  };

  return (
    <ThemeContext.Provider
      value={{
        themeSettings,
        updateThemeMode,
        updateAccent,
        updateElevation,
        toggleSound,
        updateSoundVolume,
        toggleReducedMotion,
        toggleCompactDensity,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
