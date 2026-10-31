import { getStoredThemeSettings } from './themeEngine';

/**
 * Web Audio API Sound Synthesizer Utility
 * Generates clean, hardware-accelerated non-intrusive UI feedback sounds
 */

function getAudioContext(): AudioContext | null {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    return new AudioCtx();
  } catch (e) {
    return null;
  }
}

/**
 * Crisp micro-click sound for button presses
 */
export function playClickSound() {
  try {
    const theme = getStoredThemeSettings();
    if (!theme.soundEnabled) return;

    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    const volume = (theme.soundVolume || 0.6) * 0.12;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  } catch (e) {
    // AudioContext blocked until user interaction or unsupported
  }
}

/**
 * Toggle switch state sound (soft rising or falling pitch)
 */
export function playToggleSound(enabled: boolean) {
  try {
    const theme = getStoredThemeSettings();
    if (!theme.soundEnabled) return;

    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    if (enabled) {
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);
    } else {
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.06);
    }

    const volume = (theme.soundVolume || 0.6) * 0.1;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  } catch (e) {
    // Ignore
  }
}

/**
 * Soft tab pop sound for switching tabs/panels
 */
export function playTabSound() {
  try {
    const theme = getStoredThemeSettings();
    if (!theme.soundEnabled) return;

    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.05);

    const volume = (theme.soundVolume || 0.6) * 0.08;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  } catch (e) {
    // Ignore
  }
}

/**
 * Success completion chord
 */
export function playSuccessSound() {
  try {
    const theme = getStoredThemeSettings();
    if (!theme.soundEnabled) return;

    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 triad
    const masterGain = ctx.createGain();
    const volume = (theme.soundVolume || 0.6) * 0.12;
    masterGain.gain.setValueAtTime(volume, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    masterGain.connect(ctx.destination);

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      osc.connect(masterGain);
      osc.start(now + idx * 0.05);
      osc.stop(now + 0.35);
    });
  } catch (e) {
    // Ignore
  }
}

/**
 * Lightweight Web Audio synthesizer for factory inventory alerts and operational notifications
 */
export function playAlertChime(type: 'critical' | 'warning' | 'success') {
  try {
    const theme = getStoredThemeSettings();
    if (!theme.soundEnabled) return;

    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const baseVol = (theme.soundVolume || 0.6);

    if (type === 'critical') {
      // 2-tone urgent warning beep (880Hz -> 660Hz -> 880Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(660, now + 0.12);
      osc.frequency.setValueAtTime(880, now + 0.24);

      gain.gain.setValueAtTime(0.12 * baseVol, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'warning') {
      // Gentle double pulse
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(659.25, now + 0.15); // E5

      gain.gain.setValueAtTime(0.1 * baseVol, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      playSuccessSound();
    }
  } catch (e) {
    // Ignore
  }
}
