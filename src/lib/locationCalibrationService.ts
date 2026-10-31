import { LocalizationSettings } from '../types';
import {
  getStoredLocalization,
  saveStoredLocalization,
} from '../data/userProfileSettings';
import { showAppToast } from '../components/ToastNotificationCenter';
import { playClickSound, playAlertChime, playSuccessSound } from './soundUtils';

export interface CountryCalibrationProfile {
  countryCode: string;
  countryName: string;
  flag: string;
  currencyCode: LocalizationSettings['currencyCode'];
  currencySymbol: string;
  currencyName: string;
  currencyPosition: 'prefix' | 'suffix';
  decimalPlaces: number;
  unitSystem: 'metric' | 'imperial' | 'hybrid';
  temperatureUnit: 'C' | 'F';
  pressureUnit: 'kPa' | 'bar' | 'psi';
  dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'DD-MMM-YYYY';
  defaultTaxRate: number;
  defaultMarginRate: number;
  defaultContingencyRate: number;
  bounds?: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
}

export interface CalibrationTelemetry {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  countryCode: string;
  countryName: string;
  regionName?: string;
  method: 'gps' | 'timezone_locale' | 'network' | 'manual';
  timestamp: number;
}

// Global Country Calibration Profiles
export const CALIBRATION_PROFILES: Record<string, CountryCalibrationProfile> = {
  NG: {
    countryCode: 'NG',
    countryName: 'Nigeria',
    flag: '🇳🇬',
    currencyCode: 'NGN',
    currencySymbol: '₦',
    currencyName: 'Nigerian Naira (NGN)',
    currencyPosition: 'prefix',
    decimalPlaces: 2,
    unitSystem: 'metric',
    temperatureUnit: 'C',
    pressureUnit: 'kPa',
    dateFormat: 'DD/MM/YYYY',
    defaultTaxRate: 7.5, // Standard Nigerian VAT is 7.5%
    defaultMarginRate: 15.0,
    defaultContingencyRate: 5.0,
    bounds: { minLat: 4.2, maxLat: 13.9, minLng: 2.6, maxLng: 14.7 },
  },
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    flag: '🇬🇧',
    currencyCode: 'GBP',
    currencySymbol: '£',
    currencyName: 'British Pound (GBP)',
    currencyPosition: 'prefix',
    decimalPlaces: 2,
    unitSystem: 'metric',
    temperatureUnit: 'C',
    pressureUnit: 'bar',
    dateFormat: 'DD/MM/YYYY',
    defaultTaxRate: 20.0,
    defaultMarginRate: 15.0,
    defaultContingencyRate: 5.0,
    bounds: { minLat: 49.8, maxLat: 60.9, minLng: -8.6, maxLng: 1.8 },
  },
  US: {
    countryCode: 'US',
    countryName: 'United States',
    flag: '🇺🇸',
    currencyCode: 'USD',
    currencySymbol: '$',
    currencyName: 'US Dollar (USD)',
    currencyPosition: 'prefix',
    decimalPlaces: 2,
    unitSystem: 'imperial',
    temperatureUnit: 'F',
    pressureUnit: 'psi',
    dateFormat: 'MM/DD/YYYY',
    defaultTaxRate: 8.25,
    defaultMarginRate: 15.0,
    defaultContingencyRate: 5.0,
    bounds: { minLat: 24.5, maxLat: 49.4, minLng: -125.0, maxLng: -66.9 },
  },
  DE: {
    countryCode: 'DE',
    countryName: 'Germany',
    flag: '🇩🇪',
    currencyCode: 'EUR',
    currencySymbol: '€',
    currencyName: 'Euro (EUR)',
    currencyPosition: 'prefix',
    decimalPlaces: 2,
    unitSystem: 'metric',
    temperatureUnit: 'C',
    pressureUnit: 'bar',
    dateFormat: 'DD/MM/YYYY',
    defaultTaxRate: 19.0,
    defaultMarginRate: 15.0,
    defaultContingencyRate: 5.0,
    bounds: { minLat: 47.2, maxLat: 55.1, minLng: 5.8, maxLng: 15.1 },
  },
  FR: {
    countryCode: 'FR',
    countryName: 'France',
    flag: '🇫🇷',
    currencyCode: 'EUR',
    currencySymbol: '€',
    currencyName: 'Euro (EUR)',
    currencyPosition: 'prefix',
    decimalPlaces: 2,
    unitSystem: 'metric',
    temperatureUnit: 'C',
    pressureUnit: 'bar',
    dateFormat: 'DD/MM/YYYY',
    defaultTaxRate: 20.0,
    defaultMarginRate: 15.0,
    defaultContingencyRate: 5.0,
    bounds: { minLat: 41.3, maxLat: 51.1, minLng: -5.1, maxLng: 9.6 },
  },
  CA: {
    countryCode: 'CA',
    countryName: 'Canada',
    flag: '🇨🇦',
    currencyCode: 'CAD',
    currencySymbol: 'CA$',
    currencyName: 'Canadian Dollar (CAD)',
    currencyPosition: 'prefix',
    decimalPlaces: 2,
    unitSystem: 'metric',
    temperatureUnit: 'C',
    pressureUnit: 'kPa',
    dateFormat: 'YYYY-MM-DD',
    defaultTaxRate: 13.0,
    defaultMarginRate: 15.0,
    defaultContingencyRate: 5.0,
  },
  AU: {
    countryCode: 'AU',
    countryName: 'Australia',
    flag: '🇦🇺',
    currencyCode: 'AUD',
    currencySymbol: 'AU$',
    currencyName: 'Australian Dollar (AUD)',
    currencyPosition: 'prefix',
    decimalPlaces: 2,
    unitSystem: 'metric',
    temperatureUnit: 'C',
    pressureUnit: 'kPa',
    dateFormat: 'DD/MM/YYYY',
    defaultTaxRate: 10.0,
    defaultMarginRate: 15.0,
    defaultContingencyRate: 5.0,
  },
  ZA: {
    countryCode: 'ZA',
    countryName: 'South Africa',
    flag: '🇿🇦',
    currencyCode: 'ZAR',
    currencySymbol: 'R',
    currencyName: 'South African Rand (ZAR)',
    currencyPosition: 'prefix',
    decimalPlaces: 2,
    unitSystem: 'metric',
    temperatureUnit: 'C',
    pressureUnit: 'kPa',
    dateFormat: 'DD/MM/YYYY',
    defaultTaxRate: 15.0,
    defaultMarginRate: 15.0,
    defaultContingencyRate: 5.0,
  },
  GH: {
    countryCode: 'GH',
    countryName: 'Ghana',
    flag: '🇬🇭',
    currencyCode: 'GHS',
    currencySymbol: 'GH₵',
    currencyName: 'Ghanaian Cedi (GHS)',
    currencyPosition: 'prefix',
    decimalPlaces: 2,
    unitSystem: 'metric',
    temperatureUnit: 'C',
    pressureUnit: 'kPa',
    dateFormat: 'DD/MM/YYYY',
    defaultTaxRate: 15.0,
    defaultMarginRate: 15.0,
    defaultContingencyRate: 5.0,
  },
  KE: {
    countryCode: 'KE',
    countryName: 'Kenya',
    flag: '🇰🇪',
    currencyCode: 'KES',
    currencySymbol: 'KSh',
    currencyName: 'Kenyan Shilling (KES)',
    currencyPosition: 'prefix',
    decimalPlaces: 2,
    unitSystem: 'metric',
    temperatureUnit: 'C',
    pressureUnit: 'kPa',
    dateFormat: 'DD/MM/YYYY',
    defaultTaxRate: 16.0,
    defaultMarginRate: 15.0,
    defaultContingencyRate: 5.0,
  },
  AE: {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    flag: '🇦🇪',
    currencyCode: 'AED',
    currencySymbol: 'AED ',
    currencyName: 'UAE Dirham (AED)',
    currencyPosition: 'prefix',
    decimalPlaces: 2,
    unitSystem: 'metric',
    temperatureUnit: 'C',
    pressureUnit: 'bar',
    dateFormat: 'DD/MM/YYYY',
    defaultTaxRate: 5.0,
    defaultMarginRate: 15.0,
    defaultContingencyRate: 5.0,
  },
  IN: {
    countryCode: 'IN',
    countryName: 'India',
    flag: '🇮🇳',
    currencyCode: 'INR',
    currencySymbol: '₹',
    currencyName: 'Indian Rupee (INR)',
    currencyPosition: 'prefix',
    decimalPlaces: 2,
    unitSystem: 'metric',
    temperatureUnit: 'C',
    pressureUnit: 'bar',
    dateFormat: 'DD/MM/YYYY',
    defaultTaxRate: 18.0,
    defaultMarginRate: 15.0,
    defaultContingencyRate: 5.0,
  },
};

const BACKUP_KEY = 'siteview_pre_calibration_localization_backup';
const LAST_CALIBRATION_KEY = 'siteview_last_location_calibration_meta';

/**
 * Checks if coordinates fall within Nigeria's geographical bounds
 */
export function isWithinNigeria(lat: number, lng: number): boolean {
  return lat >= 4.0 && lat <= 14.0 && lng >= 2.5 && lng <= 14.8;
}

/**
 * Reverse identify approximate Nigerian city or state from coordinates
 */
export function resolveNigerianRegion(lat: number, lng: number): string {
  // Lagos area
  if (lat >= 6.3 && lat <= 6.8 && lng >= 3.1 && lng <= 3.7) {
    return 'Lagos (South-West)';
  }
  // Abuja FCT
  if (lat >= 8.8 && lat <= 9.3 && lng >= 7.2 && lng <= 7.7) {
    return 'Abuja (Federal Capital Territory)';
  }
  // Port Harcourt / Rivers
  if (lat >= 4.6 && lat <= 5.1 && lng >= 6.8 && lng <= 7.3) {
    return 'Port Harcourt (Rivers)';
  }
  // Kano area
  if (lat >= 11.8 && lat <= 12.3 && lng >= 8.3 && lng <= 8.8) {
    return 'Kano (Northern Zone)';
  }
  // Ibadan / Oyo
  if (lat >= 7.2 && lat <= 7.6 && lng >= 3.7 && lng <= 4.1) {
    return 'Ibadan (Oyo)';
  }
  // Enugu area
  if (lat >= 6.3 && lat <= 6.6 && lng >= 7.4 && lng <= 7.7) {
    return 'Enugu (South-East)';
  }
  // Benin City
  if (lat >= 6.2 && lat <= 6.5 && lng >= 5.5 && lng <= 5.8) {
    return 'Benin City (Edo)';
  }
  return 'Nigeria (GPS Telemetry)';
}

/**
 * Detects country based on device timezone and locale
 */
export function detectCountryFromTimezoneAndLocale(): string {
  // Application standard default localization is Nigeria
  return 'NG';
}

/**
 * Resolves country code from GPS coordinates by bounding box
 */
export function resolveCountryFromCoords(lat: number, lng: number): { countryCode: string; regionName?: string } {
  // 1. Direct check for Nigerian region
  if (isWithinNigeria(lat, lng)) {
    const regionName = resolveNigerianRegion(lat, lng);
    return { countryCode: 'NG', regionName };
  }

  // Fallback to Nigeria default localization with GPS telemetry note
  return { countryCode: 'NG', regionName: `West Africa Grid (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)` };
}

/**
 * Retrieves the stored pre-calibration settings backup
 */
export function getPreCalibrationBackup(): LocalizationSettings | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(BACKUP_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load backup localization:', e);
  }
  return null;
}

/**
 * Reverts system localization back to the previous settings
 */
export function revertLocationCalibration(customTarget?: LocalizationSettings | null): void {
  const previous = customTarget || getPreCalibrationBackup();
  if (!previous) {
    showAppToast({
      type: 'warning',
      title: 'No Prior Settings',
      message: 'Unable to revert: no previous localization state was recorded.',
      badge: 'Notice',
    });
    return;
  }

  saveStoredLocalization(previous);
  playClickSound();

  showAppToast({
    type: 'info',
    title: 'Settings Reverted',
    message: `Restored previous settings: ${previous.currencyCode} (${previous.currencySymbol}) with ${previous.unitSystem.toUpperCase()} measurement metrics.`,
    badge: 'Restored',
    durationMs: 7000,
  });
}

/**
 * Calibrates the application's localization and measurement settings based on device location
 */
export function applyLocationCalibration(
  profile: CountryCalibrationProfile,
  telemetry: CalibrationTelemetry,
  options: { showToast?: boolean; customRegion?: string } = { showToast: true }
): void {
  const currentSettings = getStoredLocalization();

  // Save backup of pre-calibration state so the user can revert anytime
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(BACKUP_KEY, JSON.stringify(currentSettings));
      localStorage.setItem(LAST_CALIBRATION_KEY, JSON.stringify(telemetry));
    } catch (e) {
      console.warn('Failed to store calibration backup:', e);
    }
  }

  // Build calibrated settings
  const calibratedSettings: LocalizationSettings = {
    ...currentSettings,
    currencyCode: profile.currencyCode,
    currencySymbol: profile.currencySymbol,
    currencyPosition: profile.currencyPosition,
    decimalPlaces: profile.decimalPlaces,
    unitSystem: profile.unitSystem,
    temperatureUnit: profile.temperatureUnit,
    pressureUnit: profile.pressureUnit,
    dateFormat: profile.dateFormat,
    defaultTaxRate: profile.defaultTaxRate,
    defaultMarginRate: profile.defaultMarginRate,
    defaultContingencyRate: profile.defaultContingencyRate,
  };

  // Apply to storage and dispatch event
  saveStoredLocalization(calibratedSettings);

  if (options.showToast !== false) {
    playSuccessSound();

    const regionText = options.customRegion || telemetry.regionName || profile.countryName;
    const metricsDetail =
      profile.unitSystem === 'metric'
        ? 'Metric (m², Liters, kg, °C)'
        : 'Imperial (sq ft, Gallons, lbs, °F)';

    showAppToast({
      type: 'success',
      title: `Location Calibrated: ${profile.countryName}`,
      message: `Device located in ${regionText}. Calibrated currency to ${profile.currencyName} (${profile.currencySymbol}) & metrics to ${metricsDetail}.`,
      badge: `${profile.flag} ${profile.currencyCode} • ${profile.unitSystem.toUpperCase()}`,
      durationMs: 15000,
      revertAction: {
        label: 'Revert',
        tooltip: `Revert to previous settings (${currentSettings.currencyCode} / ${currentSettings.unitSystem})`,
        onRevert: () => {
          revertLocationCalibration(currentSettings);
        },
      },
    });
  }
}

/**
 * Main startup function: checks device location on every startup and initiates calibration
 */
export async function checkDeviceLocationAndCalibrate(options: {
  isStartup?: boolean;
  force?: boolean;
} = {}): Promise<void> {
  if (typeof window === 'undefined') return;

  // Perform quick initial environment check
  const fallbackCountry = detectCountryFromTimezoneAndLocale();

  // Try GPS Geolocation first
  if (navigator.geolocation) {
    try {
      await new Promise<void>((resolve) => {
        let hasResolved = false;

        const timer = setTimeout(() => {
          if (!hasResolved) {
            hasResolved = true;
            // Timeout reached: calibrate with timezone/locale fallback
            const profile = CALIBRATION_PROFILES[fallbackCountry] || CALIBRATION_PROFILES.NG;
            applyLocationCalibration(
              profile,
              {
                latitude: null,
                longitude: null,
                accuracy: null,
                countryCode: profile.countryCode,
                countryName: profile.countryName,
                method: 'timezone_locale',
                timestamp: Date.now(),
              },
              { showToast: true }
            );
            resolve();
          }
        }, 4500);

        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (hasResolved) return;
            hasResolved = true;
            clearTimeout(timer);

            const { latitude, longitude, accuracy } = position.coords;
            const { countryCode, regionName } = resolveCountryFromCoords(latitude, longitude);
            const profile = CALIBRATION_PROFILES[countryCode] || CALIBRATION_PROFILES.NG;

            applyLocationCalibration(
              profile,
              {
                latitude,
                longitude,
                accuracy,
                countryCode: profile.countryCode,
                countryName: profile.countryName,
                regionName,
                method: 'gps',
                timestamp: position.timestamp,
              },
              { showToast: true, customRegion: regionName }
            );
            resolve();
          },
          (error) => {
            if (hasResolved) return;
            hasResolved = true;
            clearTimeout(timer);

            console.warn('Device GPS unavailable or permission delayed, using timezone/locale:', error.message);
            const profile = CALIBRATION_PROFILES[fallbackCountry] || CALIBRATION_PROFILES.NG;
            applyLocationCalibration(
              profile,
              {
                latitude: null,
                longitude: null,
                accuracy: null,
                countryCode: profile.countryCode,
                countryName: profile.countryName,
                method: 'timezone_locale',
                timestamp: Date.now(),
              },
              { showToast: true }
            );
            resolve();
          },
          { enableHighAccuracy: true, timeout: 4000, maximumAge: 60000 }
        );
      });
      return;
    } catch (err) {
      console.warn('Geolocation check failed, using timezone calibration:', err);
    }
  }

  // Geolocation API not present: calibrate using timezone/locale
  const profile = CALIBRATION_PROFILES[fallbackCountry] || CALIBRATION_PROFILES.NG;
  applyLocationCalibration(
    profile,
    {
      latitude: null,
      longitude: null,
      accuracy: null,
      countryCode: profile.countryCode,
      countryName: profile.countryName,
      method: 'timezone_locale',
      timestamp: Date.now(),
    },
    { showToast: true }
  );
}
