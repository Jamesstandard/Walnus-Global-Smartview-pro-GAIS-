import { RawMaterialStockItem, MaterialQueueRequirement, InventoryAlertNotification, PaintProject } from '../types';

export const INITIAL_RAW_MATERIALS: RawMaterialStockItem[] = [
  {
    id: 'mat_wall_screed_binder',
    name: 'Polymer-Modified Wall Screening Binder (VAE Powder)',
    chemicalTradeName: 'Vinnapas 5044 N / Elotex MP 2100',
    category: 'binder',
    categoryLabel: 'Wall Polymer Binder',
    currentStockKg: 320.0,
    criticalThresholdKg: 80.0,
    reorderLevelKg: 400.0,
    unitCostPerKg: 3.15,
    supplier: 'Wacker Polymers Wall Logistics Depot',
    leadTimeDays: 1,
    color: '#10b981',
  },
  {
    id: 'mat_fine_marble_dust',
    name: 'Micronized Marble Dust & Fine Silica (Wall Skim Filler)',
    chemicalTradeName: 'Omyacarb 15-AV / Calcite White 2000',
    category: 'extender',
    categoryLabel: 'Wall Fine Filler',
    currentStockKg: 180.0,
    criticalThresholdKg: 40.0,
    reorderLevelKg: 300.0,
    unitCostPerKg: 0.72,
    supplier: 'Omya Wall Mineral Fillers Hub',
    leadTimeDays: 2,
    color: '#f59e0b',
  },
  {
    id: 'mat_cellulosic_thickener',
    name: 'HPMC Cellulosic Wall Thickener & Water Retainer',
    chemicalTradeName: 'Culminal C9115 / Bermocoll EBM 3000',
    category: 'additive',
    categoryLabel: 'Wall Rheology & Open Time',
    currentStockKg: 16.0,
    criticalThresholdKg: 15.0,
    reorderLevelKg: 40.0,
    unitCostPerKg: 7.80,
    supplier: 'Ashland Wall Rheology Solutions',
    leadTimeDays: 2,
    color: '#ec4899',
  },
  {
    id: 'mat_alkali_primer',
    name: 'Alkali-Resistant Acrylic Wall Bonding Primer',
    chemicalTradeName: 'Primal AC-339 Wall Sealer / Acronal 290D',
    category: 'binder',
    categoryLabel: 'Wall Substrate Keying Primer',
    currentStockKg: 110.0,
    criticalThresholdKg: 50.0,
    reorderLevelKg: 250.0,
    unitCostPerKg: 2.45,
    supplier: 'Brenntag Wall Chemicals Depot',
    leadTimeDays: 1,
    color: '#14b8a6',
  },
  {
    id: 'mat_crack_fibers',
    name: 'Polypropylene Anti-Crack Micro-Fibres (6mm Wall Grade)',
    chemicalTradeName: 'CrackStop WallFiber 6mm / SikaFiber-P6',
    category: 'additive',
    categoryLabel: 'Wall Fiber Reinforcement',
    currentStockKg: 24.5,
    criticalThresholdKg: 20.0,
    reorderLevelKg: 50.0,
    unitCostPerKg: 5.60,
    supplier: 'Sika Wall Construction Fibers',
    leadTimeDays: 2,
    color: '#8b5cf6',
  },
  {
    id: 'mat_base_pigment_tio2',
    name: 'Titanium Dioxide Rutile Base (Wall Opacifier R-902+)',
    chemicalTradeName: 'Ti-Pure R-902+ / Kronos 2310',
    category: 'base_pigment',
    categoryLabel: 'Wall Base Opacifier',
    currentStockKg: 85.0,
    criticalThresholdKg: 60.0,
    reorderLevelKg: 150.0,
    unitCostPerKg: 3.45,
    supplier: 'ChemPoint Wall Pigments Depot',
    leadTimeDays: 2,
    color: '#38bdf8',
  },
  {
    id: 'mat_wall_mesh',
    name: 'Alkali-Resistant Fibreglass Wall Joint Mesh Grid (160g)',
    chemicalTradeName: 'Saint-Gobain ADFORS WallGrid Mesh',
    category: 'additive',
    categoryLabel: 'Wall Joint Reinforcement',
    currentStockKg: 75.0,
    criticalThresholdKg: 40.0,
    reorderLevelKg: 200.0,
    unitCostPerKg: 1.25,
    supplier: 'Saint-Gobain ADFORS Wall Systems',
    leadTimeDays: 1,
    color: '#6366f1',
  },
  {
    id: 'mat_silane_wall_seal',
    name: 'Hydrophobic Silicate Weatherproof Wall Sealant',
    chemicalTradeName: 'SILRES BS 1701 / Wacker BS 29',
    category: 'solvent',
    categoryLabel: 'Wall Weatherproof Barrier',
    currentStockKg: 500.0,
    criticalThresholdKg: 100.0,
    reorderLevelKg: 600.0,
    unitCostPerKg: 4.80,
    supplier: 'Wacker Wall Silicones Distribution',
    leadTimeDays: 1,
    color: '#06b6d4',
  },
];

const LOCAL_STORAGE_KEY = 'factory_mixer_raw_materials_inventory_v1';
const CRITICAL_ALERT_DISMISSED_KEY = 'factory_mixer_dismissed_alerts_v1';

export function getStoredInventory(): RawMaterialStockItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading stored inventory', e);
  }
  return INITIAL_RAW_MATERIALS;
}

export function saveStoredInventory(inventory: RawMaterialStockItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(inventory));
  } catch (e) {
    console.error('Error saving inventory', e);
  }
}

/**
 * Calculates raw material mass requirement in kg for a single project batch (Wall Screening / Coating)
 */
export function calculateSingleProjectMaterials(project: PaintProject): Record<string, number> {
  const densityKgPerGal = 4.75;
  const batchMassKg = Math.max(1, project.volumeGallons * densityKgPerGal);

  const paintTypeLower = (project.paintType || '').toLowerCase();
  const isScreed = paintTypeLower.includes('screed') || paintTypeLower.includes('screen') || paintTypeLower.includes('mortar') || paintTypeLower.includes('skim');

  let binderPct = 0.35;
  let fineFillerPct = 0.30;
  let thickenerPct = 0.05;
  let primerPct = 0.12;
  let fiberPct = 0.04;
  let tio2Pct = 0.08;
  let sealPct = 0.06;

  if (isScreed) {
    binderPct = 0.40;
    fineFillerPct = 0.32;
    thickenerPct = 0.04;
    primerPct = 0.08;
    fiberPct = 0.06;
    tio2Pct = 0.05;
    sealPct = 0.05;
  }

  return {
    'mat_wall_screed_binder': parseFloat((batchMassKg * binderPct).toFixed(2)),
    'mat_fine_marble_dust': parseFloat((batchMassKg * fineFillerPct).toFixed(2)),
    'mat_cellulosic_thickener': parseFloat((batchMassKg * thickenerPct).toFixed(2)),
    'mat_alkali_primer': parseFloat((batchMassKg * primerPct).toFixed(2)),
    'mat_crack_fibers': parseFloat((batchMassKg * fiberPct).toFixed(2)),
    'mat_base_pigment_tio2': parseFloat((batchMassKg * tio2Pct).toFixed(2)),
    'mat_silane_wall_seal': parseFloat((batchMassKg * sealPct).toFixed(2)),
  };
}

/**
 * Evaluates the real-time queue demand against current inventory stock
 */
export function evaluateQueueInventoryRequirements(
  projects: PaintProject[],
  inventory: RawMaterialStockItem[]
): MaterialQueueRequirement[] {
  // Only evaluate active projects in the staging pipeline (estimated, formulating, mixing)
  const activeQueue = projects.filter((p) => p.status === 'estimated' || p.status === 'formulating' || p.status === 'mixing');

  const demandsMap: Record<
    string,
    {
      totalRequiredKg: number;
      affectedProjects: {
        projectId: string;
        projectName: string;
        paintType: string;
        volumeGallons: number;
        requiredKg: number;
      }[];
    }
  > = {};

  inventory.forEach((item) => {
    demandsMap[item.id] = {
      totalRequiredKg: 0,
      affectedProjects: [],
    };
  });

  activeQueue.forEach((project) => {
    const singleMatDemands = calculateSingleProjectMaterials(project);
    Object.entries(singleMatDemands).forEach(([matId, reqKg]) => {
      if (demandsMap[matId]) {
        demandsMap[matId].totalRequiredKg += reqKg;
        demandsMap[matId].affectedProjects.push({
          projectId: project.id,
          projectName: project.name,
          paintType: project.paintType,
          volumeGallons: project.volumeGallons,
          requiredKg: reqKg,
        });
      }
    });
  });

  return inventory.map((item) => {
    const demandInfo = demandsMap[item.id] || { totalRequiredKg: 0, affectedProjects: [] };
    const totalRequiredKg = parseFloat(demandInfo.totalRequiredKg.toFixed(2));
    const projectedRemainingKg = parseFloat((item.currentStockKg - totalRequiredKg).toFixed(2));

    let status: 'adequate' | 'warning' | 'critical' = 'adequate';
    let shortfallKg = 0;

    if (projectedRemainingKg < 0) {
      // Direct shortage: Not enough stock to fulfill current queue!
      status = 'critical';
      shortfallKg = parseFloat((Math.abs(projectedRemainingKg) + item.criticalThresholdKg).toFixed(2));
    } else if (projectedRemainingKg <= item.criticalThresholdKg || item.currentStockKg <= item.criticalThresholdKg) {
      // Below critical safety threshold
      status = projectedRemainingKg <= item.criticalThresholdKg * 0.5 ? 'critical' : 'warning';
      shortfallKg = parseFloat((item.criticalThresholdKg - projectedRemainingKg).toFixed(2));
    }

    return {
      materialId: item.id,
      materialName: item.name,
      chemicalTradeName: item.chemicalTradeName,
      category: item.categoryLabel,
      color: item.color,
      currentStockKg: item.currentStockKg,
      criticalThresholdKg: item.criticalThresholdKg,
      unitCostPerKg: item.unitCostPerKg,
      supplier: item.supplier,
      leadTimeDays: item.leadTimeDays,
      totalRequiredKg,
      projectedRemainingKg,
      status,
      shortfallKg: Math.max(0, shortfallKg),
      affectedProjects: demandInfo.affectedProjects,
    };
  });
}

/**
 * Generates active notifications from the evaluated requirements
 */
export function generateInventoryAlerts(
  requirements: MaterialQueueRequirement[]
): InventoryAlertNotification[] {
  const alerts: InventoryAlertNotification[] = [];

  requirements.forEach((req) => {
    if (req.status === 'critical') {
      const isDeficit = req.projectedRemainingKg < 0;
      alerts.push({
        id: `alert_crit_${req.materialId}`,
        materialId: req.materialId,
        materialName: req.materialName,
        severity: 'critical',
        title: isDeficit ? `CRITICAL DEFICIT: ${req.materialName}` : `BELOW SAFETY THRESHOLD: ${req.materialName}`,
        message: isDeficit
          ? `Queue requires ${req.totalRequiredKg} kg but only ${req.currentStockKg} kg is on hand (Deficit: ${Math.abs(req.projectedRemainingKg)} kg). Production will stall for ${req.affectedProjects.length} queued batch(es).`
          : `Projected buffer after queue execution is ${req.projectedRemainingKg} kg (Critical safety limit: ${req.criticalThresholdKg} kg). Emergency replenishment advised before staging.`,
        timestamp: Date.now(),
        currentStockKg: req.currentStockKg,
        requiredKg: req.totalRequiredKg,
        criticalThresholdKg: req.criticalThresholdKg,
        deficitKg: req.shortfallKg,
        affectedProjectCount: req.affectedProjects.length,
      });
    } else if (req.status === 'warning') {
      alerts.push({
        id: `alert_warn_${req.materialId}`,
        materialId: req.materialId,
        materialName: req.materialName,
        severity: 'warning',
        title: `Low Stock Warning: ${req.materialName}`,
        message: `Projected stock will drop to ${req.projectedRemainingKg} kg after completing ${req.affectedProjects.length} pending batch(es). Threshold is ${req.criticalThresholdKg} kg.`,
        timestamp: Date.now(),
        currentStockKg: req.currentStockKg,
        requiredKg: req.totalRequiredKg,
        criticalThresholdKg: req.criticalThresholdKg,
        deficitKg: req.shortfallKg,
        affectedProjectCount: req.affectedProjects.length,
      });
    }
  });

  return alerts;
}
