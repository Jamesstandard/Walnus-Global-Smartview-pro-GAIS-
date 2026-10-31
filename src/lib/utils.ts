import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getStoredLocalization, formatLocalizedCurrency } from '../data/userProfileSettings';
import { LocalizationSettings } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function formatCurrency(amount: number, customLoc?: LocalizationSettings | null) {
  try {
    return formatLocalizedCurrency(amount, customLoc);
  } catch {
    return `₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

