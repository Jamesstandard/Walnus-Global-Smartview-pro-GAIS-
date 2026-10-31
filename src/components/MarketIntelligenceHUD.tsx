import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { gridStaggerContainer, gridStaggerItem } from '../lib/motionVariants';
import { Bot, LineChart, Globe, DollarSign, Package, Zap, ExternalLink, Activity, ArrowRight } from 'lucide-react';

interface MarketIntelligenceHUDProps {
  projectMode: string;
  surfaceArea: number;
  onNext?: () => void;
  show3DButton?: boolean;
}

export function MarketIntelligenceHUD({ projectMode, surfaceArea, onNext, show3DButton }: MarketIntelligenceHUDProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [progress, setProgress] = useState(0);

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
              Fetching global spot pricing & vendor availability...
            </div>
          </div>
        </div>
        <div className="px-2 py-1 bg-slate-950 rounded border border-slate-700 text-[10px] font-mono font-bold text-indigo-400 uppercase flex items-center gap-1">
          <Globe className="w-3 h-3" />
          <span>Comms HUD</span>
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
              {/* Vendor A */}
              <motion.div
                variants={gridStaggerItem}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="p-4 bg-slate-900/50 hover:bg-slate-900 rounded-xl border border-emerald-500/30 hover:border-emerald-500 transition-colors cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-mono font-bold text-emerald-400 text-sm">BuildCorp Supplies</div>
                  <div className="bg-emerald-950/60 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">TOP MATCH</div>
                </div>
                <div className="text-[10px] text-slate-400 mb-4">Stock available for {surfaceArea} sqft</div>
                <div className="text-xl font-bold text-white mb-1 flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-slate-500" />
                  1,240.00
                </div>
                <div className="text-[10px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="flex items-center gap-1"><Package className="w-3 h-3" /> Delivery: 2 Days</span>
                  <ExternalLink className="w-3 h-3 group-hover:text-emerald-400" />
                </div>
              </motion.div>

              {/* Vendor B */}
              <motion.div
                variants={gridStaggerItem}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="p-4 bg-slate-900/50 hover:bg-slate-900 rounded-xl border border-slate-800 hover:border-indigo-500/50 transition-colors cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-mono font-bold text-indigo-400 text-sm">Industrial Materials LLC</div>
                </div>
                <div className="text-[10px] text-slate-400 mb-4">Partial stock available</div>
                <div className="text-xl font-bold text-white mb-1 flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-slate-500" />
                  1,180.50
                </div>
                <div className="text-[10px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="flex items-center gap-1"><Package className="w-3 h-3 text-amber-400" /> Delivery: 5 Days</span>
                  <ExternalLink className="w-3 h-3 group-hover:text-indigo-400" />
                </div>
              </motion.div>

              {/* Vendor C */}
              <motion.div
                variants={gridStaggerItem}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="p-4 bg-slate-900/50 hover:bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-600 transition-colors cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-mono font-bold text-slate-300 text-sm">Global Paints Direct</div>
                </div>
                <div className="text-[10px] text-slate-400 mb-4">Premium grade alternative</div>
                <div className="text-xl font-bold text-white mb-1 flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-slate-500" />
                  1,450.00
                </div>
                <div className="text-[10px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-emerald-400" /> Express Delivery</span>
                  <ExternalLink className="w-3 h-3 group-hover:text-slate-300" />
                </div>
              </motion.div>
            </motion.div>

            <div className="bg-indigo-950/30 border border-indigo-500/30 p-3 rounded-lg flex items-start gap-3">
              <Bot className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Based on current market conditions, <strong>BuildCorp Supplies</strong> offers the best balance of cost and delivery speed for {projectMode} materials targeting {surfaceArea} sqft. I have compiled these quotes into a formal Stakeholder Report.
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
