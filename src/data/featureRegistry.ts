export interface FeatureRegistryItem {
  id: string;
  name: string;
  description: string;
  module: string;
  status: 'planned' | 'in_development' | 'unverified' | 'verified_operational' | 'partially_available';
  entryPoint: string;
  permissionsRequired: string[];
  deviceRequirements: string[];
  version: string;
}

export const SMARTVIEW_FEATURE_REGISTRY: FeatureRegistryItem[] = [
  {
    id: 'feat-copilot',
    name: 'SmartView-ai Copilot & RAG',
    description: 'Conversational assistant with vector RAG knowledge retrieval and local SLM support.',
    module: 'SmartView-ai Copilot',
    status: 'verified_operational',
    entryPoint: 'AICopilotDrawer / Bottom Drawer',
    permissionsRequired: ['AI Inference'],
    deviceRequirements: ['Standard Web/Android Runtime'],
    version: '1.0.0',
  },
  {
    id: 'feat-camera-hud',
    name: 'ADAS Telemetry HUD & Camera',
    description: 'Real-time camera feed with pitch/roll indicators, GPS telemetry, and structural meters.',
    module: 'HUD and Camera Guidance',
    status: 'verified_operational',
    entryPoint: 'CameraViewfinder / ADAS HUD View',
    permissionsRequired: ['Camera', 'Geolocation'],
    deviceRequirements: ['Camera Device', 'Sensor Fusion (with fallback)'],
    version: '1.0.0',
  },
  {
    id: 'feat-surface-profiler',
    name: 'Surface Profiler & Coating Visualiser',
    description: 'Surface roughness metrics, porosity values, and coating finish selection.',
    module: 'Paint & Surface Workflow',
    status: 'verified_operational',
    entryPoint: 'SurfaceVisualizerWorkspace',
    permissionsRequired: ['Storage / IndexedDB'],
    deviceRequirements: ['Standard GPU / WebGL'],
    version: '1.0.0',
  },
  {
    id: 'feat-estimator',
    name: 'SmartCoat Material Estimator',
    description: 'Automated calculation for paint, primer, screeding, and plastering with quotations.',
    module: 'Material & Quantity Estimation',
    status: 'verified_operational',
    entryPoint: 'EstimatorApp',
    permissionsRequired: ['Dexie Storage'],
    deviceRequirements: ['Standard Runtime'],
    version: '1.0.0',
  },
  {
    id: 'feat-offline-storage',
    name: 'Offline-First Dexie Persistence',
    description: 'Local IndexedDB persistence for projects, surveys, and measurement records.',
    module: 'Data Persistence',
    status: 'verified_operational',
    entryPoint: 'Background Sync & Local DB',
    permissionsRequired: ['IndexedDB Access'],
    deviceRequirements: ['Local Storage Capacity'],
    version: '1.0.0',
  },
];
