// Hardware RAM Optimization & Telemetry Governor
// Tailored for Android 4GB RAM & Open-Source Client WebGL / WebGPU Runtimes

export type HardwareRAMProfile = 'android_4gb' | 'balanced_mobile' | 'ultra_desktop';

export interface RAMProfileConfig {
  id: HardwareRAMProfile;
  name: string;
  badge: string;
  description: string;
  renderScale: number;
  maxPolygons: number;
  splatBudget: number;
  maxFPS: number;
  textureRes: number;
  shadowMapSize: number;
  vramCapMB: number;
}

export const RAM_PROFILES: Record<HardwareRAMProfile, RAMProfileConfig> = {
  android_4gb: {
    id: 'android_4gb',
    name: 'Android 4GB (Low RAM Saver)',
    badge: '4GB RAM Safe',
    description: 'Optimized for 4GB Android devices. 0.65x resolution, 30 FPS cap, 16-bit quantized splats, decimation to <20k polys to avoid browser OOM kills.',
    renderScale: 0.65,
    maxPolygons: 18000,
    splatBudget: 15000,
    maxFPS: 30,
    textureRes: 512,
    shadowMapSize: 512,
    vramCapMB: 180,
  },
  balanced_mobile: {
    id: 'balanced_mobile',
    name: 'Balanced (6-8GB Mobile)',
    badge: 'Balanced 60FPS',
    description: 'Native 1.0x resolution scale with full 60 FPS viewport, 50k polygons, and 60k splat points.',
    renderScale: 1.0,
    maxPolygons: 52000,
    splatBudget: 60000,
    maxFPS: 60,
    textureRes: 1024,
    shadowMapSize: 1024,
    vramCapMB: 512,
  },
  ultra_desktop: {
    id: 'ultra_desktop',
    name: 'Ultra (Desktop / Compute GPU)',
    badge: 'Ultra Fidelity',
    description: 'Supersampled 1.35x resolution, 120k polygons, uncompressed 32-bit floating splats, and 2048px PBR normal maps.',
    renderScale: 1.35,
    maxPolygons: 120000,
    splatBudget: 150000,
    maxFPS: 60,
    textureRes: 2048,
    shadowMapSize: 2048,
    vramCapMB: 1500,
  },
};

export interface HardwareMemoryStats {
  usedHeapMB: number;
  heapLimitMB: number;
  estimatedVramMB: number;
  activePolys: number;
  activeSplats: number;
  activeBuffers: number;
  fps: number;
  isThrottled: boolean;
  isOpenSourceFree: boolean;
}

export function getDeviceMemoryStats(
  polys: number,
  splats: number,
  profile: HardwareRAMProfile
): HardwareMemoryStats {
  const cfg = RAM_PROFILES[profile];
  
  // Measure actual browser JS heap if performance.memory is exposed (Chrome/Android WebView)
  let usedHeap = 68;
  let heapLimit = 512;
  
  if (typeof window !== 'undefined' && (performance as any).memory) {
    const mem = (performance as any).memory;
    usedHeap = Math.round(mem.usedJSHeapSize / (1024 * 1024));
    heapLimit = Math.round(mem.jsHeapSizeLimit / (1024 * 1024));
  } else {
    // Simulated realistic heap based on active polygons & buffers
    usedHeap = Math.round(52 + (polys / 1000) * 0.45 + (splats / 1000) * 0.35);
    heapLimit = profile === 'android_4gb' ? 384 : profile === 'balanced_mobile' ? 768 : 2048;
  }

  // Estimate GPU VRAM footprint
  const vertexBytes = polys * 3 * 32; // pos, norm, uv
  const splatBytes = splats * (profile === 'android_4gb' ? 16 : 32); // 16-bit vs 32-bit splats
  const textureBytes = (cfg.textureRes * cfg.textureRes * 4 * 4) / 1.5; // mipmapped PBR maps
  const estVramMB = Math.round((vertexBytes + splatBytes + textureBytes) / (1024 * 1024) + 38);

  const isThrottled = estVramMB > cfg.vramCapMB || usedHeap > heapLimit * 0.85;

  return {
    usedHeapMB: usedHeap,
    heapLimitMB: heapLimit,
    estimatedVramMB: estVramMB,
    activePolys: polys,
    activeSplats: splats,
    activeBuffers: profile === 'android_4gb' ? 14 : profile === 'balanced_mobile' ? 26 : 48,
    fps: cfg.maxFPS,
    isThrottled,
    isOpenSourceFree: true,
  };
}
