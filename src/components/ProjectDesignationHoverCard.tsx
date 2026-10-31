import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Minimize2,
  Maximize2,
  ChevronRight,
  ChevronLeft,
  Palette,
  Layers,
  Sparkles,
  Check,
  Sliders,
  CornerDownRight,
  Eye,
  Info,
  Hammer,
  ShieldCheck,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { gridStaggerContainer, gridStaggerItem } from '../lib/motionVariants';
import {
  SiteParametersInput,
  PaintTypeKey,
  QualityGrade,
  PAINT_TYPES_REGISTRY,
  QUALITY_GRADES_REGISTRY,
  FormulationTargetOutput,
} from '../lib/weatherEquationEngine';
import { ProjectMode, PROJECT_MODES_CONFIG } from '../types';
import { formatCurrency } from '../lib/utils';
import { playClickSound } from '../lib/soundUtils';

interface ProjectDesignationHoverCardProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  paintType: string;
  onPaintTypeChange: (type: string) => void;
  colorHex: string;
  onColorHexChange: (hex: string) => void;
  initialCollapsed?: boolean;
  siteParams: SiteParametersInput;
  onUpdateSiteParams: (updated: Partial<SiteParametersInput>) => void;
  formulationTarget: FormulationTargetOutput | null;
  projectMode?: ProjectMode;
  onMinimize?: () => void;
}

export function ProjectDesignationHoverCard({
  projectName,
  onProjectNameChange,
  paintType,
  onPaintTypeChange,
  colorHex,
  onColorHexChange,
  initialCollapsed = false,
  siteParams,
  onUpdateSiteParams,
  formulationTarget,
  projectMode = 'paint',
  onMinimize,
}: ProjectDesignationHoverCardProps) {
  const [isHoveredEdge, setIsHoveredEdge] = useState<boolean>(false);

  const modeConfig = PROJECT_MODES_CONFIG[projectMode] || PROJECT_MODES_CONFIG.paint;

  useEffect(() => {
    const updateGlobalBreakdown = () => {
      if ((window as any).__paint_sync_breakdown_active) {
        let materialCost = 0;
        let laborCost = 0;
        let equipmentCost = 0;
        let totalCost = 0;
        let litersNeeded = 0;
        let pricePerLiter = 0;

        if (projectMode === 'screed') {
          const bagsNeeded = Math.ceil(siteParams.siteAreaSqMeters * 1.8);
          const pricePerBag = 14500;
          materialCost = bagsNeeded * pricePerBag;
          const baseLaborRate = 4500;
          laborCost = siteParams.siteAreaSqMeters * baseLaborRate;
          equipmentCost = 25000 + (siteParams.siteAreaSqMeters * 500);
          totalCost = materialCost + laborCost + equipmentCost;
          litersNeeded = bagsNeeded;
          pricePerLiter = pricePerBag;
        } else if (projectMode === 'plaster') {
          const bagsNeeded = Math.ceil(siteParams.siteAreaSqMeters / 2.3);
          const pricePerBag = 8500;
          materialCost = bagsNeeded * pricePerBag;
          const baseLaborRate = 3200;
          laborCost = siteParams.siteAreaSqMeters * baseLaborRate;
          equipmentCost = 18000 + (siteParams.siteAreaSqMeters * 350);
          totalCost = materialCost + laborCost + equipmentCost;
          litersNeeded = bagsNeeded;
          pricePerLiter = pricePerBag;
        } else {
          const paintBasePrices: Record<PaintTypeKey, number> = {
            acrylic_latex: 18.50,
            '2k_epoxy': 36.00,
            aliphatic_polyurethane: 42.50,
            masonry_elastomeric: 24.00,
            pvdf_fluoropolymer: 72.00,
            siloxane_waterproof: 29.50,
            zinc_anti_corrosive: 48.00,
          };
          const currentQuality = QUALITY_GRADES_REGISTRY[siteParams.qualityGrade];
          pricePerLiter = (paintBasePrices[siteParams.paintTypeKey] || 25.00) * currentQuality.costMultiplier;
          litersNeeded = formulationTarget?.totalAdjustedLiters || 0;
          materialCost = litersNeeded * pricePerLiter;
          
          const laborRates: Record<PaintTypeKey, number> = {
            acrylic_latex: 12.00,
            '2k_epoxy': 28.00,
            aliphatic_polyurethane: 32.00,
            masonry_elastomeric: 18.00,
            pvdf_fluoropolymer: 45.00,
            siloxane_waterproof: 15.00,
            zinc_anti_corrosive: 25.00,
          };
          const baseLaborRate = laborRates[siteParams.paintTypeKey] || 15.00;
          laborCost = siteParams.siteAreaSqMeters * baseLaborRate * siteParams.coatsCount;
          equipmentCost = 150 + (siteParams.siteAreaSqMeters * 1.5);
          totalCost = materialCost + laborCost + equipmentCost;
        }

        window.dispatchEvent(new CustomEvent('paint_sync_active_spec_cost_clicked', {
          detail: {
            projectName,
            paintType,
            colorHex,
            siteParams,
            formulationTarget,
            projectMode,
            totalCost,
            materialCost,
            laborCost,
            equipmentCost,
            litersNeeded,
            pricePerLiter,
          }
        }));
      }
    };
    
    updateGlobalBreakdown();
  }, [siteParams, formulationTarget, projectName, paintType, colorHex, projectMode]);

  return (
    <div className="relative z-30 w-full mb-4">
      <motion.div
        key="expanded-floating-card"
        initial={{ opacity: 0, y: -12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="w-full bg-slate-950/95 border border-indigo-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-black/80 backdrop-blur-xl space-y-4 relative overflow-hidden"
      >
        {/* Subtle top accent gradient line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-indigo-500 opacity-80" />

            {/* Card Header with Snap/Collapse Button */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/90">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wider">
                      {modeConfig.name} / Site Designation
                    </h3>
                    <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-[9px] font-mono font-bold">
                      {modeConfig.discipline}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {modeConfig.tagline}
                  </p>
                </div>
              </div>

              {/* Minimize to Floating Stack Button */}
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onMinimize?.();
                }}
                title="Minimize and add to floating panel stack"
                className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 hover:border-indigo-500/50 transition-all font-mono text-[11px] shrink-0"
              >
                <span className="hidden sm:inline text-[10px] text-slate-400 group-hover:text-indigo-300">
                  Minimize
                </span>
                <X className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Form Fields: Project Name, Paint Spec, Target Color Tone */}
            <div className="space-y-4">
              {/* Project / Site Designation input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Site Designation Name
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">
                    Field Location ID
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => onProjectNameChange(e.target.value)}
                    placeholder={`e.g. ${modeConfig.name} - Exterior Wall Elevation`}
                    className="w-full p-2.5 pl-3 bg-slate-900 border border-slate-800 rounded-lg text-xs sm:text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none font-mono transition-all"
                  />
                </div>
              </div>

              {/* Two-column layout for Target Color Tone & Surface Area Takeoff in Metric sq meters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                    Target {projectMode === 'screed' ? 'Finish Tone / Seal' : projectMode === 'plaster' ? 'Skim Color / Render' : 'Color Tone'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colorHex}
                      onChange={(e) => onColorHexChange(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-slate-700 cursor-pointer bg-slate-900 p-0.5 shrink-0"
                    />
                    <div className="flex items-center justify-between flex-1 bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg font-mono text-xs text-slate-200">
                      <span className="uppercase">{colorHex}</span>
                      <span
                        className="w-3 h-3 rounded-full border border-white/30"
                        style={{ backgroundColor: colorHex }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                    Site Area (Metric m²)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min={1}
                      value={siteParams.siteAreaSqMeters}
                      onChange={(e) => {
                        const sqm = Number(e.target.value);
                        onUpdateSiteParams({ siteAreaSqMeters: sqm });
                      }}
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                    />
                    <span className="text-xs font-mono font-bold text-slate-400 shrink-0">m²</span>
                  </div>
                </div>
              </div>

              {/* Full Listing of Mode-Specific Material & Quality Grade Selection */}
              <div className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                    {modeConfig.name} Material Specification
                  </label>
                  {projectMode === 'paint' ? (
                    <select
                      value={siteParams.paintTypeKey}
                      onChange={(e) => {
                        const key = e.target.value as PaintTypeKey;
                        onUpdateSiteParams({ paintTypeKey: key });
                        onPaintTypeChange(PAINT_TYPES_REGISTRY[key]?.name || 'Exterior Paint');
                      }}
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none font-mono cursor-pointer"
                    >
                      {Object.values(PAINT_TYPES_REGISTRY).map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.name} ({p.defaultVolumeSolidsPercent}% Solids, {p.defaultTargetDftMicrons}µm DFT)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={paintType}
                      onChange={(e) => {
                        onPaintTypeChange(e.target.value);
                      }}
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none font-mono cursor-pointer"
                    >
                      {modeConfig.subOptions.map((opt) => (
                        <option key={opt.id} value={opt.name}>
                          {opt.name} ({opt.dft}) — {opt.desc}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="mt-1.5 text-[11px] text-indigo-300 font-mono italic leading-normal">
                    {projectMode === 'paint'
                      ? PAINT_TYPES_REGISTRY[siteParams.paintTypeKey]?.description
                      : modeConfig.subOptions.find((o) => o.name === paintType)?.desc || modeConfig.tagline}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                      Target Substrate
                    </label>
                    <select
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none font-mono cursor-pointer"
                    >
                      {modeConfig.recommendedSubstrates.map((sub, idx) => (
                        <option key={idx} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                      {projectMode === 'paint' ? 'Coating Pass Count' : projectMode === 'screed' ? 'Screed Bed Thickness' : 'Render Build Depth'}
                    </label>
                    {projectMode === 'paint' ? (
                      <select
                        value={siteParams.coatsCount}
                        onChange={(e) => onUpdateSiteParams({ coatsCount: Number(e.target.value) })}
                        className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none font-mono cursor-pointer"
                      >
                        <option value={1}>1 Coat (Direct-to-Metal/Primed)</option>
                        <option value={2}>2 Coats (Standard Spec)</option>
                        <option value={3}>3 Coats (High-Build Protection)</option>
                        <option value={4}>4 Coats (Extreme Weather/Industrial)</option>
                      </select>
                    ) : projectMode === 'screed' ? (
                      <select
                        className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none font-mono cursor-pointer"
                      >
                        <option value="1.5">1.5 mm (Ultra-Thin Fine Wall Skim)</option>
                        <option value="3.0">3.0 mm (Standard Wall Screening Mortar)</option>
                        <option value="5.0">5.0 mm (High-Build Exterior Wall Screen)</option>
                        <option value="8.0">8.0 mm (Deep Cavity Wall Leveling Screen)</option>
                      </select>
                    ) : (
                      <select
                        className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none font-mono cursor-pointer"
                      >
                        <option value="3">3 mm (Ultra-Smooth Finishing Skim)</option>
                        <option value="6">6 mm (Single Coat Interior Render)</option>
                        <option value="12">12 mm (Standard 2-Coat Blockwork Plaster)</option>
                        <option value="18">18 mm (High-Durability External Weather Render)</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Real-Time Cost Estimation Engine Breakdown Box (Putting UX First) */}
              {(() => {
                let materialCost = 0;
                let laborCost = 0;
                let equipmentCost = 0;
                let totalCost = 0;
                let unitsNeeded = 0;
                let unitRate = 0;
                let unitName = 'Liters';

                if (projectMode === 'screed') {
                  unitsNeeded = Math.ceil(siteParams.siteAreaSqMeters * 1.8);
                  unitRate = 14500;
                  unitName = '25kg Bags';
                  materialCost = unitsNeeded * unitRate;
                  laborCost = siteParams.siteAreaSqMeters * 4500;
                  equipmentCost = 25000 + (siteParams.siteAreaSqMeters * 500);
                  totalCost = materialCost + laborCost + equipmentCost;
                } else if (projectMode === 'plaster') {
                  unitsNeeded = Math.ceil(siteParams.siteAreaSqMeters / 2.3);
                  unitRate = 8500;
                  unitName = '25kg Bags';
                  materialCost = unitsNeeded * unitRate;
                  laborCost = siteParams.siteAreaSqMeters * 3200;
                  equipmentCost = 18000 + (siteParams.siteAreaSqMeters * 350);
                  totalCost = materialCost + laborCost + equipmentCost;
                } else {
                  const currentQuality = QUALITY_GRADES_REGISTRY[siteParams.qualityGrade];
                  const paintBasePrices: Record<PaintTypeKey, number> = {
                    acrylic_latex: 18.50,
                    '2k_epoxy': 36.00,
                    aliphatic_polyurethane: 42.50,
                    masonry_elastomeric: 24.00,
                    pvdf_fluoropolymer: 72.00,
                    siloxane_waterproof: 29.50,
                    zinc_anti_corrosive: 48.00,
                  };
                  unitRate = (paintBasePrices[siteParams.paintTypeKey] || 25.00) * currentQuality.costMultiplier;
                  unitsNeeded = formulationTarget?.totalAdjustedLiters || 0;
                  unitName = 'Liters';
                  materialCost = unitsNeeded * unitRate;
                  
                  const laborRates: Record<PaintTypeKey, number> = {
                    acrylic_latex: 12.00,
                    '2k_epoxy': 28.00,
                    aliphatic_polyurethane: 32.00,
                    masonry_elastomeric: 18.00,
                    pvdf_fluoropolymer: 45.00,
                    siloxane_waterproof: 15.00,
                    zinc_anti_corrosive: 25.00,
                  };
                  const baseLaborRate = laborRates[siteParams.paintTypeKey] || 15.00;
                  laborCost = siteParams.siteAreaSqMeters * baseLaborRate * siteParams.coatsCount;
                  equipmentCost = 150 + (siteParams.siteAreaSqMeters * 1.5);
                  totalCost = materialCost + laborCost + equipmentCost;
                }
                
                return (
                  <div className="p-3 bg-indigo-950/40 border border-indigo-500/25 rounded-xl space-y-2.5 font-mono text-xs">
                    <div className="flex items-center justify-between font-bold border-b border-indigo-500/15 pb-1.5 text-indigo-300 uppercase tracking-wider text-[10px]">
                      <span className="flex items-center gap-1">
                        <Sliders className="w-3.5 h-3.5 text-indigo-400" /> Cost Estimation Engine ({modeConfig.name})
                      </span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Recalculating
                      </span>
                    </div>
                    
                    <motion.div
                      variants={gridStaggerContainer}
                      initial="hidden"
                      animate="show"
                      className="grid grid-cols-3 gap-2 text-[10px]"
                    >
                      <motion.div variants={gridStaggerItem} className="p-2 bg-slate-900/60 rounded border border-slate-800">
                        <span className="text-slate-400 block text-[8px] uppercase font-bold">Materials</span>
                        <strong className="text-white">{formatCurrency(materialCost)}</strong>
                        <span className="text-[8px] text-slate-500 block truncate">@ {formatCurrency(unitRate)}/{projectMode === 'paint' ? 'L' : 'bag'}</span>
                      </motion.div>
                      <motion.div variants={gridStaggerItem} className="p-2 bg-slate-900/60 rounded border border-slate-800">
                        <span className="text-slate-400 block text-[8px] uppercase font-bold">Labor & Prep</span>
                        <strong className="text-white">{formatCurrency(laborCost)}</strong>
                        <span className="text-[8px] text-slate-500 block truncate">@ {formatCurrency(laborCost / (siteParams.siteAreaSqMeters || 1))}/m²</span>
                      </motion.div>
                      <motion.div variants={gridStaggerItem} className="p-2 bg-slate-900/60 rounded border border-slate-800">
                        <span className="text-slate-400 block text-[8px] uppercase font-bold">Plant & Gear</span>
                        <strong className="text-white">{formatCurrency(equipmentCost)}</strong>
                        <span className="text-[8px] text-slate-500 block">Tools & Consumables</span>
                      </motion.div>
                    </motion.div>
                    
                    <div 
                      id="active-spec-total-cost-trigger"
                      onClick={() => {
                        (window as any).__paint_sync_breakdown_active = true;
                        window.dispatchEvent(new CustomEvent('paint_sync_active_spec_cost_clicked', {
                          detail: {
                            projectName,
                            paintType,
                            colorHex,
                            siteParams,
                            formulationTarget,
                            projectMode,
                            totalCost,
                            materialCost,
                            laborCost,
                            equipmentCost,
                            litersNeeded: unitsNeeded,
                            pricePerLiter: unitRate,
                          }
                        }));
                      }}
                      className="group/cost flex items-center justify-between bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 hover:border-emerald-400 p-2 rounded-xl cursor-pointer transition-all duration-200 select-none shadow-lg active:scale-[0.98]"
                      title="Click to auto-produce procurement breakdown, chemicals listing & proximity comparison in Comms Hub"
                    >
                      <div>
                        <span className="text-slate-400 text-[9px] block uppercase font-bold leading-tight flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Total Best Cost (Active Spec)</span>
                        </span>
                        <span className="text-[8.5px] text-emerald-400 font-mono leading-none flex items-center gap-1 group-hover/cost:text-white transition-colors">
                          <span>{unitsNeeded.toFixed(0)} {unitName} for {siteParams.siteAreaSqMeters}m²</span>
                          <span className="text-[8px] px-1 rounded bg-emerald-500/10 border border-emerald-400/20">Click for Sourced Breakdown</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-right">
                        <span className="text-sm font-extrabold text-emerald-400 group-hover/cost:scale-105 transition-transform">
                          {formatCurrency(totalCost)}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-emerald-400 group-hover/cost:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
    </div>
  );
}

