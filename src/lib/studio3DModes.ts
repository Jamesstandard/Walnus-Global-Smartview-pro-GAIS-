// 4 Active Modes Specification Engine for 3D Reconstruction & Spatial HUD
// 1. Image-to-3D (Poisson Surface)
// 2. Video-to-3D (3D Gaussian Splatting)
// 3. Spatial Measurement HUD
// 4. Chemical Formulation Matching

export type Studio3DActiveMode =
  | 'image_to_3d'
  | 'video_to_3d_splat'
  | 'spatial_hud'
  | 'chemical_formulation'
  | 'studio_scene';

export interface Studio3DModeDefinition {
  id: Studio3DActiveMode;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  iconName: string;
  badge: string;
}

export const STUDIO_3D_MODES: Record<Studio3DActiveMode, Studio3DModeDefinition> = {
  image_to_3d: {
    id: 'image_to_3d',
    name: 'Image-to-3D Surface',
    shortName: 'Image-to-3D',
    tagline: 'Monocular Depth & Poisson Mesh Reconstruction',
    description: 'Structure-from-Motion keypoint matching and Screened Poisson Surface generator with progressive texture LOD.',
    iconName: 'Camera',
    badge: 'Poisson LOD',
  },
  video_to_3d_splat: {
    id: 'video_to_3d_splat',
    name: 'Video-to-3D (Gaussian Splatting)',
    shortName: 'Video-3DGS',
    tagline: 'Real-Time 3DGS Radiance Field & Splat Cloud',
    description: 'Keyframe camera trajectory tracking with 16-bit quantized spherical harmonic splats for 4GB Android hardware.',
    iconName: 'Video',
    badge: '3DGS Splats',
  },
  spatial_hud: {
    id: 'spatial_hud',
    name: 'Spatial Measurement HUD',
    shortName: 'Spatial HUD',
    tagline: 'Interactive 3D Raycasting & Point-to-Point Telemetry',
    description: 'Real-time laser crosshairs, vertex point distance, façade dimensions, surface area takeoff, and compass pitch/yaw radar.',
    iconName: 'Crosshair',
    badge: '±1.1mm LiDAR',
  },
  chemical_formulation: {
    id: 'chemical_formulation',
    name: 'Chemical Formulation Matching',
    shortName: 'Chemical Match',
    tagline: 'Substrate Stoichiometry & Weather Equation Engine',
    description: 'Real-time dry film thickness (DFT), solids by volume %, cure kinetics, and Bill of Materials (BOM) for coatings/screeds/plasters.',
    iconName: 'FlaskConical',
    badge: 'Stoichiometry',
  },
  studio_scene: {
    id: 'studio_scene',
    name: '3D Studio Scene',
    shortName: '3D Studio',
    tagline: 'Procedural Architectural Scene',
    description: 'High-fidelity procedural architectural studio scene.',
    iconName: 'Box',
    badge: '3D Studio',
  },
};

export interface ChemicalSubstrateMatch {
  substrate: string;
  recommendedPrimer: string;
  recommendedTopcoat: string;
  volumeSolidsPercent: number;
  targetDftMicrons: number;
  theoreticalCoverageSqMPerLiter: number;
  cureTimeHours: number;
  pigmentVolumeConcentration: number;
  estimatedCostPerSqM: number;
  mixingRatio: string;
  keyNotes: string;
}

export const CHEMICAL_SUBSTRATE_REGISTRY: Record<string, ChemicalSubstrateMatch> = {
  concrete: {
    substrate: 'Concrete Plinth / Foundation',
    recommendedPrimer: 'Deep Penetrating Silane-Siloxane Hydrophobic Primer',
    recommendedTopcoat: 'High-Build Pure Elastomeric Acrylic Weather Barrier',
    volumeSolidsPercent: 54,
    targetDftMicrons: 150,
    theoreticalCoverageSqMPerLiter: 3.6,
    cureTimeHours: 4.5,
    pigmentVolumeConcentration: 38,
    estimatedCostPerSqM: 8.50,
    mixingRatio: '1-Component Ready Mix (Thinned max 5% water)',
    keyNotes: 'High capillary porosity requires alkali-resistant primer; bridge dynamic substrate micro-cracks up to 1.2mm.',
  },
  stucco: {
    substrate: 'Exterior Stucco / Cementitious Render',
    recommendedPrimer: 'Alkali-Resistant 100% Pure Acrylic Bonding Sealer',
    recommendedTopcoat: 'Cross-Linking Acrylic Satin Exterior Coating',
    volumeSolidsPercent: 44,
    targetDftMicrons: 80,
    theoreticalCoverageSqMPerLiter: 5.5,
    cureTimeHours: 3.0,
    pigmentVolumeConcentration: 42,
    estimatedCostPerSqM: 6.20,
    mixingRatio: 'Ready-to-use (Low-shear roller or 517 airless tip)',
    keyNotes: 'Ensures optimal water vapor permeability (SD-value < 0.14m) to prevent blistering under solar driving rain.',
  },
  masonry: {
    substrate: 'Brick & Architectural Masonry',
    recommendedPrimer: 'Micro-Emulsion Penetrating Primer',
    recommendedTopcoat: 'Silicon-Enhanced Breathable Mineral Paint',
    volumeSolidsPercent: 48,
    targetDftMicrons: 95,
    theoreticalCoverageSqMPerLiter: 4.8,
    cureTimeHours: 3.5,
    pigmentVolumeConcentration: 45,
    estimatedCostPerSqM: 7.10,
    mixingRatio: '1-Component Direct Application',
    keyNotes: 'Repels liquid wind-driven moisture while allowing interior water vapor migration through mortar joints.',
  },
  steel: {
    substrate: 'Structural Steel & Aluminum Mullions',
    recommendedPrimer: '2K Polyamide Zinc-Phosphate Anti-Corrosive Epoxy',
    recommendedTopcoat: 'Aliphatic 2K Polyurethane UV-Gloss Enamel',
    volumeSolidsPercent: 68,
    targetDftMicrons: 120,
    theoreticalCoverageSqMPerLiter: 5.6,
    cureTimeHours: 6.0,
    pigmentVolumeConcentration: 24,
    estimatedCostPerSqM: 14.80,
    mixingRatio: '4:1 Base to Hardener by Volume (Induction: 20 min)',
    keyNotes: 'Passes ISO 12944 C4 high-durability marine/industrial corrosion testing.',
  },
  gypsum: {
    substrate: 'Interior Gypsum Plaster / Drywall',
    recommendedPrimer: 'PVA High-Solids Sealer & Surface Equalizer',
    recommendedTopcoat: 'Scuff-Resistant Matte Latex with Ceramic Micro-Spheres',
    volumeSolidsPercent: 40,
    targetDftMicrons: 45,
    theoreticalCoverageSqMPerLiter: 9.8,
    cureTimeHours: 1.5,
    pigmentVolumeConcentration: 46,
    estimatedCostPerSqM: 4.40,
    mixingRatio: 'Ready-to-apply (Spray 0.015 tip / 1/2" microfiber nap)',
    keyNotes: 'Zero-VOC formulation for rapid interior turnaround and high scrub resistance.',
  },
};
