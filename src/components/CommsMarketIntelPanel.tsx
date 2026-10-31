import React, { useState, useMemo, useEffect } from 'react';
import { LocalizedRegionalMaterial } from '../types';
import { LOCALIZED_REGIONAL_MATERIALS, CURRENT_JOB_SITE } from '../data/localizedSuppliers';
import { formatCurrency, generateId } from '../lib/utils';
import { saveMessageOffline } from '../db';
import { showAppToast } from './ToastNotificationCenter';
import {
  Compass,
  Navigation,
  MapPin,
  Building2,
  PackageCheck,
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  Truck,
  Layers,
  Radio,
  SlidersHorizontal,
  Clock,
  Send,
  ChevronDown,
  ChevronUp,
  Info,
  Beaker,
  Coins,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BackgroundAgentManagerPanel } from './BackgroundAgentManagerPanel';

interface CommsMarketIntelPanelProps {
  onOpenGpsMap: (material: LocalizedRegionalMaterial) => void;
}

export function CommsMarketIntelPanel({ onOpenGpsMap }: CommsMarketIntelPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'paint' | 'plaster' | 'screed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProximity, setSelectedProximity] = useState<'all' | '5km' | '10km'>('all');
  const [dispatchedId, setDispatchedId] = useState<string | null>(null);

  // Custom states for active spec detailed breakdown
  const [activeSpecBreakdown, setActiveSpecBreakdown] = useState<any | null>(null);
  const [isBreakdownCollapsed, setIsBreakdownCollapsed] = useState(false);
  const [choiceUpdating, setChoiceUpdating] = useState<string | null>(null);

  const playClickSound = () => {
    try {
      const audio = new Audio('/assets/click.mp3');
      audio.volume = 0.2;
      audio.play().catch(() => {});
    } catch {}
  };

  useEffect(() => {
    const handleSpecCostClicked = (e: any) => {
      if (e.detail) {
        setActiveSpecBreakdown(e.detail);
        setIsBreakdownCollapsed(false); // Expand when clicked
      }
    };
    window.addEventListener('paint_sync_active_spec_cost_clicked', handleSpecCostClicked);
    return () => window.removeEventListener('paint_sync_active_spec_cost_clicked', handleSpecCostClicked);
  }, []);

  const handleUpdateQualityChoice = (qualityGrade: 'low' | 'high') => {
    playClickSound();
    setChoiceUpdating(qualityGrade);
    
    // Dispatch custom event to update site parameters in EstimatorApp
    window.dispatchEvent(new CustomEvent('paint_sync_quality_grade_changed', {
      detail: { qualityGrade }
    }));

    setTimeout(() => {
      setChoiceUpdating(null);
    }, 400);
  };

  const filteredMaterials = useMemo(() => {
    return LOCALIZED_REGIONAL_MATERIALS.filter((mat) => {
      // Category match
      if (selectedCategory !== 'all' && mat.materialType !== selectedCategory) return false;

      // Proximity filter
      if (selectedProximity === '5km' && mat.distanceKm > 5.0) return false;
      if (selectedProximity === '10km' && mat.distanceKm > 10.0) return false;

      // Search query match
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        mat.name.toLowerCase().includes(q) ||
        mat.tradeName.toLowerCase().includes(q) ||
        mat.standardSpec.toLowerCase().includes(q) ||
        mat.supplierName.toLowerCase().includes(q) ||
        mat.fullAddress.toLowerCase().includes(q) ||
        mat.category.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, searchQuery, selectedProximity]);

  const handleShareToComms = async (mat: LocalizedRegionalMaterial, e: React.MouseEvent) => {
    e.stopPropagation();
    setDispatchedId(mat.id);

    await saveMessageOffline({
      id: generateId(),
      sender: 'Estimator',
      recipient: 'Mixer & Field Team',
      text: `[REGIONAL MARKET INTEL - ${mat.materialType.toUpperCase()}]: Sourced "${mat.tradeName}" from ${mat.supplierName} (${mat.distanceKm} km from site, ${mat.fullAddress}). Price: ${formatCurrency(mat.spotPrice)} / ${mat.unit} (${mat.marketTrend === 'down' ? '↓' : '↑'} ${Math.abs(mat.trendPercentage)}%). Stock: ${mat.stockQuantity} units (${mat.stockStatus}). GPS: ${mat.gpsCoordinates.lat}, ${mat.gpsCoordinates.lng}`,
      timestamp: Date.now(),
      syncStatus: 'pending',
      type: 'text',
    });

    showAppToast({
      title: 'Market Intel Dispatched',
      message: `"${mat.tradeName}" (${mat.supplierName}) dispatched to Comms Hub.`,
      type: 'success',
      badge: mat.materialType.toUpperCase(),
    });

    setTimeout(() => setDispatchedId(null), 2500);
  };

  const getCategoryCounts = () => {
    const paint = LOCALIZED_REGIONAL_MATERIALS.filter((m) => m.materialType === 'paint').length;
    const plaster = LOCALIZED_REGIONAL_MATERIALS.filter((m) => m.materialType === 'plaster').length;
    const screed = LOCALIZED_REGIONAL_MATERIALS.filter((m) => m.materialType === 'screed').length;
    return { all: LOCALIZED_REGIONAL_MATERIALS.length, paint, plaster, screed };
  };

  const counts = getCategoryCounts();

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 text-xs font-sans overflow-hidden">
      {/* Background Agent Manager Panel */}
      <div className="p-2.5 pb-0">
        <BackgroundAgentManagerPanel />
      </div>

      {/* Top Filter & Telemetry Control Strip */}
      <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>All Specs</span>
            <span className="text-[10px] opacity-75">({counts.all})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('paint')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1.5 ${
              selectedCategory === 'paint'
                ? 'bg-blue-600 text-white font-bold shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>Paint Coatings</span>
            <span className="text-[10px] opacity-75">({counts.paint})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('plaster')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1.5 ${
              selectedCategory === 'plaster'
                ? 'bg-amber-600 text-white font-bold shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>Plaster & Renders</span>
            <span className="text-[10px] opacity-75">({counts.plaster})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('screed')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1.5 ${
              selectedCategory === 'screed'
                ? 'bg-purple-600 text-white font-bold shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>Wall Screening</span>
            <span className="text-[10px] opacity-75">({counts.screed})</span>
          </button>
        </div>

        {/* Search & Distance filter */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-[200px] justify-end">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search specs, suppliers..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 font-mono placeholder:text-slate-600"
            />
          </div>

          <div className="hidden md:flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => setSelectedProximity('all')}
              className={`px-2 py-0.5 rounded ${selectedProximity === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}
            >
              All Radius
            </button>
            <button
              type="button"
              onClick={() => setSelectedProximity('5km')}
              className={`px-2 py-0.5 rounded ${selectedProximity === '5km' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
            >
              &lt;5km
            </button>
          </div>
        </div>
      </div>

      {/* Autonomous Market Telemetry Summary Banner */}
      <div className="px-3 py-1.5 bg-indigo-950/30 border-b border-indigo-900/40 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-indigo-300 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>
            Autonomous Market Agent: Matched <strong>{filteredMaterials.length} localized materials</strong> with real-time regional availability & spot rates
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <span>Site Anchor: <strong className="text-white">{CURRENT_JOB_SITE.code}</strong></span>
          <span className="text-emerald-400">● 100% Verified Depots</span>
        </div>
      </div>

      {/* Materials List Stream */}
      <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2.5 min-h-0 bg-slate-950">
        
        {/* ========================================================================= */}
        {/* COLLAPSIBLE PROXIMITY TO SOURCE & ACTIVE SPEC PROCUREMENT BREAKDOWN PANEL */}
        {/* ========================================================================= */}
        <div className="bg-slate-900/90 rounded-2xl border border-indigo-500/30 overflow-hidden shadow-2xl transition-all duration-300 mb-2.5">
          
          {/* Section Header */}
          <div 
            onClick={() => { playClickSound(); setIsBreakdownCollapsed(!isBreakdownCollapsed); }}
            className="px-3.5 py-2.5 bg-gradient-to-r from-indigo-950/80 to-slate-900 border-b border-slate-800/80 flex items-center justify-between cursor-pointer select-none group/hdr"
          >
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400 animate-spin-slow shrink-0" />
              <div className="text-left">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <span>Proximity to Source & Geo-Sourcing Matrix</span>
                  <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/30">
                    Active Spec Analysis
                  </span>
                </h3>
                <span className="text-[9px] text-slate-400 font-mono block">
                  Job Site Geolocation: {CURRENT_JOB_SITE.city} (Sector 4 Hub)
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-indigo-400 font-mono hidden sm:inline">
                {activeSpecBreakdown ? "Calibration Loaded" : "Awaiting Calibration Input"}
              </span>
              <button className="p-1 rounded hover:bg-slate-800 text-slate-400 group-hover/hdr:text-slate-200 transition-colors">
                {isBreakdownCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {!isBreakdownCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                {!activeSpecBreakdown ? (
                  /* Standard Empty State / Prompt */
                  <div className="p-4 sm:p-5 text-center space-y-2.5">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto border border-slate-700/60">
                      <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                      <p className="text-slate-200 font-medium text-xs">Awaiting Active Sourcing Input</p>
                      <p className="text-slate-400 text-[10.5px] leading-relaxed">
                        To view real-time chemical compositions, supplier distance, travel times, and compare choices:
                      </p>
                      <div className="mt-2 text-[10px] bg-slate-950 p-2 rounded-lg border border-slate-800 text-amber-300 font-mono inline-block">
                        💡 Click on the <strong>"Total Best Cost"</strong> button in the active calibration spec box above.
                      </div>
                    </div>
                  </div>
                ) : (
                  /* FULL DETAILED PROCURE BREAKDOWN */
                  <div className="p-3.5 space-y-3.5 bg-slate-900/50">
                    
                    {/* Top Brief Header */}
                    <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 text-[10px] font-mono bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                      <div>
                        <span className="text-slate-500 block text-[8px] uppercase font-bold">Calibration target</span>
                        <strong className="text-slate-200 block truncate">{activeSpecBreakdown.projectName || "Exterior Coating Spec"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[8px] uppercase font-bold">Color swatch</span>
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded border border-slate-800 shrink-0" style={{ backgroundColor: activeSpecBreakdown.colorHex }} />
                          <strong className="text-slate-200 uppercase">{activeSpecBreakdown.colorHex}</strong>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[8px] uppercase font-bold">Volume Required</span>
                        <strong className="text-slate-200">{(activeSpecBreakdown.litersNeeded || 0).toFixed(1)} Liters</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[8px] uppercase font-bold">Total Est. cost</span>
                        <strong className="text-emerald-400">{formatCurrency(activeSpecBreakdown.totalCost || 0)}</strong>
                      </div>
                    </div>

                    {/* TWO-COLUMN GRID: CHEMICAL LISTINGS & SUPPLIER PROXIMITY */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                      
                      {/* COLUMN 1: Chemical Listings (lg:col-span-7) */}
                      <div className="lg:col-span-7 space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="text-[11px] font-bold text-slate-300 font-mono flex items-center gap-1">
                            <Beaker className="w-3.5 h-3.5 text-indigo-400" />
                            Chemical Listing & Pricing Breakdown
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">Spot Commodity Rates</span>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[10px] font-mono">
                            <thead>
                              <tr className="text-slate-500 border-b border-slate-800 text-[9px] uppercase">
                                <th className="py-1">Component / chemical</th>
                                <th className="py-1 text-center">Share</th>
                                <th className="py-1 text-right">Mass (kg)</th>
                                <th className="py-1 text-right">Spot Rate</th>
                                <th className="py-1 text-right">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50 text-slate-300">
                              {(() => {
                                const liters = activeSpecBreakdown.litersNeeded || 150;
                                const weightKg = liters * 1.35; // Estimating average paint density
                                const grade = activeSpecBreakdown.siteParams?.qualityGrade || 'standard';
                                
                                // Dynamic compositions
                                const compTable = grade === 'low' ? [
                                  { name: "Synthetic Elastomeric Polymer Resin", pct: 25, rate: 4.50 },
                                  { name: "Rutillic Titanium Dioxide (TiO₂)", pct: 15, rate: 5.50 },
                                  { name: "Eco-Chalk & Calcium Carbonate (Local)", pct: 40, rate: 0.75 },
                                  { name: "Bio-Clay & Local Natural Silicates (Local)", pct: 10, rate: 0.60 },
                                  { name: "Carrier Fluid (Purified Water & Additives)", pct: 10, rate: 0.20 },
                                ] : grade === 'high' ? [
                                  { name: "Synthetic Elastomeric Polymer Resin", pct: 55, rate: 4.50 },
                                  { name: "Rutillic Titanium Dioxide (TiO₂)", pct: 25, rate: 5.50 },
                                  { name: "Eco-Chalk & Calcium Carbonate (Local)", pct: 8, rate: 0.75 },
                                  { name: "Bio-Clay & Local Natural Silicates (Local)", pct: 2, rate: 0.60 },
                                  { name: "Carrier Fluid (Purified Water & Additives)", pct: 10, rate: 0.20 },
                                ] : [
                                  { name: "Synthetic Elastomeric Polymer Resin", pct: 42, rate: 4.50 },
                                  { name: "Rutillic Titanium Dioxide (TiO₂)", pct: 22, rate: 5.50 },
                                  { name: "Eco-Chalk & Calcium Carbonate (Local)", pct: 18, rate: 0.75 },
                                  { name: "Bio-Clay & Local Natural Silicates (Local)", pct: 6, rate: 0.60 },
                                  { name: "Carrier Fluid (Purified Water & Additives)", pct: 12, rate: 0.20 },
                                ];

                                return compTable.map((chem, idx) => {
                                  const chemMass = (weightKg * chem.pct) / 100;
                                  const chemCost = chemMass * chem.rate;
                                  const isLocalExtender = chem.name.includes("Local");
                                  return (
                                    <tr key={idx} className={`${isLocalExtender ? 'text-amber-300 font-semibold' : ''}`}>
                                      <td className="py-1 truncate max-w-[140px] xs:max-w-none" title={chem.name}>
                                        <span className="flex items-center gap-1">
                                          {isLocalExtender && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                                          <span>{chem.name}</span>
                                        </span>
                                      </td>
                                      <td className="py-1 text-center">{chem.pct}%</td>
                                      <td className="py-1 text-right">{chemMass.toFixed(1)}</td>
                                      <td className="py-1 text-right">{formatCurrency(chem.rate * 1200)}</td>
                                      <td className="py-1 text-right text-slate-200">{formatCurrency(chemCost * 1200)}</td>
                                    </tr>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* COLUMN 2: Supplier Proximity & Route (lg:col-span-5) */}
                      <div className="lg:col-span-5 space-y-2">
                        <div className="border-b border-slate-800 pb-1.5">
                          <span className="text-[11px] font-bold text-slate-300 font-mono flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-emerald-400" />
                            Supplier Proximity (Frankfurt Geo-Zone)
                          </span>
                        </div>
                        
                        <div className="space-y-1.5 text-[10px] font-mono">
                          {LOCALIZED_REGIONAL_MATERIALS.slice(0, 3).map((supplier, idx) => {
                            const isOptimal = idx === 0;
                            return (
                              <div key={supplier.id} className="p-2 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-200 truncate max-w-[160px] flex items-center gap-1">
                                    <span className={`w-1.5 h-1.5 rounded-full ${isOptimal ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                                    <span>{supplier.supplierName}</span>
                                  </span>
                                  {isOptimal && (
                                    <span className="text-[8px] bg-emerald-500/15 text-emerald-300 px-1 py-0.2 rounded border border-emerald-500/20 uppercase font-extrabold tracking-wider">
                                      Optimal Node
                                    </span>
                                  )}
                                </div>
                                <div className="flex justify-between text-[9.5px] text-slate-400">
                                  <span>Route: via A5 Autoclass</span>
                                  <span className="text-slate-300">
                                    {supplier.distanceKm} km • <strong className={isOptimal ? "text-emerald-400" : "text-slate-300"}>{supplier.travelTimeMins} min ETA</strong>
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                    {/* STRATEGIC DOUBLE-DOWN CALLOUT */}
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-amber-300 text-[10.5px]">
                        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Geo-Sourcing Strategic Intel: Double down on natural extenders</span>
                      </div>
                      <p className="text-slate-300 text-[10px] leading-relaxed">
                        By strategically substituting a portion of synthetic polymer resins with <strong>natural, local bio-based calcite extenders & silicates (chalk and clay)</strong> mined in the immediate Frankfurt SW-1 Westhafen freight terminal, you can harvest up to <strong>35% cost savings</strong> on material procurement with negligible gloss fluctuation. Or, stick to the heavy-duty industrial formula for maximum weatherability.
                      </p>
                    </div>

                    {/* CUSTOMER SOURCING MODE INTERACTIVE CHOICE */}
                    <div className="pt-2 border-t border-slate-800 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <span className="text-slate-400 font-mono text-[10px] uppercase font-bold block leading-tight">
                            Procurement Calibration
                          </span>
                          <span className="text-[11px] font-extrabold text-amber-300 font-mono tracking-tight block">
                            $ave money || or better quality. It's up to you...
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono font-bold">
                          Active mode: {activeSpecBreakdown.siteParams?.qualityGrade === 'low' ? '💰 Economy Savings' : activeSpecBreakdown.siteParams?.qualityGrade === 'high' ? '💎 Industrial Premium' : '⚖️ Standard Balanced'}
                        </span>
                      </div>

                      {/* BUTTON LAYOUT IN COMMS HUB */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        
                        {/* Button 1: Save Money */}
                        <button
                          type="button"
                          onClick={() => handleUpdateQualityChoice('low')}
                          disabled={choiceUpdating !== null}
                          className={`relative group/btn cursor-pointer p-3 rounded-xl border flex items-start gap-3 text-left transition-all select-none active:scale-[0.98] ${
                            activeSpecBreakdown.siteParams?.qualityGrade === 'low'
                              ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                              : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
                            activeSpecBreakdown.siteParams?.qualityGrade === 'low'
                              ? 'bg-emerald-500/20 border-emerald-400'
                              : 'bg-slate-900 border-slate-800'
                          }`}>
                            <Coins className={`w-4 h-4 ${activeSpecBreakdown.siteParams?.qualityGrade === 'low' ? 'text-emerald-400' : 'text-slate-400'}`} />
                          </div>
                          
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-[11px] tracking-tight block">$ave Money (Eco-Chalk Spec)</span>
                              <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded font-extrabold">
                                -35% COST
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-400 leading-normal block group-hover/btn:text-slate-200 transition-colors">
                              Formulates with 50% regional bio-chalk & clay extenders. Cut synthetic polymers. Excellent breathability.
                            </span>
                          </div>

                          {activeSpecBreakdown.siteParams?.qualityGrade === 'low' && (
                            <span className="absolute top-2 right-2 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          )}
                        </button>

                        {/* Button 2: Better Quality */}
                        <button
                          type="button"
                          onClick={() => handleUpdateQualityChoice('high')}
                          disabled={choiceUpdating !== null}
                          className={`relative group/btn cursor-pointer p-3 rounded-xl border flex items-start gap-3 text-left transition-all select-none active:scale-[0.98] ${
                            activeSpecBreakdown.siteParams?.qualityGrade === 'high'
                              ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                              : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
                            activeSpecBreakdown.siteParams?.qualityGrade === 'high'
                              ? 'bg-indigo-500/20 border-indigo-400'
                              : 'bg-slate-900 border-slate-800'
                          }`}>
                            <Beaker className={`w-4 h-4 ${activeSpecBreakdown.siteParams?.qualityGrade === 'high' ? 'text-indigo-400' : 'text-slate-400'}`} />
                          </div>
                          
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-[11px] tracking-tight block">Better Quality (Industrial Spec)</span>
                              <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1 py-0.2 rounded font-extrabold">
                                MAX RESINS
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-400 leading-normal block group-hover/btn:text-slate-200 transition-colors">
                              Formulates with 55% high-grade synthetic polymer binder and max Titanium Dioxide. Maximum 15-year weathering protection.
                            </span>
                          </div>

                          {activeSpecBreakdown.siteParams?.qualityGrade === 'high' && (
                            <span className="absolute top-2 right-2 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                          )}
                        </button>

                      </div>
                    </div>

                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {filteredMaterials.length === 0 ? (
          <div className="text-center py-8 text-slate-500 font-mono text-xs">
            No localized regional materials matching the current filter criteria.
          </div>
        ) : (
          filteredMaterials.map((mat) => {
            const isDispatched = dispatchedId === mat.id;

            return (
              <div
                key={mat.id}
                className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5 shadow-sm group"
              >
                {/* Header Row: Category Badge, Name, Spot Price */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Material Type Tag */}
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          mat.materialType === 'paint'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : mat.materialType === 'plaster'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}
                      >
                        {mat.materialType}
                      </span>

                      {/* Technical Standard */}
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {mat.standardSpec}
                      </span>

                      {/* Stock availability */}
                      <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                        <PackageCheck className="w-3 h-3 text-emerald-400" />
                        <span>{mat.stockStatus} ({mat.stockQuantity} in stock)</span>
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white font-sans group-hover:text-indigo-300 transition-colors">
                      {mat.name}
                    </h4>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Trade spec: <strong className="text-slate-200">{mat.tradeName}</strong> • {mat.coverageEstimate}
                    </div>
                  </div>

                  {/* Spot Price & Trend Badge */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0 bg-slate-950 sm:bg-transparent p-2 sm:p-0 rounded-lg border sm:border-0 border-slate-800">
                    <div className="text-xs font-bold font-mono text-emerald-400">
                      {formatCurrency(mat.spotPrice)} <span className="text-[10px] text-slate-400 font-normal">/ {mat.unit}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-mono">
                      {mat.marketTrend === 'down' ? (
                        <span className="text-emerald-400 flex items-center gap-0.5">
                          <TrendingDown className="w-3 h-3" />
                          <span>{mat.trendPercentage}% spot</span>
                        </span>
                      ) : mat.marketTrend === 'up' ? (
                        <span className="text-amber-400 flex items-center gap-0.5">
                          <TrendingUp className="w-3 h-3" />
                          <span>+{mat.trendPercentage}% spot</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-0.5">
                          <Minus className="w-3 h-3" />
                          <span>Stable spot</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Supplier Address, GPS Coordinates, and Distance Row */}
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px]">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-slate-300 font-bold font-mono text-[11px]">
                      <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{mat.supplierName}</span>
                    </div>
                    <div className="text-slate-400 text-[10px] font-sans truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{mat.fullAddress}</span>
                    </div>
                  </div>

                  {/* GPS & Distance Tags + Animated Map Popup Trigger Link */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <div className="text-[10px] font-mono bg-slate-900 px-2 py-1 rounded text-slate-300 border border-slate-800 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      <span>{mat.distanceKm} km ({mat.travelTimeMins}m ETA)</span>
                    </div>

                    {/* THE REQUESTED GPS SVG LINK THAT POPS UP THE ANIMATED MAP */}
                    <button
                      type="button"
                      onClick={() => onOpenGpsMap(mat)}
                      title={`Open Animated Radar GPS Map for ${mat.supplierName}`}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 hover:border-indigo-400 text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm group/btn cursor-pointer"
                    >
                      {/* Animated SVG GPS Target Icon */}
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current stroke-2 group-hover/btn:animate-spin">
                        <circle cx="12" cy="12" r="9" strokeDasharray="2 2" />
                        <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.4" />
                        <line x1="12" y1="2" x2="12" y2="6" />
                        <line x1="12" y1="18" x2="12" y2="22" />
                        <line x1="2" y1="12" x2="6" y2="12" />
                        <line x1="18" y1="12" x2="22" y2="12" />
                      </svg>
                      <span>GPS Map & Route</span>
                    </button>

                    {/* Dispatch to Comms Hub Button */}
                    <button
                      type="button"
                      onClick={(e) => handleShareToComms(mat, e)}
                      title="Dispatch specification note to Comms Hub"
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isDispatched
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700'
                      }`}
                    >
                      {isDispatched ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Footer Strip */}
      <div className="p-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0">
        <span className="flex items-center gap-1">
          <Navigation className="w-3 h-3 text-emerald-400" />
          <span>Real-time GPS Geo-Sourcing Engine</span>
        </span>
        <span className="text-indigo-400">Regional Spot Pricing Updated Live</span>
      </div>

    </div>
  );
}
