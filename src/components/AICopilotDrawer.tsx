import React, { useState, useEffect, useRef } from 'react';
import {
  SLMModelInfo,
  AICopilotMessage,
  KnowledgeDomain,
  RAGSearchResult,
  RAGKnowledgeDocument,
  AIAgentDefinition,
  Reconstruction3DConfig,
  ProjectMode,
  PROJECT_MODES_CONFIG,
} from '../types';
import { SLM_MODELS_REGISTRY, KNOWLEDGE_DOMAIN_METADATA } from '../data/slmModelsData';
import { slmEngine, INITIAL_AI_AGENTS } from '../lib/slmEngine';
import { vectorRagEngine } from '../lib/vectorRagEngine';
import { generateId, formatCurrency } from '../lib/utils';
import { playClickSound } from '../lib/soundUtils';
import { AgentOrchestrationConsole } from './AgentOrchestrationConsole';
import { IntegrationsConsole } from './IntegrationsConsole';
import {
  Bot,
  Sparkles,
  Cpu,
  Database,
  Users,
  Compass,
  Box,
  Send,
  RefreshCw,
  X,
  Pin,
  PinOff,
  Search,
  CheckCircle2,
  AlertTriangle,
  Play,
  Download,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Beaker,
  TrendingUp,
  Atom,
  Factory,
  SprayCan,
  Volume2,
  VolumeX,
  Mic,
  Maximize2,
  Minimize2,
  ExternalLink,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Filter,
  BarChart3,
  Sliders,
  FileCode,
  Award,
  Radio,
  FileText,
  HardDrive,
  Globe,
  Copy,
  Check,
  Trash2,
  CloudSun,
  Thermometer,
  Droplets,
  Wind,
  MapPin,
  TrendingDown,
  Menu,
  Boxes,
  GitMerge,
  ArrowLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  onNavigateTab?: (tab: 'estimator' | 'mixer') => void;
  onOpenWorkspace?: () => void;
  onOpenSettings?: () => void;
  onOpenContacts?: () => void;
  onOpenInventory?: () => void;
  onOpenQuotation?: () => void;
  onOpenPublish?: () => void;
}

export function AICopilotDrawer({
  isOpen,
  onClose,
  onMinimize,
  onNavigateTab,
  onOpenWorkspace,
  onOpenSettings,
  onOpenContacts,
  onOpenInventory,
  onOpenQuotation,
  onOpenPublish,
}: AICopilotDrawerProps) {
  const [activeTab, setActiveTab] = useState<
    'copilot' | 'chat' | 'integrations' | 'agents' | 'models' | 'rag' | 'reconstruction3d' | 'navigation'
  >('copilot');
  const [isPinned, setIsPinned] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);

  const TAB_LABELS: Record<string, string> = {
    copilot: 'Copilot Messages',
    chat: 'Copilot Messages',
    integrations: 'Integrations & Tools',
    agents: 'Agent Orchestration',
    models: '19 Mini SLMs',
    rag: 'Vector RAG',
    reconstruction3d: '3D Mesh Studio',
    navigation: 'App Navigator',
  };

  // Active Model State
  const [activeModel, setActiveModel] = useState<SLMModelInfo>(slmEngine.getActiveModel());
  const [modelFilter, setModelFilter] = useState<'all' | 'open_source' | 'sub_3b' | 'downloaded'>('all');
  const [searchModelQuery, setSearchModelQuery] = useState('');

  // Chat State
  const [messages, setMessages] = useState<AICopilotMessage[]>([
    {
      id: 'init-msg',
      sender: 'assistant',
      text: `### **Welcome to WalnusGlobal SmartView -Pro © AI Co-Pilot & Localized Intelligence**\n\nI am running on your local device via **${slmEngine.getActiveModel().name}** with direct access to our **Embedded Vector RAG Knowledge Base**.\n\nAsk me about:\n- **Paint Chemistry & Formulations** (PVC vs CPVC, TiO2 dispersion, latex binders, rheology)\n- **Manufacturing & Plant QC** (HSD dispersers, Hegman grind gauges, Krebs Stormer viscosity)\n- **Airless Spray & Application** (tip 517/521 physics, substrate prep SSPC-SP10, 3°C Dew Point rule)\n- **Realtime Pricing & Margins** (spot chemical commodities, margin & contingency calculations)\n- **Wall Screening (Interior & Exterior)** (polymer wall screening mortars, wall skim coats, crack-bridging wall screeds)\n- **Plastering & Rendering** (Gypsum dihydrate, NHL 3.5 lime, 3-coat render stages)\n- **Image-to-3D & Gaussian Splatting** (Photogrammetry, LiDAR mesh scaling, point clouds)\n- **Autonomous Multi-Agent Manager & App Guidance**\n\nHow can I assist your field operations today?`,
      timestamp: Date.now(),
      modelUsed: slmEngine.getActiveModel().name,
      suggestedActions: [
        { label: 'Go to 3D Estimator', actionType: 'navigate_estimator' },
        { label: 'Go to Paint Mixer', actionType: 'navigate_mixer' },
        { label: 'Open Google Docs & Drive', actionType: 'open_workspace' },
      ],
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamedText, setCurrentStreamedText] = useState('');
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<KnowledgeDomain | 'all'>('all');
  const [voiceSpeechEnabled, setVoiceSpeechEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // RAG Explorer State
  const [ragSearchQuery, setRagSearchQuery] = useState('');
  const [ragSearchResults, setRagSearchResults] = useState<RAGSearchResult[]>(() =>
    vectorRagEngine.search('', 'all', 10)
  );
  const [selectedRagDoc, setSelectedRagDoc] = useState<RAGKnowledgeDocument | null>(null);

  // Multi-Agent State
  const [agents, setAgents] = useState<AIAgentDefinition[]>(INITIAL_AI_AGENTS);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [currentProjectMode, setCurrentProjectMode] = useState<ProjectMode>(() => {
    try {
      const raw = localStorage.getItem('siteview_estimator_input_draft_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.projectMode && ['paint', 'screed', 'plaster'].includes(parsed.projectMode)) {
          return parsed.projectMode;
        }
      }
    } catch {}
    return 'paint';
  });
  const [agentLogs, setAgentLogs] = useState<string[]>([
    'System initialized with 5 specialized autonomous sub-agents.',
    'Vector RAG knowledge base connected (30+ domain specifications indexed).',
  ]);

  // Sync mode changes
  useEffect(() => {
    const handleModeSync = (e: any) => {
      if (e.detail && e.detail.mode && ['paint', 'screed', 'plaster'].includes(e.detail.mode)) {
        setCurrentProjectMode(e.detail.mode);
      }
    };
    window.addEventListener('paint_sync_project_mode_changed', handleModeSync);
    return () => window.removeEventListener('paint_sync_project_mode_changed', handleModeSync);
  }, []);

  // 3D Reconstruction Studio State
  const [reconConfig, setReconConfig] = useState<Reconstruction3DConfig>({
    sourceType: 'images',
    algorithm: '3D Gaussian Splatting (3DGS)',
    targetPolygonCount: 45000,
    resolution: 'High Precision (4K)',
    textureQuality: '2048px',
    depthSensorFusion: true,
    scaleCalibrationAnchorMm: 1000,
  });
  const [isReconstructing, setIsReconstructing] = useState(false);
  const [reconProgress, setReconProgress] = useState(0);
  const [reconSuccess, setReconSuccess] = useState(false);

  // Benchmarking State
  const [benchmarkingModelId, setBenchmarkingModelId] = useState<string | null>(null);
  const [benchmarkResult, setBenchmarkResult] = useState<{ id: string; speed: number; latency: number } | null>(null);

  // Weather and localized intelligence states
  const [weather, setWeather] = useState({
    temperatureCelsius: 22,
    relativeHumidityPercent: 68,
    dewPointCelsius: 14,
    windSpeedKmH: 14,
    locationName: 'Sector 4 Construction Site',
    feasibilityStatus: 'optimal' as 'optimal' | 'caution' | 'restricted',
    feasibilityScorePercent: 92,
  });
  const [isRefreshingWeather, setIsRefreshingWeather] = useState(false);
  const [mobileWeatherExpanded, setMobileWeatherExpanded] = useState(false);

  const handleRefreshWeather = () => {
    setIsRefreshingWeather(true);
    setTimeout(() => {
      const newHumidity = Math.round(55 + Math.random() * 30);
      const newTemp = Math.round(18 + Math.random() * 10);
      const newWind = Math.round(8 + Math.random() * 18);
      const isOptimal = newHumidity <= 75 && newTemp >= 12 && newWind <= 20;

      setWeather({
        temperatureCelsius: newTemp,
        relativeHumidityPercent: newHumidity,
        dewPointCelsius: Math.round(newTemp - (100 - newHumidity) / 5),
        windSpeedKmH: newWind,
        locationName: 'Sector 4 Construction Site',
        feasibilityStatus: isOptimal ? 'optimal' : newHumidity > 80 || newTemp < 10 ? 'restricted' : 'caution',
        feasibilityScorePercent: Math.round(isOptimal ? 85 + Math.random() * 15 : 45 + Math.random() * 35),
      });
      setIsRefreshingWeather(false);
    }, 800);
  };

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStreamedText]);

  // Listen to keyboard shortcut (Cmd+K / Ctrl+K) and Agent Manager open triggers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          setActiveTab('copilot');
          window.dispatchEvent(new CustomEvent('paint_sync_toggle_copilot'));
        }
      }
    };
    const handleOpenAgents = () => {
      setActiveTab('agents');
    };
    const handleOpenCopilotChat = () => {
      setActiveTab('copilot');
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paint_sync_open_agent_manager', handleOpenAgents);
    window.addEventListener('paint_sync_open_copilot_chat', handleOpenCopilotChat);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paint_sync_open_agent_manager', handleOpenAgents);
      window.removeEventListener('paint_sync_open_copilot_chat', handleOpenCopilotChat);
    };
  }, [isOpen, onClose]);

  // Handle RAG search input changes
  useEffect(() => {
    const results = vectorRagEngine.search(
      ragSearchQuery,
      selectedDomainFilter,
      8
    );
    setRagSearchResults(results);
  }, [ragSearchQuery, selectedDomainFilter]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || isStreaming) return;

    const userMsg: AICopilotMessage = {
      id: generateId(),
      sender: 'user',
      text: prompt,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsStreaming(true);
    setCurrentStreamedText('');

    try {
      const response = await slmEngine.generateResponse(
        prompt,
        selectedDomainFilter,
        (partial) => {
          setCurrentStreamedText(partial);
        }
      );

      setMessages((prev) => [...prev, response]);
      setCurrentStreamedText('');

      // Voice read-out if enabled
      if (voiceSpeechEnabled && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(
          response.text.replace(/[*#`_-]/g, '').slice(0, 200)
        );
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error('Co-Pilot inference failed:', err);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleReadAloudMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*#`_-]/g, '').slice(0, 250));
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleToggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (e: any) => {
          const transcript = Array.from(e.results)
            .map((result: any) => result[0].transcript)
            .join('');
          setInputPrompt(transcript);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.error('Speech recognition error:', err);
        setIsListening(false);
      }
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: generateId(),
        sender: 'assistant',
        text: `### **Co-Pilot Session Reset**\n\nActive model: **${slmEngine.getActiveModel().name}**. Vector RAG engine active.\n\nAsk any question regarding chemical formulas, surface area takeoffs, spray tips, pricing, or application rules.`,
        timestamp: Date.now(),
        modelUsed: slmEngine.getActiveModel().name,
      },
    ]);
  };

  const handleSwitchModel = (model: SLMModelInfo) => {
    slmEngine.setActiveModel(model.id);
    setActiveModel(model);

    const switchMsg: AICopilotMessage = {
      id: generateId(),
      sender: 'system',
      text: `[MODEL SWITCHED]: Active on-device SLM updated to **${model.name}** (${model.parameterCount} params, Quantization: ${model.quantization}, RAM: ~${model.ramRequiredMb}MB, License: ${model.license}).`,
      timestamp: Date.now(),
      modelUsed: model.name,
    };
    setMessages((prev) => [...prev, switchMsg]);
  };

  const handleRunModelBenchmark = async (model: SLMModelInfo) => {
    setBenchmarkingModelId(model.id);
    setBenchmarkResult(null);

    await new Promise((r) => setTimeout(r, 800));
    const speed = Math.round(model.tokensPerSecBenchmark * (0.95 + Math.random() * 0.1) * 10) / 10;
    const latency = Math.round(15 + (1 / speed) * 1000);

    setBenchmarkResult({
      id: model.id,
      speed,
      latency,
    });
    setBenchmarkingModelId(null);
  };

  const handleExecuteAction = (actionType: string) => {
    onClose();
    setTimeout(() => {
      switch (actionType) {
        case 'navigate_estimator':
          onNavigateTab?.('estimator');
          break;
        case 'navigate_mixer':
          onNavigateTab?.('mixer');
          break;
        case 'open_workspace':
          onOpenWorkspace?.();
          break;
        case 'open_settings':
          onOpenSettings?.();
          break;
        case 'open_contacts':
          onOpenContacts?.();
          break;
        case 'open_inventory':
          onOpenInventory?.();
          break;
        case 'open_quotation':
          onOpenQuotation?.();
          break;
        case 'open_publish':
          onOpenPublish?.();
          break;
        default:
          break;
      }
    }, 150);
  };

  const handleRunMultiAgentPipeline = async () => {
    setIsAgentRunning(true);
    const modeName = PROJECT_MODES_CONFIG[currentProjectMode]?.title || currentProjectMode;
    setAgentLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] INITIATING 5-STAGE AUTONOMOUS MULTI-AGENT LOOP FOR MODE: [${modeName.toUpperCase()}]...`,
      ...prev,
    ]);

    // Agent 1: Estimator
    setAgents((prev) =>
      prev.map((a) =>
        a.id === 'agent-estimator' ? { ...a, status: 'analyzing', currentTask: `Integrating 3D LiDAR Mesh for ${modeName} takeoff` } : a
      )
    );
    await new Promise((r) => setTimeout(r, 700));
    const estimatorMsg =
      currentProjectMode === 'screed'
        ? `[Spatial Estimator Agent]: Computed 2,450 sq ft (227.6 m²) wall surface area with 3.0mm target wall screening depth.`
        : currentProjectMode === 'plaster'
        ? `[Spatial Estimator Agent]: Computed 2,450 sq ft (227.6 m²) vertical wall substrate with 12mm 2-coat render profile.`
        : `[Spatial Estimator Agent]: Computed 2,450 sq ft surface area for 2-coat architectural paint finish.`;
    setAgentLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${estimatorMsg}`,
      ...prev,
    ]);
    setAgents((prev) =>
      prev.map((a) =>
        a.id === 'agent-estimator' ? { ...a, status: 'completed', completedTasksCount: a.completedTasksCount + 1 } : a
      )
    );

    // Agent 2: Formulator
    setAgents((prev) =>
      prev.map((a) =>
        a.id === 'agent-formulator'
          ? {
              ...a,
              status: 'calculating',
              currentTask:
                currentProjectMode === 'screed'
                  ? 'Calculating wall polymer binder, fine silica & redispersible VAE curve'
                  : currentProjectMode === 'plaster'
                  ? 'Balancing hydrated lime / gypsum stoichiometric ratio & retarder'
                  : 'Balancing PVC (38%) & stoichiometric CPVC limit',
            }
          : a
      )
    );
    await new Promise((r) => setTimeout(r, 800));
    const formulatorMsg =
      currentProjectMode === 'screed'
        ? `[Chemical Formulator Agent]: Formulated Polymer-Modified Wall Screening Mortar (77 Bags of 25kg, 3.0mm depth, EN 998-1 Class CS IV).`
        : currentProjectMode === 'plaster'
        ? `[Chemical Formulator Agent]: Formulated High-Adhesion Polymer Render (98 Bags of 25kg, scratch + float coats, EN 998-1 GP).`
        : `[Chemical Formulator Agent]: Formulated High-Durability Exterior Acrylic (7.0 Gal / 26.5 L), PVC = 38%, Lambda ratio = 0.78.`;
    setAgentLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${formulatorMsg}`,
      ...prev,
    ]);
    setAgents((prev) =>
      prev.map((a) =>
        a.id === 'agent-formulator' ? { ...a, status: 'completed', completedTasksCount: a.completedTasksCount + 1 } : a
      )
    );

    // Agent 3: QC Auditor
    setAgents((prev) =>
      prev.map((a) =>
        a.id === 'agent-qc'
          ? {
              ...a,
              status: 'executing',
              currentTask:
                currentProjectMode === 'screed'
                  ? 'Auditing wall substrate moisture (<5% CM) & surface keying'
                  : currentProjectMode === 'plaster'
                  ? 'Auditing adhesion strength (>0.8 MPa) & moisture barrier integrity'
                  : 'Auditing VOC limits & SSPC 3°C Dew Point Delta',
            }
          : a
      )
    );
    await new Promise((r) => setTimeout(r, 700));
    const qcMsg =
      currentProjectMode === 'screed'
        ? `[QC & Standards Auditor]: PASSED. Wall substrate keying verified, tensile adhesion > 0.90 MPa, optimal for screening coat.`
        : currentProjectMode === 'plaster'
        ? `[QC & Standards Auditor]: PASSED. Substrate keying verified, tensile adhesion > 0.95 MPa, shrinkage compensation within specs.`
        : `[QC & Standards Auditor]: PASSED. Dew point spread is +4.2°C (>3.0°C limit). VOC = 42 g/L (<50 g/L limit).`;
    setAgentLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${qcMsg}`,
      ...prev,
    ]);
    setAgents((prev) =>
      prev.map((a) =>
        a.id === 'agent-qc' ? { ...a, status: 'completed', completedTasksCount: a.completedTasksCount + 1 } : a
      )
    );

    // Agent 4: Procurement
    setAgents((prev) =>
      prev.map((a) =>
        a.id === 'agent-procurement'
          ? {
              ...a,
              status: 'calculating',
              currentTask:
                currentProjectMode === 'screed'
                  ? 'Querying polymer wall screening mortar & fine filler indices'
                  : currentProjectMode === 'plaster'
                  ? 'Querying hydrated lime, gypsum & sand commodity indices'
                  : 'Querying TiO2 & Acrylic spot indices',
            }
          : a
      )
    );
    await new Promise((r) => setTimeout(r, 700));
    const costEstimate =
      currentProjectMode === 'screed' ? 2450000 : currentProjectMode === 'plaster' ? 2150000 : 1840400;
    const procurementMsg =
      currentProjectMode === 'screed'
        ? `[Market Procurement Agent]: Spot price indexed for polymer wall screening mortars and fine fillers. Total raw material cost = ${formatCurrency(costEstimate)} with 15% contractor margin.`
        : currentProjectMode === 'plaster'
        ? `[Market Procurement Agent]: Spot price indexed for render binder and aggregates. Total raw material cost = ${formatCurrency(costEstimate)} with 15% contractor margin.`
        : `[Market Procurement Agent]: Spot price indexed for TiO2 and acrylic emulsions. Total raw material cost = ${formatCurrency(costEstimate)} with 15% contractor margin.`;
    setAgentLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${procurementMsg}`,
      ...prev,
    ]);
    setAgents((prev) =>
      prev.map((a) =>
        a.id === 'agent-procurement' ? { ...a, status: 'completed', completedTasksCount: a.completedTasksCount + 1 } : a
      )
    );

    // Agent 5: Coordinator
    setAgents((prev) =>
      prev.map((a) =>
        a.id === 'agent-coordinator' ? { ...a, status: 'executing', currentTask: `Synthesizing live ${modeName} quotation & dispatching to field HUDs` } : a
      )
    );
    await new Promise((r) => setTimeout(r, 600));
    setAgentLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] [Site Dispatch Coordinator]: MULTI-AGENT CONSENSUS ACHIEVED (100% confidence for ${modeName}). Ready for stakeholder sign-off.`,
      ...prev,
    ]);
    setAgents((prev) =>
      prev.map((a) =>
        a.id === 'agent-coordinator' ? { ...a, status: 'completed', completedTasksCount: a.completedTasksCount + 1 } : a
      )
    );

    setIsAgentRunning(false);
  };

  const handleStart3DReconstruction = async () => {
    setIsReconstructing(true);
    setReconSuccess(false);
    setReconProgress(0);

    for (let p = 10; p <= 100; p += 15) {
      await new Promise((r) => setTimeout(r, 350));
      setReconProgress(p);
    }

    setIsReconstructing(false);
    setReconSuccess(true);
  };

  // Filtered models
  const filteredModels = SLM_MODELS_REGISTRY.filter((m) => {
    if (modelFilter === 'open_source' && !m.openSource) return false;
    if (modelFilter === 'sub_3b' && m.parameterSizeB > 3.0) return false;
    if (modelFilter === 'downloaded' && !m.isDownloadedOffline) return false;
    if (searchModelQuery) {
      const q = searchModelQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.family.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed top-[86px] inset-x-0 bottom-0 z-50 flex items-center justify-center p-0 sm:p-3 md:p-6 bg-black/80 backdrop-blur-md font-sans transition-all">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`bg-slate-950 border border-slate-800/90 w-full ${
            isPinned ? 'max-w-none sm:h-full rounded-none' : 'max-w-6xl sm:h-[92vh] sm:rounded-2xl'
          } h-full flex flex-col shadow-2xl overflow-hidden hardware-accelerated transition-all duration-300`}
        >
          {/* Streamlined Header Bar */}
          <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0 relative z-20">
            {/* Left side: Purple Co-Pilot Logo + Title + Hamburger Menu Icon */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30 shrink-0">
                <Bot className="w-4 h-4" />
              </div>

              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wide truncate">
                  AI CO-PILOT
                </h2>

                {/* Hamburger Menu Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
                  title="Toggle Co-Pilot Menu"
                  className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1.5 text-[11px] font-mono cursor-pointer ${
                    isNavMenuOpen
                      ? 'bg-purple-600 text-white border-purple-400'
                      : 'bg-slate-800 text-purple-300 hover:text-white border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Menu className="w-4 h-4 text-purple-300" />
                  <span className="hidden sm:inline text-[10px] font-bold text-slate-300">
                    {TAB_LABELS[activeTab]}
                  </span>
                </button>
              </div>
            </div>

            {/* Right side: Action Icon Row (Trash/Clear, Mute, Pin, Resize/Minimize, Close) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleClearChat}
                title="Reset Co-Pilot Chat Session"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setVoiceSpeechEnabled(!voiceSpeechEnabled)}
                title={voiceSpeechEnabled ? 'Mute AI Speech Output' : 'Enable AI Speech Output'}
                className={`p-1.5 rounded-lg border transition-colors ${
                  voiceSpeechEnabled
                    ? 'bg-purple-600 text-white border-purple-400'
                    : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                }`}
              >
                {voiceSpeechEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setIsPinned(!isPinned);
                }}
                title={isPinned ? 'Unpin Panel' : 'Pin Panel'}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isPinned
                    ? 'bg-purple-600 text-white border-purple-400'
                    : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                }`}
              >
                {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  if (onMinimize) onMinimize();
                  else onClose();
                }}
                title="Minimize to Floating Icon"
                className="p-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 text-purple-300 hover:text-white border border-purple-500/40 transition-colors"
              >
                <Minimize2 className="w-3.5 h-3.5 text-purple-400" />
              </button>

              <button
                type="button"
                onClick={onClose}
                title="Close Co-Pilot Panel"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Collapsible Dropdown Navigation Menu */}
            <AnimatePresence>
              {isNavMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full left-0 right-0 z-40 bg-slate-900/98 backdrop-blur-xl border-b border-purple-500/30 p-3 shadow-2xl flex flex-col gap-2 font-mono text-xs"
                >
                  <div className="text-[10px] uppercase font-bold text-purple-400 tracking-wider px-1">
                    Co-Pilot Modules:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'chat', label: 'Interactive Chat', icon: Bot, badge: null, color: 'text-purple-400' },
                      { id: 'models', label: '19 Mini SLMs', icon: Cpu, badge: '19', color: 'text-indigo-400' },
                      { id: 'rag', label: 'Vector RAG', icon: Database, badge: '30+', color: 'text-emerald-400' },
                      { id: 'agents', label: 'Multi-Agents', icon: Users, badge: '5', color: 'text-amber-400' },
                      { id: 'reconstruction3d', label: '3D Mesh Studio', icon: Box, badge: null, color: 'text-blue-400' },
                      { id: 'navigation', label: 'App Navigator', icon: Compass, badge: null, color: 'text-teal-400' },
                    ].map((tab) => {
                      const isActive = activeTab === tab.id;
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            playClickSound();
                            setActiveTab(tab.id as any);
                            setIsNavMenuOpen(false);
                          }}
                          className={`p-2.5 rounded-xl border transition-all flex items-center justify-between text-left cursor-pointer ${
                            isActive
                              ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                              : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.color} shrink-0`} />
                            <span className="font-bold text-xs truncate">{tab.label}</span>
                          </div>
                          {tab.badge && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                              isActive ? 'bg-purple-800 text-white' : 'bg-slate-800 text-purple-300 border border-purple-500/30'
                            }`}>
                              {tab.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Primary Top Navigation Tab Row: Copilot | Integrations | Agents */}
          <div className="px-3 sm:px-4 py-2 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0 z-10">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                id="copilot-tab-btn"
                onClick={() => {
                  playClickSound();
                  setActiveTab('copilot');
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
                  activeTab === 'copilot' || activeTab === 'chat'
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                    : 'bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
              >
                <Bot className="w-4 h-4" />
                <span>Copilot</span>
              </button>

              <button
                type="button"
                id="integrations-tab-btn"
                onClick={() => {
                  playClickSound();
                  setActiveTab('integrations');
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
                  activeTab === 'integrations' || activeTab === 'models' || activeTab === 'rag' || activeTab === 'reconstruction3d'
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                    : 'bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
              >
                <Boxes className="w-4 h-4" />
                <span>Integrations</span>
                <span className="hidden sm:inline text-[9px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                  6 Connectors
                </span>
              </button>

              <button
                type="button"
                id="agents-tab-btn"
                onClick={() => {
                  playClickSound();
                  setActiveTab('agents');
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
                  activeTab === 'agents'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-pink-400 shadow-md shadow-pink-600/30 ring-1 ring-pink-400'
                    : 'bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
              >
                <GitMerge className="w-4 h-4 text-pink-300" />
                <span>Agents</span>
                <span className="hidden sm:inline text-[9px] px-1.5 py-0.2 rounded bg-pink-950 text-pink-300 border border-pink-500/40">
                  DAG Engine
                </span>
              </button>
            </div>

            {/* Sub-tab Breadcrumb Indicator if viewing a deep module */}
            {(activeTab === 'models' || activeTab === 'rag' || activeTab === 'reconstruction3d' || activeTab === 'navigation') && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setActiveTab('integrations');
                }}
                className="text-[11px] font-mono text-indigo-300 hover:text-white flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back to Integrations</span>
              </button>
            )}
          </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-950 relative">
          {/* ---------------------------------------------------- */}
          {/* TAB 1: INTERACTIVE CO-PILOT CHAT */}
          {/* ---------------------------------------------------- */}
          {(activeTab === 'copilot' || activeTab === 'chat') && (
            <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 min-h-0 overflow-hidden">
              {/* LEFT CHAT COLUMN */}
              <div className="flex-1 flex flex-col lg:col-span-8 min-h-0 overflow-hidden border-r border-slate-900/80">
              {/* Domain Quick Filter Bar */}
              <div className="px-3 sm:px-4 py-2 bg-slate-900/50 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono shrink-0 no-scrollbar">
                <span className="text-slate-500 uppercase flex items-center gap-1 shrink-0 font-bold">
                  <Filter className="w-3 h-3 text-indigo-400" /> Focus Domain:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDomainFilter('all')}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors shrink-0 ${
                    selectedDomainFilter === 'all'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Domains (Global RAG)
                </button>
                {Object.entries(KNOWLEDGE_DOMAIN_METADATA).map(([key, meta]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDomainFilter(key as KnowledgeDomain)}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1 shrink-0 ${
                      selectedDomainFilter === key
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{meta.name}</span>
                  </button>
                ))}
              </div>

              {/* Mobile-only Collapsible Live Weather & Sensors Ribbon */}
              <div className="lg:hidden px-3 sm:px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <CloudSun className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1">
                      <span>Live Sensors:</span>
                      <span className="text-cyan-300 font-mono">{weather.temperatureCelsius}°C</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-blue-300 font-mono">{weather.relativeHumidityPercent}% RH</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                      weather.feasibilityStatus === 'optimal'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                        : weather.feasibilityStatus === 'caution'
                        ? 'bg-amber-950 text-amber-400 border border-amber-700'
                        : 'bg-rose-950 text-rose-400 border border-rose-700'
                    }`}>
                      {weather.feasibilityStatus}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMobileWeatherExpanded(!mobileWeatherExpanded)}
                      className="p-1 rounded bg-slate-800 text-slate-400 hover:text-slate-200"
                    >
                      {mobileWeatherExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {mobileWeatherExpanded && (
                  <div className="grid grid-cols-2 gap-2 p-2 bg-slate-950 rounded-lg border border-slate-800/80 text-[10px] font-mono mt-1">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                      <span>Temp: {weather.temperatureCelsius}°C</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                      <span>RH: {weather.relativeHumidityPercent}%</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Wind className="w-3.5 h-3.5 text-teal-400" />
                      <span>Wind: {weather.windSpeedKmH} km/h</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Activity className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Score: {weather.feasibilityScorePercent}%</span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-800 flex justify-between items-center text-[9px] text-slate-500">
                      <span>GPS: {weather.locationName}</span>
                      <button
                        type="button"
                        onClick={handleRefreshWeather}
                        disabled={isRefreshingWeather}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-[9px] text-cyan-300 font-bold rounded flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw className={`w-2.5 h-2.5 ${isRefreshingWeather ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Message Scrollable Container */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 text-xs font-sans min-h-0">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end ml-auto' : 'items-start mr-auto'
                    } w-full`}
                  >
                    {/* Message Card */}
                    <div
                      className={`w-full ${
                        msg.sender === 'user'
                          ? 'sm:max-w-[80%] md:max-w-[70%] ml-auto bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl rounded-br-xs p-3.5 sm:p-4 shadow-lg'
                          : msg.sender === 'system'
                          ? 'w-full bg-slate-900/90 border border-slate-700/80 text-slate-300 rounded-xl p-3 shadow'
                          : 'sm:max-w-[88%] md:max-w-[82%] mr-auto bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl rounded-bl-xs p-3.5 sm:p-4 shadow-lg space-y-2.5'
                      }`}
                    >
                      {/* Message Header */}
                      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 text-[10px] font-mono text-slate-400">
                        <div className="flex items-center gap-1.5">
                          {msg.sender === 'user' ? (
                            <span className="font-bold text-white uppercase flex items-center gap-1">
                              <span>Field Operator</span>
                            </span>
                          ) : (
                            <span className="font-bold text-indigo-300 uppercase flex items-center gap-1.5 flex-wrap">
                              <Bot className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{msg.modelUsed || activeModel.name}</span>
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700 text-[9px] font-mono normal-case tracking-normal ml-1.5 shrink-0 select-none">
                                <CloudSun className="w-3 h-3 text-amber-400 shrink-0" />
                                <span>{weather.temperatureCelsius}°C</span>
                              </span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">{new Date(msg.timestamp).toLocaleTimeString()}</span>

                          {msg.sender === 'assistant' && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleCopyMessage(msg.id, msg.text)}
                                title="Copy Message Text"
                                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                              >
                                {copiedMsgId === msg.id ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReadAloudMessage(msg.text)}
                                title="Read reply aloud"
                                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                              >
                                <Volume2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Message Markdown Body */}
                      <div className="prose prose-invert prose-xs max-w-none text-slate-200 leading-relaxed space-y-2 whitespace-pre-wrap font-sans text-xs sm:text-sm">
                        {msg.text}
                      </div>

                      {/* Code or Formula Block */}
                      {msg.codeOrFormula && (
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{msg.codeOrFormula}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.id + '-code', msg.codeOrFormula || '')}
                            className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white text-[10px] shrink-0"
                          >
                            {copiedMsgId === msg.id + '-code' ? 'Copied' : 'Copy Code'}
                          </button>
                        </div>
                      )}

                      {/* RAG Source Citations */}
                      {msg.ragSources && msg.ragSources.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                          <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1 font-bold">
                            <Database className="w-3 h-3 text-emerald-400" />
                            <span>Retrieved Vector Sources (On-Device RAG):</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                            {msg.ragSources.map((source, idx) => (
                              <div
                                key={idx}
                                className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-[10px] font-mono"
                              >
                                <div className="truncate text-slate-300 pr-2">
                                  <strong className="text-white block truncate">{source.document.title}</strong>
                                  <span className="text-slate-500">{source.document.category}</span>
                                </div>
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold shrink-0">
                                  {Math.round(source.similarityScore * 100)}% Match
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggested Instant Navigation Actions */}
                      {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                        <div className="pt-2.5 border-t border-slate-800/80 space-y-1">
                          <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Suggested Actions:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {msg.suggestedActions.map((action, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleExecuteAction(action.actionType)}
                                className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-200 hover:text-white border border-indigo-500/30 font-mono text-[11px] font-semibold transition-all flex items-center justify-between gap-1.5 shadow-xs"
                              >
                                <span className="truncate">{action.label}</span>
                                <ExternalLink className="w-3 h-3 text-indigo-400 shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Latency & Token Footer */}
                      {msg.latencyMs && (
                        <div className="text-[9px] font-mono text-slate-500 text-right pt-0.5">
                          Inference latency: {msg.latencyMs}ms • Generated {msg.tokensGenerated} tokens • 0% cloud cost
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Live Stream Indicator */}
                {isStreaming && (
                  <div className="flex flex-col items-start space-y-2 w-full max-w-[88%]">
                    <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl rounded-bl-xs p-4 shadow-lg space-y-2 text-slate-200 w-full">
                      <div className="flex items-center gap-2 text-[10px] font-mono text-indigo-400 animate-pulse font-bold">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        <span>Streaming from on-device {activeModel.name}...</span>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                        {currentStreamedText || 'Retrieving vector embeddings and initializing token stream...'}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Quick Prompt Pills Bar */}
              <div className="px-3 sm:px-4 py-2 bg-slate-900/50 border-t border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px] font-mono shrink-0 no-scrollbar">
                <span className="text-slate-500 text-[10px] uppercase shrink-0 font-bold">Quick Prompts:</span>
                {[
                  'What is Critical PVC (CPVC) and how does it affect scrub resistance?',
                  'Airless spray tip 517 vs 521 pressure & fluid flow comparison',
                  'High-Speed Disperser donut vortex & tip speed formula',
                  'Polymer wall screening mortar EN 998-1 mix depth & drying time',
                  'Gypsum dihydrate vs NHL 3.5 lime plastering stages',
                  '3D Gaussian Splatting vs Photogrammetry for facade takeoffs',
                  'What are current spot prices for TiO2 and Acrylic Resin?',
                  'Substrate prep standards and 3°C Dew Point Delta rule',
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    disabled={isStreaming}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 whitespace-nowrap transition-colors disabled:opacity-50 text-[10px] font-semibold shrink-0"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Chat Input Field Container */}
              <div className="p-2 sm:p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0">
                <div className="flex-1 flex items-center gap-2 bg-slate-950 border border-slate-800/90 rounded-xl px-3 py-2 focus-within:border-purple-500 transition-all">
                  <input
                    type="text"
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={`Ask ${activeModel.name}...`}
                    className="flex-1 bg-transparent border-none text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none"
                  />

                  {inputPrompt && (
                    <button
                      type="button"
                      onClick={() => setInputPrompt('')}
                      className="text-slate-500 hover:text-slate-300 p-1 shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Speech-to-Text Microphone Button */}
                  <button
                    type="button"
                    onClick={handleToggleVoiceInput}
                    title={isListening ? 'Listening... Click to stop' : 'Speech-to-Text Voice Input'}
                    className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                      isListening
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>

                  {/* Inline Send Icon Button */}
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={!inputPrompt.trim() || isStreaming}
                    title="Send Message"
                    className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-all shadow-sm shadow-purple-600/30 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR: LOCALIZED INTELLIGENCE & SENSORS */}
              <div className="hidden lg:flex lg:col-span-4 flex-col bg-slate-900/25 border-l border-slate-900 min-h-0 overflow-y-auto p-4 space-y-4 no-scrollbar select-none">
                {/* Live Site Weather Sensors */}
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-white uppercase tracking-wider">
                      <CloudSun className="w-4 h-4 text-amber-400" />
                      <span>Live Site Sensors</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRefreshWeather}
                      disabled={isRefreshingWeather}
                      title="Scan Sensors"
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-cyan-400 hover:text-white rounded-lg border border-slate-700 transition-all cursor-pointer flex items-center justify-center"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingWeather ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 p-3 bg-slate-950 rounded-lg border border-slate-800/80">
                    <div className="relative shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/10 to-indigo-500/5 border border-slate-800 flex items-center justify-center text-amber-400">
                      <span className="absolute -inset-1.5 rounded-xl bg-amber-500/20 blur-xs opacity-50 animate-pulse" />
                      <CloudSun className="w-7 h-7 relative" />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wide">Ambient Temp</div>
                      <div className="text-2xl font-mono font-bold text-white leading-tight">{weather.temperatureCelsius}°C</div>
                      <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                        <span className="truncate max-w-[120px]">{weather.locationName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Sensor Parameters */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 bg-slate-950 border border-slate-800/50 rounded-lg space-y-0.5">
                      <div className="text-slate-500 text-[9px] uppercase">Humidity</div>
                      <div className="font-bold text-cyan-300 flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5" />
                        <span>{weather.relativeHumidityPercent}% RH</span>
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-950 border border-slate-800/50 rounded-lg space-y-0.5">
                      <div className="text-slate-500 text-[9px] uppercase">Wind Speed</div>
                      <div className="font-bold text-teal-300 flex items-center gap-1">
                        <Wind className="w-3.5 h-3.5" />
                        <span>{weather.windSpeedKmH} km/h</span>
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-950 border border-slate-800/50 rounded-lg space-y-0.5">
                      <div className="text-slate-500 text-[9px] uppercase">Dew Point</div>
                      <div className="font-bold text-purple-300 flex items-center gap-1">
                        <Thermometer className="w-3.5 h-3.5" />
                        <span>{weather.dewPointCelsius}°C</span>
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-950 border border-slate-800/50 rounded-lg space-y-0.5">
                      <div className="text-slate-500 text-[9px] uppercase">Adhesion Index</div>
                      <div className="font-bold text-amber-300 flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5" />
                        <span>{weather.feasibilityScorePercent}% score</span>
                      </div>
                    </div>
                  </div>

                  {/* Feasibility Ribbon */}
                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Coating Feasibility:</span>
                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                        weather.feasibilityStatus === 'optimal'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                          : weather.feasibilityStatus === 'caution'
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                          : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                      }`}>
                        {weather.feasibilityStatus}
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          weather.feasibilityStatus === 'optimal'
                            ? 'bg-emerald-500'
                            : weather.feasibilityStatus === 'caution'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${weather.feasibilityScorePercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Local Commodity Indices */}
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-white uppercase tracking-wider">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Regional Spot Commodities</span>
                  </div>

                  <div className="space-y-2 font-mono text-[11px]">
                    {[
                      { name: 'TiO2 Pigment (Pure Rutile)', price: '$3.45', unit: 'kg', trend: 'down', change: '-1.2%' },
                      { name: 'Acrylic Resin (Emulsion)', price: '$2.12', unit: 'kg', trend: 'up', change: '+0.8%' },
                      { name: 'Hydraulic Lime (NHL 3.5)', price: '$0.85', unit: 'kg', trend: 'stable', change: '0.0%' },
                      { name: 'Portland Cement (CEM I)', price: '$0.18', unit: 'kg', trend: 'down', change: '-0.5%' },
                    ].map((c, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-slate-950/60 rounded-lg border border-slate-800/40">
                        <span className="text-slate-400 text-xs">{c.name}</span>
                        <div className="flex items-center gap-2">
                          <strong className="text-white">{c.price} <span className="text-[9px] text-slate-500">/{c.unit}</span></strong>
                          <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                            c.trend === 'up'
                              ? 'bg-amber-950/80 text-amber-400'
                              : c.trend === 'down'
                              ? 'bg-emerald-950/80 text-emerald-400'
                              : 'bg-slate-900 text-slate-400'
                          }`}>
                            {c.change}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stacked Navigation Shortcut Menu */}
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-white uppercase tracking-wider">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <span>Field Actions Matrix</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { label: '3D Mesh Estimator', tab: 'reconstruction3d', icon: Box, color: 'text-indigo-400' },
                      { label: 'Mini SLMs Suite', tab: 'models', icon: Cpu, color: 'text-blue-400' },
                      { label: 'Embedded RAG DB', tab: 'rag', icon: Database, color: 'text-emerald-400' },
                      { label: 'Autonomous Agents', tab: 'agents', icon: Users, color: 'text-purple-400' },
                      { label: 'App Deep Routing', tab: 'navigation', icon: Compass, color: 'text-teal-400' },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setActiveTab(item.tab as any);
                        }}
                        className="w-full p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 hover:border-indigo-500/40 rounded-xl flex items-center justify-between text-left font-mono text-xs text-slate-300 hover:text-white transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <item.icon className={`w-4 h-4 ${item.color} shrink-0`} />
                          <span className="font-semibold">{item.label}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* TAB 2: 19 MINI SLMs REGISTRY & BENCHMARKS */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'models' && (
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
              {/* Header & Filter Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white font-mono uppercase">
                    19 Mini LLM / SLM On-Device Models Suite
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Embedded offline Small Language Models optimized for edge inference, WASM/WebGPU, and zero cloud dependency.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={searchModelQuery}
                      onChange={(e) => setSearchModelQuery(e.target.value)}
                      placeholder="Search 19 models..."
                      className="w-full sm:w-48 pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <select
                    value={modelFilter}
                    onChange={(e) => setModelFilter(e.target.value as any)}
                    className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-purple-300 focus:outline-none"
                  >
                    <option value="all">All 19 Models</option>
                    <option value="open_source">Open Source Only</option>
                    <option value="sub_3b">Compact (&lt;3B params)</option>
                    <option value="downloaded">Downloaded Offline</option>
                  </select>
                </div>
              </div>

              {/* Models Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredModels.map((model) => {
                  const isActive = activeModel.id === model.id;
                  const isBenchmarking = benchmarkingModelId === model.id;
                  const benchResult = benchmarkResult?.id === model.id ? benchmarkResult : null;

                  return (
                    <div
                      key={model.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                        isActive
                          ? 'bg-slate-900 border-purple-500 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Title & Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-white font-mono">{model.name}</h4>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{model.provider} • {model.family}</span>
                          </div>

                          {isActive ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold shrink-0">
                              ACTIVE SLM
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-mono shrink-0">
                              {model.quantization}
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-[11px] text-slate-300 leading-relaxed">{model.description}</p>

                        {/* Specs Matrix */}
                        <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-950 rounded-lg border border-slate-800/80 text-[10px] font-mono text-slate-300">
                          <div>
                            <span className="text-slate-500 block">Params:</span>
                            <strong className="text-purple-300">{model.parameterCount}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">RAM Footprint:</span>
                            <strong className="text-cyan-300">~{model.ramRequiredMb} MB</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Speed (Edge):</span>
                            <strong className="text-emerald-400">{model.tokensPerSecBenchmark} tok/s</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Context:</span>
                            <strong className="text-amber-300">{model.contextWindow.toLocaleString()} tok</strong>
                          </div>
                        </div>

                        {/* License & Strengths */}
                        <div className="space-y-1">
                          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                            <span>License: <strong className="text-slate-300">{model.license}</strong></span>
                          </div>
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {model.strengths.slice(0, 2).map((st, sIdx) => (
                              <span
                                key={sIdx}
                                className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                              >
                                {st}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Actions Footer */}
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleRunModelBenchmark(model)}
                          disabled={isBenchmarking}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>{isBenchmarking ? 'Testing...' : 'Test Speed'}</span>
                        </button>

                        {benchResult && (
                          <span className="text-[10px] font-mono text-emerald-400">
                            {benchResult.speed} tok/s ({benchResult.latency}ms)
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleSwitchModel(model)}
                          disabled={isActive}
                          className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ml-auto ${
                            isActive
                              ? 'bg-emerald-600/30 text-emerald-300 cursor-default'
                              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30'
                          }`}
                        >
                          {isActive ? 'Current Model' : 'Switch to Model'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* TAB 3: LOCAL VECTOR RAG EXPLORER */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'rag' && (
            <div className="flex-1 overflow-hidden flex flex-col p-3 sm:p-4 space-y-3">
              {/* RAG Search Header */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={ragSearchQuery}
                    onChange={(e) => setRagSearchQuery(e.target.value)}
                    placeholder="Search vector embeddings for chemistry, ASTM standards, airless tips, wall screening, plaster..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-500/30 shrink-0">
                  Cosine Index: 30+ Indexed Specifications
                </span>
              </div>

              {/* Document List & Inspector */}
              <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-3.5">
                {/* Search Results Column */}
                <div className="lg:col-span-5 overflow-y-auto space-y-2.5 pr-1 min-h-0">
                  {ragSearchResults.map((res) => (
                    <div
                      key={res.document.id}
                      onClick={() => setSelectedRagDoc(res.document)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                        selectedRagDoc?.id === res.document.id
                          ? 'bg-slate-900 border-emerald-500 shadow-md shadow-emerald-500/10'
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-white font-mono">{res.document.title}</h4>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold shrink-0">
                          {Math.round(res.similarityScore * 100)}% Sim
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2">{res.document.summary}</p>

                      <div className="flex flex-wrap gap-1 pt-1">
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {res.document.category}
                        </span>
                        {res.document.tags.slice(0, 3).map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Document Detail Preview Column */}
                <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-y-auto space-y-3.5 min-h-0">
                  {selectedRagDoc ? (
                    <div className="space-y-3">
                      <div className="border-b border-slate-800 pb-2">
                        <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">
                          {selectedRagDoc.category} • {selectedRagDoc.domain}
                        </span>
                        <h3 className="text-sm font-bold text-white font-mono mt-0.5">
                          {selectedRagDoc.title}
                        </h3>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-slate-400 uppercase block">Summary:</span>
                        <p className="text-xs text-slate-300 leading-relaxed">{selectedRagDoc.summary}</p>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-slate-400 uppercase block">Full Technical Content:</span>
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                          {selectedRagDoc.content}
                        </div>
                      </div>

                      {selectedRagDoc.keyFormulas && selectedRagDoc.keyFormulas.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono text-emerald-400 uppercase block">Mathematical Formulas:</span>
                          <div className="space-y-1">
                            {selectedRagDoc.keyFormulas.map((f, fIdx) => (
                              <div
                                key={fIdx}
                                className="p-2 bg-slate-950 rounded border border-emerald-500/30 text-[11px] font-mono text-emerald-300"
                              >
                                {f}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedRagDoc.practicalTips && selectedRagDoc.practicalTips.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono text-amber-400 uppercase block">Practical Field Tips:</span>
                          <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                            {selectedRagDoc.practicalTips.map((tip, tIdx) => (
                              <li key={tIdx}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedRagDoc.standardSpecs && selectedRagDoc.standardSpecs.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono text-indigo-400 uppercase block">Standard Specifications:</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedRagDoc.standardSpecs.map((spec, sIdx) => (
                              <span
                                key={sIdx}
                                className="text-[10px] font-mono px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2 p-6">
                      <Database className="w-8 h-8 text-slate-600" />
                      <div className="text-xs font-mono">Select any RAG document on the left to inspect full text, formulas, and standards.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* TAB 2: INTEGRATIONS & CONNECTED TOOLS */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'integrations' && (
            <IntegrationsConsole
              onOpenWorkspace={onOpenWorkspace}
              onOpenSettings={onOpenSettings}
              onOpenContacts={onOpenContacts}
              onOpenInventory={onOpenInventory}
              onOpenQuotation={onOpenQuotation}
              onOpenPublish={onOpenPublish}
              onNavigateTab={onNavigateTab}
              onSelectSLMTab={() => setActiveTab('models')}
              onSelectRAGTab={() => setActiveTab('rag')}
              onSelect3DTab={() => setActiveTab('reconstruction3d')}
            />
          )}

          {/* ---------------------------------------------------- */}
          {/* TAB 3: ADVANCED AGENT ORCHESTRATION & FLEET MANAGEMENT */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'agents' && (
            <AgentOrchestrationConsole
              projectMode={currentProjectMode}
              onNavigateTab={onNavigateTab}
            />
          )}

          {/* ---------------------------------------------------- */}
          {/* TAB 5: 3D RECONSTRUCTION STUDIO (IMAGE/VIDEO TO 3D) */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'reconstruction3d' && (
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white font-mono uppercase">
                    3D Spatial Reconstruction Studio (Image & Video to 3D)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Multi-View Photogrammetry, 3D Gaussian Splatting (3DGS), and LiDAR SLAM depth fusion for millimeter surface takeoffs.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleStart3DReconstruction}
                  disabled={isReconstructing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50 shrink-0"
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>{isReconstructing ? `Reconstructing (${reconProgress}%)...` : 'Run 3D Mesh Reconstruction'}</span>
                </button>
              </div>

              {/* Progress Bar */}
              {isReconstructing && (
                <div className="p-3.5 bg-blue-950/60 border border-blue-500/40 rounded-xl space-y-2 font-mono text-xs text-blue-200">
                  <div className="flex justify-between">
                    <span>Processing Structure-from-Motion keypoint matching & point cloud densification...</span>
                    <strong className="text-white">{reconProgress}%</strong>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all duration-300"
                      style={{ width: `${reconProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Success Banner */}
              {reconSuccess && (
                <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-200 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white">3D Surface Mesh Reconstructed Successfully!</div>
                      <div className="text-[11px] text-emerald-300">
                        Synthesized 45,200 polygon mesh with calibrated surface area of 2,450 sq ft (227.6 m²). Metric scale accuracy ±2mm.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleExecuteAction('navigate_estimator')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] shrink-0 self-start sm:self-auto"
                  >
                    View in 3D Estimator
                  </button>
                </div>
              )}

              {/* Parameters & Pipeline Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Configuration Card */}
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3 text-xs font-mono">
                  <div className="text-xs font-bold text-white uppercase flex items-center gap-1.5 text-blue-400">
                    <Sliders className="w-3.5 h-3.5" /> Reconstruction Pipeline Parameters
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase">Input Source Type:</label>
                    <select
                      value={reconConfig.sourceType}
                      onChange={(e) => setReconConfig({ ...reconConfig, sourceType: e.target.value as any })}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                    >
                      <option value="images">Multi-View High-Res Photo Stream (60+ Images)</option>
                      <option value="video">4K 60FPS Continuous Orbital Video Scan</option>
                      <option value="lidar_scan">Hardware LiDAR Point Cloud + RGB Fusion</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase">Algorithm Architecture:</label>
                    <select
                      value={reconConfig.algorithm}
                      onChange={(e) => setReconConfig({ ...reconConfig, algorithm: e.target.value as any })}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                    >
                      <option value="3D Gaussian Splatting (3DGS)">3D Gaussian Splatting (Real-Time 120 FPS)</option>
                      <option value="Structure from Motion (SfM + MVS)">Structure from Motion (SfM + MVS Dense Mesh)</option>
                      <option value="Poisson Surface Mesh">Screened Poisson Surface Reconstruction</option>
                      <option value="NeRF Neural Radiance">Neural Radiance Field (NeRF Instant-NGP)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase">Resolution:</label>
                      <select
                        value={reconConfig.resolution}
                        onChange={(e) => setReconConfig({ ...reconConfig, resolution: e.target.value as any })}
                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                      >
                        <option value="High Precision (4K)">High Precision (4K)</option>
                        <option value="Draft Fast (1080p)">Draft Fast (1080p)</option>
                        <option value="Industrial Metric (8K Multi-Cam)">Industrial Metric (8K)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase">Texture Bake:</label>
                      <select
                        value={reconConfig.textureQuality}
                        onChange={(e) => setReconConfig({ ...reconConfig, textureQuality: e.target.value as any })}
                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                      >
                        <option value="2048px">2048px PBR Albedo</option>
                        <option value="4096px PBR">4096px Ultra PBR</option>
                        <option value="1024px">1024px Standard</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Spatial Geometry Readout */}
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
                  <div className="text-xs font-bold text-white uppercase flex items-center gap-1.5 text-emerald-400">
                    <Box className="w-3.5 h-3.5" /> Calibrated Geometric Metrics
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Total Surface Area:</span>
                      <strong className="text-emerald-400 text-sm">2,450.0 sq ft</strong>
                      <span className="text-slate-400 text-[10px] block">(227.6 m²)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Polygon Density:</span>
                      <strong className="text-blue-300 text-sm">45,200 Triangles</strong>
                      <span className="text-slate-400 text-[10px] block">Watertight Solid</span>
                    </div>
                    <div className="pt-2">
                      <span className="text-slate-500 block">Estimated Paint Volume:</span>
                      <strong className="text-amber-400 text-sm">7.0 Gallons</strong>
                      <span className="text-slate-400 text-[10px] block">(26.5 Liters)</span>
                    </div>
                    <div className="pt-2">
                      <span className="text-slate-500 block">Substrate Porosity:</span>
                      <strong className="text-indigo-300 text-sm">Medium Porous</strong>
                      <span className="text-slate-400 text-[10px] block">Rough Brick/Masonry</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-blue-950/40 rounded-lg border border-blue-500/30 text-[10px] text-blue-200">
                    <strong>Metric Anchor Calibration:</strong> 1000.0mm reference anchor locked. Area calculation uncertainty is &lt;0.8%.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* TAB 6: APP NAVIGATOR & ACTION SHORTCUTS */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'navigation' && (
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                <h3 className="text-xs sm:text-sm font-bold text-white font-mono uppercase">
                  Application Navigation & Deep Action Matrix
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  1-click deep routing to all WalnusGlobal SmartView -Pro © modules, tools, and integration panels.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  {
                    title: '3D LiDAR Estimator',
                    desc: 'Live camera viewfinder, point cloud polygon mesh takeoff, and surface calculation.',
                    action: 'navigate_estimator',
                    icon: Layers,
                    color: 'text-indigo-400',
                    bg: 'hover:border-indigo-500',
                  },
                  {
                    title: 'Automated Paint Mixer',
                    desc: 'Stoichiometric pigment matrix, resin solids balancing, and drum packaging plan.',
                    action: 'navigate_mixer',
                    icon: Beaker,
                    color: 'text-emerald-400',
                    bg: 'hover:border-emerald-500',
                  },
                  {
                    title: 'Google Docs & Drive Hub',
                    desc: 'Generate official specification sheets in Google Docs and export to Google Drive.',
                    action: 'open_workspace',
                    icon: HardDrive,
                    color: 'text-blue-400',
                    bg: 'hover:border-blue-500',
                  },
                  {
                    title: 'Field Site Contacts',
                    desc: 'Instant full-duplex video conferencing with Engineer, Painter, Manager, and Bricklayer.',
                    action: 'open_contacts',
                    icon: Users,
                    color: 'text-purple-400',
                    bg: 'hover:border-purple-500',
                  },
                  {
                    title: 'Raw Materials Inventory',
                    desc: 'Track chemical safety stocks, critical deficit warnings, and live batch reorders.',
                    action: 'open_inventory',
                    icon: Database,
                    color: 'text-amber-400',
                    bg: 'hover:border-amber-500',
                  },
                  {
                    title: 'Generate Official Quotation',
                    desc: 'Send interactive live editable quotation to HUD or compile certified high-res PDF.',
                    action: 'open_quotation',
                    icon: FileText,
                    color: 'text-rose-400',
                    bg: 'hover:border-rose-500',
                  },
                  {
                    title: 'Advanced Settings Console',
                    desc: 'Camera/sensor diagnostics, video codecs, user profile branding, and localization.',
                    action: 'open_settings',
                    icon: Sliders,
                    color: 'text-teal-400',
                    bg: 'hover:border-teal-500',
                  },
                  {
                    title: 'Publish Stakeholder 3D Portal',
                    desc: 'Interactive 3D building viewer with orbit/pan/zoom, real-time color swapper & dynamic quotation.',
                    action: 'open_publish',
                    icon: Globe,
                    color: 'text-indigo-400',
                    bg: 'hover:border-indigo-500',
                  },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleExecuteAction(item.action)}
                    className={`p-4 bg-slate-900 rounded-xl border border-slate-800 ${item.bg} text-left transition-all space-y-2 group shadow-sm`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                        <h4 className="text-xs font-bold text-white font-mono">{item.title}</h4>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Drawer Footer */}
        <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-900 flex items-center justify-between shrink-0 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-slate-400 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">Active SLM: <strong className="text-white">{activeModel.name}</strong></span>
          </div>
        </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
