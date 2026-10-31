import { UserProfileSettings, LocalizationSettings } from '../types';

export const DEFAULT_USER_PROFILE: UserProfileSettings = {
  profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  userName: 'Engr. Babatunde Adeleke',
  applicationId: 'PSP-NIG-2026-X99',
  email: 'babatunde.adeleke@apexcoatings-wa.com',
  phone: '+234 803 459 2041',
  fieldDispatchPhone: '+234 802 339 4400',
  jobTitle: 'Lead Surface Engineer & Field Operations Lead',
  position: 'Senior Director of Autonomous Coating Logistics (West Africa)',
  department: 'Advanced Polymers & Field Surface Engineering',
  certifications: 'NACE Coating Inspector Level 3 (#94821) • COREN Registered Structural Specialist',
  digitalSignatureText: 'Engr. Babatunde Adeleke, FNSE, NACE III',
  company: {
    name: 'Walnus SmartView Pro West Africa Ltd.',
    legalRegistration: 'RC Reg: #RC-1849204 • TIN: 23821094-0001',
    slogan: 'Commercial Surface Engineering & Autonomous Formulation Division',
    address: 'Plot 14 Victoria Island Industrial Corridor, Phase 2',
    cityStateZip: 'Lagos, Nigeria',
    website: 'https://walnusglobal.com',
    logoUrl: '', // Can be filled or fallback to vector badge
  },
  social: {
    linkedin: 'https://linkedin.com/in/babatunde-adeleke-coatings',
    twitter: 'https://x.com/WalnusSmartViewWA',
    github: 'https://github.com/walnusglobal-lab',
    industryPortal: 'https://paint-sync-pro.net/org/walnus-west-africa',
  },
  communicationChannels: {
    primaryChannel: 'WhatsApp Business',
    channelId: 'WA-CORP-LAGOS • Freq 156.350 MHz (VHF Ch-7)',
    satelliteCommsId: 'IRIDIUM-SAT-88392-NIG',
    notes: 'Direct field telemetry channel active during live mixer operations 06:00-18:00 WAT.',
  },
};

export const DEFAULT_LOCALIZATION: LocalizationSettings = {
  unitSystem: 'metric',
  currencyCode: 'NGN',
  currencySymbol: '₦',
  currencyPosition: 'prefix',
  decimalPlaces: 2,
  dateFormat: 'DD/MM/YYYY',
  temperatureUnit: 'C',
  pressureUnit: 'kPa',
  defaultTaxRate: 7.5, // Standard Nigerian VAT is 7.5%
  defaultMarginRate: 15.0,
  defaultContingencyRate: 5.0,
};

export const SUPPORTED_CURRENCIES: {
  code: LocalizationSettings['currencyCode'];
  symbol: string;
  name: string;
  position: 'prefix' | 'suffix';
}[] = [
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira (NGN)', position: 'prefix' },
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)', position: 'prefix' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)', position: 'prefix' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)', position: 'prefix' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CAD)', position: 'prefix' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar (AUD)', position: 'prefix' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (JPY)', position: 'prefix' },
  { code: 'AED', symbol: 'AED ', name: 'UAE Dirham (AED)', position: 'prefix' },
  { code: 'SAR', symbol: 'SAR ', name: 'Saudi Riyal (SAR)', position: 'prefix' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)', position: 'prefix' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand (ZAR)', position: 'prefix' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi (GHS)', position: 'prefix' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling (KES)', position: 'prefix' },
  { code: 'CHF', symbol: 'CHF ', name: 'Swiss Franc (CHF)', position: 'prefix' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar (SGD)', position: 'prefix' },
  { code: 'custom', symbol: '$', name: 'Custom Defined Symbol', position: 'prefix' },
];

export const PRESET_AVATARS = [
  {
    name: 'Dr. Elena Rostova (Engineer)',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Marcus Sterling (Field Director)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Aisha Al-Mansoor (Quality Lead)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Henrik Lindqvist (Formulation Chemist)',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  },
];

const PROFILE_STORAGE_KEY = 'paint_sync_user_profile_v2';
const LOCALIZATION_STORAGE_KEY = 'paint_sync_localization_v2';

export function getStoredUserProfile(): UserProfileSettings {
  if (typeof window === 'undefined') return DEFAULT_USER_PROFILE;
  try {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_USER_PROFILE,
        ...parsed,
        company: { ...DEFAULT_USER_PROFILE.company, ...(parsed.company || {}) },
        social: { ...DEFAULT_USER_PROFILE.social, ...(parsed.social || {}) },
        communicationChannels: {
          ...DEFAULT_USER_PROFILE.communicationChannels,
          ...(parsed.communicationChannels || {}),
        },
      };
    }
  } catch (e) {
    console.warn('Failed to load user profile from storage:', e);
  }
  return DEFAULT_USER_PROFILE;
}

export function saveStoredUserProfile(profile: UserProfileSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent('paint_sync_profile_updated', { detail: profile }));
  } catch (e) {
    console.error('Failed to save user profile:', e);
  }
}

export function getStoredLocalization(): LocalizationSettings {
  if (typeof window === 'undefined') return DEFAULT_LOCALIZATION;
  try {
    const saved = localStorage.getItem(LOCALIZATION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // If legacy settings had USD / $ or uninitialized currency, migrate to default Nigeria (NGN / ₦ / metric)
      if (parsed && (parsed.currencyCode === 'USD' || parsed.currencySymbol === '$' || !parsed.currencyCode)) {
        parsed.currencyCode = 'NGN';
        parsed.currencySymbol = '₦';
        parsed.unitSystem = 'metric';
        parsed.dateFormat = 'DD/MM/YYYY';
        parsed.temperatureUnit = 'C';
        parsed.pressureUnit = 'kPa';
        parsed.defaultTaxRate = 7.5;
        localStorage.setItem(LOCALIZATION_STORAGE_KEY, JSON.stringify(parsed));
      }
      return { ...DEFAULT_LOCALIZATION, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load localization settings:', e);
  }
  return DEFAULT_LOCALIZATION;
}

export function saveStoredLocalization(settings: LocalizationSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCALIZATION_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('paint_sync_localization_updated', { detail: settings }));
  } catch (e) {
    console.error('Failed to save localization settings:', e);
  }
}

/**
 * Formats a monetary amount according to the user's configured currency & localization
 */
export function formatLocalizedCurrency(
  amount: number,
  localization?: LocalizationSettings | null
): string {
  const loc = localization || getStoredLocalization();
  const decimals = loc.decimalPlaces !== undefined ? loc.decimalPlaces : 2;
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  if (loc.currencyPosition === 'suffix') {
    return `${formattedNumber} ${loc.currencySymbol}`;
  }
  return `${loc.currencySymbol}${formattedNumber}`;
}

/**
 * Formats area according to unit system (sq ft or m²)
 */
export function formatLocalizedArea(
  sqFt: number,
  localization?: LocalizationSettings | null
): string {
  const loc = localization || getStoredLocalization();
  if (loc.unitSystem === 'metric') {
    const sqM = Math.round(sqFt * 0.092903 * 10) / 10;
    return `${sqM} m²`;
  }
  return `${sqFt.toLocaleString()} sq ft`;
}

/**
 * Formats liquid volume according to unit system (Gallons or Liters)
 */
export function formatLocalizedVolume(
  gallons: number,
  localization?: LocalizationSettings | null
): string {
  const loc = localization || getStoredLocalization();
  if (loc.unitSystem === 'metric') {
    const liters = Math.round(gallons * 3.78541 * 10) / 10;
    return `${liters} L`;
  }
  return `${gallons} Gal`;
}

/**
 * Formats mass according to unit system (kg or lbs)
 */
export function formatLocalizedMass(
  kg: number,
  localization?: LocalizationSettings | null
): string {
  const loc = localization || getStoredLocalization();
  if (loc.unitSystem === 'imperial') {
    const lbs = Math.round(kg * 2.20462 * 10) / 10;
    return `${lbs} lbs`;
  }
  return `${kg} kg`;
}
