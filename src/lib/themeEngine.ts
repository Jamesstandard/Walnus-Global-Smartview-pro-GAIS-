export type ThemeMode = 'dark' | 'light' | 'system';
export type AccentScheme = 'emerald' | 'cyber' | 'indigo' | 'amber' | 'slate' | 'contrast';
export type UIElevationMode = 'subtle' | 'elevated' | 'flat';

export interface ThemeSettings {
  mode: ThemeMode;
  accent: AccentScheme;
  elevation: UIElevationMode;
  soundEnabled: boolean;
  soundVolume: number; // 0 to 1
  reducedMotion: boolean;
  compactDensity: boolean;
}

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  mode: 'dark',
  accent: 'indigo',
  elevation: 'elevated',
  soundEnabled: true,
  soundVolume: 0.6,
  reducedMotion: false,
  compactDensity: true,
};

export const ACCENT_PRESETS: {
  id: AccentScheme;
  name: string;
  colorHex: string;
  badgeBg: string;
  description: string;
}[] = [
  {
    id: 'indigo',
    name: 'Royal Indigo',
    colorHex: '#6366f1',
    badgeBg: 'bg-indigo-600',
    description: 'High-tech precision industrial theme',
  },
  {
    id: 'emerald',
    name: 'Emerald Industry',
    colorHex: '#10b981',
    badgeBg: 'bg-emerald-600',
    description: 'Eco-formulation & factory production theme',
  },
  {
    id: 'cyber',
    name: 'Cyber Blue',
    colorHex: '#3b82f6',
    badgeBg: 'bg-blue-600',
    description: 'Ultra-clear field engineering & GPS telemetry',
  },
  {
    id: 'amber',
    name: 'Amber Gold',
    colorHex: '#f59e0b',
    badgeBg: 'bg-amber-600',
    description: 'High visibility site inspection & alert theme',
  },
  {
    id: 'slate',
    name: 'Steel Slate',
    colorHex: '#64748b',
    badgeBg: 'bg-slate-600',
    description: 'Minimalist, low-distraction dark studio theme',
  },
  {
    id: 'contrast',
    name: 'High Contrast',
    colorHex: '#f43f5e',
    badgeBg: 'bg-rose-600',
    description: 'Maximum contrast for direct outdoor sunlight field work',
  },
];

const THEME_STORAGE_KEY = 'paint_sync_theme_settings_v2';

export function getStoredThemeSettings(): ThemeSettings {
  if (typeof window === 'undefined') return DEFAULT_THEME_SETTINGS;
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_THEME_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Failed to load theme settings:', e);
  }
  return DEFAULT_THEME_SETTINGS;
}

export function applyThemeSettings(settings: ThemeSettings): void {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;

  // 1. Light vs Dark
  let isDark = settings.mode === 'dark';
  if (settings.mode === 'system') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  if (isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }

  // 2. Accent Theme class
  const accentClasses = ['theme-indigo', 'theme-emerald', 'theme-cyber', 'theme-amber', 'theme-slate', 'theme-contrast'];
  accentClasses.forEach((cls) => root.classList.remove(cls));
  root.classList.add(`theme-${settings.accent}`);

  // 3. Compact density attribute
  if (settings.compactDensity) {
    root.setAttribute('data-density', 'compact');
  } else {
    root.removeAttribute('data-density');
  }

  // 4. Custom CSS Variables on Root for Dynamic Runtime Binding
  const selectedAccent = ACCENT_PRESETS.find((a) => a.id === settings.accent) || ACCENT_PRESETS[0];
  root.style.setProperty('--app-accent-hex', selectedAccent.colorHex);
}

export function saveStoredThemeSettings(settings: ThemeSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(settings));
    applyThemeSettings(settings);
    window.dispatchEvent(new CustomEvent('paint_sync_theme_updated', { detail: settings }));
  } catch (e) {
    console.error('Failed to save theme settings:', e);
  }
}
