import { MarketMaterialItem, QuotationLineItem, ProjectSourcePackage, PaintProject, SiteContact, DraftQuotation } from '../types';
import { generateId } from '../lib/utils';

export const AUTONOMOUS_MARKET_MATERIALS: MarketMaterialItem[] = [
  {
    id: 'mat_wall_vae_01',
    name: 'Redispersible VAE Polymer Binder Powder (Wall Screed Grade)',
    casNumber: '24937-78-8',
    category: 'Wall Polymer Binder',
    spotPricePerKg: 3.15,
    marketTrend: 'stable',
    trendPercentage: -0.4,
    supplier: 'Wacker Polymers Wall Logistics Depot',
    leadTimeDays: 1,
    stockAvailability: 'Immediate Dispatch',
    confidenceScore: 99.2,
    requiredAmountKg: 240.0,
    notes: 'Autonomous agent benchmarked spot price across 14 European & US wall polymer suppliers. Tensile adhesion >0.95 MPa.'
  },
  {
    id: 'mat_wall_mortar_02',
    name: 'Polymer-Modified Anti-Crack Wall Screening Mortar',
    casNumber: '65997-15-1',
    category: 'Wall Screening Mortar',
    spotPricePerKg: 1.85,
    marketTrend: 'down',
    trendPercentage: -1.2,
    supplier: 'Knauf WallScreed Specialty Supply',
    leadTimeDays: 1,
    stockAvailability: 'In Stock',
    confidenceScore: 98.8,
    requiredAmountKg: 480.0,
    notes: 'High-yield fine grain formula (32 sq ft @ 3mm depth per 25kg bag). EN 998-1 Class CS IV.'
  },
  {
    id: 'mat_wall_marble_03',
    name: 'Micronized Marble Dust & Fine Silica (Wall Skim Filler)',
    casNumber: '1317-65-3',
    category: 'Wall Fine Filler',
    spotPricePerKg: 0.72,
    marketTrend: 'stable',
    trendPercentage: 0.1,
    supplier: 'Omya Wall Mineral Fillers Hub',
    leadTimeDays: 2,
    stockAvailability: 'In Stock',
    confidenceScore: 97.5,
    requiredAmountKg: 320.0,
    notes: 'Ultra-fine 15μm particle distribution for silky-smooth troweled wall screening finish.'
  },
  {
    id: 'mat_wall_hpmc_04',
    name: 'HPMC Cellulosic Wall Thickener & Water Retainer',
    casNumber: '9004-65-3',
    category: 'Wall Performance Additive',
    spotPricePerKg: 7.80,
    marketTrend: 'up',
    trendPercentage: 1.5,
    supplier: 'Ashland Wall Rheology Solutions',
    leadTimeDays: 2,
    stockAvailability: 'In Stock',
    confidenceScore: 96.9,
    requiredAmountKg: 28.0,
    notes: 'Extends open trowel time to 45 mins, prevents sag on vertical wall applications.'
  },
  {
    id: 'mat_wall_primer_05',
    name: 'Alkali-Resistant Acrylic Wall Bonding Primer',
    casNumber: '25085-34-1',
    category: 'Wall Primer & Keying',
    spotPricePerKg: 2.45,
    marketTrend: 'stable',
    trendPercentage: -0.2,
    supplier: 'Brenntag Wall Chemicals Depot',
    leadTimeDays: 1,
    stockAvailability: 'Immediate Dispatch',
    confidenceScore: 99.4,
    requiredAmountKg: 120.0,
    notes: 'Seals porous blockwork & plaster walls, preventing moisture suction during screening coat.'
  },
  {
    id: 'mat_wall_fibers_06',
    name: 'Polypropylene Anti-Crack Micro-Fibres (6mm Wall Grade)',
    casNumber: '9003-07-0',
    category: 'Wall Fiber Reinforcement',
    spotPricePerKg: 5.60,
    marketTrend: 'down',
    trendPercentage: -2.1,
    supplier: 'Sika Wall Construction Fibers',
    leadTimeDays: 2,
    stockAvailability: 'Immediate Dispatch',
    confidenceScore: 98.1,
    requiredAmountKg: 35.0,
    notes: 'Eliminates micro-cracking in high-build wall screening coats up to 8mm depth.'
  },
  {
    id: 'mat_wall_mesh_07',
    name: 'Alkali-Resistant Fibreglass Wall Joint Mesh Grid (160g)',
    casNumber: '65997-17-3',
    category: 'Wall Joint Reinforcement',
    spotPricePerKg: 1.25,
    marketTrend: 'stable',
    trendPercentage: 0.0,
    supplier: 'Saint-Gobain ADFORS Wall Systems',
    leadTimeDays: 1,
    stockAvailability: 'Immediate Dispatch',
    confidenceScore: 99.7,
    requiredAmountKg: 150.0,
    notes: 'Prevents structural movement cracks across blockwork joints & lintel transitions.'
  },
  {
    id: 'mat_wall_tio2_08',
    name: 'Titanium Dioxide Rutile Base (Wall Opacifier R-902+)',
    casNumber: '13463-67-7',
    category: 'Wall Base Pigment',
    spotPricePerKg: 3.45,
    marketTrend: 'down',
    trendPercentage: -0.8,
    supplier: 'ChemPoint Wall Pigments Depot',
    leadTimeDays: 2,
    stockAvailability: 'Immediate Dispatch',
    confidenceScore: 98.6,
    requiredAmountKg: 110.0,
    notes: 'Provides crisp white substrate base for decorative wall smoothing compounds.'
  }
];

export function buildProjectSourcePackage(
  project: PaintProject,
  activeContact?: SiteContact
): ProjectSourcePackage {
  return {
    schemaVersion: '2.4.0-ecosystem-full',
    exportTimestamp: Date.now(),
    checksumSha256: `sha256_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}`,
    project: {
      ...project,
    },
    environmentConditions: {
      substrateTempCelsius: 21.4,
      relativeHumidity: 54.2,
      dewPointSpread: 4.8,
      atmosphericPressureKpa: 101.3,
    },
    formulationBreakdown: {
      basePigments: [
        { name: 'Titanium Dioxide R-996', percentage: 28.5, costPerKg: 3.42 },
        { name: 'PB15:3 Dispersion Tone', percentage: 4.2, costPerKg: 12.85 },
      ],
      additives: [
        { name: 'Acrylic Elastomer Copolymer', percentage: 42.0, costPerKg: 2.18 },
        { name: 'Silane Hydrophobic Additive', percentage: 6.5, costPerKg: 7.95 },
        { name: 'Zinc Phosphate Inhibitor', percentage: 5.8, costPerKg: 4.60 },
        { name: 'Coalescent Matrix & Biocide', percentage: 13.0, costPerKg: 0.95 },
      ],
      viscosityCps: 2450,
      vocGramsPerLiter: 14.8,
      theoreticalCoverageSqFtPerGal: 350,
    },
    meshMetadata: {
      vertexCount: 48920,
      polygonCount: 97840,
      lidarAccuracyMm: 1.2,
      scanSensor: 'TrueDepth LiDAR Field Telemetry Array',
    },
    assignedTeam: {
      engineer: 'Alex Mercer (SSPC NACE-3)',
      painter: 'Elena Rostova (Master Painter)',
      manager: 'Marcus Vance (Site Logistics)',
      bricklayer: 'David Ross (Substrate Prep)',
    },
  };
}

export function generateDefaultQuotation(
  project: PaintProject,
  targetContact: SiteContact
): DraftQuotation {
  const sqft = project.surfaceAreaSqFt || 2450;
  const gallons = project.volumeGallons || Math.round((sqft / 350) * 100) / 100;
  
  const rawMatCost = Math.round(gallons * 34.5 * 100) / 100;
  const prepCost = Math.round(sqft * 0.45 * 100) / 100;
  const laborCost = Math.round(sqft * 1.35 * 100) / 100;
  const equipmentCost = 450.0;
  const inspectionCost = 350.0;

  const lineItems: QuotationLineItem[] = [
    {
      id: 'item_mat_1',
      category: 'Materials',
      description: `Formulated ${project.paintType} (High-Durability Exterior Formulation, ${gallons} Gallons)`,
      quantity: gallons,
      unit: 'Gallons',
      unitRate: 34.50,
      total: rawMatCost,
      isEditable: true,
    },
    {
      id: 'item_prep_2',
      category: 'Substrate Prep',
      description: 'Surface Mechanical Abrasion, Hydro-wash & Primer Keying (SSPC-SP13)',
      quantity: sqft,
      unit: 'Sq Ft',
      unitRate: 0.45,
      total: prepCost,
      isEditable: true,
    },
    {
      id: 'item_labor_3',
      category: 'Labor',
      description: 'Certified Dual-Coat Airless Spray Application & Cut-in Work',
      quantity: sqft,
      unit: 'Sq Ft',
      unitRate: 1.35,
      total: laborCost,
      isEditable: true,
    },
    {
      id: 'item_equip_4',
      category: 'Equipment',
      description: 'High-Pressure Hydraulic Graco Rig & Mobile Scaffolding Tower Rental',
      quantity: 3,
      unit: 'Days',
      unitRate: 150.00,
      total: equipmentCost,
      isEditable: true,
    },
    {
      id: 'item_qc_5',
      category: 'Quality & Compliance',
      description: 'Dry Film Thickness (DFT) Elcometer Verification & NACE Compliance Sign-off',
      quantity: 1,
      unit: 'Audit',
      unitRate: 350.00,
      total: inspectionCost,
      isEditable: true,
    },
  ];

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const marginPercent = 18;
  const taxPercent = 8.5;
  const contingencyPercent = 5;

  const marginAmount = Math.round(subtotal * (marginPercent / 100) * 100) / 100;
  const contingencyAmount = Math.round(subtotal * (contingencyPercent / 100) * 100) / 100;
  const taxableBase = subtotal + marginAmount + contingencyAmount;
  const taxAmount = Math.round(taxableBase * (taxPercent / 100) * 100) / 100;
  const total = Math.round((taxableBase + taxAmount) * 100) / 100;

  return {
    id: generateId(),
    projectId: project.id,
    projectName: project.name || 'Commercial Façade Coating Project',
    quotationNumber: `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    targetContact,
    version: 1.0,
    lineItems,
    contractorMarginPercent: marginPercent,
    taxRatePercent: taxPercent,
    contingencyPercent,
    subtotal,
    marginAmount,
    taxAmount,
    contingencyAmount,
    total,
    paymentTerms: '30% Deposit upon Substrate Sign-off, 40% Intermediate Coat, 30% Final DFT Handover',
    validityDays: 30,
    lastUpdated: Date.now(),
    status: 'draft',
  };
}
