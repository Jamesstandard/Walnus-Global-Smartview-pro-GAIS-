import React, { useState } from 'react';
import {
  Boxes,
  Database,
  Cpu,
  Share2,
  HardDrive,
  Globe,
  Radio,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Box,
  Layers,
  FileText,
  Sliders,
  Sparkles,
  Zap,
  CloudSun,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { playClickSound } from '../lib/soundUtils';
import { SLM_MODELS_REGISTRY } from '../data/slmModelsData';
import { slmEngine } from '../lib/slmEngine';
import { SLMModelInfo } from '../types';

interface IntegrationsConsoleProps {
  onOpenWorkspace?: () => void;
  onOpenSettings?: () => void;
  onOpenContacts?: () => void;
  onOpenInventory?: () => void;
  onOpenQuotation?: () => void;
  onOpenPublish?: () => void;
  onNavigateTab?: (tab: 'estimator' | 'mixer') => void;
  onSelectSLMTab?: () => void;
  onSelectRAGTab?: () => void;
  onSelect3DTab?: () => void;
}

export const IntegrationsConsole: React.FC<IntegrationsConsoleProps> = ({
  onOpenWorkspace,
  onOpenSettings,
  onOpenContacts,
  onOpenInventory,
  onOpenQuotation,
  onOpenPublish,
  onNavigateTab,
  onSelectSLMTab,
  onSelectRAGTab,
  onSelect3DTab,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'workspace' | 'models' | 'hardware' | 'cad'>('all');
  const [connectedMap, setConnectedMap] = useState<Record<string, boolean>>({
    google_drive: true,
    dexie_db: true,
    hardware_sensors: true,
    slm_wasm: true,
    rag_vector: true,
    mesh_export: true,
  });

  const toggleConnection = (key: string) => {
    playClickSound();
    setConnectedMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 text-slate-200 font-sans">
      {/* Top Banner */}
      <div className="p-3 sm:p-4 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white font-mono uppercase tracking-wide">
                Connected Tools & Software Integrations
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold uppercase">
                6 Active Connectors
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Google Workspace, CAD/BIM Exporters, Local Dexie SQL, Hardware Telemetry & 19 Embedded SLMs.
            </p>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono shrink-0">
          {[
            { id: 'all', label: 'All Integrations' },
            { id: 'workspace', label: 'Workspace' },
            { id: 'models', label: 'Models & RAG' },
            { id: 'hardware', label: 'Hardware & CAD' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                playClickSound();
                setActiveCategory(cat.id as any);
              }}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Integrations Grid */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          
          {/* Card 1: Google Workspace & Drive */}
          {(activeCategory === 'all' || activeCategory === 'workspace') && (
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono">Google Workspace & Drive</h4>
                      <span className="text-[10px] text-slate-400 font-mono">Docs, Sheets & Drive Sync</span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    connectedMap.google_drive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {connectedMap.google_drive ? 'Connected' : 'Paused'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Real-time synchronization of project takeoff sheets, certified coating reports, and stakeholder milestone deliverables.
                </p>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Target Folder:</span>
                    <strong className="text-white">Walnus SmartView Pro/</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Sync Strategy:</span>
                    <strong className="text-emerald-400">Bidirectional Sync</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    if (onOpenWorkspace) onOpenWorkspace();
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Docs & Drive</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleConnection('google_drive')}
                  className="text-[10px] text-slate-400 hover:text-slate-200 font-mono"
                >
                  {connectedMap.google_drive ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            </div>
          )}

          {/* Card 2: 19 Embedded Mini SLMs */}
          {(activeCategory === 'all' || activeCategory === 'models') && (
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono">19 On-Device Mini SLMs</h4>
                      <span className="text-[10px] text-slate-400 font-mono">Edge Neural Inference</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase">
                    Active (Zero-Cloud)
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Suite of 19 quantized language models (Llama 3.2, Gemma 2, Phi-3.5, Qwen 2.5, SmolLM2) running in WebAssembly / WebGPU.
                </p>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Active Engine:</span>
                    <strong className="text-purple-300">{slmEngine.getActiveModel().name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Quantization:</span>
                    <strong className="text-cyan-300">{slmEngine.getActiveModel().quantization}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    if (onSelectSLMTab) onSelectSLMTab();
                  }}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Configure 19 Models</span>
                </button>
              </div>
            </div>
          )}

          {/* Card 3: Embedded Vector RAG Database */}
          {(activeCategory === 'all' || activeCategory === 'models') && (
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono">Embedded Vector RAG</h4>
                      <span className="text-[10px] text-slate-400 font-mono">Semantic Knowledge Base</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
                    30+ Standards
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Embedded Cosine Similarity search over paint chemistry, ASTM / SSPC-SP10 standards, and wall screening specs.
                </p>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Indexed Chunks:</span>
                    <strong className="text-emerald-400">32 High-Density Vectors</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Search Latency:</span>
                    <strong className="text-white">&lt;2ms (Local)</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    if (onSelectRAGTab) onSelectRAGTab();
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Inspect Vector RAG</span>
                </button>
              </div>
            </div>
          )}

          {/* Card 4: 3D Spatial Reconstruction & BIM CAD Export */}
          {(activeCategory === 'all' || activeCategory === 'hardware' || activeCategory === 'cad') && (
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                      <Box className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono">3D Mesh & BIM Studio</h4>
                      <span className="text-[10px] text-slate-400 font-mono">GLTF, OBJ, USDZ & IFC</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold uppercase">
                    3DGS & LiDAR
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Multi-view photogrammetry, Gaussian Splatting (3DGS), Poisson mesh reconstruction, and CAD stakeholder exports.
                </p>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Accuracy:</span>
                    <strong className="text-cyan-300">±2mm Calibrated</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Export Formats:</span>
                    <strong className="text-white">GLTF 2.0 / OBJ / USDZ</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    if (onSelect3DTab) onSelect3DTab();
                  }}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow"
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>Launch 3D Studio</span>
                </button>
              </div>
            </div>
          )}

          {/* Card 5: Local Dexie IndexedDB & Offline SQLite */}
          {(activeCategory === 'all' || activeCategory === 'workspace') && (
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono">Dexie IndexedDB & Sync</h4>
                      <span className="text-[10px] text-slate-400 font-mono">Zero-Latency Client Persistence</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                    100% Offline Ready
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Persistent local relational store indexing site dimensions, custom recipes, inventory batches, and messages.
                </p>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Auto-Save Cadence:</span>
                    <strong className="text-emerald-400">Every 15 Minutes + Live</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage Engine:</span>
                    <strong className="text-white">IndexedDB (Dexie.js v4)</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    window.dispatchEvent(new CustomEvent('paint_sync_trigger_autosave'));
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Force Snapshot Save</span>
                </button>
              </div>
            </div>
          )}

          {/* Card 6: Hardware Sensors & Telemetry */}
          {(activeCategory === 'all' || activeCategory === 'hardware') && (
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-pink-600/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono">Hardware Sensor Bus</h4>
                      <span className="text-[10px] text-slate-400 font-mono">GPS, Gyro & Dew Point</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30 font-bold uppercase">
                    Live Polling
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Real-time ingestion of barometric pressure, ambient temperature, relative humidity, and spatial orientation.
                </p>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Dew Point Calculation:</span>
                    <strong className="text-emerald-400">Magnus-Tetens Formula</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>GPS Anchor:</span>
                    <strong className="text-white">Active (37.7749, -122.4194)</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    if (onNavigateTab) onNavigateTab('estimator');
                  }}
                  className="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>View in Estimator</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
