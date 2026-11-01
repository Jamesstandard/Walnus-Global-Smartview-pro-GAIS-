import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { gridStaggerContainer, gridStaggerItem } from '../lib/motionVariants';
import { Bot, LineChart, Globe, Package, Zap, ExternalLink, Activity, ArrowRight, MapPin } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { getStoredLocalization } from '../data/userProfileSettings';
import { getLocalizedMaterialsLocal } from '../data/localizedSuppliers';

interface MarketIntelligenceHUDProps {
  projectMode: string;
  surfaceArea: number;
  onNext?: () => void;
  show3DButton?: boolean;
}

export function MarketIntelligenceHUD({ projectMode, surfaceArea, onNext, show3DButton }: MarketIntelligenceHUDProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [localization, setLocalization] = useState(getStoredLocalization);

  useEffect(() => {
    const handleLocUpdate = (e: any) => {
      if (e.detail) setLocalization(e.detail);
    };
    window.addEventListener('paint_sync_localization_updated', handleLocUpdate);
    return () => window.removeEventListener('paint_sync_localization_updated', handleLocUpdate);
  }, []);

  useEffect(() => {
    if (!isAnalyzing) return;
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);
          return 100;
        }
        return p + 2.5;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const materials = useMemo(() => {
    const cat = projectMode === 'screed' ? 'screed' : projectMode === 'plaster' ? 'plaster' : 'paint';
    return getLocalizedMaterialsLocal(cat, 50).slice(0, 3);
  }, [projectMode]);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col font-sans">
      <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
              Autonomous Market Intelligence
            </h3>
            <div className="text-[10px] text-slate-400 font-mono">
              Analyzing local 50-mile radius for {projectMode}...
            </div>
          </div>
        </div>
        <div className="px-2 py-1 bg-slate-950 rounded border border-slate-700 text-[10px] font-mono font-bold text-indigo-400 uppercase flex items-center gap-1">
          <Globe className="w-3 h-3" />
          <span>Local Hub</span>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {isAnalyzing ? (
          <div className="space-y-4 py-8">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 font-bold uppercase">
              <span>Agent Network Queries Running...</span>
              <span className="text-indigo-400">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-indigo-600 to-emerald-400 transition-all duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400 animate-spin" />
                <span className="text-[10px] text-slate-400 font-mono">Pinging Regional Suppliers...</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center gap-2">
                <LineChart className="w-4 h-4 text-amber-400 animate-bounce" />
                <span className="text-[10px] text-slate-400 font-mono">Analyzing Spot Markets...</span>
              </div>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <motion.div
              variants={gridStaggerContainer}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              {materials.map((mat, idx) => (
                <motion.div
                  key={mat.id}
                  variants={gridStaggerItem}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  onClick={() => {
                    // Fix: Open the detailed analysis HUD
                    window.dispatchEvent(new CustomEvent('paint_sync_active_spec_cost_clicked', { detail: { 
                      projectName: mat.tradeName,
                      totalCost: mat.spotPrice,
                      litersNeeded: surfaceArea / 10, // Mock calculation
                      colorHex: '#3b82f6'
                    }}));
                    // Also switch to Comms Hub if possible, but for now we just show the toast or feedback
                  }}
                  className={`p-4 bg-slate-900/50 hover:bg-slate-900 rounded-xl border transition-colors cursor-pointer group ${
                    idx === 0 ? 'border-emerald-500/40 hover:border-emerald-500' : 'border-slate-800 hover:border-indigo-500/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className={`font-mono font-bold text-sm ${idx === 0 ? 'text-emerald-400' : 'text-indigo-400'}`}>
                      {mat.supplierName.split(' ')[0]}
                    </div>
                    {idx === 0 && (
                      <div className="bg-emerald-950/60 text-emerald-400 px-2 py-0.5 rounded text-[8px] font-bold uppercase">Top Match</div>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-200 font-bold mb-1 truncate">{mat.tradeName}</div>
                  <div className="text-[9px] text-slate-500 mb-3 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {mat.distanceMiles} miles away
                  </div>
                  <div className="text-lg font-bold text-white mb-1 flex items-center gap-1">
                    <span className={idx === 0 ? 'text-emerald-400' : 'text-slate-200'}>
                      {formatCurrency(mat.spotPrice, localization)}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {mat.unit}</span>
                    <ExternalLink className="w-3 h-3 group-hover:text-indigo-400" />
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <div className="bg-indigo-950/30 border border-indigo-500/30 p-3 rounded-lg flex items-start gap-3">
              <Bot className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                I have identified <strong>{materials[0]?.supplierName}</strong> as the optimal local supplier for {projectMode} within a 50-mile radius of your Lagos VI fix. Total materials for {surfaceArea} sqft are estimated at {formatCurrency((materials[0]?.spotPrice || 0) * 5, localization)}.
              </p>
            </div>

            {show3DButton && onNext && (
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={onNext}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-indigo-900/50"
                >
                  <span>Generate 3D Model</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
