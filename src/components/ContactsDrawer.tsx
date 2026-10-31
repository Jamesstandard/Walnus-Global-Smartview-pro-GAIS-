import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { SiteContact, PaintProject } from '../types';
import { INITIAL_CONTACTS } from '../data/contacts';
import { db, saveMessageOffline } from '../db';
import { generateId } from '../lib/utils';
import { playClickSound } from '../lib/soundUtils';
import { ContactSubMenuModal, ContactSubMenuOption } from './ContactSubMenuModal';
import { SendMaterialsListingModal } from './SendMaterialsListingModal';
import { ExportProjectModal } from './ExportProjectModal';
import { SendDraftQuotationModal } from './SendDraftQuotationModal';
import { SendFinalQuotationModal } from './SendFinalQuotationModal';
import {
  Users,
  MessageSquare,
  Mic,
  MicOff,
  Video,
  Play,
  Square,
  Send,
  X,
  Phone,
  MapPin,
  Briefcase,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Radio,
  Search,
  Sparkles,
  Volume2,
  Trash2,
  HardHat,
  Paintbrush,
  UserCheck,
  Building,
  MoreVertical,
  SlidersHorizontal,
  Bot,
  FileCode2,
  FileEdit,
  FileCheck,
  Minimize2,
  Pin,
  PinOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ContactsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  onStartVideoCall: (contact: SiteContact) => void;
}

export function ContactsDrawer({
  isOpen,
  onClose,
  onMinimize,
  onStartVideoCall,
}: ContactsDrawerProps) {
  const [contacts, setContacts] = useState<SiteContact[]>(INITIAL_CONTACTS);
  const [isPinned, setIsPinned] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(INITIAL_CONTACTS[0].id);
  const [isListCollapsed, setIsListCollapsed] = useState(false);
  const [isAgenticUiOpen, setIsAgenticUiOpen] = useState(false);
  const [runningAgentWorkflow, setRunningAgentWorkflow] = useState<string | null>(null);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [agentProgress, setAgentProgress] = useState(0);

  const runAgenticWorkflow = async (workflowName: string) => {
    setRunningAgentWorkflow(workflowName);
    setAgentProgress(0);
    setAgentLogs([]);

    const stepsMap: Record<string, string[]> = {
      dispatcher: [
        'Initializing Multi-Agent Comms Coordinator...',
        'Scraping site weather metrics (Temp: 74°F, Humidity: 62%)...',
        'Applying GHS-07 hazardous material application constraints...',
        'Compiling real-time briefing for Elena Rostova & Alex Mercer...',
        'Dispatched site briefings via offline Comms Mesh to all crew!',
      ],
      formulator: [
        'Accessing formulation target database...',
        'Evaluating raw material stock status for Exterior Acrylic Latex...',
        'Determining gravimetric pigment ratios (Titanium Dioxide, Acrylic Resin)...',
        'Calibrating delta-E color tolerance boundaries...',
        'Sent calibration profile to Elena Rostova\'s high-shear dispersion system!',
      ],
      proposal: [
        'Extracting site geometric area metrics (2450 sq ft)...',
        'Compiling SSPC-SP13 coating standard requirements...',
        'Drafting interactive PDF quotation proposal...',
        'Pre-negotiating logistics with Marcus Vance at Dispatch Hub...',
        'Quotation generated & queued in Google Drive / Workspace sync!',
      ],
    };

    const steps = stepsMap[workflowName] || ['Executing workflow step...'];
    
    for (let i = 0; i < steps.length; i++) {
      setAgentLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${steps[i]}`]);
      setAgentProgress(Math.round(((i + 1) / steps.length) * 100));
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    setTimeout(() => {
      setRunningAgentWorkflow(null);
    }, 2000);
  };

  // Retrieve projects for context
  const projects = useLiveQuery(() => db.projects.toArray()) || [];
  const activeProject: PaintProject | null = projects[0] || null;

  // Active interaction mode for the selected contact: none | message | voice
  const [activeAction, setActiveAction] = useState<'message' | 'voice' | null>(null);

  // Sub-menu and 4 modal states
  const [subMenuContact, setSubMenuContact] = useState<SiteContact | null>(null);
  const [materialsModalContact, setMaterialsModalContact] = useState<SiteContact | null>(null);
  const [exportModalContact, setExportModalContact] = useState<SiteContact | null>(null);
  const [draftQuoteModalContact, setDraftQuoteModalContact] = useState<SiteContact | null>(null);
  const [finalQuoteModalContact, setFinalQuoteModalContact] = useState<SiteContact | null>(null);


  // Text message state
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null);

  // Voice recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [voiceBlobUrl, setVoiceBlobUrl] = useState<string | null>(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voiceWaveform, setVoiceWaveform] = useState<number[]>([15, 30, 45, 60, 40, 20, 50, 70, 30, 20]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const voiceTimerRef = useRef<any>(null);

  // Filter contacts by search
  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.roleCaption.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Long-Press Event Handlers
  const handleOpenSubMenu = (contact: SiteContact, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSubMenuContact(contact);
  };

  const handleSubMenuOptionSelect = (option: ContactSubMenuOption, contact: SiteContact) => {
    setSubMenuContact(null);
    switch (option) {
      case 'materials_listings':
        setMaterialsModalContact(contact);
        break;
      case 'export_project':
        setExportModalContact(contact);
        break;
      case 'draft_quotation':
        setDraftQuoteModalContact(contact);
        break;
      case 'final_quotation':
        setFinalQuoteModalContact(contact);
        break;
    }
  };

  // Handle Contact Selection
  const handleSelectContact = (contact: SiteContact) => {
    if (selectedContactId === contact.id) {
      // Keep selected or toggle action
    } else {
      setSelectedContactId(contact.id);
      setActiveAction(null);
      setMessageText('');
      resetVoiceRecording();
    }
  };

  // 1. Send Direct Text Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedContactId) return;

    const contact = contacts.find((c) => c.id === selectedContactId);
    if (!contact) return;

    setIsSendingMessage(true);
    try {
      await saveMessageOffline({
        id: generateId(),
        sender: 'Estimator',
        recipient: `${contact.name} (${contact.role})`,
        text: `[DIRECT TO @${contact.name} - ${contact.role}]: ${messageText.trim()}`,
        timestamp: Date.now(),
        syncStatus: 'pending',
        type: 'text',
      });

      setMessageSuccess(`Message dispatched to ${contact.name}!`);
      setMessageText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // 2. Voice Message Recording
  const startVoiceRecording = async () => {
    resetVoiceRecording();
    setIsRecordingVoice(true);
    setVoiceDuration(0);

    voiceTimerRef.current = setInterval(() => {
      setVoiceDuration((prev) => prev + 1);
      setVoiceWaveform([
        Math.floor(Math.random() * 80) + 15,
        Math.floor(Math.random() * 80) + 15,
        Math.floor(Math.random() * 80) + 15,
        Math.floor(Math.random() * 80) + 15,
        Math.floor(Math.random() * 80) + 15,
        Math.floor(Math.random() * 80) + 15,
        Math.floor(Math.random() * 80) + 15,
        Math.floor(Math.random() * 80) + 15,
      ]);
    }, 1000);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          setVoiceBlobUrl(audioUrl);
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
      }
    } catch (err) {
      console.info('Microphone recording simulation fallback active:', err);
      setTimeout(() => {
        if (!voiceBlobUrl) {
          setVoiceBlobUrl('simulated_audio_memo');
        }
      }, 500);
    }
  };

  const stopVoiceRecording = () => {
    setIsRecordingVoice(false);
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else if (!voiceBlobUrl) {
      setVoiceBlobUrl('simulated_audio_memo');
    }
  };

  const resetVoiceRecording = () => {
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingVoice(false);
    setVoiceDuration(0);
    setVoiceBlobUrl(null);
    setIsPlayingVoice(false);
  };

  const handleSendVoiceMessage = async () => {
    const contact = contacts.find((c) => c.id === selectedContactId);
    if (!contact) return;

    try {
      await saveMessageOffline({
        id: generateId(),
        sender: 'Estimator',
        recipient: `${contact.name} (${contact.role})`,
        text: `[VOICE MEMO - ${voiceDuration}s]: Transmitted site audio dispatch to ${contact.name}`,
        timestamp: Date.now(),
        syncStatus: 'pending',
        type: 'voice',
        voiceDurationSec: voiceDuration || 8,
      });

      setMessageSuccess(`Voice memo (${voiceDuration}s) sent to ${contact.name}!`);
      resetVoiceRecording();
      setActiveAction(null);
    } catch (err) {
      console.error('Failed to send voice memo:', err);
    }
  };

  // 3. Initiate Video Feed / Conference
  const handleInitiateVideo = (contact: SiteContact) => {
    onStartVideoCall(contact);
    onClose();
  };

  const formatSecs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-40 flex bg-black/60 backdrop-blur-sm font-sans justify-end sm:justify-start">
        {/* Semi-transparent dark backdrop blur panel */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`w-full ${
            isPinned ? 'max-w-xl sm:max-w-2xl' : 'max-w-md'
          } bg-slate-900/95 backdrop-blur-md border-r border-slate-800/80 h-full flex flex-col shadow-2xl overflow-hidden text-white transition-all duration-300`}
        >
          {/* Prominent Agent Workflows / Launch Agentic UI Trigger Bar */}
          <div className="px-3 py-1.5 bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-slate-900 border-b border-purple-500/20 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold tracking-wider text-purple-200 uppercase">Agent Systems</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAgenticUiOpen(!isAgenticUiOpen)}
              className="px-2.5 py-1 text-[9px] font-bold tracking-wider text-white uppercase rounded bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-400/30 shadow flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
              <span>Launch Agentic UI</span>
            </button>
          </div>

          {/* Agentic UI Control Center Panel */}
          {isAgenticUiOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-slate-950/80 border-b border-purple-500/30 overflow-hidden shrink-0"
            >
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-purple-300">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Agent Operations Desk</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAgenticUiOpen(false)}
                    className="text-[9px] font-mono text-slate-400 hover:text-white"
                  >
                    [Close HUD]
                  </button>
                </div>

                {runningAgentWorkflow ? (
                  /* Running Workflow Live Output Terminal */
                  <div className="p-2 bg-slate-950 border border-purple-500/20 rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between text-[9px] font-mono text-purple-400">
                      <span>Agent Running: {runningAgentWorkflow === 'dispatcher' ? 'Crew Dispatcher' : runningAgentWorkflow === 'formulator' ? 'Formulation Calibrator' : 'Proposal Architect'}</span>
                      <span className="animate-pulse">{agentProgress}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full transition-all duration-300" style={{ width: `${agentProgress}%` }} />
                    </div>
                    {/* Log Terminal Window */}
                    <div className="h-20 overflow-y-auto font-mono text-[9px] text-slate-300 space-y-1 bg-black/40 p-1.5 rounded border border-slate-900/50">
                      {agentLogs.map((log, index) => (
                        <div key={index} className="leading-tight">{log}</div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Standard Workflows list */
                  <div className="grid grid-cols-1 gap-1.5">
                    <div className="p-2 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between gap-2 transition-all">
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono font-bold text-slate-200">Autonomous Crew Dispatcher</div>
                        <div className="text-[8px] text-slate-400 truncate">Scrapes weather metrics and auto-briefs crew</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => runAgenticWorkflow('dispatcher')}
                        className="py-1 px-1.5 text-[8px] font-bold font-mono uppercase bg-purple-600 hover:bg-purple-500 text-white rounded border border-purple-400/20 shrink-0"
                      >
                        Run Agent
                      </button>
                    </div>

                    <div className="p-2 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between gap-2 transition-all">
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono font-bold text-slate-200">Formulation Calibration Agent</div>
                        <div className="text-[8px] text-slate-400 truncate">Calibrates Delta-E & gravimetric values</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => runAgenticWorkflow('formulator')}
                        className="py-1 px-1.5 text-[8px] font-bold font-mono uppercase bg-purple-600 hover:bg-purple-500 text-white rounded border border-purple-400/20 shrink-0"
                      >
                        Calibrate
                      </button>
                    </div>

                    <div className="p-2 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between gap-2 transition-all">
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono font-bold text-slate-200">Client Proposal Architect</div>
                        <div className="text-[8px] text-slate-400 truncate">Builds SSPC-SP13 compliant quotations</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => runAgenticWorkflow('proposal')}
                        className="py-1 px-1.5 text-[8px] font-bold font-mono uppercase bg-purple-600 hover:bg-purple-500 text-white rounded border border-purple-400/20 shrink-0"
                      >
                        Draft Quotes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          
          {/* Drawer Header with Collapse Toggle */}
          <div className="p-3 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-sm shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-[11px] font-bold text-white uppercase font-mono tracking-wider truncate">
                    Site Contacts & Crew
                  </h2>
                  <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                    ● 4 On
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 truncate">Long-press card for workflow menu</p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Collapse/Fold contacts list Toggle button */}
              <button
                type="button"
                onClick={() => setIsListCollapsed(!isListCollapsed)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
                title={isListCollapsed ? "Expand Contacts List" : "Collapse Contacts List"}
              >
                <ChevronDown className={`w-3.5 h-3.5 text-indigo-400 transition-transform duration-200 ${isListCollapsed ? 'rotate-180' : ''}`} />
              </button>

              {/* Pin & Expand Drawer Button */}
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setIsPinned(!isPinned);
                }}
                className={`p-1 rounded border transition-colors ${
                  isPinned
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                }`}
                title={isPinned ? 'Unpin / Normal Drawer Width' : 'Pin & Expand Contacts Drawer'}
              >
                {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onMinimize) onMinimize();
                  else onClose();
                }}
                className="p-1 rounded bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 hover:text-white border border-indigo-500/40 transition-colors"
                title="Minimize to Floating Tiny Icon"
              >
                <Minimize2 className="w-3.5 h-3.5 text-indigo-400" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Collapsible Section Area */}
          {isListCollapsed ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-xs text-slate-400 bg-slate-900/20 select-none p-6">
              <Users className="w-8 h-8 text-indigo-400 mb-2 opacity-50 animate-pulse" />
              <span className="font-mono text-slate-300">Crew list folded</span>
              <p className="text-[10px] text-slate-500 mt-1 max-w-[200px]">Minimize spatial footprint active. Expand list to communicate.</p>
              <button
                type="button"
                onClick={() => setIsListCollapsed(false)}
                className="mt-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[10px] font-mono uppercase font-bold"
              >
                Expand Contacts List
              </button>
            </div>
          ) : (
            <>
              {/* Quick Instructions Badge */}
              <div className="px-3 py-1.5 bg-indigo-950/30 border-b border-indigo-900/30 flex items-center justify-between text-[10px] font-mono text-indigo-300 shrink-0 select-none">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span><strong>Long-press</strong> row to trigger autonomous dispatches</span>
                </span>
                <span className="text-[9px] text-indigo-400">500ms</span>
              </div>

              {/* Success Toast Banner */}
              <AnimatePresence>
                {messageSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -16, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{
                      opacity: 0,
                      y: -10,
                      scale: 0.92,
                      transition: { duration: 0.22, ease: 'easeInOut' },
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 420,
                      damping: 18,
                      mass: 0.8,
                    }}
                    onClick={() => {
                      playClickSound();
                      setMessageSuccess(null);
                    }}
                    className="p-2.5 bg-emerald-950/95 border-b border-emerald-500/60 text-xs text-emerald-200 flex items-center justify-between gap-2 font-mono shrink-0 cursor-pointer select-none transition-transform active:scale-[0.99] hover:bg-emerald-900/90 shadow-md"
                    title="Tap notification to dismiss"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{messageSuccess}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[9px] text-emerald-300 font-bold uppercase hidden sm:inline bg-emerald-900/80 px-1.5 py-0.5 rounded border border-emerald-500/40">
                        Tap to dismiss
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playClickSound();
                          setMessageSuccess(null);
                        }}
                        className="p-1 text-emerald-400 hover:text-white rounded hover:bg-emerald-800/60 transition-colors"
                        title="Dismiss"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Search Toolbar with Minimized Height */}
              <div className="p-2.5 bg-slate-900/40 border-b border-slate-800/80 shrink-0">
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Engineer, Painter, Manager..."
                    className="w-full pl-7 pr-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Scrollable Dense List of Contacts */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0 select-none">
                {filteredContacts.map((contact) => {
                  const isSelected = selectedContactId === contact.id;

                  return (
                    <div
                      key={contact.id}
                      onClick={(e) => {
                        e.preventDefault();
                        handleSelectContact(contact);
                        handleOpenSubMenu(contact);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        handleOpenSubMenu(contact);
                      }}
                      className={`relative rounded-xl border transition-all duration-150 overflow-hidden cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 border-indigo-500/70 shadow-lg shadow-indigo-950/40'
                          : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      {/* Contact Card Row */}
                      <div
                        className="w-full p-2 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {/* Mini Contact Avatar */}
                          <div className="relative shrink-0">
                            <div
                              className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${contact.avatarBg} flex items-center justify-center text-white font-bold font-mono text-[10px] shadow-md transition-transform`}
                            >
                              {contact.initials}
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-slate-900" />
                          </div>

                          {/* Captions & Role Description */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-[11px] font-bold text-white font-mono truncate">{contact.name}</span>
                              <span
                                className={`text-[8px] font-mono px-1 py-0.2 rounded font-semibold shrink-0 ${
                                  contact.role === 'Engineer'
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                    : contact.role === 'Painter'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : contact.role === 'Manager'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {contact.role}
                              </span>
                            </div>

                            <p className="text-[10px] text-indigo-300 truncate font-mono mt-0.5">
                              {contact.roleCaption}
                            </p>
                          </div>
                        </div>

                        {/* Direct Row Quick Actions */}
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectContact(contact);
                              setActiveAction(activeAction === 'message' && isSelected ? null : 'message');
                            }}
                            title="Quick Message"
                            className={`p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all ${
                              isSelected && activeAction === 'message' ? 'bg-indigo-600 text-white border-indigo-400' : ''
                            }`}
                          >
                            <MessageSquare className="w-3 h-3 text-indigo-400" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              handleSelectContact(contact);
                              setActiveAction(activeAction === 'voice' && isSelected ? null : 'voice');
                            }}
                            title="Voice Call / Memo"
                            className={`p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all ${
                              isSelected && activeAction === 'voice' ? 'bg-purple-600 text-white border-purple-400' : ''
                            }`}
                          >
                            <Mic className="w-3 h-3 text-purple-400" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleInitiateVideo(contact)}
                            title="Video Feed Call"
                            className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/30 transition-all"
                          >
                            <Video className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleOpenSubMenu(contact, e)}
                            title="Sub-Menu Actions"
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/80 transition-all"
                          >
                            <MoreVertical className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded quick form panel */}
                      {isSelected && (
                        <div className="px-2 pb-2.5 pt-1 border-t border-slate-800/60 bg-slate-950/70 space-y-2 animate-in fade-in duration-100">
                          {/* Quick sub-menu strip indicator */}
                          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate max-w-[240px]">{contact.siteLocation}</span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleOpenSubMenu(contact, e)}
                              className="text-indigo-400 hover:underline"
                            >
                              Show Sub-Menu Actions ›
                            </button>
                          </div>

                          {/* ACTION PANEL 1: MESSAGE FORM */}
                          {activeAction === 'message' && (
                            <form onSubmit={handleSendMessage} className="space-y-1 pt-1" onClick={(e) => e.stopPropagation()}>
                              <div className="text-[9px] font-mono uppercase text-slate-400 flex items-center justify-between">
                                <span>Dispatch Direct Note to {contact.name}</span>
                                <span className="text-indigo-400 font-bold">Comms Hub Sync</span>
                              </div>
                              <div className="flex gap-1">
                                <input
                                  type="text"
                                  value={messageText}
                                  onChange={(e) => setMessageText(e.target.value)}
                                  placeholder={`Type message to ${contact.name}...`}
                                  className="flex-1 px-2.5 py-1 bg-slate-900 border border-slate-850 rounded-md text-[10px] font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                                  autoFocus
                                />
                                <button
                                  type="submit"
                                  disabled={!messageText.trim() || isSendingMessage}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-[10px] font-mono font-bold uppercase disabled:opacity-50 transition-colors flex items-center gap-0.5 shrink-0"
                                >
                                  <Send className="w-3 h-3" />
                                </button>
                              </div>
                            </form>
                          )}

                          {/* ACTION PANEL 2: VOICE MESSAGE RECORDER */}
                          {activeAction === 'voice' && (
                            <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg space-y-2 pt-1" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-between text-[9px] font-mono uppercase text-slate-400">
                                <span>Voice Dispatch Memo</span>
                                <span className="text-purple-400 font-bold">
                                  {isRecordingVoice ? (
                                    <span className="flex items-center gap-0.5 text-rose-400 animate-pulse">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                      Recording ({formatSecs(voiceDuration)})
                                    </span>
                                  ) : voiceBlobUrl ? (
                                    'Ready to Send'
                                  ) : (
                                    'Ready to Record'
                                  )}
                                </span>
                              </div>

                              {/* Visual Waveform */}
                              <div className="h-7 bg-slate-950 rounded-md flex items-center justify-center gap-1 px-2 border border-slate-800/80">
                                {voiceWaveform.map((height, i) => (
                                  <span
                                    key={i}
                                    className={`w-1 rounded-full transition-all duration-150 ${
                                      isRecordingVoice ? 'bg-rose-500' : voiceBlobUrl ? 'bg-purple-400' : 'bg-slate-700'
                                    }`}
                                    style={{ height: `${isRecordingVoice ? height * 0.6 : 8}px` }}
                                  />
                                ))}
                              </div>

                              {/* Voice Controls */}
                              <div className="flex items-center justify-between gap-1.5">
                                {!isRecordingVoice && !voiceBlobUrl && (
                                  <button
                                    type="button"
                                    onClick={startVoiceRecording}
                                    className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                                  >
                                    <Mic className="w-3 h-3" />
                                    <span>Record Voice Memo</span>
                                  </button>
                                )}

                                {isRecordingVoice && (
                                  <button
                                    type="button"
                                    onClick={stopVoiceRecording}
                                    className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors animate-pulse"
                                  >
                                    <Square className="w-3 h-3" />
                                    <span>Stop Recording</span>
                                  </button>
                                )}

                                {voiceBlobUrl && (
                                  <div className="flex items-center gap-1 w-full">
                                    <button
                                      type="button"
                                      onClick={() => setIsPlayingVoice(!isPlayingVoice)}
                                      className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-lg text-[10px] font-mono flex items-center gap-0.5 transition-colors"
                                    >
                                      <Play className="w-3 h-3" />
                                      <span>Preview</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={handleSendVoiceMessage}
                                      className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors shadow-md"
                                    >
                                      <Send className="w-3 h-3" />
                                      <span>Transmit Memo</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={resetVoiceRecording}
                                      title="Discard Memo"
                                      className="p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Specialty details */}
                          <div className="p-1.5 bg-slate-900/60 rounded border border-slate-850 text-[9px] font-mono text-slate-400 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Specialty:</span>
                              <span className="text-slate-200 font-semibold truncate max-w-[200px]">{contact.specialty}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Phone:</span>
                              <span className="text-slate-200">{contact.phone}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Footer info */}
          <div className="p-2.5 bg-slate-900 border-t border-slate-800 text-[9px] font-mono text-slate-500 flex items-center justify-between select-none">
            <span className="flex items-center gap-1">
              <Radio className="w-3 h-3 text-indigo-400" />
              <span>Full Duplex Comms Mesh</span>
            </span>
            <span className="text-emerald-400">Right-click/Hold for Sub-Menu</span>
          </div>
        </motion.div>

        {/* 1. Master Long-Press Sub-Menu Modal */}
        <ContactSubMenuModal
          isOpen={!!subMenuContact}
          contact={subMenuContact}
          project={activeProject}
          onClose={() => setSubMenuContact(null)}
          onSelectOption={handleSubMenuOptionSelect}
        />

        {/* 2. Sub-Menu Option #1: Send Materials Listings (Autonomous Market Agent) */}
        {materialsModalContact && (
          <SendMaterialsListingModal
            isOpen={!!materialsModalContact}
            contact={materialsModalContact}
            project={activeProject}
            onClose={() => setMaterialsModalContact(null)}
          />
        )}

        {/* 3. Sub-Menu Option #2: Export Project Source File */}
        {exportModalContact && (
          <ExportProjectModal
            isOpen={!!exportModalContact}
            contact={exportModalContact}
            project={activeProject}
            onClose={() => setExportModalContact(null)}
          />
        )}

        {/* 4. Sub-Menu Option #3: Send Draft Quotation (Editable HUD) */}
        {draftQuoteModalContact && (
          <SendDraftQuotationModal
            isOpen={!!draftQuoteModalContact}
            contact={draftQuoteModalContact}
            project={activeProject}
            onClose={() => setDraftQuoteModalContact(null)}
          />
        )}

        {/* 5. Sub-Menu Option #4: Send Final Quotation (Full PDF Document) */}
        {finalQuoteModalContact && (
          <SendFinalQuotationModal
            isOpen={!!finalQuoteModalContact}
            contact={finalQuoteModalContact}
            project={activeProject}
            onClose={() => setFinalQuoteModalContact(null)}
          />
        )}
      </div>
    </AnimatePresence>
  );
}
