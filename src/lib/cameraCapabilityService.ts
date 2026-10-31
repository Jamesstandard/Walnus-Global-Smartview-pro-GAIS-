/**
 * SmartView Pro™ - Camera Capability & Auto-Fallback Service
 * Walnus Global Ventures
 * Milestone: SV-005 Camera Intelligence & HUD Enhancement
 * 
 * Detects device hardware capabilities, sensor availability, and adapts
 * rendering and resolution parameters for high-spec down to entry-level devices (e.g. Tecno Pop 7).
 */

export interface DeviceCapabilityReport {
  isHighSpec: boolean;
  hasDeviceOrientation: boolean;
  hasMediaCapture: boolean;
  recommendedResolution: { width: number; height: number };
  targetFps: number;
  enableAdvancedHud: boolean;
  deviceTier: 'HIGH' | 'MID' | 'ENTRY';
}

export async function detectDeviceCapabilities(): Promise<DeviceCapabilityReport> {
  let hasMediaCapture = false;
  try {
    hasMediaCapture = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  } catch {
    hasMediaCapture = false;
  }

  // Detect memory / hardware concurrency if available
  const memoryGB = (navigator as any).deviceMemory || 4;
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const userAgent = navigator.userAgent || '';
  const isLowSpecAgent = /Tecno|Pop|Go Edition|Android [4-8]/i.test(userAgent);

  const isHighSpec = memoryGB >= 6 && hardwareConcurrency >= 6 && !isLowSpecAgent;
  const isEntry = memoryGB <= 3 || hardwareConcurrency <= 3 || isLowSpecAgent;

  const deviceTier: 'HIGH' | 'MID' | 'ENTRY' = isHighSpec ? 'HIGH' : isEntry ? 'ENTRY' : 'MID';

  return {
    isHighSpec,
    hasDeviceOrientation: typeof window !== 'undefined' && 'DeviceOrientationEvent' in window,
    hasMediaCapture,
    recommendedResolution: isHighSpec 
      ? { width: 1920, height: 1080 } 
      : isEntry 
      ? { width: 1280, height: 720 } 
      : { width: 1280, height: 720 },
    targetFps: isHighSpec ? 60 : 30,
    enableAdvancedHud: !isEntry,
    deviceTier,
  };
}
