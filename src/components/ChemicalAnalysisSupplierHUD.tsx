import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FlaskConical,
  Search,
  Database,
  Globe,
  Truck,
  Check,
  Building2,
  Sparkles,
  Download,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Layers,
  Thermometer,
  Zap,
} from 'lucide-react';
import {
  scrapeOpenFormulationsAgent,
  matchSurfaceToChemicalFormulation,
  INTERNATIONAL_SUPPLIERS,
  ChemicalFormulation,
  ScrapedDataSheet,
  SupplierInfo,
} from '../lib/chemicalAnalysisEngine';

interface ChemicalAnalysisSupplierHUDProps {
  discipline: 'paint' | 'screed' | 'plaster';
  paintType: string;
  surfaceAreaSqFt: number;
  tempCelsius?: number;
  humidityPercent?: number;
  onClose?: () => void;
}

export const ChemicalAnalysisSupplierHUD: React.FC<ChemicalAnalysisSupplierHUDProps> = ({
  discipline,
  paintType,
  surfaceAreaSqFt,
  tempCelsius = 22,
  humidityPercent = 55,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState(paintType || 'Industrial Floor Coating');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedResults, setScrapedResults] = useState<ScrapedDataSheet[]>([]);
  const [selectedFormulation, setSelectedFormulation] = useState<ChemicalFormulation | null>(null);
  const [activeTab, setActiveTab] = useState<'formulation' | 'suppliers' | 'mixing' | 'scraper'>('formulation');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Compute live match
  const matchResult = matchSurfaceToChemicalFormulation({
    discipline,
    paintType: searchQuery,
    surfaceAreaSqFt,
    tempCelsius,
    humidityPercent,
  });

  const formulation = selectedFormulation || matchResult.matchedFormulation;

  const handleRunAgentScraper = async () => {
    setIsScraping(true);
    try {
      const results = await scrapeOpenFormulationsAgent(searchQuery, discipline);
      setScrapedResults(results);
      if (results.length > 0) {
        setSelectedFormulation(results[0].formulation);
      }
    } finally {
      setIsScraping(false);
    }
  };

  useEffect(() => {
    handleRunAgentScraper();
  }, [discipline]);

  const handleExportMSDS = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formulation, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Chemical_Spec_${formulation.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-slate-100 font-mono">
      {/* HUD Header */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Chemical Formulation & Supplier Intelligence
            </h3>
            <p className="text-[10px] text-slate-400">
              Scraped Datasheets • CAS Registry • BASF / Dow / Evonik Matching
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportMSDS}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-[10px] font-bold transition-all active:scale-95"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Spec Downloaded</span>
              </>
            ) : (
              <>
                <Download className="w-3 h-3 text-emerald-400" />
                <span>Export MSDS Spec</span>
              </>
            )}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-800 rounded border border-slate-700"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center bg-black/60 border-b border-slate-800 px-2 py-1 gap-1 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('formulation')}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] uppercase font-bold transition-all shrink-0 ${
            activeTab === 'formulation'
              ? 'bg-indigo-600 text-white shadow border border-indigo-400'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>Chemical Breakdown</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] uppercase font-bold transition-all shrink-0 ${
            activeTab === 'suppliers'
              ? 'bg-indigo-600 text-white shadow border border-indigo-400'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
          }`}
        >
          <Building2 className="w-3 h-3" />
          <span>Global Suppliers ({INTERNATIONAL_SUPPLIERS.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mixing')}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] uppercase font-bold transition-all shrink-0 ${
            activeTab === 'mixing'
              ? 'bg-indigo-600 text-white shadow border border-indigo-400'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
          }`}
        >
          <Zap className="w-3 h-3" />
          <span>Batch Recipe & Mix</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('scraper')}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] uppercase font-bold transition-all shrink-0 ${
            activeTab === 'scraper'
              ? 'bg-indigo-600 text-white shadow border border-indigo-400'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
          }`}
        >
          <Search className="w-3 h-3" />
          <span>Crawler Agent</span>
        </button>
      </div>

      {/* Main Body Content */}
      <div className="p-3.5 space-y-3">
        {/* TAB 1: CHEMICAL FORMULATION & CAS BREAKDOWN */}
        {activeTab === 'formulation' && (
          <div className="space-y-3">
            {/* Header Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-xl">
                <span className="text-[9px] text-slate-400 uppercase block">Solids By Weight</span>
                <span className="text-xs font-bold text-emerald-400">{formulation.solidsByWeightPercent}%</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-xl">
                <span className="text-[9px] text-slate-400 uppercase block">VOC Content</span>
                <span className="text-xs font-bold text-cyan-400">{formulation.vocContentGL} g/L</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-xl">
                <span className="text-[9px] text-slate-400 uppercase block">PVC Ratio</span>
                <span className="text-xs font-bold text-indigo-400">{formulation.pvcPercent}% PVC</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-xl">
                <span className="text-[9px] text-slate-400 uppercase block">Est. Material Cost</span>
                <span className="text-xs font-bold text-amber-400">${matchResult.totalMaterialCostUSD} USD</span>
              </div>
            </div>

            {/* Title & Description */}
            <div className="bg-slate-900/40 border border-slate-800 p-3 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">{formulation.name}</span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {formulation.mixingRatio}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">{formulation.description}</p>
            </div>

            {/* Ingredient Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-black/50">
              <div className="p-2 bg-slate-900/80 border-b border-slate-800 text-[10px] font-bold text-slate-300 flex items-center justify-between">
                <span>INGREDIENT & CAS REGISTRY</span>
                <span>MATCHED SUPPLIER SKU</span>
              </div>
              <div className="divide-y divide-slate-800/80">
                {matchResult.ingredientBreakdownKg.map((item) => (
                  <div key={item.ingredient.id} className="p-2.5 hover:bg-slate-900/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-200">{item.ingredient.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          CAS {item.ingredient.casNumber}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">{item.ingredient.function}</p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 text-right">
                      <div>
                        <span className="text-xs font-bold text-emerald-400">{item.requiredKg} kg</span>
                        <span className="text-[9px] text-slate-400 block">${item.totalCostUSD}</span>
                      </div>
                      <div className="bg-slate-900 px-2 py-1 rounded border border-slate-800 text-[9px] text-indigo-300">
                        <span className="font-bold text-slate-200 block">{item.ingredient.supplierName}</span>
                        <span>{item.ingredient.supplierProductCode}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INTERNATIONAL SUPPLIER CATALOG */}
        {activeTab === 'suppliers' && (
          <div className="space-y-3">
            <p className="text-[11px] text-slate-400">
              Direct API integrations and stock routing for primary international chemical manufacturers:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {INTERNATIONAL_SUPPLIERS.map((sup) => (
                <div key={sup.companyName} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 hover:border-indigo-500/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-slate-200">{sup.companyName}</span>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                      IN STOCK
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 space-y-0.5 font-sans">
                    <div className="flex items-center gap-1 text-slate-300">
                      <Globe className="w-3 h-3 text-slate-500" />
                      <span>HQ: {sup.headquarters}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Truck className="w-3 h-3 text-slate-500" />
                      <span>Lead Time: {sup.leadTimeDays} Days ({sup.regionalHub})</span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between border-t border-slate-800/80 text-[10px]">
                    <span className="text-slate-500">Min Order: {sup.minOrderQtyKg} kg</span>
                    <a
                      href={`mailto:${sup.contactEmail}`}
                      className="text-indigo-400 hover:text-indigo-300 font-mono font-bold flex items-center gap-0.5"
                    >
                      <span>Request Quote</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: BATCH RECIPE & MIXING INSTRUCTIONS */}
        {activeTab === 'mixing' && (
          <div className="space-y-3">
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide block">
                Automated Batch Preparation Protocol
              </span>
              <p className="text-[11px] text-slate-400">
                Calculated for target surface area of <strong className="text-slate-200">{surfaceAreaSqFt.toLocaleString()} SQFT</strong>:
              </p>

              <div className="space-y-1.5 pt-1">
                {matchResult.batchMixingInstructions.map((step, idx) => (
                  <div key={idx} className="p-2 rounded bg-black/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                    <span className="w-5 h-5 rounded bg-indigo-950 border border-indigo-700 text-indigo-300 flex items-center justify-center font-bold shrink-0 text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-indigo-400" />
                <span className="text-indigo-200">Pot Life: {formulation.potLifeMinutes} Mins @ {tempCelsius}°C</span>
              </div>
              <span className="text-[10px] text-indigo-400 font-bold">Full Cure: {formulation.fullCureDays} Days</span>
            </div>
          </div>
        )}

        {/* TAB 4: CRAWLER AGENT SEARCH */}
        {activeTab === 'scraper' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chemical coating, CAS number, or paint type..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-indigo-500 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleRunAgentScraper}
                disabled={isScraping}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 shrink-0"
              >
                {isScraping ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Run Crawler</span>
              </button>
            </div>

            <div className="space-y-2">
              {scrapedResults.map((res) => (
                <div
                  key={res.formulation.id}
                  onClick={() => setSelectedFormulation(res.formulation)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedFormulation?.id === res.formulation.id
                      ? 'bg-indigo-950/60 border-indigo-500'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-200">{res.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold">
                      Confidence {(res.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{res.formulation.description}</p>
                  <div className="flex items-center justify-between pt-2 text-[9px] text-slate-500 font-sans">
                    <span>Source: {res.sourceUrl}</span>
                    <span>Scraped: {new Date(res.scrapedTimestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
