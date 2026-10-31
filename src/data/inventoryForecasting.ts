import { RawMaterialStockItem, PaintProject } from '../types';
import { calculateSingleProjectMaterials } from './rawMaterialsInventory';

export interface DailyDepletionPoint {
  dayNumber: number; // 1 to 7
  dateString: string; // e.g. "Sep 4"
  fullDate: string; // e.g. "2026-09-04"
  dayName: string; // e.g. "Fri"
  consumedKg: number;
  remainingStockKg: number;
  stockPercentage: number;
  batchesScheduled: {
    projectId: string;
    projectName: string;
    batchVolumeGal: number;
    materialDemandKg: number;
  }[];
  isBelowCritical: boolean;
  isDepleted: boolean;
}

export interface MaterialDepletionForecast {
  materialId: string;
  materialName: string;
  chemicalTradeName: string;
  category: string;
  color: string;
  currentStockKg: number;
  criticalThresholdKg: number;
  reorderLevelKg: number;
  unitCostPerKg: number;
  supplier: string;
  leadTimeDays: number;
  totalQueueDemandKg: number;
  projectedBalanceKg: number;

  // Forecast metrics
  criticalBreachDay: number | null; // 1 to 7, or null if >7 days
  criticalBreachDate: string | null; // e.g. "Sep 5, 2026"
  depletionDay: number | null; // 1 to 7, or null if >7 days
  depletionDate: string | null; // e.g. "Sep 6, 2026"
  daysToCritical: number | null;
  daysToStockout: number | null;

  isCriticalWithin7Days: boolean;
  isStockoutWithin7Days: boolean;
  hasLeadTimeRisk: boolean; // leadTimeDays >= daysToCritical
  triggeringBatch: {
    projectId: string;
    projectName: string;
    queuePosition: number;
    requiredKg: number;
  } | null;

  dailyTimeline: DailyDepletionPoint[];
  urgencyLevel: 'emergency' | 'critical' | 'warning' | 'stable';
}

export interface OverallForecastSummary {
  totalBatchesQueued: number;
  totalQueueVolumeGallons: number;
  criticalWithin7DaysCount: number;
  stockoutWithin7DaysCount: number;
  leadTimeRiskCount: number;
  earliestBreachDate: string | null;
  earliestBreachMaterial: string | null;
  materialsForecast: MaterialDepletionForecast[];
}

/**
 * Generates an array of date objects starting from tomorrow for 7 days
 */
export function getForecastDateRange(days = 7, baseDate: Date = new Date()): { date: Date; dateString: string; fullDate: string; dayName: string }[] {
  const result = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 1; i <= days; i++) {
    const d = new Date(baseDate.getTime());
    d.setDate(baseDate.getDate() + i);
    const dayName = dayNames[d.getDay()];
    const month = monthNames[d.getMonth()];
    const dateNum = d.getDate();
    const year = d.getFullYear();

    const dateString = `${month} ${dateNum}`;
    const fullDate = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;

    result.push({
      date: d,
      dateString,
      fullDate,
      dayName,
    });
  }
  return result;
}

/**
 * Predicts inventory depletion dates and critical threshold breaches
 * based on the sequential queue ordering of active projects.
 *
 * Each project in the queue is mapped to the production schedule:
 * - Position 0 (Batch #1): Scheduled on Day 1 (Next Shift)
 * - Position 1 (Batch #2): Scheduled on Day 2
 * - Position 2 (Batch #3): Scheduled on Day 3
 * ...etc.
 *
 * If there are multiple batches on a day (or paced production), this handles
 * sequential cumulative depletion over the 7-day outlook.
 */
export function calculateInventoryDepletionForecast(
  orderedProjects: PaintProject[],
  inventory: RawMaterialStockItem[],
  options?: {
    daysToForecast?: number;
    batchesPerDay?: number;
    baseDate?: Date;
  }
): OverallForecastSummary {
  const daysToForecast = options?.daysToForecast || 7;
  const batchesPerDay = options?.batchesPerDay || 1;
  const dateRange = getForecastDateRange(daysToForecast, options?.baseDate);

  // Filter for active queue projects in pipeline
  const activeQueue = orderedProjects.filter(
    (p) => p.status === 'estimated' || p.status === 'formulating' || p.status === 'mixing'
  );

  const totalVolumeGallons = activeQueue.reduce((sum, p) => sum + (p.volumeGallons || 0), 0);

  // Map each project in the ordered queue to its scheduled execution day (1-indexed)
  const projectSchedule: {
    project: PaintProject;
    queuePosition: number;
    scheduledDay: number;
    materialsRequired: Record<string, number>;
  }[] = activeQueue.map((project, idx) => {
    // 1 batch per day by default (Batch 0 on Day 1, Batch 1 on Day 2, etc.)
    const scheduledDay = Math.min(daysToForecast, Math.floor(idx / batchesPerDay) + 1);
    const materialsRequired = calculateSingleProjectMaterials(project);
    return {
      project,
      queuePosition: idx + 1,
      scheduledDay,
      materialsRequired,
    };
  });

  const materialsForecast: MaterialDepletionForecast[] = inventory.map((mat) => {
    let runningStock = mat.currentStockKg;
    const initialStock = mat.currentStockKg;
    let totalQueueDemand = 0;

    let criticalBreachDay: number | null = null;
    let criticalBreachDate: string | null = null;
    let depletionDay: number | null = null;
    let depletionDate: string | null = null;
    let triggeringBatch: MaterialDepletionForecast['triggeringBatch'] = null;

    // Daily breakdown for the 7 days
    const dailyTimeline: DailyDepletionPoint[] = dateRange.map((dateObj, dayIdx) => {
      const dayNum = dayIdx + 1;

      // Find batches scheduled on this day
      const batchesThisDay = projectSchedule.filter((ps) => ps.scheduledDay === dayNum);
      let dayConsumed = 0;
      const scheduledBatchDetails = [];

      for (const ps of batchesThisDay) {
        const demand = ps.materialsRequired[mat.id] || 0;
        if (demand > 0) {
          dayConsumed += demand;
          totalQueueDemand += demand;
          scheduledBatchDetails.push({
            projectId: ps.project.id,
            projectName: ps.project.name,
            batchVolumeGal: ps.project.volumeGallons,
            materialDemandKg: demand,
          });

          // Check if this batch caused a breach
          const stockBefore = runningStock;
          const stockAfter = Math.max(0, runningStock - demand);

          if (criticalBreachDay === null && stockAfter <= mat.criticalThresholdKg && stockBefore > mat.criticalThresholdKg) {
            criticalBreachDay = dayNum;
            criticalBreachDate = `${dateObj.dateString}, ${dateObj.date.getFullYear()}`;
            triggeringBatch = {
              projectId: ps.project.id,
              projectName: ps.project.name,
              queuePosition: ps.queuePosition,
              requiredKg: demand,
            };
          }

          if (depletionDay === null && stockAfter <= 0 && stockBefore > 0) {
            depletionDay = dayNum;
            depletionDate = `${dateObj.dateString}, ${dateObj.date.getFullYear()}`;
          }

          runningStock = stockAfter;
        }
      }

      // If initial stock was ALREADY below critical threshold on Day 0
      if (initialStock <= mat.criticalThresholdKg && criticalBreachDay === null) {
        criticalBreachDay = 1;
        criticalBreachDate = `${dateRange[0].dateString}, ${dateRange[0].date.getFullYear()} (Immediate Buffer Deficit)`;
        if (scheduledBatchDetails.length > 0) {
          triggeringBatch = {
            projectId: scheduledBatchDetails[0].projectId,
            projectName: scheduledBatchDetails[0].projectName,
            queuePosition: 1,
            requiredKg: scheduledBatchDetails[0].materialDemandKg,
          };
        }
      }

      const isBelowCritical = runningStock <= mat.criticalThresholdKg;
      const isDepleted = runningStock <= 0;
      const stockPercentage = initialStock > 0 ? Math.min(100, Math.max(0, (runningStock / initialStock) * 100)) : 0;

      return {
        dayNumber: dayNum,
        dateString: dateObj.dateString,
        fullDate: dateObj.fullDate,
        dayName: dateObj.dayName,
        consumedKg: parseFloat(dayConsumed.toFixed(2)),
        remainingStockKg: parseFloat(runningStock.toFixed(2)),
        stockPercentage: parseFloat(stockPercentage.toFixed(1)),
        batchesScheduled: scheduledBatchDetails,
        isBelowCritical,
        isDepleted,
      };
    });

    const isCriticalWithin7Days = criticalBreachDay !== null && criticalBreachDay <= 7;
    const isStockoutWithin7Days = depletionDay !== null && depletionDay <= 7;
    const daysToCritical = criticalBreachDay;
    const daysToStockout = depletionDay;

    // Lead time risk: if days to critical breach is less than or equal to the supplier's replenishment lead time
    const hasLeadTimeRisk = isCriticalWithin7Days && daysToCritical !== null && daysToCritical <= mat.leadTimeDays;

    let urgencyLevel: MaterialDepletionForecast['urgencyLevel'] = 'stable';
    if (isStockoutWithin7Days || (hasLeadTimeRisk && daysToCritical !== null && daysToCritical <= 2)) {
      urgencyLevel = 'emergency';
    } else if (isCriticalWithin7Days) {
      urgencyLevel = 'critical';
    } else if (runningStock <= mat.reorderLevelKg) {
      urgencyLevel = 'warning';
    }

    const projectedBalanceKg = parseFloat((mat.currentStockKg - totalQueueDemand).toFixed(2));

    return {
      materialId: mat.id,
      materialName: mat.name,
      chemicalTradeName: mat.chemicalTradeName,
      category: mat.category,
      color: mat.color,
      currentStockKg: mat.currentStockKg,
      criticalThresholdKg: mat.criticalThresholdKg,
      reorderLevelKg: mat.reorderLevelKg,
      unitCostPerKg: mat.unitCostPerKg,
      supplier: mat.supplier,
      leadTimeDays: mat.leadTimeDays,
      totalQueueDemandKg: parseFloat(totalQueueDemand.toFixed(2)),
      projectedBalanceKg,
      criticalBreachDay,
      criticalBreachDate,
      depletionDay,
      depletionDate,
      daysToCritical,
      daysToStockout,
      isCriticalWithin7Days,
      isStockoutWithin7Days,
      hasLeadTimeRisk,
      triggeringBatch,
      dailyTimeline,
      urgencyLevel,
    };
  });

  // Sort forecasts: emergency & critical within 7 days first, then by earliest breach day
  materialsForecast.sort((a, b) => {
    if (a.isCriticalWithin7Days && !b.isCriticalWithin7Days) return -1;
    if (!a.isCriticalWithin7Days && b.isCriticalWithin7Days) return 1;

    const dayA = a.criticalBreachDay ?? 99;
    const dayB = b.criticalBreachDay ?? 99;
    if (dayA !== dayB) return dayA - dayB;

    if (a.hasLeadTimeRisk && !b.hasLeadTimeRisk) return -1;
    if (!a.hasLeadTimeRisk && b.hasLeadTimeRisk) return 1;

    return (a.currentStockKg - a.criticalThresholdKg) - (b.currentStockKg - b.criticalThresholdKg);
  });

  const criticalWithin7DaysCount = materialsForecast.filter((m) => m.isCriticalWithin7Days).length;
  const stockoutWithin7DaysCount = materialsForecast.filter((m) => m.isStockoutWithin7Days).length;
  const leadTimeRiskCount = materialsForecast.filter((m) => m.hasLeadTimeRisk).length;

  const firstBreach = materialsForecast.find((m) => m.isCriticalWithin7Days);

  return {
    totalBatchesQueued: activeQueue.length,
    totalQueueVolumeGallons: totalVolumeGallons,
    criticalWithin7DaysCount,
    stockoutWithin7DaysCount,
    leadTimeRiskCount,
    earliestBreachDate: firstBreach?.criticalBreachDate || null,
    earliestBreachMaterial: firstBreach?.materialName || null,
    materialsForecast,
  };
}
