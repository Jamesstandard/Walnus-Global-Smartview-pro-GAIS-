import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Sector } from 'recharts';
import { PaintProject } from '../types';
import { formatCurrency } from '../lib/utils';
import {
  PieChart as PieChartIcon,
  Scale,
  DollarSign,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  SlidersHorizontal,
  Beaker,
  Droplets,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface FormulationRawMaterial {
  id: string;
  name: string;
  chemicalTradeName: string;
  role: 'binder' | 'base_pigment' | 'solvent' | 'colorant' | 'extender' | 'additive';
  roleLabel: string;
  weightPercentage: number; // e.g. 34.0 (%)
  pricePerKg: number;
  color: string;
  description: string;
}

interface PaintFormulationDonutChartProps {
  project: PaintProject;
  marketPrices?: { name: string; price: number }[];
  onIngredientSelect?: (ingredient: FormulationRawMaterial) => void;
}

function PaintFormulationDonutChartComponent({
  project,
  marketPrices,
  onIngredientSelect,
}: PaintFormulationDonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [displayMode, setDisplayMode] = useState<'percentage' | 'mass' | 'cost'>('percentage');

  // Paint density constant: ~4.75 kg per US gallon (~10.47 lbs/gal, 1.255 g/cm³)
  const totalBatchMassKg = useMemo(() => {
    return Math.max(1, parseFloat((project.volumeGallons * 4.75).toFixed(2)));
  }, [project.volumeGallons]);

  // Dynamic formulation calculated based on paintType and color
  const formulationData = useMemo(() => {
    // Determine dynamic price overrides from market scraping if available
    const getPrice = (nameKey: string, defaultPrice: number) => {
      if (!marketPrices || marketPrices.length === 0) return defaultPrice;
      const match = marketPrices.find((p) => p.name.toLowerCase().includes(nameKey.toLowerCase()));
      return match ? match.price : defaultPrice;
    };

    const isEpoxy = project.paintType.toLowerCase().includes('epoxy');
    const isPolyurethane = project.paintType.toLowerCase().includes('polyurethane');
    const isSilicone = project.paintType.toLowerCase().includes('silicone');

    // Customized weight percentages based on formulation chemistry
    let binderPct = 34.0;
    let basePigmentPct = 22.5;
    let solventPct = 28.0;
    let colorantPct = 6.5;
    let extenderPct = 5.5;
    let additivePct = 3.5;

    let binderName = 'Acrylic Copolymer Emulsion (Binder)';
    let binderTrade = 'Primal AC-261 / Rhoplex HG-54D';
    let solventName = 'Demineralized H₂O / Co-Solvent Matrix';

    if (isEpoxy) {
      binderPct = 42.0;
      basePigmentPct = 20.0;
      solventPct = 22.0;
      colorantPct = 6.0;
      extenderPct = 6.0;
      additivePct = 4.0;
      binderName = 'Bisphenol-A Diglycidyl Epoxy Resin (Binder)';
      binderTrade = 'EPON 828 / Araldite GY 2600';
      solventName = 'Xylene / Glycol Ether Solvent Carrier';
    } else if (isPolyurethane) {
      binderPct = 38.0;
      basePigmentPct = 21.0;
      solventPct = 26.0;
      colorantPct = 6.5;
      extenderPct = 4.5;
      additivePct = 4.0;
      binderName = 'Aliphatic Polyurethane Isocyanate Pre-Polymer';
      binderTrade = 'Desmodur N 3300 / Tolonate HDT';
      solventName = 'Methoxypropyl Acetate / Butyl Acetate';
    } else if (isSilicone) {
      binderPct = 36.0;
      basePigmentPct = 24.0;
      solventPct = 24.5;
      colorantPct = 5.5;
      extenderPct = 6.0;
      additivePct = 4.0;
      binderName = 'Silicone-Modified Hydrophobic Resin Binder';
      binderTrade = 'Silres BS 45 / Wacker Siloxane Matrix';
      solventName = 'Pure Demineralized Water Carrier';
    }

    const rawMaterials: FormulationRawMaterial[] = [
      {
        id: 'mat_binder',
        name: binderName,
        chemicalTradeName: binderTrade,
        role: 'binder',
        roleLabel: 'Polymer Binder',
        weightPercentage: binderPct,
        pricePerKg: getPrice('Resin', 2.10),
        color: '#10b981', // Emerald
        description: 'Forms the continuous, durable protective film barrier and binds pigment particles.',
      },
      {
        id: 'mat_base_pigment',
        name: 'Titanium Dioxide (TiO₂ Rutile Base)',
        chemicalTradeName: 'Ti-Pure R-902+ / Kronos 2310',
        role: 'base_pigment',
        roleLabel: 'Base Opacifier',
        weightPercentage: basePigmentPct,
        pricePerKg: getPrice('Titanium', 3.45),
        color: '#38bdf8', // Sky Blue
        description: 'High-refractive index (n=2.71) crystal providing ultimate hiding power and whiteness.',
      },
      {
        id: 'mat_solvent',
        name: solventName,
        chemicalTradeName: 'Deionized H₂O + Propylene Glycol Matrix',
        role: 'solvent',
        roleLabel: 'Volatile Vehicle',
        weightPercentage: solventPct,
        pricePerKg: getPrice('Solvent', 0.80),
        color: '#06b6d4', // Cyan
        description: 'Dispersion carrier that regulates wet application viscosity and open drying time.',
      },
      {
        id: 'mat_colorant',
        name: `Custom Spectro Tint Pigment (${project.colorName || 'Hex Dispersion'})`,
        chemicalTradeName: `Colanyl Tint Matrix (${project.colorHex})`,
        role: 'colorant',
        roleLabel: 'Spectro Toning',
        weightPercentage: colorantPct,
        pricePerKg: getPrice('Pigment', 12.50),
        color: project.colorHex || '#8b5cf6', // Project target tone or Purple
        description: 'High-chroma organic/inorganic color dispersion calibrated to target spectrophotometry.',
      },
      {
        id: 'mat_extender',
        name: 'Ultra-Fine Micronized Calcium Carbonate (CaCO₃)',
        chemicalTradeName: 'Omyacarb 2T-AV / Hydrocarb 90',
        role: 'extender',
        roleLabel: 'Extender Pigment',
        weightPercentage: extenderPct,
        pricePerKg: getPrice('Extender', 0.65),
        color: '#f59e0b', // Amber
        description: 'Controls sheen, optimizes pigment packing density, and reinforces mechanical hardness.',
      },
      {
        id: 'mat_additive',
        name: 'HEUR Rheology & Anti-Foam Additive Package',
        chemicalTradeName: 'Acrysol RM-8W + BYK-024 Defoamer',
        role: 'additive',
        roleLabel: 'Performance Additives',
        weightPercentage: additivePct,
        pricePerKg: getPrice('Additive', 8.20),
        color: '#ec4899', // Pink / Rose
        description: 'Non-ionic associative thickener, foam suppressant, in-can biocide, and wetting agent.',
      },
    ];

    return rawMaterials;
  }, [project.paintType, project.colorHex, project.colorName, marketPrices]);

  // Aggregate stats
  const totalCost = useMemo(() => {
    return formulationData.reduce((acc, item) => {
      const massKg = totalBatchMassKg * (item.weightPercentage / 100);
      return acc + massKg * item.pricePerKg;
    }, 0);
  }, [formulationData, totalBatchMassKg]);

  const activeMaterial = activeIndex !== null ? formulationData[activeIndex] : null;

  // Custom Active Shape renderer for recharts Pie to render smooth expanded highlighted slice
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 2}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          style={{ filter: 'drop-shadow(0px 0px 8px rgba(16, 185, 129, 0.4))' }}
        />
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={outerRadius + 9}
          outerRadius={outerRadius + 11}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col space-y-3.5 shadow-sm font-sans">
      
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <PieChartIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                Formulation Weight Breakdown
              </h3>
              <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/20">
                100.0 wt% Final Mix
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Gravimetric ratio for {project.volumeGallons} Gallons ({totalBatchMassKg.toLocaleString()} kg net mass)
            </p>
          </div>
        </div>

        {/* View Mode Toggle: Weight % vs Batch Mass (kg) vs Cost Contribution */}
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
          <button
            type="button"
            onClick={() => setDisplayMode('percentage')}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              displayMode === 'percentage'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Weight %</span>
          </button>

          <button
            type="button"
            onClick={() => setDisplayMode('mass')}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              displayMode === 'mass'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-2.5 h-2.5" />
            <span>Mass (kg)</span>
          </button>

          <button
            type="button"
            onClick={() => setDisplayMode('cost')}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              displayMode === 'cost'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-2.5 h-2.5" />
            <span>Cost ($)</span>
          </button>
        </div>
      </div>

      {/* Main Visual Layout: Donut Chart on Left, Ingredients List on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
        
        {/* DONUT CHART CONTAINER (Recharts) */}
        <div className="md:col-span-5 relative flex flex-col items-center justify-center min-h-[220px]">
          <div className="w-full h-52 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={formulationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={82}
                  paddingAngle={3}
                  dataKey="weightPercentage"
                  nameKey="name"
                  activeIndex={activeIndex !== null ? activeIndex : undefined}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => {
                    setActiveIndex(index);
                    if (onIngredientSelect) onIngredientSelect(formulationData[index]);
                  }}
                  onMouseLeave={() => setActiveIndex(null)}
                  cursor="pointer"
                  animationDuration={800}
                >
                  {formulationData.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.id}`}
                      fill={entry.color}
                      stroke="#020617"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>

                {/* Custom Styled Tooltip */}
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as FormulationRawMaterial;
                      const massKg = (totalBatchMassKg * (data.weightPercentage / 100)).toFixed(1);
                      const costVal = (parseFloat(massKg) * data.pricePerKg).toFixed(2);

                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs font-mono max-w-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-white">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                            <span>{data.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans">{data.chemicalTradeName}</div>
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[11px]">
                            <div>
                              <span className="text-slate-500">Weight Share:</span>{' '}
                              <strong className="text-emerald-400">{data.weightPercentage.toFixed(1)}%</strong>
                            </div>
                            <div>
                              <span className="text-slate-500">Batch Mass:</span>{' '}
                              <strong className="text-slate-200">{massKg} kg</strong>
                            </div>
                            <div>
                              <span className="text-slate-500">Rate:</span>{' '}
                              <span className="text-slate-300">{formatCurrency(data.pricePerKg)}/kg</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Cost:</span>{' '}
                              <strong className="text-emerald-400">${costVal}</strong>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Donut Hole Telemetry Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              {activeMaterial ? (
                <motion.div
                  key={activeMaterial.id}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-0.5"
                >
                  <div className="text-lg font-mono font-bold text-white tracking-tight" style={{ color: activeMaterial.color }}>
                    {displayMode === 'percentage'
                      ? `${activeMaterial.weightPercentage.toFixed(1)}%`
                      : displayMode === 'mass'
                      ? `${(totalBatchMassKg * (activeMaterial.weightPercentage / 100)).toFixed(1)} kg`
                      : `$${((totalBatchMassKg * (activeMaterial.weightPercentage / 100)) * activeMaterial.pricePerKg).toFixed(0)}`}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider truncate max-w-[100px]">
                    {activeMaterial.roleLabel}
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-0.5">
                  <div className="text-base sm:text-lg font-mono font-bold text-white tracking-tight">
                    {displayMode === 'percentage'
                      ? '100.0%'
                      : displayMode === 'mass'
                      ? `${totalBatchMassKg.toLocaleString()} kg`
                      : formatCurrency(totalCost)}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                    {displayMode === 'percentage' ? 'Total Mix' : displayMode === 'mass' ? 'Batch Mass' : 'Batch Cost'}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-500 text-center">
            Hover slices to inspect chemistry & weight fractions
          </div>
        </div>

        {/* INGREDIENTS BREAKDOWN LIST */}
        <div className="md:col-span-7 space-y-1.5">
          {formulationData.map((item, idx) => {
            const isHovered = activeIndex === idx;
            const itemMassKg = parseFloat((totalBatchMassKg * (item.weightPercentage / 100)).toFixed(1));
            const itemCost = parseFloat((itemMassKg * item.pricePerKg).toFixed(2));
            const costSharePct = ((itemCost / (totalCost || 1)) * 100).toFixed(1);

            return (
              <div
                key={item.id}
                onMouseEnter={() => {
                  setActiveIndex(idx);
                  if (onIngredientSelect) onIngredientSelect(item);
                }}
                onMouseLeave={() => setActiveIndex(null)}
                className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                  isHovered
                    ? 'bg-slate-900 border-slate-700 shadow-md ring-1 ring-emerald-500/40'
                    : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                {/* Left: Swatch & Name */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-200 truncate font-sans">
                        {item.name}
                      </span>
                      <span className="hidden sm:inline text-[9px] font-mono text-slate-500 uppercase bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800 shrink-0">
                        {item.roleLabel}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      {item.chemicalTradeName}
                    </div>
                  </div>
                </div>

                {/* Right: Values based on display mode */}
                <div className="text-right shrink-0 font-mono">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs font-bold text-emerald-400">
                      {displayMode === 'percentage'
                        ? `${item.weightPercentage.toFixed(1)} wt%`
                        : displayMode === 'mass'
                        ? `${itemMassKg.toLocaleString()} kg`
                        : formatCurrency(itemCost)}
                    </span>
                    <span className="text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      {item.weightPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-500">
                    {itemMassKg} kg • {formatCurrency(item.pricePerKg)}/kg
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Footer Physical Properties Telemetry Bar */}
      <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-slate-400">
        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/60 flex items-center justify-between">
          <span>Target Batch:</span>
          <strong className="text-slate-200">{project.volumeGallons} Gal ({(project.volumeGallons * 3.78541).toFixed(0)} L)</strong>
        </div>
        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/60 flex items-center justify-between">
          <span>Dry Solids:</span>
          <strong className="text-emerald-400">52.8 wt%</strong>
        </div>
        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/60 flex items-center justify-between">
          <span>VOC Rating:</span>
          <strong className="text-slate-200">&lt; 25 g/L</strong>
        </div>
        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/60 flex items-center justify-between">
          <span>Batch Material Cost:</span>
          <strong className="text-emerald-400">{formatCurrency(totalCost)}</strong>
        </div>
      </div>

    </div>
  );
}

export const PaintFormulationDonutChart = React.memo(PaintFormulationDonutChartComponent);
