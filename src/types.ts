export type SyncStatus = 'synced' | 'pending' | 'conflict';

export type ProjectMode = 'paint' | 'screed' | 'plaster';

export interface ProjectModeDefinition {
  id: ProjectMode;
  name: string;
  shortLabel: string;
  discipline: string;
  tagline: string;
  unit: string;
  metricUnit: string;
  imperialUnit: string;
  coveragePerUnit: string;
  defaultThickness: string;
  dryTimeHours: number;
  costPerSqFt: number; // reference in Naira
  costPerSqMeter: number; // reference in Naira
  defaultMaterial: string;
  defaultHex: string;
  defaultSubstrate: string;
  recommendedSubstrates: string[];
  subOptions: { id: string; name: string; desc: string; dft: string; costMultiplier: number }[];
  prepMethods: { id: string; label: string; desc: string }[];
  autonomousDomain: 'paint_chemistry' | 'wall_screening' | 'plastering_rendering';
}

export const PROJECT_MODES_CONFIG: Record<ProjectMode, ProjectModeDefinition> = {
  paint: {
    id: 'paint',
    name: 'Painting',
    shortLabel: 'Coatings & Protection',
    discipline: 'Surface Coating & Weatherproofing',
    tagline: 'Architectural Acrylic, Epoxy, Polyurethane & Weather Barrier Systems',
    unit: 'Liters / Gallons',
    metricUnit: 'Liters',
    imperialUnit: 'Gallons',
    coveragePerUnit: '10.2 m²/L (350 sq ft/gal)',
    defaultThickness: '45–120 µm DFT (2-3 coats)',
    dryTimeHours: 4,
    costPerSqFt: 850,
    costPerSqMeter: 9150,
    defaultMaterial: 'Architectural Acrylic Latex',
    defaultHex: '#6366f1',
    defaultSubstrate: 'Masonry & Primed Drywall',
    recommendedSubstrates: [
      'Masonry & Plaster',
      'Primed Drywall / Gypsum',
      'Structural Steel',
      'Exterior Concrete Façade',
      'Wood Cladding',
    ],
    subOptions: [
      { id: 'acrylic_latex', name: 'Architectural Acrylic Latex', desc: 'Waterborne breathable UV-resistant finish', dft: '45 µm', costMultiplier: 1.0 },
      { id: '2k_epoxy', name: '2K Polyamide Epoxy Resin', desc: 'Industrial chemical & abrasion barrier', dft: '125 µm', costMultiplier: 1.45 },
      { id: 'aliphatic_polyurethane', name: 'Aliphatic Polyurethane Topcoat', desc: 'Marine grade gloss & color retention', dft: '60 µm', costMultiplier: 1.6 },
      { id: 'masonry_elastomeric', name: 'Masonry Elastomeric Membrane', desc: 'Façade crack-bridging waterproofing', dft: '250 µm', costMultiplier: 1.25 },
      { id: 'siloxane_waterproof', name: 'Siloxane Hydrophobic Sealer', desc: 'Efflorescence & damp ingress barrier', dft: '80 µm', costMultiplier: 1.2 },
    ],
    prepMethods: [
      { id: 'sanding_primer', label: 'Fine Sanding & Alkali Sealer', desc: 'Standard dry dust extraction & acrylic primer' },
      { id: 'pressure_wash', label: 'High-Pressure Façade Wash', desc: '3000 PSI wash removing chalking & algae' },
      { id: 'abrasive_blast', label: 'SSPC-SP10 Near-White Blast', desc: 'Heavy steel/concrete profile blasting' },
    ],
    autonomousDomain: 'paint_chemistry',
  },
  screed: {
    id: 'screed',
    name: 'Wall Screening',
    shortLabel: 'Wall Skim / Screen',
    discipline: 'Interior & Exterior Wall Screening',
    tagline: 'Polymer-Modified Wall Screening Mortar, Skim Coating & Surface Smoothing',
    unit: '25kg Bags',
    metricUnit: '25kg Bags / m²',
    imperialUnit: '50lb Bags / sq ft',
    coveragePerUnit: '32 sq ft / 25kg bag @ 3mm (3.0 m²)',
    defaultThickness: '2.0 – 6.0 mm Wall Depth',
    dryTimeHours: 12,
    costPerSqFt: 2400,
    costPerSqMeter: 25800,
    defaultMaterial: 'Polymer Wall Screening Mortar',
    defaultHex: '#f59e0b',
    defaultSubstrate: 'Interior & Exterior Masonry Wall',
    recommendedSubstrates: [
      'Interior Brick & Blockwork',
      'Exterior Masonry Wall',
      'Poured Concrete Wall',
      'Cement Board & Drywall Substrate',
      'Rough Plastered Wall Surface',
    ],
    subOptions: [
      { id: 'interior_wall_skim', name: 'Interior Wall Screening Skim Coat', desc: 'Ultra-smooth interior wall skim & screening mortar', dft: '1.5–3.0 mm', costMultiplier: 1.0 },
      { id: 'exterior_weather_screen', name: 'Exterior Weatherproof Wall Screening Mortar', desc: 'High-adhesion fiber-reinforced exterior wall screen', dft: '3.0–6.0 mm', costMultiplier: 1.25 },
      { id: 'polymer_wall_screed', name: 'Polymer-Modified Anti-Crack Wall Screening', desc: 'Elastic crack-bridging screening compound for walls', dft: '2.0–5.0 mm', costMultiplier: 1.35 },
      { id: 'rapid_setting_wall_screen', name: 'Rapid-Setting Wall Screening Compound', desc: 'Fast-curing smooth finish ready for paint in 6 hrs', dft: '2.0–4.0 mm', costMultiplier: 1.15 },
      { id: 'decorative_wall_smoothing', name: 'Fine-Grain Decorative Wall Smoothing Screed', desc: 'Superfine marble-dust wall screening compound', dft: '1.0–2.5 mm', costMultiplier: 1.4 },
    ],
    prepMethods: [
      { id: 'wall_dust_extraction', label: 'Wall Mechanical Sanding & Dust Removal', desc: 'Vacuum dust extraction and surface cleaning' },
      { id: 'wall_acrylic_primer', label: 'Wall Acrylic Bonding Primer', desc: 'Deep-penetrating alkali-resistant primer coat' },
      { id: 'wall_mesh_joint', label: 'Fibreglass Joint Mesh Reinforcement', desc: 'Crack-prevention mesh over blockwork joints' },
    ],
    autonomousDomain: 'wall_screening',
  },
  plaster: {
    id: 'plaster',
    name: 'Plastering',
    shortLabel: 'Wall Render & Skim',
    discipline: 'Wall Rendering & Finishing Skim',
    tagline: 'POP Gypsum Skim, Polymer-Modified Render & Weatherproof Plaster Systems',
    unit: '25kg Bags',
    metricUnit: '25kg Bags',
    imperialUnit: '50lb Bags',
    coveragePerUnit: '25 sq ft / 25kg bag @ 12mm (2.3 m²)',
    defaultThickness: '6.0 – 15.0 mm Render',
    dryTimeHours: 24,
    costPerSqFt: 2400,
    costPerSqMeter: 25800,
    defaultMaterial: 'POP Gypsum Finishing Skim Coat',
    defaultHex: '#10b981',
    defaultSubstrate: 'Sandcrete Blocks & Clay Brick',
    recommendedSubstrates: [
      'Sandcrete Hollow Blocks',
      'Clay Brick Masonry',
      'In-situ Cast Concrete Walls',
      'AAC Lightweight Autoclaved Blocks',
      'Gypsum Baseboard / Lath',
    ],
    subOptions: [
      { id: 'pop_gypsum_skim', name: 'POP (Plaster of Paris) Gypsum Skim Coat', desc: 'Ultra-smooth mirror wall finish ready for paint', dft: '2–4 mm', costMultiplier: 1.0 },
      { id: 'sand_cement_waterproof', name: 'Waterproof Sand-Cement Exterior Render (1:4)', desc: 'Weather-resistant base render with waterproof admixture', dft: '12–18 mm', costMultiplier: 0.9 },
      { id: 'polymer_render', name: 'Polymer-Modified Flexible Render', desc: 'High flexibility with fibreglass crack mesh', dft: '8–12 mm', costMultiplier: 1.3 },
      { id: 'hydraulic_lime_render', name: 'Hydraulic Lime Render (NHL 3.5)', desc: 'Breathable historic & heritage masonry render', dft: '15–20 mm', costMultiplier: 1.4 },
      { id: 'acoustic_insulating', name: 'Acoustic Sound-Dampening Plaster', desc: 'Perlite aggregate sound absorption matrix', dft: '15–25 mm', costMultiplier: 1.75 },
    ],
    prepMethods: [
      { id: 'spatterdash_key', label: 'Cement Spatterdash Key Coat', desc: 'Rough mechanical key applied to blockwork' },
      { id: 'bonding_suction_agent', label: 'Suction Control PVA / SBR Primer', desc: 'Prevents rapid water draw on dry blocks' },
      { id: 'corner_stop_beads', label: 'Galvanized Angle Beads & Mesh', desc: 'Plumb corner alignment & crack bridging' },
    ],
    autonomousDomain: 'plastering_rendering',
  },
};

export interface PaintProject {
  id: string;
  name: string;
  surfaceAreaSqFt: number;
  paintType: string;
  colorName: string;
  colorHex: string;
  volumeGallons: number;
  status: 'estimated' | 'formulating' | 'mixing' | 'packaged';
  syncStatus: SyncStatus;
  lastUpdated: number;
  images: string[]; // Base64 or URLs
}

export interface PaintFormulation {
  id: string;
  paintType: string;
  basePigments: { name: string; percentage: number; costPerKg: number }[];
  additives: { name: string; percentage: number; costPerKg: number }[];
  instructions: string[];
}

export interface ChatMessage {
  id: string;
  projectId?: string;
  sender: 'Estimator' | 'Mixer' | 'Manager' | 'Packaging' | 'Engineer' | 'Painter' | 'Bricklayer';
  text: string;
  timestamp: number;
  syncStatus: SyncStatus;
  type?: 'text' | 'voice' | 'call_log';
  voiceDurationSec?: number;
  recipient?: string;
}

export interface FormulationPlan {
  projectId: string;
  totalVolume: number;
  drumsRequired: number;
  drumSizeGallons: number;
  rawMaterials: { name: string; amountKg: number; cost: number }[];
  totalCost: number;
}

export interface SiteContact {
  id: string;
  name: string;
  role: 'Engineer' | 'Painter' | 'Manager' | 'Bricklayer' | 'Subcontractor' | 'Client';
  roleCaption: string;
  department: string;
  avatarBg: string;
  initials: string;
  status: 'online' | 'busy' | 'in-call' | 'offline';
  phone: string;
  email?: string;
  applicationId?: string;
  isLinked?: boolean;
  linkedAt?: number;
  connectionProtocol?: string;
  siteLocation: string;
  specialty: string;
  experienceYears: number;
  assignedProjects: number;
}

export interface VideoConferenceSettings {
  resolution: '480p' | '720p' | '1080p' | '4k';
  frameRate: 15 | 24 | 30 | 60;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  preferredCodec: 'VP8' | 'VP9' | 'H264' | 'AV1';
  bandwidthProfile: 'fiber' | '4g' | 'low_bandwidth' | 'satellite';
  audioInputDeviceId: string;
  videoInputDeviceId: string;
  virtualBackground: 'none' | 'blur_soft' | 'blur_deep' | 'jobsite' | 'factory';
  pictureInPictureDefault: boolean;
  lowLightBoost: boolean;
  fullDuplexAudio: boolean;
}

export interface MarketMaterialItem {
  id: string;
  name: string;
  casNumber: string;
  category: 'Base Pigment' | 'Polymer Binder' | 'Solvent & Matrix' | 'Performance Additive' | 'Sealant & Barrier' | 'Wall Polymer Binder' | 'Wall Screening Mortar' | 'Wall Fine Filler' | 'Wall Performance Additive' | 'Wall Primer & Keying' | 'Wall Fiber Reinforcement' | 'Wall Joint Reinforcement' | 'Wall Base Pigment' | (string & {});
  spotPricePerKg: number;
  marketTrend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  supplier: string;
  leadTimeDays: number;
  stockAvailability: 'In Stock' | 'Allocated' | 'Immediate Dispatch';
  confidenceScore: number;
  requiredAmountKg: number;
  notes: string;
}

export interface ProjectSourcePackage {
  schemaVersion: string;
  exportTimestamp: number;
  checksumSha256: string;
  project: PaintProject;
  environmentConditions: {
    substrateTempCelsius: number;
    relativeHumidity: number;
    dewPointSpread: number;
    atmosphericPressureKpa: number;
  };
  formulationBreakdown: {
    basePigments: { name: string; percentage: number; costPerKg: number }[];
    additives: { name: string; percentage: number; costPerKg: number }[];
    viscosityCps: number;
    vocGramsPerLiter: number;
    theoreticalCoverageSqFtPerGal: number;
  };
  meshMetadata: {
    vertexCount: number;
    polygonCount: number;
    lidarAccuracyMm: number;
    scanSensor: string;
  };
  assignedTeam: {
    engineer: string;
    painter: string;
    manager: string;
    bricklayer: string;
  };
}

export interface QuotationLineItem {
  id: string;
  category: 'Materials' | 'Labor' | 'Equipment' | 'Substrate Prep' | 'Quality & Compliance';
  description: string;
  quantity: number;
  unit: string;
  unitRate: number;
  total: number;
  isEditable?: boolean;
}

export interface LocalizedRegionalMaterial {
  id: string;
  materialType: 'paint' | 'plaster' | 'screed';
  name: string;
  tradeName: string;
  standardSpec: string;
  category: string;
  spotPrice: number;
  unit: string;
  currency: string;
  marketTrend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  stockQuantity: number;
  stockStatus: 'In Stock (Direct Depot)' | 'Next-Day Dispatch' | 'Allocated - 2 Day Delivery' | 'Live Warehouse Stock' | 'Immediate Collection';
  coverageEstimate: string;
  dryingTime: string;
  vocOrEhs: string;
  supplierName: string;
  supplierDepot: string;
  fullAddress: string;
  distanceKm: number;
  distanceMiles: number;
  travelTimeMins: number;
  phone: string;
  gpsCoordinates: { lat: number; lng: number };
  geoZone: string;
  minOrder: string;
  confidenceScore: number;
  mapPinX: number; // 0-100% relative for animated SVG map
  mapPinY: number; // 0-100% relative for animated SVG map
}

export interface DraftQuotation {
  id: string;
  projectId: string;
  projectName: string;
  quotationNumber: string;
  targetContact: SiteContact;
  version: number;
  lineItems: QuotationLineItem[];
  contractorMarginPercent: number;
  taxRatePercent: number;
  contingencyPercent: number;
  subtotal: number;
  marginAmount: number;
  taxAmount: number;
  contingencyAmount: number;
  total: number;
  paymentTerms: string;
  validityDays: number;
  lastUpdated: number;
  status: 'draft' | 'under_review' | 'approved' | 'finalized';
}

export interface RawMaterialStockItem {
  id: string;
  name: string;
  chemicalTradeName: string;
  category: 'binder' | 'base_pigment' | 'solvent' | 'colorant' | 'extender' | 'additive';
  categoryLabel: string;
  currentStockKg: number;
  criticalThresholdKg: number;
  reorderLevelKg: number;
  unitCostPerKg: number;
  supplier: string;
  leadTimeDays: number;
  color: string;
}

export interface MaterialQueueRequirement {
  materialId: string;
  materialName: string;
  chemicalTradeName: string;
  category: string;
  color: string;
  currentStockKg: number;
  criticalThresholdKg: number;
  unitCostPerKg: number;
  supplier: string;
  leadTimeDays: number;
  totalRequiredKg: number;
  projectedRemainingKg: number;
  status: 'adequate' | 'warning' | 'critical';
  shortfallKg: number;
  affectedProjects: {
    projectId: string;
    projectName: string;
    paintType: string;
    volumeGallons: number;
    requiredKg: number;
  }[];
}

export interface UserProfileSettings {
  profilePicture: string; // Base64 or image URL
  userName: string;
  applicationId: string;
  email: string;
  phone: string;
  fieldDispatchPhone: string;
  jobTitle: string;
  position: string;
  department: string;
  certifications: string;
  digitalSignatureText: string;
  company: {
    name: string;
    legalRegistration: string;
    slogan: string;
    address: string;
    cityStateZip: string;
    website: string;
    logoUrl: string;
  };
  social: {
    linkedin: string;
    twitter: string;
    github: string;
    industryPortal: string;
  };
  communicationChannels: {
    primaryChannel: 'Field Radio VHF' | 'Teams' | 'Slack' | 'WhatsApp Business' | 'Direct Satellite' | 'Email';
    channelId: string;
    satelliteCommsId: string;
    notes: string;
  };
}

export interface LocalizationSettings {
  unitSystem: 'metric' | 'imperial' | 'hybrid';
  currencyCode: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'AED' | 'SAR' | 'INR' | 'CHF' | 'SGD' | 'NGN' | 'ZAR' | 'GHS' | 'KES' | 'custom' | (string & {});
  currencySymbol: string;
  currencyPosition: 'prefix' | 'suffix';
  decimalPlaces: number;
  dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'DD-MMM-YYYY';
  temperatureUnit: 'C' | 'F';
  pressureUnit: 'kPa' | 'bar' | 'psi';
  defaultTaxRate: number;
  defaultMarginRate: number;
  defaultContingencyRate: number;
}

export interface InventoryAlertNotification {
  id: string;
  materialId: string;
  materialName: string;
  severity: 'critical' | 'warning';
  title: string;
  message: string;
  timestamp: number;
  currentStockKg: number;
  requiredKg: number;
  criticalThresholdKg: number;
  deficitKg: number;
  affectedProjectCount: number;
  read?: boolean;
}

// ----------------------------------------------------
// AI Co-Pilot, SLM Models, Vector RAG & Agent Hub Types
// ----------------------------------------------------

export type KnowledgeDomain =
  | 'paint_chemistry'
  | 'manufacturing_process'
  | 'application_equipment'
  | 'realtime_pricing'
  | 'wall_screening_domain'
  | 'screeding_domain'
  | 'plastering_domain'
  | 'image_video_to_3d'
  | 'agent_coordination'
  | 'app_navigation';

export interface SLMModelInfo {
  id: string;
  name: string;
  family: string;
  parameterCount: string;
  parameterSizeB: number; // e.g. 0.5, 1.1, 1.5, 3.0, 3.8, 7.0, 8.0, 9.0, 12.0
  license: string;
  openSource: boolean;
  quantization: 'Q4_K_M' | 'Q8_0' | 'INT4_ONNX' | 'GGUF_Q4' | 'AWQ' | 'FP16';
  contextWindow: number; // in tokens, e.g. 8192, 32768, 131072
  ramRequiredMb: number;
  tokensPerSecBenchmark: number;
  provider: string;
  description: string;
  specializedDomains: KnowledgeDomain[];
  isDownloadedOffline: boolean;
  downloadSizeMb: number;
  recommendedRole: string;
  strengths: string[];
}

export interface RAGKnowledgeDocument {
  id: string;
  title: string;
  domain: KnowledgeDomain;
  category: string;
  tags: string[];
  summary: string;
  content: string;
  keyFormulas?: string[];
  practicalTips?: string[];
  standardSpecs?: string[];
  relevanceKeywords: string[];
}

export interface RAGSearchResult {
  document: RAGKnowledgeDocument;
  similarityScore: number; // 0 to 1
  matchedSnippet: string;
  matchedKeywords: string[];
}

export interface AICopilotMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system' | 'agent_coordinator';
  text: string;
  timestamp: number;
  modelUsed?: string;
  domain?: KnowledgeDomain;
  ragSources?: RAGSearchResult[];
  suggestedActions?: {
    label: string;
    actionType: 'navigate_estimator' | 'navigate_mixer' | 'open_contacts' | 'open_workspace' | 'open_settings' | 'open_inventory' | 'open_quotation' | 'trigger_3d_scan' | 'trigger_formulation' | 'start_video_call';
    payload?: any;
  }[];
  agentSteps?: {
    agentName: string;
    role: string;
    stepDescription: string;
    status: 'pending' | 'running' | 'completed';
  }[];
  codeOrFormula?: string;
  tokensGenerated?: number;
  latencyMs?: number;
  isStreaming?: boolean;
}

export interface AIAgentDefinition {
  id: string;
  name: string;
  role: string;
  description: string;
  avatarBg: string;
  avatarIcon: string;
  status: 'idle' | 'analyzing' | 'calculating' | 'executing' | 'completed';
  currentTask?: string;
  specialtyDomain: KnowledgeDomain;
  assignedModelId: string;
  completedTasksCount: number;
  capabilities: string[];
}

export interface Reconstruction3DConfig {
  sourceType: 'images' | 'video' | 'lidar_scan';
  algorithm: '3D Gaussian Splatting (3DGS)' | 'Structure from Motion (SfM + MVS)' | 'NeRF Neural Radiance' | 'Poisson Surface Mesh';
  targetPolygonCount: number;
  resolution: 'Draft Fast (1080p)' | 'High Precision (4K)' | 'Industrial Metric (8K Multi-Cam)';
  textureQuality: '512px' | '1024px' | '2048px' | '4096px PBR';
  depthSensorFusion: boolean;
  scaleCalibrationAnchorMm: number;
}

// ----------------------------------------------------
// SmartView Pro™ - SV-003 Camera Acquisition & Local Media Types
// ----------------------------------------------------

export type CaptureType =
  | 'STANDARD_STILL'
  | 'WIDE_ANGLE'
  | 'ELEVATION'
  | 'CLOSE_UP_DEFECT'
  | 'DETAIL';

export const CAPTURE_TYPE_LABELS: Record<CaptureType, { label: string; desc: string }> = {
  STANDARD_STILL: { label: 'Standard Still', desc: 'General field survey capture' },
  WIDE_ANGLE: { label: 'Wide Survey View', desc: 'Broad panoramic architectural elevation' },
  ELEVATION: { label: 'Façade Elevation', desc: 'Direct orthogonal surface record' },
  CLOSE_UP_DEFECT: { label: 'Defect / Crack Detail', desc: 'Substrate spalling or damp inspection' },
  DETAIL: { label: 'Material Joint Detail', desc: 'Structural transition or flashing joint' },
};

export type CameraLifecycleState =
  | 'Idle'
  | 'Initializing'
  | 'Ready'
  | 'Capturing'
  | 'CaptureSuccess'
  | 'CaptureError'
  | 'PermissionRequired'
  | 'CameraUnavailable';

export interface Survey {
  id: string; // e.g., "srv_site_facade_01"
  projectId: string; // Associated parent project
  title: string;
  clientName?: string;
  siteAddress?: string;
  surveyorName?: string;
  notes?: string;
  projectReference?: string;
  clientContact?: string;
  projectType?: string;
  latitude?: number;
  longitude?: number;
  status: 'active' | 'completed' | 'archived';
  description?: string;
  createdAtEpochMs: number;
  lastUpdatedEpochMs: number;
  captureCount?: number;
}

export interface SurveyCapture {
  id: string; // Collision-resistant identifier (e.g., "cap_UUID")
  surveyId: string; // Mandatory non-null Survey association
  localPath: string; // Local storage identifier / URI
  captureType: CaptureType;
  width?: number; // Pixel width
  height?: number; // Pixel height
  fileSizeBytes?: number;
  createdAtEpochMs: number; // Capture timestamp
  notes?: string;
  thumbnailDataUrl?: string; // Fast preview thumbnail
  syncStatus?: 'synced' | 'pending';
}



