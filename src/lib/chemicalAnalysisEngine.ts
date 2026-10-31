/**
 * Chemical Analysis & International Supplier Integration Engine
 * Walnus SmartView Pro / SiteView Pro
 *
 * Provides automated chemical formulation intelligence, open datasheet scraping simulation,
 * ingredient breakdown mapping, and supplier catalog matching (BASF, Dow, Evonik, AkzoNobel, Ashland, Wacker).
 */

export interface ChemicalIngredient {
  id: string;
  name: string;
  casNumber: string;
  category: 'binder' | 'pigment' | 'extender' | 'solvent' | 'additive' | 'hardener';
  percentage: number; // % by weight
  function: string;
  supplierName: string;
  supplierProductCode: string;
  supplierLocation: string;
  densityGcm3: number;
  costPerKgUSD: number;
}

export interface ChemicalFormulation {
  id: string;
  name: string;
  discipline: 'paint' | 'screed' | 'plaster';
  paintType: string;
  description: string;
  vocContentGL: number; // g/L
  solidsByWeightPercent: number;
  solidsByVolumePercent: number;
  pvcPercent: number; // Pigment Volume Concentration
  mixingRatio: string; // e.g. "4:1 Part A to Part B by volume"
  potLifeMinutes: number;
  recoatTimeHours: number;
  fullCureDays: number;
  ingredients: ChemicalIngredient[];
  compatibleSubstrates: string[];
  weatherTolerance: {
    minTempC: number;
    maxTempC: number;
    maxHumidityPercent: number;
  };
  suppliers: SupplierInfo[];
}

export interface SupplierInfo {
  companyName: string;
  headquarters: string;
  contactEmail: string;
  regionalHub: string;
  leadTimeDays: number;
  inStock: boolean;
  minOrderQtyKg: number;
}

export interface ScrapedDataSheet {
  sourceUrl: string;
  title: string;
  scrapedTimestamp: string;
  confidenceScore: number;
  formulation: ChemicalFormulation;
}

// Global Master Supplier Database
export const INTERNATIONAL_SUPPLIERS: SupplierInfo[] = [
  {
    companyName: 'BASF SE',
    headquarters: 'Ludwigshafen, Germany',
    contactEmail: 'industrial.coatings@basf.com',
    regionalHub: 'Frankfurt / Houston / Shanghai',
    leadTimeDays: 3,
    inStock: true,
    minOrderQtyKg: 25,
  },
  {
    companyName: 'Dow Inc.',
    headquarters: 'Midland, Michigan, USA',
    contactEmail: 'construction.materials@dow.com',
    regionalHub: 'Midland / Antwerp / Singapore',
    leadTimeDays: 4,
    inStock: true,
    minOrderQtyKg: 50,
  },
  {
    companyName: 'Evonik Industries AG',
    headquarters: 'Essen, Germany',
    contactEmail: 'coating-additives@evonik.com',
    regionalHub: 'Hanau / Piscataway / Guangzhou',
    leadTimeDays: 2,
    inStock: true,
    minOrderQtyKg: 10,
  },
  {
    companyName: 'Wacker Chemie AG',
    headquarters: 'Munich, Germany',
    contactEmail: 'vinnapas.polymers@wacker.com',
    regionalHub: 'Burghausen / Adrian / Shanghai',
    leadTimeDays: 5,
    inStock: true,
    minOrderQtyKg: 20,
  },
  {
    companyName: 'Ashland Global Holdings',
    headquarters: 'Wilmington, Delaware, USA',
    contactEmail: 'specialty.additives@ashland.com',
    regionalHub: 'Wilmington / Rotterdam / Tokyo',
    leadTimeDays: 4,
    inStock: true,
    minOrderQtyKg: 15,
  },
  {
    companyName: 'AkzoNobel N.V.',
    headquarters: 'Amsterdam, Netherlands',
    contactEmail: 'performance.coatings@akzonobel.com',
    regionalHub: 'Amsterdam / Chicago / Singapore',
    leadTimeDays: 3,
    inStock: true,
    minOrderQtyKg: 30,
  },
];

// Preserved Formulation Knowledge Base
export const KNOWN_FORMULATIONS: ChemicalFormulation[] = [
  {
    id: 'form-epoxy-heavy-duty',
    name: 'Industrial High-Solids Two-Component Epoxy Floor Coating',
    discipline: 'screed',
    paintType: 'Industrial Epoxy Floor',
    description: '100% solids structural epoxy resin system with micro-silica reinforcement for extreme abrasion and chemical exposure.',
    vocContentGL: 12,
    solidsByWeightPercent: 98.5,
    solidsByVolumePercent: 97.0,
    pvcPercent: 22,
    mixingRatio: '4:1 (Part A Base : Part B Hardener by Weight)',
    potLifeMinutes: 35,
    recoatTimeHours: 12,
    fullCureDays: 7,
    compatibleSubstrates: ['concrete', 'screed', 'masonry', 'steel'],
    weatherTolerance: { minTempC: 10, maxTempC: 38, maxHumidityPercent: 80 },
    ingredients: [
      {
        id: 'ing-1',
        name: 'Bisphenol-A Diglycidyl Ether (DGEBA Epoxy Resin)',
        casNumber: '25068-38-6',
        category: 'binder',
        percentage: 42.0,
        function: 'Primary structural crosslinking film former',
        supplierName: 'Dow Inc.',
        supplierProductCode: 'D.E.R. 331™ Liquid Epoxy',
        supplierLocation: 'USA / EU',
        densityGcm3: 1.16,
        costPerKgUSD: 4.85,
      },
      {
        id: 'ing-2',
        name: 'Cycloaliphatic Amine Hardener (IPDA Crosslinker)',
        casNumber: '2855-13-2',
        category: 'hardener',
        percentage: 18.0,
        function: 'Rapid ambient cure hardener with high UV resistance',
        supplierName: 'Evonik Industries AG',
        supplierProductCode: 'VESTAMIN® IPD',
        supplierLocation: 'Germany',
        densityGcm3: 0.92,
        costPerKgUSD: 8.40,
      },
      {
        id: 'ing-3',
        name: 'Micronized Titanium Dioxide (Rutile TiO2)',
        casNumber: '13463-67-7',
        category: 'pigment',
        percentage: 15.0,
        function: 'Prime opacity, brightness and UV shielding',
        supplierName: 'BASF SE',
        supplierProductCode: 'Kronos® 2310 / BASF MasterColor',
        supplierLocation: 'Germany',
        densityGcm3: 4.23,
        costPerKgUSD: 3.20,
      },
      {
        id: 'ing-4',
        name: 'Ultra-Fine Crystalline Silica & Barium Sulfate',
        casNumber: '7727-43-7',
        category: 'extender',
        percentage: 22.5,
        function: 'Abrasion resistance, mechanical compression strength',
        supplierName: 'Ashland Global Holdings',
        supplierProductCode: 'Barimite® Micro-Filler',
        supplierLocation: 'USA',
        densityGcm3: 4.45,
        costPerKgUSD: 0.95,
      },
      {
        id: 'ing-5',
        name: 'Polysiloxane Defoamer & Reactive Silane Agent',
        casNumber: '1760-24-3',
        category: 'additive',
        percentage: 2.5,
        function: 'De-aeration, surface leveling, and substrate adhesion promoter',
        supplierName: 'Wacker Chemie AG',
        supplierProductCode: 'GENIOSIL® GF 93 Silane',
        supplierLocation: 'Germany',
        densityGcm3: 1.02,
        costPerKgUSD: 14.20,
      },
    ],
    suppliers: INTERNATIONAL_SUPPLIERS,
  },
  {
    id: 'form-acrylic-ext',
    name: 'Elastomeric Masonry 100% Pure Acrylic Exterior Architectural Finish',
    discipline: 'paint',
    paintType: 'Exterior Acrylic Masonry',
    description: 'High-flexibility weather-proof acrylic latex paint designed for masonry and plaster over-coatings with crack-bridging capability.',
    vocContentGL: 45,
    solidsByWeightPercent: 54.0,
    solidsByVolumePercent: 42.5,
    pvcPercent: 38,
    mixingRatio: 'Single Component (Ready to Use)',
    potLifeMinutes: 480,
    recoatTimeHours: 4,
    fullCureDays: 3,
    compatibleSubstrates: ['plaster', 'concrete', 'stucco', 'brick', 'drywall'],
    weatherTolerance: { minTempC: 5, maxTempC: 42, maxHumidityPercent: 88 },
    ingredients: [
      {
        id: 'ing-ext-1',
        name: '100% Pure Acrylic Emulsion Polymer (Tg = 12°C)',
        casNumber: '25852-37-3',
        category: 'binder',
        percentage: 35.0,
        function: 'Flexible weather-resistant binder with dirt pickup resistance',
        supplierName: 'Dow Inc.',
        supplierProductCode: 'PRIMAL™ AC-261K Binder',
        supplierLocation: 'USA / Europe',
        densityGcm3: 1.06,
        costPerKgUSD: 3.10,
      },
      {
        id: 'ing-ext-2',
        name: 'Rutile Titanium Dioxide Pigment',
        casNumber: '13463-67-7',
        category: 'pigment',
        percentage: 18.0,
        function: 'Hiding power and solar reflectance',
        supplierName: 'AkzoNobel N.V.',
        supplierProductCode: 'Akzo TiO2 Pure White',
        supplierLocation: 'Netherlands',
        densityGcm3: 4.20,
        costPerKgUSD: 3.15,
      },
      {
        id: 'ing-ext-3',
        name: 'Calcium Carbonate & Micro-Kaolin Clay Filler',
        casNumber: '471-34-1',
        category: 'extender',
        percentage: 24.0,
        function: 'Matte sheen control and rheological bodying',
        supplierName: 'BASF SE',
        supplierProductCode: 'BASF PlastoFiller 500',
        supplierLocation: 'Germany',
        densityGcm3: 2.71,
        costPerKgUSD: 0.45,
      },
      {
        id: 'ing-ext-4',
        name: 'Water & Ester Alcohol Coalescent (Texanol Equivalent)',
        casNumber: '25265-77-4',
        category: 'solvent',
        percentage: 20.0,
        function: 'Continuous film formation matrix at low ambient temps',
        supplierName: 'Ashland Global Holdings',
        supplierProductCode: 'Ashland Coalesce 2000',
        supplierLocation: 'USA',
        densityGcm3: 1.00,
        costPerKgUSD: 1.80,
      },
      {
        id: 'ing-ext-5',
        name: 'Hydroxyethyl Cellulose (HEC) & TEGO® Rheology Modifier',
        casNumber: '9004-62-0',
        category: 'additive',
        percentage: 3.0,
        function: 'Thixotropic anti-sag control, open time extender, and spatter control',
        supplierName: 'Evonik Industries AG',
        supplierProductCode: 'TEGO® ViscoPlus 3030',
        supplierLocation: 'Germany',
        densityGcm3: 1.10,
        costPerKgUSD: 11.50,
      },
    ],
    suppliers: INTERNATIONAL_SUPPLIERS,
  },
  {
    id: 'form-polymer-plaster',
    name: 'Fibre-Reinforced Polymer Hydrophobic Lime Plaster Render',
    discipline: 'plaster',
    paintType: 'Polymer Lime Plaster',
    description: 'Mineral hydraulic lime plaster enriched with redispersible polymer powder and micro-glass fibers for breathability and structural crack mitigation.',
    vocContentGL: 0,
    solidsByWeightPercent: 100.0,
    solidsByVolumePercent: 100.0,
    pvcPercent: 65,
    mixingRatio: '1 Bag (25kg) Dry Mix to 5.5L Water',
    potLifeMinutes: 90,
    recoatTimeHours: 24,
    fullCureDays: 14,
    compatibleSubstrates: ['brick', 'blockwork', 'aerated concrete', 'existing render'],
    weatherTolerance: { minTempC: 5, maxTempC: 35, maxHumidityPercent: 85 },
    ingredients: [
      {
        id: 'ing-pls-1',
        name: 'Hydraulic Lime (NHL 3.5) & Portland Cement Binder',
        casNumber: '1305-62-0',
        category: 'binder',
        percentage: 28.0,
        function: 'Primary hydraulic binder providing vapor permeability',
        supplierName: 'BASF SE',
        supplierProductCode: 'BASF MasterEmaco® Binder',
        supplierLocation: 'Germany',
        densityGcm3: 2.20,
        costPerKgUSD: 0.35,
      },
      {
        id: 'ing-pls-2',
        name: 'Redispersible Polymer Powder (Ethylene-Vinyl Acetate / VAE)',
        casNumber: '24937-78-8',
        category: 'binder',
        percentage: 6.5,
        function: 'Flexural strength, tensile adhesion and water repulsion',
        supplierName: 'Wacker Chemie AG',
        supplierProductCode: 'VINNAPAS® 5044 N Polymer Powder',
        supplierLocation: 'Germany',
        densityGcm3: 1.15,
        costPerKgUSD: 4.20,
      },
      {
        id: 'ing-pls-3',
        name: 'Graded Quartz Sands (0.1mm - 1.2mm Aggregate)',
        casNumber: '14808-60-7',
        category: 'extender',
        percentage: 62.0,
        function: 'Aggregate matrix for mechanical thickness and thermal stability',
        supplierName: 'Dow Inc.',
        supplierProductCode: 'Dow Aggregate Silica Pack',
        supplierLocation: 'USA / EU',
        densityGcm3: 2.65,
        costPerKgUSD: 0.18,
      },
      {
        id: 'ing-pls-4',
        name: 'Alkyl Trialkoxysilane Hydrophobic Agent & Fibers',
        casNumber: '2943-75-1',
        category: 'additive',
        percentage: 3.5,
        function: 'Water beading action, efflorescence inhibitor and shear crack control',
        supplierName: 'Evonik Industries AG',
        supplierProductCode: 'PROTECTOSIL® DRY CIT',
        supplierLocation: 'Germany',
        densityGcm3: 0.95,
        costPerKgUSD: 9.80,
      },
    ],
    suppliers: INTERNATIONAL_SUPPLIERS,
  },
];

/**
 * Simulates an automated web scraper / intelligence agent that crawls open
 * supplier datasheets, patents, and technical literature for chemical formulations.
 */
export async function scrapeOpenFormulationsAgent(
  searchQuery: string,
  targetDiscipline: 'paint' | 'screed' | 'plaster'
): Promise<ScrapedDataSheet[]> {
  // Simulate network latency for automated scraping agent
  await new Promise((resolve) => setTimeout(resolve, 600));

  const filtered = KNOWN_FORMULATIONS.filter(
    (f) => f.discipline === targetDiscipline || searchQuery.toLowerCase().includes(f.paintType.toLowerCase())
  );

  const results: ScrapedDataSheet[] = (filtered.length > 0 ? filtered : KNOWN_FORMULATIONS).map((f) => ({
    sourceUrl: `https://chemical-datasheets.open-coatings.org/spec/${f.id}.pdf`,
    title: `Scraped Datasheet: ${f.name} (${f.paintType})`,
    scrapedTimestamp: new Date().toISOString(),
    confidenceScore: 0.94 + Math.random() * 0.05,
    formulation: f,
  }));

  return results;
}

/**
 * Matches scanned surface metrics (from LiDAR / Camera) with international
 * chemical supplier ingredient lists and formulation datasets.
 */
export function matchSurfaceToChemicalFormulation(params: {
  discipline: 'paint' | 'screed' | 'plaster';
  paintType: string;
  surfaceAreaSqFt: number;
  locationRegion?: string;
  humidityPercent?: number;
  tempCelsius?: number;
}): {
  matchedFormulation: ChemicalFormulation;
  ingredientBreakdownKg: { ingredient: ChemicalIngredient; requiredKg: number; totalCostUSD: number }[];
  totalMaterialCostUSD: number;
  recommendedSuppliers: SupplierInfo[];
  batchMixingInstructions: string[];
} {
  // Select best formulation match
  const matched =
    KNOWN_FORMULATIONS.find((f) => f.discipline === params.discipline) || KNOWN_FORMULATIONS[0];

  // Calculate required volume & weight
  // Rule of thumb: 1 gallon paint covers ~350 sq ft (~3.785 liters, ~4.5 kg)
  const estimatedGallons = Math.max(1, params.surfaceAreaSqFt / 300);
  const totalWeightKg = estimatedGallons * 4.8; // Approx 4.8kg per gallon

  const ingredientBreakdownKg = matched.ingredients.map((ing) => {
    const requiredKg = Number(((totalWeightKg * ing.percentage) / 100).toFixed(2));
    const totalCostUSD = Number((requiredKg * ing.costPerKgUSD).toFixed(2));
    return {
      ingredient: ing,
      requiredKg,
      totalCostUSD,
    };
  });

  const totalMaterialCostUSD = Number(
    ingredientBreakdownKg.reduce((acc, i) => acc + i.totalCostUSD, 0).toFixed(2)
  );

  const batchMixingInstructions = [
    `1. Measure Part A Base (${(totalWeightKg * 0.7).toFixed(1)} kg) into a clean stainless mixing vessel.`,
    `2. High-shear disperse prime pigments (TiO2 & Extenders) at 1200 RPM for 15 minutes.`,
    `3. Slow mixing speed to 400 RPM and introduce ${matched.ingredients.find((i) => i.category === 'additive')?.supplierProductCode || 'Defoamer Additive'}.`,
    `4. Under ambient temperature (${params.tempCelsius || 22}°C), introduce hardener/binder component and agitate for 3 minutes before site application.`,
    `5. Apply within pot-life window of ${matched.potLifeMinutes} minutes.`,
  ];

  return {
    matchedFormulation: matched,
    ingredientBreakdownKg,
    totalMaterialCostUSD,
    recommendedSuppliers: matched.suppliers,
    batchMixingInstructions,
  };
}
