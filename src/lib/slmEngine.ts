import { SLMModelInfo, AICopilotMessage, KnowledgeDomain, RAGSearchResult, AIAgentDefinition } from '../types';
import { SLM_MODELS_REGISTRY } from '../data/slmModelsData';
import { vectorRagEngine } from './vectorRagEngine';
import { generateId } from './utils';

export const INITIAL_AI_AGENTS: AIAgentDefinition[] = [
  {
    id: 'agent-estimator',
    name: 'Spatial Estimator Agent',
    role: 'Surface Geometry & Area Takeoff',
    description: 'Processes LiDAR point clouds and camera frames to integrate polygon surface area, substrate porosity, and theoretical coverage.',
    avatarBg: 'from-blue-600 to-cyan-600',
    avatarIcon: 'Ruler',
    status: 'completed',
    specialtyDomain: 'image_video_to_3d',
    assignedModelId: 'llama-3.2-3b',
    completedTasksCount: 14,
    capabilities: ['3D Mesh Area Integration', 'Substrate Porosity Analysis', 'Theoretical Volume Calculus'],
  },
  {
    id: 'agent-formulator',
    name: 'Chemical Formulator Agent',
    role: 'Stoichiometric Recipe & Binder Balancing',
    description: 'Calculates PVC/CPVC ratios, TiO2 dispersion levels, coalescing solvent loadings, and drum batch recipes.',
    avatarBg: 'from-purple-600 to-indigo-600',
    avatarIcon: 'Atom',
    status: 'idle',
    specialtyDomain: 'paint_chemistry',
    assignedModelId: 'phi-3.5-mini',
    completedTasksCount: 28,
    capabilities: ['PVC vs CPVC Optimization', 'Resin Solids Balancing', 'Rheology Modifier Prediction'],
  },
  {
    id: 'agent-qc',
    name: 'QC & Standards Auditor',
    role: 'Environmental & ASTM/ISO Compliance',
    description: 'Audits VOC compliance, ensures the 3°C Dew Point Delta rule is verified, and tests Hegman grind tolerances.',
    avatarBg: 'from-emerald-600 to-teal-600',
    avatarIcon: 'ShieldCheck',
    status: 'idle',
    specialtyDomain: 'manufacturing_process',
    assignedModelId: 'gemma-2-9b',
    completedTasksCount: 19,
    capabilities: ['Dew Point Delta Safety Check', 'VOC Environmental Limit Audit', 'Hegman & Viscosity Verification'],
  },
  {
    id: 'agent-procurement',
    name: 'Market Procurement Agent',
    role: 'Spot Price & Inventory Sourcing',
    description: 'Tracks raw chemical spot pricing, verifies warehouse safety stocks, and builds itemized contractor quotations.',
    avatarBg: 'from-amber-600 to-orange-600',
    avatarIcon: 'TrendingUp',
    specialtyDomain: 'realtime_pricing',
    assignedModelId: 'qwen-2.5-3b',
    status: 'idle',
    completedTasksCount: 22,
    capabilities: ['Live Spot Index Query', 'Supplier Freight Calculation', 'Automated Margin & Tax Buildup'],
  },
  {
    id: 'agent-coordinator',
    name: 'Site Dispatch Coordinator',
    role: 'Task Orchestration & Stakeholder Dispatches',
    description: 'Coordinates multi-agent consensus, dispatches live editable quotations to site HUDs, and schedules video conferences.',
    avatarBg: 'from-rose-600 to-pink-600',
    avatarIcon: 'Send',
    specialtyDomain: 'agent_coordination',
    assignedModelId: 'llama-3.2-1b',
    status: 'idle',
    completedTasksCount: 31,
    capabilities: ['Quotation HUD Live Transfer', 'Signed PDF Generation', 'Field Video Call Routing'],
  },
];

// Active SLM State Manager
class SLMInferenceEngine {
  private activeModelId: string = 'llama-3.2-3b';
  private customModelRegistry: SLMModelInfo[] = [...SLM_MODELS_REGISTRY];
  private isProcessing: boolean = false;

  public getActiveModel(): SLMModelInfo {
    return (
      this.customModelRegistry.find((m) => m.id === this.activeModelId) ||
      this.customModelRegistry[0]
    );
  }

  public getAvailableModels(): SLMModelInfo[] {
    return this.customModelRegistry;
  }

  public setActiveModel(modelId: string) {
    const exists = this.customModelRegistry.some((m) => m.id === modelId);
    if (exists) {
      this.activeModelId = modelId;
    }
  }

  // Detect navigation intent
  public detectNavigationIntent(query: string): {
    actionType: any;
    label: string;
  } | null {
    const q = query.toLowerCase();
    if (q.includes('estimator') || q.includes('measure') || q.includes('takeoff') || q.includes('viewfinder') || q.includes('camera scan')) {
      return { actionType: 'navigate_estimator', label: 'Go to 3D Estimator' };
    }
    if (q.includes('mixer') || q.includes('formulate') || q.includes('mix paint') || q.includes('drum batch')) {
      return { actionType: 'navigate_mixer', label: 'Go to Paint Mixer' };
    }
    if (q.includes('contact') || q.includes('team') || q.includes('engineer') || q.includes('painter') || q.includes('call') || q.includes('bricklayer')) {
      return { actionType: 'open_contacts', label: 'Open Site Contacts' };
    }
    if (q.includes('docs') || q.includes('drive') || q.includes('workspace') || q.includes('google doc') || q.includes('spec sheet')) {
      return { actionType: 'open_workspace', label: 'Open Google Workspace' };
    }
    if (q.includes('settings') || q.includes('sensor') || q.includes('hardware') || q.includes('permission') || q.includes('profile')) {
      return { actionType: 'open_settings', label: 'Open Advanced Settings' };
    }
    if (q.includes('inventory') || q.includes('stock') || q.includes('raw material') || q.includes('deficit') || q.includes('threshold')) {
      return { actionType: 'open_inventory', label: 'Open Inventory Matrix' };
    }
    if (q.includes('quote') || q.includes('quotation') || q.includes('pdf quote') || q.includes('send price')) {
      return { actionType: 'open_quotation', label: 'Generate Official Quotation' };
    }
    return null;
  }

  // Generate inference response with streaming and RAG grounding
  public async generateResponse(
    userPrompt: string,
    domainFilter?: KnowledgeDomain | 'all',
    onToken?: (partialText: string) => void
  ): Promise<AICopilotMessage> {
    this.isProcessing = true;
    const startTime = Date.now();
    const activeModel = this.getActiveModel();

    // Step 1: Query Local Vector RAG Knowledge Base
    const ragSources: RAGSearchResult[] = vectorRagEngine.search(
      userPrompt,
      domainFilter,
      3
    );

    // Step 2: Detect navigation actions
    const navIntent = this.detectNavigationIntent(userPrompt);
    const suggestedActions: any[] = [];
    if (navIntent) {
      suggestedActions.push(navIntent);
    }

    // Always offer context-relevant quick actions
    if (userPrompt.toLowerCase().includes('formulat') || userPrompt.toLowerCase().includes('chem')) {
      suggestedActions.push({ actionType: 'navigate_mixer', label: 'Formulate in Mixer' });
    }
    if (userPrompt.toLowerCase().includes('area') || userPrompt.toLowerCase().includes('surface') || userPrompt.toLowerCase().includes('3d')) {
      suggestedActions.push({ actionType: 'navigate_estimator', label: 'Scan 3D Surface' });
    }

    // Step 3: Multi-agent execution steps simulation
    const agentSteps = [
      {
        agentName: 'Spatial Estimator Agent',
        role: 'Geometry Takeoff',
        stepDescription: 'Validated spatial parameters against project mesh',
        status: 'completed' as const,
      },
      {
        agentName: 'Chemical Formulator Agent',
        role: 'Chemical Stoichiometry',
        stepDescription: 'Cross-referenced RAG pigment matrix & CPVC threshold',
        status: 'completed' as const,
      },
      {
        agentName: 'QC & Standards Auditor',
        role: 'Safety & Specs',
        stepDescription: 'Audited ASTM & SSPC environmental compliance rules',
        status: 'completed' as const,
      },
    ];

    // Step 4: Synthesize intelligent grounded response
    const synthesizedResponse = this.synthesizeAnswer(userPrompt, ragSources, activeModel);

    // Step 5: Simulate realistic token-by-token streaming according to model speed
    const words = synthesizedResponse.text.split(' ');
    let streamedText = '';
    const delayPerWord = Math.max(12, Math.round(1000 / activeModel.tokensPerSecBenchmark));

    for (let i = 0; i < words.length; i++) {
      streamedText += (i === 0 ? '' : ' ') + words[i];
      if (onToken) {
        onToken(streamedText);
      }
      // Small delay for streaming feel
      if (i % 3 === 0) {
        await new Promise((r) => setTimeout(r, Math.min(25, delayPerWord)));
      }
    }

    const latencyMs = Date.now() - startTime;
    const tokensGenerated = Math.round(streamedText.length / 4);

    this.isProcessing = false;

    return {
      id: generateId(),
      sender: 'assistant',
      text: synthesizedResponse.text,
      timestamp: Date.now(),
      modelUsed: `${activeModel.name} (${activeModel.quantization})`,
      domain: ragSources.length > 0 ? ragSources[0].document.domain : undefined,
      ragSources,
      suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
      agentSteps,
      codeOrFormula: synthesizedResponse.formula,
      tokensGenerated,
      latencyMs,
    };
  }

  // Answer synthesis logic grounded in RAG documents
  private synthesizeAnswer(
    prompt: string,
    ragSources: RAGSearchResult[],
    model: SLMModelInfo
  ): { text: string; formula?: string } {
    const q = prompt.toLowerCase();

    // Check for specific technical domains
    if (ragSources.length > 0) {
      const topDoc = ragSources[0].document;
      const topSnippet = ragSources[0].matchedSnippet;
      const formulas = topDoc.keyFormulas || [];
      const tips = topDoc.practicalTips || [];
      const specs = topDoc.standardSpecs || [];

      let reasoning = '';

      // Chain of thought tag if reasoning model (DeepSeek R1)
      if (model.id.includes('deepseek-r1')) {
        reasoning += `<think>\n1. Analyzing query: "${prompt}" against ${topDoc.domain} domain knowledge.\n2. Retrieved vector source: "${topDoc.title}" (Cosine Similarity: ${Math.round(ragSources[0].similarityScore * 100)}%).\n3. Verifying stoichiometric safety margins and standard specifications (${specs.join(', ')}).\n4. Formulating actionable field recommendations.\n</think>\n\n`;
      }

      reasoning += `### **${topDoc.title}**\n\n`;
      reasoning += `${topDoc.summary}\n\n`;
      reasoning += `**Technical Overview & Mechanism:**\n${topDoc.content}\n\n`;

      if (formulas.length > 0) {
        reasoning += `**Core Mathematical & Stoichiometric Formulas:**\n`;
        formulas.forEach((f) => {
          reasoning += `- \`${f}\`\n`;
        });
        reasoning += `\n`;
      }

      if (tips.length > 0) {
        reasoning += `**Field Best Practices & Troubleshooting:**\n`;
        tips.forEach((t) => {
          reasoning += `- **Practical Tip:** ${t}\n`;
        });
        reasoning += `\n`;
      }

      if (specs.length > 0) {
        reasoning += `**Referenced Standards & Compliance:** ${specs.map((s) => `\`${s}\``).join(' • ')}\n\n`;
      }

      reasoning += `*Synthesized by on-device model **${model.name}** via Local Vector RAG (0% cloud latency, 100% private).*`;

      return {
        text: reasoning,
        formula: formulas.length > 0 ? formulas[0] : undefined,
      };
    }

    // Default fallback guidance if no exact RAG hit
    return {
      text: `### **Co-Pilot Analysis (${model.name})**\n\nI have evaluated your request against our on-device WalnusGlobal SmartView -Pro © knowledge matrix.\n\n- **Model Engine:** ${model.name} (${model.quantization})\n- **Execution Mode:** 100% Offline Edge Inference\n- **Target Capabilities:** Paint chemistry, high-speed dispersers, airless spray calibration, spot chemical pricing, interior & exterior wall screening mortars, lime/gypsum plastering, and 3D photogrammetry mesh reconstruction.\n\nFeel free to ask specific questions about formulation ratios (PVC/CPVC), Hegman grind testing, airless tip selection (e.g. 517 vs 521), substrate prep (SSPC-SP10), or polymer wall screening mix calculations.`,
    };
  }
}

export const slmEngine = new SLMInferenceEngine();
