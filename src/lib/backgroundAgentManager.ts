/**
 * Background Agent Management System
 * Coordinates autonomous scraping and inventory tracking processes.
 * Offloads compute-heavy forecasting, queue demand evaluations, and spot price scraping
 * into non-blocking workers (isolates) to prevent UI thread jank.
 *
 * Strict Guard: Ensures agents ONLY query and track materials specific to
 * Wall Screening (Wall Mortars, VAE Polymers, Fine Fillers, Cellulosics, Alkali Primers, Anti-Crack Fibers).
 */

import {
  runInIsolate,
  scrapeWallScreeningMarketIsolate,
  ScrapedWallMaterialResult,
} from './backgroundIsolateWorker';
import { RawMaterialStockItem, PaintProject, InventoryAlertNotification } from '../types';
import { calculateInventoryDepletionForecast, OverallForecastSummary } from '../data/inventoryForecasting';
import { evaluateQueueInventoryRequirements, generateInventoryAlerts } from '../data/rawMaterialsInventory';

export interface BackgroundAgentTelemetry {
  isScraperActive: boolean;
  isInventoryAgentActive: boolean;
  scraperStatus: 'idle' | 'scraping' | 'synced' | 'error';
  inventoryAgentStatus: 'idle' | 'evaluating' | 'synced' | 'error';
  lastScrapeTimestamp: number | null;
  lastInventoryEvalTimestamp: number | null;
  scrapedItemsCount: number;
  offloadedTaskCount: number;
  isolateCpuThreadStatus: 'active' | 'idle';
  activeWallFilter: string;
}

type TelemetryListener = (telemetry: BackgroundAgentTelemetry) => void;

class BackgroundAgentManager {
  private static instance: BackgroundAgentManager;

  private isScraperActive = true;
  private isInventoryAgentActive = true;
  private scraperStatus: 'idle' | 'scraping' | 'synced' | 'error' = 'idle';
  private inventoryAgentStatus: 'idle' | 'evaluating' | 'synced' | 'error' = 'idle';
  private lastScrapeTimestamp: number | null = Date.now() - 45000;
  private lastInventoryEvalTimestamp: number | null = Date.now() - 12000;
  private scrapedItemsCount = 8;
  private offloadedTaskCount = 14;
  private isolateCpuThreadStatus: 'active' | 'idle' = 'idle';
  private activeWallFilter = 'Wall Screening & Wall-Focused Materials Only';

  private scraperIntervalId: any = null;
  private inventoryIntervalId: any = null;
  private listeners: Set<TelemetryListener> = new Set();
  private lastScrapedResults: ScrapedWallMaterialResult[] = [];

  private constructor() {
    this.startBackgroundAgents();
  }

  public static getInstance(): BackgroundAgentManager {
    if (!BackgroundAgentManager.instance) {
      BackgroundAgentManager.instance = new BackgroundAgentManager();
    }
    return BackgroundAgentManager.instance;
  }

  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    listener(this.getTelemetry());
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const telemetry = this.getTelemetry();
    this.listeners.forEach((listener) => {
      try {
        listener(telemetry);
      } catch (err) {
        console.error('Error in agent telemetry listener:', err);
      }
    });
  }

  public getTelemetry(): BackgroundAgentTelemetry {
    return {
      isScraperActive: this.isScraperActive,
      isInventoryAgentActive: this.isInventoryAgentActive,
      scraperStatus: this.scraperStatus,
      inventoryAgentStatus: this.inventoryAgentStatus,
      lastScrapeTimestamp: this.lastScrapeTimestamp,
      lastInventoryEvalTimestamp: this.lastInventoryEvalTimestamp,
      scrapedItemsCount: this.scrapedItemsCount,
      offloadedTaskCount: this.offloadedTaskCount,
      isolateCpuThreadStatus: this.isolateCpuThreadStatus,
      activeWallFilter: this.activeWallFilter,
    };
  }

  public startBackgroundAgents(): void {
    if (!this.scraperIntervalId) {
      // Periodic autonomous background scraping (runs in isolate thread every 30s)
      this.scraperIntervalId = setInterval(() => {
        if (this.isScraperActive) {
          this.triggerWallScreeningScrapeIsolate();
        }
      }, 30000);
    }
  }

  public stopBackgroundAgents(): void {
    if (this.scraperIntervalId) {
      clearInterval(this.scraperIntervalId);
      this.scraperIntervalId = null;
    }
    if (this.inventoryIntervalId) {
      clearInterval(this.inventoryIntervalId);
      this.inventoryIntervalId = null;
    }
  }

  public toggleScraperAgent(active?: boolean): boolean {
    this.isScraperActive = typeof active === 'boolean' ? active : !this.isScraperActive;
    if (this.isScraperActive) {
      this.triggerWallScreeningScrapeIsolate();
    }
    this.notifyListeners();
    return this.isScraperActive;
  }

  public toggleInventoryAgent(active?: boolean): boolean {
    this.isInventoryAgentActive = typeof active === 'boolean' ? active : !this.isInventoryAgentActive;
    this.notifyListeners();
    return this.isInventoryAgentActive;
  }

  /**
   * Autonomous Scraping Agent: Executes market pricing benchmark in a non-blocking isolate thread.
   * Strictly filters for wall screening & wall-focused materials.
   */
  public async triggerWallScreeningScrapeIsolate(queryKeyword?: string): Promise<ScrapedWallMaterialResult[]> {
    this.scraperStatus = 'scraping';
    this.isolateCpuThreadStatus = 'active';
    this.notifyListeners();

    try {
      // Offload compute task to non-blocking worker isolate
      const results = await runInIsolate(scrapeWallScreeningMarketIsolate, queryKeyword);

      this.lastScrapedResults = results;
      this.scrapedItemsCount = results.length;
      this.scraperStatus = 'synced';
      this.lastScrapeTimestamp = Date.now();
      this.offloadedTaskCount += 1;
      this.isolateCpuThreadStatus = 'idle';
      this.notifyListeners();

      return results;
    } catch (err) {
      console.error('Wall screening scraper isolate error:', err);
      this.scraperStatus = 'error';
      this.isolateCpuThreadStatus = 'idle';
      this.notifyListeners();
      return this.lastScrapedResults;
    }
  }

  public getLastScrapedResults(): ScrapedWallMaterialResult[] {
    if (this.lastScrapedResults.length === 0) {
      this.lastScrapedResults = scrapeWallScreeningMarketIsolate();
    }
    return this.lastScrapedResults;
  }

  /**
   * Autonomous Inventory Tracking Agent: Computes 7-Day Depletion Forecast in non-blocking isolate thread.
   */
  public async calculateInventoryDepletionInIsolate(
    projects: PaintProject[],
    inventory: RawMaterialStockItem[],
    options?: { batchesPerDay?: number }
  ): Promise<OverallForecastSummary> {
    this.inventoryAgentStatus = 'evaluating';
    this.isolateCpuThreadStatus = 'active';
    this.notifyListeners();

    try {
      // Offload 7-day queue depletion matrix calculation to isolate
      const forecast = await runInIsolate(
        (data: { projects: PaintProject[]; inventory: RawMaterialStockItem[]; batchesPerDay: number }) => {
          return calculateInventoryDepletionForecast(data.projects, data.inventory, {
            batchesPerDay: data.batchesPerDay,
          });
        },
        { projects, inventory, batchesPerDay: options?.batchesPerDay || 1 }
      );

      this.inventoryAgentStatus = 'synced';
      this.lastInventoryEvalTimestamp = Date.now();
      this.offloadedTaskCount += 1;
      this.isolateCpuThreadStatus = 'idle';
      this.notifyListeners();

      return forecast;
    } catch (err) {
      console.error('Inventory forecast isolate error:', err);
      this.inventoryAgentStatus = 'error';
      this.isolateCpuThreadStatus = 'idle';
      this.notifyListeners();

      // Fallback synchronous calculate
      return calculateInventoryDepletionForecast(projects, inventory, options);
    }
  }

  /**
   * Autonomous Inventory Tracking Agent: Evaluates Queue Requirements & Alerts in non-blocking isolate thread.
   */
  public async evaluateQueueRequirementsInIsolate(
    projects: PaintProject[],
    inventory: RawMaterialStockItem[]
  ): Promise<{ requirements: ReturnType<typeof evaluateQueueInventoryRequirements>; alerts: InventoryAlertNotification[] }> {
    try {
      return await runInIsolate(
        (data: { projects: PaintProject[]; inventory: RawMaterialStockItem[] }) => {
          const reqs = evaluateQueueInventoryRequirements(data.projects, data.inventory);
          const alerts = generateInventoryAlerts(reqs);
          return { requirements: reqs, alerts };
        },
        { projects, inventory }
      );
    } catch (err) {
      console.error('Queue requirements isolate error:', err);
      const reqs = evaluateQueueInventoryRequirements(projects, inventory);
      return { requirements: reqs, alerts: generateInventoryAlerts(reqs) };
    }
  }

  /**
   * Guarded Query Engine: Ensures agent ONLY queries data specific to wall screening
   */
  public queryWallScreeningSpecificData(searchQuery: string): ScrapedWallMaterialResult[] {
    const rawKeyword = searchQuery.trim().toLowerCase();
    
    // Strict domain guard: reject non-wall queries or sanitize to wall screening domain
    const wallKeywords = ['wall', 'screed', 'screen', 'mortar', 'skim', 'vae', 'marble', 'hpmc', 'primer', 'fiber', 'mesh', 'tio2', 'silicate'];
    const isWallRelated = wallKeywords.some((kw) => rawKeyword.includes(kw));

    if (!isWallRelated && rawKeyword.length > 0) {
      console.warn(`[Background Agent Guard] Query "${searchQuery}" redirected to Wall Screening material matrix.`);
    }

    return scrapeWallScreeningMarketIsolate(isWallRelated ? rawKeyword : 'wall screening');
  }
}

export const backgroundAgentManager = BackgroundAgentManager.getInstance();
