import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Box, Sliders, ScanSearch, CheckCircle2 } from 'lucide-react';
import { staggerContainer, staggerItem } from '../lib/motionVariants';
import { playClickSound, playSuccessSound } from '../lib/soundUtils';

interface AnalysisRoutingViewProps {
  imageSrc: string;
  onSelectOption: (wants3D: boolean) => void;
}

export function AnalysisRoutingView({ imageSrc, onSelectOption }: AnalysisRoutingViewProps) {
  const [analyzing, setAnalyzing] = useState(true);

  useEffect(() => {
    // Simulate AI scanning the image
    const timer = setTimeout(() => {
      setAnalyzing(false);
      playSuccessSound();
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed top-[76px] inset-x-0 bottom-0 m-[10px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl font-sans flex flex-col">
      <div className="relative flex-1 bg-black overflow-hidden flex flex-col items-center justify-center">
        <img src={imageSrc} alt="Captured Site" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        
        <AnimatePresence>
          {analyzing ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-10"
            >
              <div className="relative w-24 h-24 mb-4">
                <ScanSearch className="w-full h-full text-indigo-400 animate-pulse" />
                <motion.div
                  initial={{ top: '0%' }}
                  animate={{ top: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_15px_#22d3ee] z-20"
                />
              </div>
              <h3 className="text-white font-mono font-bold text-lg tracking-widest uppercase">
                AI Surface Analysis
              </h3>
              <p className="text-indigo-300 font-mono text-xs mt-2 animate-pulse">
                Extracting topological markers...
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-10 p-6"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              
              <h3 className="text-white font-mono font-bold text-xl tracking-wide text-center mb-2">
                Scan Complete
              </h3>
              <p className="text-slate-300 text-sm font-sans text-center max-w-sm mb-8">
                The image has been processed. Would you like to generate a fully rotatable 3D model, or proceed directly to color palette and material setup?
              </p>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg"
              >
                <motion.button
                  variants={staggerItem}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onSelectOption(true);
                  }}
                  className="group flex flex-col items-center justify-center p-6 bg-slate-900/80 hover:bg-indigo-950 border border-slate-700 hover:border-indigo-500 rounded-2xl transition-all cursor-pointer shadow-lg"
                >
                  <Box className="w-10 h-10 text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
                  <span className="font-mono font-bold text-white text-sm uppercase">Generate 3D Model</span>
                  <span className="text-[10px] text-slate-400 mt-1">High-fidelity mesh generation</span>
                </motion.button>
                
                <motion.button
                  variants={staggerItem}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onSelectOption(false);
                  }}
                  className="group flex flex-col items-center justify-center p-6 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-2xl transition-all cursor-pointer shadow-lg"
                >
                  <Sliders className="w-10 h-10 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
                  <span className="font-mono font-bold text-white text-sm uppercase">Site Setup</span>
                  <span className="text-[10px] text-slate-400 mt-1">Direct to material formulation</span>
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
