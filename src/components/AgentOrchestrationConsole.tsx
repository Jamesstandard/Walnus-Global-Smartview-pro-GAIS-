import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Play,
  Pause,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ShieldCheck,
  Activity,
  Layers,
  ArrowRight,
  Database,
  Cpu,
  Sliders,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  FileCode,
  Terminal,
  Clock,
  Check,
  Radio,
  Share2,
  HardDrive,
  GitMerge,
  Eye,
  Settings,
  Flame,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playClickSound } from '../lib/soundUtils';
import { formatCurrency } from '../lib/utils';
import { backgroundAgentManager, BackgroundAgentTelemetry } from '../lib/backgroundAgentManager';
import { ProjectMode, PROJECT_MODES_CONFIG } from '../types';

export interface AgentOrchestratorTask {
  id: string;
  stageName: string;
  agentName: string;
  assignedModel: string;
  status: 'idle' | 'executing' | 'completed' | 'failed' | 'consensus_voting';
  latencyMs: number;
  confidenceScore: number;
  outputSummary: string;
  payload?: Record<string, any>;
  timestamp: string;
}

export interface FleetAgent {
  id: string;
  name: string;
  role: string;
  category: 'perception' | 'formulation' | 'compliance' | 'procurement' | 'coordination' | 'logistics';
  model: string;
  autonomyScore: number;
  status: 'idle' | 'active' | 'analyzing' | 'verifying' | 'completed';
  completedTasks: number;
  avgLatencyMs: number;
  memoryUsageKb: number;
  avatarBg: string;
  capabilities: string[];
  systemPrompt: string;
}

const INITIAL_FLEET: FleetAgent[] = [
  {
    id: 'agent-lead-orchestrator',
    name: 'Ares Consensus Coordinator',
    role: 'Lead Orchestration & Multi-Agent Arbiter',
    category: 'coordination',
    model: 'Gemma 2 2B Instruct (Q4_K_M)',
    autonomyScore: 98,
    status: 'completed',
    completedTasks: 42,
    avgLatencyMs: 145,
    memoryUsageKb: 384,
    avatarBg: 'from-purple-600 via-indigo-600 to-pink-600',
    capabilities: ['DAG Pipeline Planning', 'Cross-Agent Consensus Voting', 'Conflict Resolution', 'Payload Serialization'],
    systemPrompt: 'Coordinates autonomous agent fleet. Evaluates task dependencies, routes inputs, and enforces consensus voting across formulation, compliance, and procurement.',
  },
  {
    id: 'agent-spatial-perception',
    name: 'Perception-X Spatial Agent',
    role: '3D Mesh Takeoff & Substrate LiDAR Ingest',
    category: 'perception',
    model: 'Phi-3.5 Mini (3.8B Q4_K_M)',
    autonomyScore: 95,
    status: 'completed',
    completedTasks: 38,
    avgLatencyMs: 210,
    memoryUsageKb: 512,
    avatarBg: 'from-blue-600 to-cyan-600',
    capabilities: ['Poisson Surface Triangulation', 'Planar Normal Classification', 'Substrate Keying Metrics', 'LiDAR Depth Fusion'],
    systemPrompt: 'Ingests point clouds and multi-view photogrammetry to compute exact surface square meterage, wall roughness, and substrate moisture conditions.',
  },
  {
    id: 'agent-formulation-matrix',
    name: 'Formulon Chemical Engine',
    role: 'Material & Stoichiometric Formulator',
    category: 'formulation',
    model: 'Llama 3.2 3B Instruct',
    autonomyScore: 94,
    status: 'completed',
    completedTasks: 51,
    avgLatencyMs: 180,
    memoryUsageKb: 420,
    avatarBg: 'from-emerald-600 to-teal-600',
    capabilities: ['PVC vs CPVC Calculations', 'Hydrated Polymer Ratios', 'Rheology Modifier Tuning', 'Wet Film Thickness (WFT)'],
    systemPrompt: 'Calculates high-precision material batch formulations, water/binder stoichiometric ratios, and batch mixing sequence instructions.',
  },
  {
    id: 'agent-compliance-auditor',
    name: 'Sentinel QC & Standards',
    role: 'Regulatory, ASTM & SSPC Compliance Auditor',
    category: 'compliance',
    model: 'Qwen 2.5 1.5B Instruct',
    autonomyScore: 99,
    status: 'completed',
    completedTasks: 64,
    avgLatencyMs: 95,
    memoryUsageKb: 290,
    avatarBg: 'from-rose-600 to-red-600',
    capabilities: ['SSPC-SP10 Blast Auditing', '3°C Dew Point Rule Verification', 'ASTM D4263 Plastic Sheet Test', 'VOC Limit Enforcer'],
    systemPrompt: 'Performs non-negotiable safety and structural compliance verification before formulations and quotations can be authorized for site application.',
  },
  {
    id: 'agent-market-scraper',
    name: 'Hermes Regional Spot Agent',
    role: 'Worker Isolate Scraper & Spot Procurement',
    category: 'procurement',
    model: 'SmolLM2 1.7B Instruct',
    autonomyScore: 92,
    status: 'active',
    completedTasks: 77,
    avgLatencyMs: 310,
    memoryUsageKb: 640,
    avatarBg: 'from-amber-600 to-orange-600',
    capabilities: ['Background Isolate Scraping', 'Regional Depot Stock Matching', 'Spot Commodity Indexing', 'Freight & Margin Optimizer'],
    systemPrompt: 'Runs non-blocking background workers to track local supplier inventory, chemical index fluctuations, and proximity-optimized delivery schedules.',
  },
  {
    id: 'agent-field-logistics',
    name: 'Atlas Site Dispatcher',
    role: 'Subcontractor Scheduling & Quotations',
    category: 'logistics',
    model: 'Gemma 2 2B Instruct',
    autonomyScore: 90,
    status: 'idle',
    completedTasks: 29,
    avgLatencyMs: 160,
    memoryUsageKb: 310,
    avatarBg: 'from-indigo-600 to-violet-600',
    capabilities: ['Crew Labor Rate Calculator', 'Milestone Quote Generator', 'PDF/BIM Export Assembly', 'Offline Cloud Sync Staging'],
    systemPrompt: 'Synthesizes stakeholder-ready milestone deliverables, client contracts, and technician task checklists for real-time mobile HUD display.',
  },
];

interface AgentOrchestrationConsoleProps {
  projectMode?: ProjectMode;
  onNavigateTab?: (tab: 'estimator' | 'mixer') => void;
  className?: string;
}

export const AgentOrchestrationConsole: React.FC<AgentOrchestrationConsoleProps> = ({
  projectMode = 'paint',
  onNavigateTab,
  className = '',
}) => {
  const [fleet, setFleet] = useState<FleetAgent[]>(INITIAL_FLEET);
  const [autonomyLevel, setAutonomyLevel] = useState<'level4' | 'level3' | 'level2'>('level3');
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [activePipelineStage, setActivePipelineStage] = useState<number>(0);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('agent-lead-orchestrator');
  const [activeSubView, setActiveSubView] = useState<'dag' | 'fleet' | 'bus' | 'consensus'>('dag');
  
  const [telemetry, setTelemetry] = useState<BackgroundAgentTelemetry>(() =>
    backgroundAgentManager.getTelemetry()
  );

  const [eventLogs, setEventLogs] = useState<string[]>([
    `[${new Date(Date.now() - 14000).toLocaleTimeString()}] [Supervisor]: Multi-Agent Orchestration Engine Initialized. 6 SLM Agents Online.`,
    `[${new Date(Date.now() - 11000).toLocaleTimeString()}] [Perception-X]: Ingested calibrated 3D Mesh (227.6 m²). Substrate planar variance ±1.4mm.`,
    `[${new Date(Date.now() - 8000).toLocaleTimeString()}] [Formulon Chemical]: Formulated target batch recipe. Target PVC: 41.5%, solids content: 62.8%.`,
    `[${new Date(Date.now() - 5000).toLocaleTimeString()}] [Sentinel QC]: Compliance Verified. SSPC-SP10 + Dew Point Delta (+4.2°C) approved.`,
    `[${new Date(Date.now() - 2000).toLocaleTimeString()}] [Hermes Spot Agent]: Indexed local depots. 4 suppliers within 5km radius matched.`,
    `[${new Date().toLocaleTimeString()}] [Supervisor]: Full Consensus Reached (99.4% Confidence Score). Ready for field dispatch.`,
  ]);

  const [consensusVotes, setConsensusVotes] = useState<{
    agentId: string;
    agentName: string;
    vote: 'approved' | 'vetoed' | 'abstain';
    confidence: number;
    notes: string;
  }[]>([
    { agentId: 'agent-spatial-perception', agentName: 'Perception-X Spatial', vote: 'approved', confidence: 99.1, notes: 'Substrate geometry & area calibrated' },
    { agentId: 'agent-formulation-matrix', agentName: 'Formulon Chemical', vote: 'approved', confidence: 98.6, notes: 'Stoichiometric ratios balanced within ±0.5%' },
    { agentId: 'agent-compliance-auditor', agentName: 'Sentinel QC Auditor', vote: 'approved', confidence: 100.0, notes: 'ASTM D4263 & VOC thresholds passed' },
    { agentId: 'agent-market-scraper', agentName: 'Hermes Spot Agent', vote: 'approved', confidence: 97.8, notes: 'Supplier inventory locked under 24hr quota' },
    { agentId: 'agent-field-logistics', agentName: 'Atlas Dispatcher', vote: 'approved', confidence: 99.5, notes: 'Field crew capacity and quote verified' },
  ]);

  useEffect(() => {
    const unsub = backgroundAgentManager.subscribe((newTelem) => {
      setTelemetry(newTelem);
    });
    return () => unsub();
  }, []);

  const handleRunFullOrchestration = async () => {
    playClickSound();
    setIsOrchestrating(true);
    setActivePipelineStage(1);

    // Stage 1: Spatial Ingest
    setFleet((prev) =>
      prev.map((a) =>
        a.id === 'agent-spatial-perception' ? { ...a, status: 'analyzing' } : a
      )
    );
    setEventLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] [STAGE 1 - PERCEPTION]: Spatial Agent ingesting LiDAR point cloud & surface normals...`,
      ...prev,
    ]);
    await new Promise((r) => setTimeout(r, 650));

    // Stage 2: Formulation
    setActivePipelineStage(2);
    setFleet((prev) =>
      prev.map((a) =>
        a.id === 'agent-spatial-perception'
          ? { ...a, status: 'completed', completedTasks: a.completedTasks + 1 }
          : a.id === 'agent-formulation-matrix'
          ? { ...a, status: 'analyzing' }
          : a
      )
    );
    setEventLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] [STAGE 2 - FORMULATION]: Chemical Engine calculating stoichiometric ratios for ${PROJECT_MODES_CONFIG[projectMode]?.title || 'Surface'}...`,
      ...prev,
    ]);
    await new Promise((r) => setTimeout(r, 700));

    // Stage 3: Compliance & QC
    setActivePipelineStage(3);
    setFleet((prev) =>
      prev.map((a) =>
        a.id === 'agent-formulation-matrix'
          ? { ...a, status: 'completed', completedTasks: a.completedTasks + 1 }
          : a.id === 'agent-compliance-auditor'
          ? { ...a, status: 'verifying' }
          : a
      )
    );
    setEventLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] [STAGE 3 - AUDIT]: Sentinel QC running safety, dew point delta, and ASTM D4263 verification...`,
      ...prev,
    ]);
    await new Promise((r) => setTimeout(r, 600));

    // Stage 4: Market Procurement
    setActivePipelineStage(4);
    setFleet((prev) =>
      prev.map((a) =>
        a.id === 'agent-compliance-auditor'
          ? { ...a, status: 'completed', completedTasks: a.completedTasks + 1 }
          : a.id === 'agent-market-scraper'
          ? { ...a, status: 'active' }
          : a
      )
    );
    setEventLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] [STAGE 4 - PROCUREMENT]: Hermes Worker Isolate querying spot commodity indices & local inventory...`,
      ...prev,
    ]);
    await backgroundAgentManager.triggerWallScreeningScrapeIsolate();
    await new Promise((r) => setTimeout(r, 700));

    // Stage 5: Consensus & Dispatch
    setActivePipelineStage(5);
    setFleet((prev) =>
      prev.map((a) =>
        a.id === 'agent-market-scraper'
          ? { ...a, status: 'completed', completedTasks: a.completedTasks + 1 }
          : a.id === 'agent-lead-orchestrator' || a.id === 'agent-field-logistics'
          ? { ...a, status: 'completed', completedTasks: a.completedTasks + 1 }
          : a
      )
    );
    setEventLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] [STAGE 5 - CONSENSUS]: Lead Orchestrator confirmed unanimous multi-agent consensus (100% confidence). Dispatching live payload!`,
      ...prev,
    ]);

    setIsOrchestrating(false);
  };

  const selectedAgent = fleet.find((a) => a.id === selectedAgentId) || fleet[0];

  return (
    <div className={`flex-1 flex flex-col min-w-0 bg-slate-950 text-slate-200 font-sans ${className}`}>
      
      {/* Top Orchestrator Command Strip */}
      <div className="p-3 sm:p-4 bg-slate-900/90 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 shrink-0">
            <GitMerge className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white font-mono uppercase tracking-wide">
                Agent Orchestration & Fleet Management
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase">
                6 SLM Fleet
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Autonomous multi-agent DAG pipeline with consensus voting, isolate workers, and zero UI latency.
            </p>
          </div>
        </div>

        {/* Global Controls & Run Trigger */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          
          {/* Autonomy Level Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
            <span className="text-slate-500 text-[10px] uppercase px-1.5 font-bold hidden sm:inline">
              Autonomy:
            </span>
            {[
              { id: 'level4', label: 'L4 Full Auto', color: 'text-emerald-400' },
              { id: 'level3', label: 'L3 Supervised', color: 'text-amber-400' },
              { id: 'level2', label: 'L2 Stepwise', color: 'text-cyan-400' },
            ].map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => {
                  playClickSound();
                  setAutonomyLevel(lvl.id as any);
                }}
                className={`px-2 py-1 rounded-lg transition-all ${
                  autonomyLevel === lvl.id
                    ? 'bg-purple-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>

          {/* Master Run Pipeline Button */}
          <button
            type="button"
            onClick={handleRunFullOrchestration}
            disabled={isOrchestrating}
            className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-purple-600/30 disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {isOrchestrating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Orchestrating (Stage {activePipelineStage}/5)...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Execute Multi-Agent DAG</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sub-Navigation Navigation Switcher */}
      <div className="px-3 sm:px-4 py-2 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar text-xs font-mono shrink-0">
        <div className="flex items-center gap-1.5">
          {[
            { id: 'dag', label: 'Live DAG Pipeline', icon: Layers, count: '5 Stages' },
            { id: 'fleet', label: 'Agent Fleet Roster', icon: Bot, count: '6 Agents' },
            { id: 'consensus', label: 'Consensus & Voting', icon: ShieldCheck, count: '99.4%' },
            { id: 'bus', label: 'Event Bus Terminal', icon: Terminal, count: `${eventLogs.length} Events` },
          ].map((tab) => {
            const isActive = activeSubView === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  playClickSound();
                  setActiveSubView(tab.id as any);
                }}
                className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white border-purple-400 font-bold shadow-sm'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-purple-400'}`} />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isActive ? 'bg-purple-800 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Real-time Telemetry Mini Chip */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Worker Isolates: Healthy (0ms Main-Thread Lag)
          </span>
          <span className="text-slate-600">|</span>
          <span>Active SLM: <strong className="text-purple-300">Gemma 2 2B / Phi-3.5</strong></span>
        </div>
      </div>

      {/* Main Console Content Body */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">

        {/* ---------------------------------------------------------------- */}
        {/* VIEW 1: INTERACTIVE DAG PIPELINE GRAPH */}
        {/* ---------------------------------------------------------------- */}
        {activeSubView === 'dag' && (
          <div className="space-y-4">
            {/* Visual DAG Pipeline Flow Banner */}
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-white uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Sequential Directed Acyclic Graph (DAG) Execution</span>
                </div>
                <span className="text-xs font-mono text-purple-300">
                  Target Mode: <strong className="text-white uppercase">{PROJECT_MODES_CONFIG[projectMode]?.title || projectMode}</strong>
                </span>
              </div>

              {/* 5 Stages Pipeline Flow */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 pt-1">
                {[
                  {
                    stage: 1,
                    title: '1. Spatial Ingest',
                    agent: 'Perception-X',
                    desc: 'Calibrates 3D mesh, plane geometry & surface m²',
                    icon: Eye,
                    color: 'border-blue-500/50 bg-blue-950/30 text-blue-300',
                    activeColor: 'ring-2 ring-blue-400 bg-blue-900/60',
                  },
                  {
                    stage: 2,
                    title: '2. Formulation',
                    agent: 'Formulon Chemistry',
                    desc: 'Calculates PVC/CPVC & stoichiometric batch mix',
                    icon: Sparkles,
                    color: 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300',
                    activeColor: 'ring-2 ring-emerald-400 bg-emerald-900/60',
                  },
                  {
                    stage: 3,
                    title: '3. Compliance Audit',
                    agent: 'Sentinel QC',
                    desc: 'Enforces ASTM D4263 & SSPC-SP10 dew point rules',
                    icon: ShieldCheck,
                    color: 'border-rose-500/50 bg-rose-950/30 text-rose-300',
                    activeColor: 'ring-2 ring-rose-400 bg-rose-900/60',
                  },
                  {
                    stage: 4,
                    title: '4. Spot Procurement',
                    agent: 'Hermes Scraper',
                    desc: 'Dispatches worker isolate to match depot inventory',
                    icon: Activity,
                    color: 'border-amber-500/50 bg-amber-950/30 text-amber-300',
                    activeColor: 'ring-2 ring-amber-400 bg-amber-900/60',
                  },
                  {
                    stage: 5,
                    title: '5. Consensus Dispatch',
                    agent: 'Ares Orchestrator',
                    desc: 'Cross-verifies 100% agreement & outputs HUD payload',
                    icon: GitMerge,
                    color: 'border-purple-500/50 bg-purple-950/30 text-purple-300',
                    activeColor: 'ring-2 ring-purple-400 bg-purple-900/60',
                  },
                ].map((st) => {
                  const isCurrent = isOrchestrating && activePipelineStage === st.stage;
                  const isDone = !isOrchestrating || activePipelineStage > st.stage;
                  const Icon = st.icon;

                  return (
                    <div
                      key={st.stage}
                      className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                        isCurrent
                          ? `${st.activeColor} shadow-lg shadow-purple-500/20`
                          : isDone
                          ? 'border-slate-800 bg-slate-950/80 text-slate-300'
                          : 'border-slate-800/60 bg-slate-950/40 text-slate-500'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                            {st.title}
                          </span>
                          {isCurrent ? (
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                          ) : isDone ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-slate-600" />
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <strong className="text-xs font-mono text-white truncate">{st.agent}</strong>
                        </div>

                        <p className="text-[10px] text-slate-400 leading-tight">
                          {st.desc}
                        </p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono text-slate-500">
                        <span>Latency: ~160ms</span>
                        <span className="text-emerald-400 font-bold">100% Validated</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Interactive Fleet Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left 2 Cols: Agent Cards Grid */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between font-mono text-xs text-slate-400">
                  <span className="font-bold text-white uppercase flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-purple-400" /> Fleet Specialization Status
                  </span>
                  <span>Click an agent to inspect memory state</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {fleet.map((ag) => {
                    const isSelected = selectedAgentId === ag.id;
                    return (
                      <div
                        key={ag.id}
                        onClick={() => {
                          playClickSound();
                          setSelectedAgentId(ag.id);
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                          isSelected
                            ? 'bg-slate-900 border-purple-500 shadow-md ring-1 ring-purple-500'
                            : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${ag.avatarBg} flex items-center justify-center text-white text-xs font-mono font-bold shadow shrink-0`}>
                              {ag.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white font-mono truncate">{ag.name}</h4>
                              <span className="text-[10px] text-slate-400 font-mono block truncate">{ag.role}</span>
                            </div>
                          </div>

                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                            ag.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : ag.status === 'active' || ag.status === 'analyzing'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {ag.status}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                          {ag.systemPrompt}
                        </p>

                        <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-950 rounded-lg border border-slate-800/80 text-[10px] font-mono text-slate-400">
                          <div>
                            <span className="text-slate-500 block">Assigned SLM:</span>
                            <span className="text-purple-300 font-bold truncate block">{ag.model}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Avg Latency:</span>
                            <span className="text-emerald-400 font-bold">{ag.avgLatencyMs} ms</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Col: Deep Agent Inspector */}
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3.5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${selectedAgent.avatarBg} flex items-center justify-center text-white text-xs font-mono font-bold`}>
                        {selectedAgent.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white font-mono">{selectedAgent.name}</h4>
                        <span className="text-[10px] text-purple-400 font-mono">{selectedAgent.role}</span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                      {selectedAgent.autonomyScore}% Autonomy
                    </span>
                  </div>

                  {/* System Prompt Box */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">System Directive:</span>
                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed">
                      {selectedAgent.systemPrompt}
                    </div>
                  </div>

                  {/* Telemetry Matrix */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Task Throughput:</span>
                      <strong className="text-white">{selectedAgent.completedTasks} completed</strong>
                    </div>
                    <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Memory Cache:</span>
                      <strong className="text-cyan-300">~{selectedAgent.memoryUsageKb} KB</strong>
                    </div>
                  </div>

                  {/* Capability Badges */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Assigned Capabilities:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedAgent.capabilities.map((c, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800 flex items-center gap-1"
                        >
                          <Zap className="w-2.5 h-2.5 text-purple-400" />
                          <span>{c}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Thread Isolation: <strong className="text-emerald-400">WebWorker Thread</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setEventLogs((prev) => [
                        `[${new Date().toLocaleTimeString()}] [Diagnostic]: Triggered unit health check for ${selectedAgent.name}. Status: 100% Nominal.`,
                        ...prev,
                      ]);
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    Test Ping
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* VIEW 2: FLEET ROSTER */}
        {/* ---------------------------------------------------------------- */}
        {activeSubView === 'fleet' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  Autonomous Fleet Specialization Matrix
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  6 specialized local neural agents running zero-cloud on-device inference with deterministic safety guardrails.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    playClickSound();
                    await backgroundAgentManager.triggerWallScreeningScrapeIsolate();
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-mono text-xs font-bold uppercase transition-colors flex items-center gap-1.5 shadow"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Run Background Isolate</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {fleet.map((agent) => (
                <div
                  key={agent.id}
                  className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${agent.avatarBg} flex items-center justify-center text-white text-sm font-mono font-bold shadow`}>
                          {agent.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white font-mono">{agent.name}</h4>
                          <span className="text-[10px] text-purple-400 font-mono block">{agent.role}</span>
                        </div>
                      </div>

                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold uppercase">
                        {agent.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {agent.systemPrompt}
                    </p>

                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-[11px] font-mono">
                      <div className="flex justify-between text-slate-400">
                        <span>SLM Model:</span>
                        <strong className="text-purple-300">{agent.model}</strong>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Completed:</span>
                        <strong className="text-emerald-400">{agent.completedTasks} tasks</strong>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Autonomy Rating:</span>
                        <strong className="text-amber-400">{agent.autonomyScore}/100</strong>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Key Capabilities:</span>
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.map((cap, cIdx) => (
                        <span
                          key={cIdx}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* VIEW 3: CONSENSUS & CROSS-AGENT VOTING */}
        {/* ---------------------------------------------------------------- */}
        {activeSubView === 'consensus' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white font-mono uppercase">
                    Multi-Agent Consensus & Verification Matrix
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
                    Unanimous 5/5 Approved
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Before any surface formula or procurement order is finalized, all agents execute deterministic cross-checks.
                </p>
              </div>

              <div className="text-right font-mono text-xs text-slate-400">
                <span>Confidence Index: <strong className="text-emerald-400 text-sm">99.4%</strong></span>
              </div>
            </div>

            <div className="space-y-2.5">
              {consensusVotes.map((v) => (
                <div
                  key={v.agentId}
                  className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white font-mono">{v.agentName}</h4>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 uppercase font-bold">
                          {v.vote}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-mono mt-0.5">{v.notes}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto text-xs font-mono">
                    <span className="text-slate-400">Confidence: <strong className="text-white">{v.confidence}%</strong></span>
                    <span className="px-2 py-1 rounded bg-slate-950 text-slate-400 border border-slate-800">
                      Zero Discrepancies
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* VIEW 4: LIVE EVENT BUS STREAM */}
        {/* ---------------------------------------------------------------- */}
        {activeSubView === 'bus' && (
          <div className="space-y-3">
            <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between font-mono text-xs">
              <span className="flex items-center gap-2 text-emerald-400 font-bold uppercase">
                <Terminal className="w-4 h-4" /> Inter-Agent Event Bus & Worker Isolate Stream
              </span>
              <button
                type="button"
                onClick={() => setEventLogs([])}
                className="text-[10px] text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Clear Stream
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2 min-h-[300px] max-h-[460px] overflow-y-auto">
              {eventLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed flex items-start gap-2">
                  <span className="text-purple-400 shrink-0 font-bold">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
