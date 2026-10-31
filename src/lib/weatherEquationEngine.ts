// Real-World Weather & Site Parameter Mathematical Equation Engine
// Integrates Sq Meters (m²), Paint Types, Quality Grades, and Real-World Weather Factors

export type PaintTypeKey =
  | 'acrylic_latex'
  | '2k_epoxy'
  | 'aliphatic_polyurethane'
  | 'masonry_elastomeric'
  | 'pvdf_fluoropolymer'
  | 'siloxane_waterproof'
  | 'zinc_anti_corrosive';

export type QualityGrade = 'low' | 'standard' | 'high';

export interface PaintTypeDefinition {
  key: PaintTypeKey;
  name: string;
  category: string;
  defaultVolumeSolidsPercent: number; // e.g., 42%
  defaultTargetDftMicrons: number; // e.g., 50 µm
  baseTheoreticalCoverageSqMPerLiter: number; // e.g. 10.5 m²/L at 40µm
  baseDryTimeHours: number; // at 20°C, 50% RH
  recoatWindowMinHours: number;
  recoatWindowMaxHours: number;
  maxHumidityPercentThreshold: number; // e.g. 80%
  minTempCelsiusThreshold: number; // e.g. 10°C
  maxWindKmHThreshold: number; // e.g. 20 km/h
  description: string;
}

export const PAINT_TYPES_REGISTRY: Record<PaintTypeKey, PaintTypeDefinition> = {
  acrylic_latex: {
    key: 'acrylic_latex',
    name: 'Architectural Acrylic Latex',
    category: 'Waterborne Exterior/Interior',
    defaultVolumeSolidsPercent: 42,
    defaultTargetDftMicrons: 45,
    baseTheoreticalCoverageSqMPerLiter: 10.2,
    baseDryTimeHours: 2.0,
    recoatWindowMinHours: 4,
    recoatWindowMaxHours: 24,
    maxHumidityPercentThreshold: 80,
    minTempCelsiusThreshold: 10,
    maxWindKmHThreshold: 22,
    description: 'Versatile water-based coating with high breathability and UV color retention.',
  },
  '2k_epoxy': {
    key: '2k_epoxy',
    name: '2K Polyamide Epoxy Resin System',
    category: 'Industrial High-Build Heavy Duty',
    defaultVolumeSolidsPercent: 68,
    defaultTargetDftMicrons: 125,
    baseTheoreticalCoverageSqMPerLiter: 5.4,
    baseDryTimeHours: 6.0,
    recoatWindowMinHours: 12,
    recoatWindowMaxHours: 48,
    maxHumidityPercentThreshold: 75,
    minTempCelsiusThreshold: 12,
    maxWindKmHThreshold: 18,
    description: 'Two-pack high solids barrier coat with extreme chemical and abrasion resistance.',
  },
  aliphatic_polyurethane: {
    key: 'aliphatic_polyurethane',
    name: 'Aliphatic Polyurethane Finish',
    category: 'High-Gloss Marine & Architectural',
    defaultVolumeSolidsPercent: 58,
    defaultTargetDftMicrons: 60,
    baseTheoreticalCoverageSqMPerLiter: 9.6,
    baseDryTimeHours: 4.0,
    recoatWindowMinHours: 8,
    recoatWindowMaxHours: 36,
    maxHumidityPercentThreshold: 78,
    minTempCelsiusThreshold: 8,
    maxWindKmHThreshold: 20,
    description: 'Non-yellowing UV stable glossy topcoat for steelwork, claddings, and bridges.',
  },
  masonry_elastomeric: {
    key: 'masonry_elastomeric',
    name: 'Masonry Elastomeric Waterproofing',
    category: 'Crack-Bridging Façade Membrane',
    defaultVolumeSolidsPercent: 55,
    defaultTargetDftMicrons: 250,
    baseTheoreticalCoverageSqMPerLiter: 2.2,
    baseDryTimeHours: 5.0,
    recoatWindowMinHours: 12,
    recoatWindowMaxHours: 72,
    maxHumidityPercentThreshold: 85,
    minTempCelsiusThreshold: 10,
    maxWindKmHThreshold: 25,
    description: 'High-build elastic coating engineered to bridge hairline structural masonry cracks.',
  },
  pvdf_fluoropolymer: {
    key: 'pvdf_fluoropolymer',
    name: 'PVDF Fluoropolymer Architectural Topcoat',
    category: 'Ultra-Premium Metallic Façade',
    defaultVolumeSolidsPercent: 48,
    defaultTargetDftMicrons: 35,
    baseTheoreticalCoverageSqMPerLiter: 13.7,
    baseDryTimeHours: 1.5,
    recoatWindowMinHours: 3,
    recoatWindowMaxHours: 12,
    maxHumidityPercentThreshold: 70,
    minTempCelsiusThreshold: 15,
    maxWindKmHThreshold: 15,
    description: 'Fluorocarbon coating offering 30+ year chalking and corrosion resistance.',
  },
  siloxane_waterproof: {
    key: 'siloxane_waterproof',
    name: 'Siloxane Hydrophobic Sealer Membrane',
    category: 'Deep Penetrating Masonry Barrier',
    defaultVolumeSolidsPercent: 35,
    defaultTargetDftMicrons: 80,
    baseTheoreticalCoverageSqMPerLiter: 6.8,
    baseDryTimeHours: 3.0,
    recoatWindowMinHours: 6,
    recoatWindowMaxHours: 24,
    maxHumidityPercentThreshold: 82,
    minTempCelsiusThreshold: 5,
    maxWindKmHThreshold: 25,
    description: 'Silane-siloxane breathability barrier preventing efflorescence and damp ingress.',
  },
  zinc_anti_corrosive: {
    key: 'zinc_anti_corrosive',
    name: 'Heavy-Duty Zinc-Rich Anti-Corrosive Primer',
    category: 'Cathodic Sacrificial Structural Primer',
    defaultVolumeSolidsPercent: 62,
    defaultTargetDftMicrons: 75,
    baseTheoreticalCoverageSqMPerLiter: 8.2,
    baseDryTimeHours: 1.0,
    recoatWindowMinHours: 4,
    recoatWindowMaxHours: 48,
    maxHumidityPercentThreshold: 85,
    minTempCelsiusThreshold: 5,
    maxWindKmHThreshold: 20,
    description: 'High metallic zinc dust content providing galvanic corrosion protection for steel.',
  },
};

export interface QualityGradeDefinition {
  grade: QualityGrade;
  name: string;
  volumeSolidsModifier: number; // Multiplier on volume solids
  consumptionMultiplier: number; // Multiplier on final material needed
  durabilityYears: number;
  costMultiplier: number;
  description: string;
}

export const QUALITY_GRADES_REGISTRY: Record<QualityGrade, QualityGradeDefinition> = {
  low: {
    grade: 'low',
    name: 'Economy / Builder Grade',
    volumeSolidsModifier: 0.82, // lower solids, more volume needed
    consumptionMultiplier: 1.22, // +22% material needed due to lower hiding power
    durabilityYears: 3,
    costMultiplier: 0.78,
    description: 'Budget-focused formula. Requires extra coats due to lower pigment concentration.',
  },
  standard: {
    grade: 'standard',
    name: 'Standard Commercial Grade',
    volumeSolidsModifier: 1.0,
    consumptionMultiplier: 1.0,
    durabilityYears: 7,
    costMultiplier: 1.0,
    description: 'Industry benchmark coating balanced for optimal durability, coverage, and cost.',
  },
  high: {
    grade: 'high',
    name: 'Industrial Premium High-Durability',
    volumeSolidsModifier: 1.18, // higher solids, superior film build
    consumptionMultiplier: 0.88, // -12% volume required for same opacity
    durabilityYears: 15,
    costMultiplier: 1.35,
    description: 'Ultra-dense solids matrix. Superior film thickness retention and 15-year weather resistance.',
  },
};

export interface SiteParametersInput {
  siteAreaSqFt: number;
  siteAreaSqMeters: number;
  paintTypeKey: PaintTypeKey;
  qualityGrade: QualityGrade;
  coatsCount: number;
  surfacePorosity: 'smooth' | 'medium' | 'porous' | 'heavy_textured';
  applicationMethod: 'airless_spray' | 'roller_brush' | 'hvlp' | 'dip_flow';
}

export interface RealWorldWeatherInput {
  temperatureCelsius: number;
  relativeHumidityPercent: number;
  dewPointCelsius: number;
  windSpeedKmH: number;
  uvIndex: number;
  rainProbabilityPercent: number;
  barometricPressureKpa: number;
  locationName: string;
  lat: number;
  lng: number;
}

export interface FormulationTargetOutput {
  areaSqMeters: number;
  areaSqFt: number;
  paintTypeName: string;
  qualityGradeName: string;
  
  // Mathematical Factors Used
  baseVolumeSolidsPercent: number;
  adjustedVolumeSolidsPercent: number;
  
  qualityMultiplier: number;
  humidityLossMultiplier: number;
  windLossMultiplier: number;
  temperatureLossMultiplier: number;
  surfaceLossMultiplier: number;
  totalCombinedEnvironmentalFactor: number;

  // Calculated Volumes
  baseTheoreticalLiters: number;
  totalAdjustedLiters: number;
  totalAdjustedGallons: number;
  
  // Film Thickness & Curing Specs
  wetFilmThicknessMicrons: number; // WFT
  targetDryFilmThicknessMicrons: number; // DFT
  calculatedDryTimeToTouchHours: number;
  calculatedRecoatWindowHours: number;
  fullCureDays: number;

  // Real-world job feasibility analysis
  feasibilityStatus: 'optimal' | 'caution' | 'warning' | 'unsuitable';
  feasibilityScorePercent: number; // 0 to 100%
  copilotAdviceNotes: string[];
}

/**
 * Core Mathematical Calculation Equation
 * Solves total paint requirement and curing parameters based on Site Area (m²/ft²), Paint Type, Quality Grade, and Weather Factors.
 */
export function calculateSiteFormulationTarget(
  siteParams: SiteParametersInput,
  weather: RealWorldWeatherInput
): FormulationTargetOutput {
  const paintDef = PAINT_TYPES_REGISTRY[siteParams.paintTypeKey] || PAINT_TYPES_REGISTRY.acrylic_latex;
  const qualityDef = QUALITY_GRADES_REGISTRY[siteParams.qualityGrade] || QUALITY_GRADES_REGISTRY.standard;

  // 1. Convert/Synchronize Site Area (m² <-> sq ft)
  const areaSqFt = siteParams.siteAreaSqFt > 0 ? siteParams.siteAreaSqFt : Math.round(siteParams.siteAreaSqMeters * 10.7639);
  const areaSqMeters = parseFloat((areaSqFt / 10.7639).toFixed(2));

  // 2. Base Volume Solids calculation
  const baseSolids = paintDef.defaultVolumeSolidsPercent;
  const adjustedSolids = Math.min(85, Math.max(25, baseSolids * qualityDef.volumeSolidsModifier));

  // 3. Target Dry Film Thickness (DFT)
  const targetDft = paintDef.defaultTargetDftMicrons;

  // 4. Base Theoretical Liters Needed (Pure math without weather losses)
  // Formula: Liters = (Area_m² * Coats * Target_DFT_µm) / (10 * Vol_Solids_%)
  const baseLiters = (areaSqMeters * siteParams.coatsCount * targetDft) / (10 * adjustedSolids);

  // 5. Calculate Environmental Multiplier Equation Factors
  
  // A. Quality Multiplier Factor
  const Q_factor = qualityDef.consumptionMultiplier;

  // B. Relative Humidity Multiplier
  // High humidity (>70%) impedes solvent/water evaporation, increasing required film allowance
  let H_factor = 1.0;
  if (weather.relativeHumidityPercent > 70) {
    H_factor = 1.0 + (weather.relativeHumidityPercent - 70) * 0.007; // e.g. 90% RH = +14% allowance
  } else if (weather.relativeHumidityPercent < 30) {
    H_factor = 1.04; // Dry rapid evaporation risk allowance
  }

  // C. Wind Loss Multiplier (Overspray / atomization drift)
  let W_factor = 1.0;
  if (weather.windSpeedKmH > 10) {
    const sprayExtra = siteParams.applicationMethod === 'airless_spray' ? 0.018 : 0.008;
    W_factor = 1.0 + (weather.windSpeedKmH - 10) * sprayExtra; // e.g. 25km/h spray = +27% overspray loss
  }

  // D. Temperature Penalty Multiplier
  let T_factor = 1.0;
  if (weather.temperatureCelsius < 12) {
    T_factor = 1.0 + (12 - weather.temperatureCelsius) * 0.015; // Low temp viscosity thickening allowance
  } else if (weather.temperatureCelsius > 32) {
    T_factor = 1.0 + (weather.temperatureCelsius - 32) * 0.012; // High temp flash dry skinning loss
  }

  // E. Substrate Surface Porosity Multiplier
  const surfaceMultipliers = {
    smooth: 1.0,
    medium: 1.08,
    porous: 1.22,
    heavy_textured: 1.35,
  };
  const S_factor = surfaceMultipliers[siteParams.surfacePorosity] || 1.0;

  // Combined Environmental Factor
  const totalEnvFactor = Q_factor * H_factor * W_factor * T_factor * S_factor;

  // 6. Total Adjusted Liters & Gallons
  const totalAdjustedLiters = parseFloat((baseLiters * totalEnvFactor).toFixed(2));
  const totalAdjustedGallons = parseFloat((totalAdjustedLiters / 3.78541).toFixed(2));

  // 7. Wet Film Thickness (WFT) Calculation
  // WFT = (DFT / (Vol_Solids_% / 100)) * Total_Loss_Factor
  const wetFilmThicknessMicrons = Math.round((targetDft / (adjustedSolids / 100)) * (H_factor * W_factor * S_factor));

  // 8. Calculated Drying & Recoat Windows based on Temp & Humidity
  // Humidity slows drying, cold slows drying, heat accelerates drying
  const humidityRatio = 1 + (weather.relativeHumidityPercent - 50) / 60;
  const tempRatio = Math.max(0.4, 1 + (20 - weather.temperatureCelsius) / 25);
  
  const calculatedDryTimeToTouchHours = parseFloat(
    (paintDef.baseDryTimeHours * humidityRatio * tempRatio).toFixed(1)
  );
  
  const calculatedRecoatWindowHours = parseFloat(
    (paintDef.recoatWindowMinHours * humidityRatio * tempRatio).toFixed(1)
  );

  const fullCureDays = Math.ceil(4 * tempRatio * humidityRatio);

  // 9. Job Feasibility Status & Copilot Safety Advice Analysis
  const copilotAdviceNotes: string[] = [];
  let riskPoints = 0;

  // Dew point check (Dew point spread = Temp - Dew Point)
  const dewPointSpread = weather.temperatureCelsius - weather.dewPointCelsius;
  if (dewPointSpread < 3.0) {
    riskPoints += 40;
    copilotAdviceNotes.push(`CRITICAL: Dew point spread is only ${dewPointSpread.toFixed(1)}°C (<3°C threshold). Extreme risk of moisture trapping and blistering.`);
  } else if (dewPointSpread < 5.0) {
    riskPoints += 15;
    copilotAdviceNotes.push(`CAUTION: Dew point spread is ${dewPointSpread.toFixed(1)}°C. Monitor substrate condensation closely.`);
  }

  // Humidity Check
  if (weather.relativeHumidityPercent > paintDef.maxHumidityPercentThreshold) {
    riskPoints += 30;
    copilotAdviceNotes.push(`HIGH HUMIDITY: Current relative humidity (${weather.relativeHumidityPercent}%) exceeds ${paintDef.name} limit (${paintDef.maxHumidityPercentThreshold}%). Extended dry time +${calculatedDryTimeToTouchHours} hrs required.`);
  }

  // Temperature Check
  if (weather.temperatureCelsius < paintDef.minTempCelsiusThreshold) {
    riskPoints += 30;
    copilotAdviceNotes.push(`LOW TEMP ALERT: Ambient temperature (${weather.temperatureCelsius}°C) is below minimum application threshold (${paintDef.minTempCelsiusThreshold}°C). Latex film formation will fail without heating.`);
  } else if (weather.temperatureCelsius > 35) {
    riskPoints += 20;
    copilotAdviceNotes.push(`HIGH TEMP ALERT: Ambient temperature (${weather.temperatureCelsius}°C) may cause flash drying and lap marks. Add 3-5% retarder additive.`);
  }

  // Wind Speed Check
  if (weather.windSpeedKmH > paintDef.maxWindKmHThreshold) {
    riskPoints += 25;
    copilotAdviceNotes.push(`HIGH WIND WARNING: Wind speed (${weather.windSpeedKmH} km/h) exceeds ${paintDef.maxWindKmHThreshold} km/h. High overspray loss (+${Math.round((W_factor - 1) * 100)}% extra material calculated). Use roller or wind screen.`);
  }

  // Rain Risk
  if (weather.rainProbabilityPercent > 50) {
    riskPoints += 35;
    copilotAdviceNotes.push(`RAIN RISK (${weather.rainProbabilityPercent}%): Precipitation expected within coating drying window. Delay exterior topcoat.`);
  }

  if (copilotAdviceNotes.length === 0) {
    copilotAdviceNotes.push('OPTIMAL CONDITIONS: Weather parameters are well within standard application tolerances. High film integrity expected.');
  }

  let feasibilityStatus: 'optimal' | 'caution' | 'warning' | 'unsuitable' = 'optimal';
  const feasibilityScorePercent = Math.max(0, Math.min(100, 100 - riskPoints));

  if (riskPoints >= 60) {
    feasibilityStatus = 'unsuitable';
  } else if (riskPoints >= 35) {
    feasibilityStatus = 'warning';
  } else if (riskPoints >= 15) {
    feasibilityStatus = 'caution';
  }

  return {
    areaSqMeters,
    areaSqFt,
    paintTypeName: paintDef.name,
    qualityGradeName: qualityDef.name,
    baseVolumeSolidsPercent: baseSolids,
    adjustedVolumeSolidsPercent: parseFloat(adjustedSolids.toFixed(1)),
    qualityMultiplier: parseFloat(Q_factor.toFixed(2)),
    humidityLossMultiplier: parseFloat(H_factor.toFixed(2)),
    windLossMultiplier: parseFloat(W_factor.toFixed(2)),
    temperatureLossMultiplier: parseFloat(T_factor.toFixed(2)),
    surfaceLossMultiplier: parseFloat(S_factor.toFixed(2)),
    totalCombinedEnvironmentalFactor: parseFloat(totalEnvFactor.toFixed(2)),
    baseTheoreticalLiters: parseFloat(baseLiters.toFixed(2)),
    totalAdjustedLiters,
    totalAdjustedGallons,
    wetFilmThicknessMicrons,
    targetDryFilmThicknessMicrons: targetDft,
    calculatedDryTimeToTouchHours,
    calculatedRecoatWindowHours,
    fullCureDays,
    feasibilityStatus,
    feasibilityScorePercent,
    copilotAdviceNotes,
  };
}

export interface HourlyWeatherForecastItem {
  timeLabel: string; // e.g. "09:00 AM"
  tempC: number;
  humidityPercent: number;
  windKmH: number;
  rainProbPercent: number;
  uvIndex: number;
  dewPointC: number;
  suitabilityScore: number; // 0-100
  suitabilityLabel: 'Optimal' | 'Good' | 'Caution' | 'High Risk';
}

/**
 * Generates dynamic 8-hour weather forecast for the location
 */
export function generateHourlyWeatherForecast(
  lat: number = 51.5074,
  lng: number = -0.1278,
  locationName: string = 'Current Field Site'
): HourlyWeatherForecastItem[] {
  const currentHour = new Date().getHours();
  const forecast: HourlyWeatherForecastItem[] = [];

  for (let i = 0; i < 8; i++) {
    const hour = (currentHour + i * 2) % 24;
    const timeLabel = `${hour.toString().padStart(2, '0')}:00`;

    // Dynamic temperature curve
    const tempC = Math.round(18 + Math.sin((hour - 6) / 4) * 6 + (Math.random() * 2 - 1));
    const humidityPercent = Math.round(Math.max(35, Math.min(92, 65 - Math.sin((hour - 6) / 4) * 20 + (Math.random() * 4 - 2))));
    const windKmH = Math.round(Math.max(5, Math.min(32, 12 + Math.cos(hour / 3) * 8)));
    const rainProbPercent = hour >= 16 && hour <= 20 ? 45 : Math.round(Math.max(0, Math.min(25, (10 - Math.abs(hour - 14)) * 2)));
    const uvIndex = hour >= 10 && hour <= 16 ? Math.round(6 + Math.sin((hour - 10) / 3) * 3) : 1;
    const dewPointC = Math.round(tempC - (100 - humidityPercent) / 5);

    let score = 100;
    if (humidityPercent > 78) score -= 25;
    if (tempC < 12) score -= 25;
    if (windKmH > 20) score -= 20;
    if (rainProbPercent > 30) score -= 30;

    score = Math.max(10, Math.min(100, score));

    let suitabilityLabel: 'Optimal' | 'Good' | 'Caution' | 'High Risk' = 'Optimal';
    if (score < 40) suitabilityLabel = 'High Risk';
    else if (score < 65) suitabilityLabel = 'Caution';
    else if (score < 85) suitabilityLabel = 'Good';

    forecast.push({
      timeLabel,
      tempC,
      humidityPercent,
      windKmH,
      rainProbPercent,
      uvIndex,
      dewPointC,
      suitabilityScore: score,
      suitabilityLabel,
    });
  }

  return forecast;
}

export interface ScheduledCoatingTask {
  id: string;
  taskName: string;
  stageLabel: string;
  scheduledTimeWindow: string;
  durationHours: number;
  recommendedTimeSlot: string;
  suitabilityScore: number;
  suitabilityStatus: 'Optimal' | 'Good' | 'Caution' | 'High Risk';
  targetCoverageM2: number;
  estimatedMaterialLiters: number;
  weatherNotes: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'delayed';
}

/**
 * Generate Weather-Integrated Task Schedule
 */
export function generateWeatherIntegratedTaskSchedule(
  targetOutput: FormulationTargetOutput,
  forecast: HourlyWeatherForecastItem[]
): ScheduledCoatingTask[] {
  // Find optimal weather slots from forecast
  const optimalSlots = forecast.filter((f) => f.suitabilityScore >= 70);
  const slot1 = forecast[1] || forecast[0];
  const slot2 = forecast[3] || forecast[2];
  const slot3 = forecast[5] || forecast[4];

  return [
    {
      id: 'task-1',
      taskName: 'Substrate Washing & SSPC-SP10 Abrasive Prep',
      stageLabel: 'Stage 1: Surface Prep',
      scheduledTimeWindow: `${forecast[0].timeLabel} - ${forecast[1].timeLabel}`,
      durationHours: 2,
      recommendedTimeSlot: forecast[0].timeLabel,
      suitabilityScore: forecast[0].suitabilityScore,
      suitabilityStatus: forecast[0].suitabilityLabel,
      targetCoverageM2: targetOutput.areaSqMeters,
      estimatedMaterialLiters: 0,
      weatherNotes: `Wind ${forecast[0].windKmH} km/h - ideal for surface drying.`,
      status: 'completed',
    },
    {
      id: 'task-2',
      taskName: 'Primer Coat Application',
      stageLabel: 'Stage 2: Primary Barrier',
      scheduledTimeWindow: `${slot1.timeLabel} - ${slot1.timeLabel}`,
      durationHours: 2.5,
      recommendedTimeSlot: slot1.timeLabel,
      suitabilityScore: slot1.suitabilityScore,
      suitabilityStatus: slot1.suitabilityLabel,
      targetCoverageM2: targetOutput.areaSqMeters,
      estimatedMaterialLiters: Math.round(targetOutput.totalAdjustedLiters * 0.4),
      weatherNotes: `Temp ${slot1.tempC}°C, Humidity ${slot1.humidityPercent}% - Optimal coat adhesion.`,
      status: 'in_progress',
    },
    {
      id: 'task-3',
      taskName: 'Intermediate Coat 1 Application',
      stageLabel: 'Stage 3: Film Build',
      scheduledTimeWindow: `${slot2.timeLabel} - ${slot2.timeLabel}`,
      durationHours: 3.0,
      recommendedTimeSlot: slot2.timeLabel,
      suitabilityScore: slot2.suitabilityScore,
      suitabilityStatus: slot2.suitabilityLabel,
      targetCoverageM2: targetOutput.areaSqMeters,
      estimatedMaterialLiters: Math.round(targetOutput.totalAdjustedLiters * 0.3),
      weatherNotes: `Required dry time before recoat: ${targetOutput.calculatedDryTimeToTouchHours} hrs.`,
      status: 'scheduled',
    },
    {
      id: 'task-4',
      taskName: 'Final Protective Topcoat Application',
      stageLabel: 'Stage 4: Weather Finish',
      scheduledTimeWindow: `${slot3.timeLabel} - ${slot3.timeLabel}`,
      durationHours: 2.5,
      recommendedTimeSlot: slot3.timeLabel,
      suitabilityScore: slot3.suitabilityScore,
      suitabilityStatus: slot3.suitabilityLabel,
      targetCoverageM2: targetOutput.areaSqMeters,
      estimatedMaterialLiters: Math.round(targetOutput.totalAdjustedLiters * 0.3),
      weatherNotes: `UV Index ${slot3.uvIndex}. Monitor wind drift under ${slot3.windKmH} km/h.`,
      status: 'scheduled',
    },
  ];
}
