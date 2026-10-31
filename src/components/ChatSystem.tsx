import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, saveMessageOffline } from '../db';
import { generateId } from '../lib/utils';
import { LocalizedRegionalMaterial } from '../types';
import { CommsMarketIntelPanel } from './CommsMarketIntelPanel';
import { SupplierGpsAnimatedMapModal } from './SupplierGpsAnimatedMapModal';
import {
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  Radio,
  Activity,
  ShieldCheck,
  Bot,
  Compass,
  Sparkles,
  MapPin,
  Truck,
  CheckCircle2,
  TrendingDown,
  Minimize2,
  X,
  Pin,
  PinOff,
  Layers,
  Beaker,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatSystemProps {
  onMinimize?: () => void;
  onClose?: () => void;
}

export function ChatSystem({ onMinimize, onClose }: ChatSystemProps = {}) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isPinned, setIsPinned] = useState(false);
  const [activeHudView, setActiveHudView] = useState<'chat' | 'market' | 'telemetry'>('chat');
  const [text, setText] = useState('');
  const [currentUser, setCurrentUser] = useState<'Estimator' | 'Mixer'>('Estimator');
  const [selectedMapMaterial, setSelectedMapMaterial] = useState<LocalizedRegionalMaterial | null>(null);

  React.useEffect(() => {
    const handleActiveCostClicked = () => {
      setIsCollapsed(false);
      setActiveHudView('market');
    };
    window.addEventListener('paint_sync_active_spec_cost_clicked', handleActiveCostClicked);
    return () => window.removeEventListener('paint_sync_active_spec_cost_clicked', handleActiveCostClicked);
  }, []);

  const messages = useLiveQuery(() => db.messages.orderBy('timestamp').toArray()) || [];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    await saveMessageOffline({
      id: generateId(),
      sender: currentUser,
      text: text.trim(),
      timestamp: Date.now(),
      syncStatus: 'pending',
    });
    setText('');
  };

  const handleToggleMarketView = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setActiveHudView('market');
    } else if (activeHudView === 'market') {
      setActiveHudView('chat');
    } else {
      setActiveHudView('market');
    }
  };

  const handleToggleTelemetryView = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setActiveHudView('telemetry');
    } else if (activeHudView === 'telemetry') {
      setActiveHudView('chat');
    } else {
      setActiveHudView('telemetry');
    }
  };

  return (
    <footer
      className={`bg-slate-950 font-sans transition-all duration-300 font-sans ${
        isPinned
          ? 'fixed inset-x-0 bottom-0 top-[44px] h-[calc(100vh-44px)] z-40 flex flex-col shadow-2xl border-t-2 border-indigo-500'
          : 'border-t border-slate-800 flex flex-col shrink-0 w-full z-20 relative'
      }`}
    >
      
      {/* Top Header Bar along the Comms HUD */}
      <div className="h-10 px-2.5 sm:px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
        
        {/* Left: Role Switchers & Quick Channel Identifier */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-1 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">
              Comms HUD
            </span>
          </div>

          {/* Role selector - Compact Icon Buttons to Fit Row cleanly */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setCurrentUser('Estimator')}
              title="Role: Site Estimator"
              className={`p-1 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono uppercase tracking-tight transition-colors flex items-center gap-1 ${
                currentUser === 'Estimator'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">Estimator</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentUser('Mixer')}
              title="Role: Factory Mixer"
              className={`p-1 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono uppercase tracking-tight transition-colors flex items-center gap-1 ${
                currentUser === 'Mixer'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Beaker className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">Mixer</span>
            </button>
          </div>

          {/* HUD View Pill Switcher (Messages vs Market Intel) */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800 shrink-0 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => {
                setIsCollapsed(false);
                setActiveHudView('chat');
              }}
              className={`px-2 py-0.5 rounded transition-colors ${
                !isCollapsed && activeHudView === 'chat'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Stream
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCollapsed(false);
                setActiveHudView('market');
              }}
              className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                !isCollapsed && activeHudView === 'market'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-amber-400/90 hover:text-amber-300'
              }`}
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span>Market</span>
            </button>
          </div>
        </div>

        {/* Right: Telemetry + [Market] Button + Collapse / Expand Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Telemetry Button */}
          <button
            type="button"
            onClick={handleToggleTelemetryView}
            title="Toggle System Telemetry"
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
              !isCollapsed && activeHudView === 'telemetry'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span className="hidden xs:inline">Telemetry</span>
          </button>

          {/* REQUESTED BUTTON: Next to Telemetry -> [Market] Button */}
          <button
            type="button"
            id="comms-hud-market-btn"
            onClick={handleToggleMarketView}
            title="Autonomous Localized Market Intelligence & Supplier Sourcing (Paint, Plaster, Wall Screening)"
            className={`group flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border transition-all shadow-sm ${
              !isCollapsed && activeHudView === 'market'
                ? 'bg-amber-600 text-white border-amber-500 shadow-amber-600/30 ring-1 ring-amber-400'
                : 'bg-gradient-to-r from-amber-950/70 to-slate-900 hover:from-amber-900/60 hover:to-slate-800 text-amber-300 border-amber-500/50 hover:border-amber-400'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>[Market]</span>
            <span className="hidden sm:inline text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded border border-amber-400/30">
              Paint • Plaster • Wall Screening
            </span>
          </button>

          <span className="hidden lg:inline text-[10px] text-emerald-400 font-mono">
            ● 2 Roles Online
          </span>

          {/* Pin & Expand Button */}
          <button
            type="button"
            onClick={() => {
              const nextPinned = !isPinned;
              setIsPinned(nextPinned);
              if (nextPinned) setIsCollapsed(false);
            }}
            title={isPinned ? 'Unpin / Normal Height' : 'Pin & Expand Chat HUD to Top'}
            className={`p-1 rounded border transition-colors ${
              isPinned
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
            }`}
          >
            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </button>

          {/* Minimize to Floating Hovering Button */}
          {onMinimize && (
            <button
              type="button"
              onClick={onMinimize}
              title="Minimize Field Chat Panel"
              className="p-1 rounded bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 hover:text-white border border-indigo-500/40 transition-colors"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Close Panel */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close Field Chat Panel"
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Collapse / Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Communication Hub' : 'Fold Communication Hub'}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors ml-0.5"
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Body of the Comms HUD */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: activeHudView === 'market' ? 320 : activeHudView === 'telemetry' ? 240 : 180,
              opacity: 1,
            }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col md:flex-row w-full overflow-hidden"
          >
            
            {/* VIEW 1: MARKET INTELLIGENCE & SUPPLIER SOURCING PANEL (Active when [Market] button clicked) */}
            {activeHudView === 'market' ? (
              <CommsMarketIntelPanel onOpenGpsMap={(material) => setSelectedMapMaterial(material)} />
            ) : activeHudView === 'telemetry' ? (
              /* VIEW 2: FULL TELEMETRY EXPANDED VIEW */
              <div className="flex-1 p-3 bg-slate-950 flex flex-col justify-between overflow-y-auto space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <Activity className="w-4 h-4" />
                    <span>System Telemetry & Full-Duplex Mesh Health</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveHudView('chat')}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px]"
                  >
                    Back to Stream
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500">API Gateway Latency</div>
                    <div className="text-emerald-400 font-bold">24 ms (Direct P2P)</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500">IndexedDB Persistence</div>
                    <div className="text-emerald-400 font-bold">Replicated (0 Errs)</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500">Autonomous Market Agent</div>
                    <div className="text-amber-400 font-bold">8 Regional Depots Live</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500">GPS Geo-Anchor</div>
                    <div className="text-indigo-400 font-bold">Sector 4 [50.11°N, 8.68°E]</div>
                  </div>
                </div>

                <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Transport Encryption: AES-GCM 256-bit • Full duplex local WebRTC fallback active</span>
                  <span className="text-emerald-400">● 100% Signal Integrity</span>
                </div>
              </div>
            ) : (
              /* VIEW 3: STANDARD CHAT STREAM & INPUT */
              <div className="flex-1 flex flex-col md:flex-row h-full min-w-0 bg-slate-950">
                {/* Messages Stream & Input Form */}
                <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
                  <div className="flex-1 p-2.5 sm:p-3 overflow-y-auto text-[11px] space-y-2 bg-slate-950 flex flex-col font-sans">
                    {messages.length === 0 ? (
                      <div className="text-center py-4 text-slate-500 font-mono text-[10px]">
                        No messages yet. Send a dispatch note to sync specifications between Site Estimator and Factory Mixer.
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div key={msg.id} className="flex items-start gap-2 leading-relaxed">
                          <span
                            className={`font-bold font-mono text-[10px] uppercase tracking-wider shrink-0 w-16 sm:w-20 ${
                              msg.sender === 'Estimator' ? 'text-indigo-400' : 'text-emerald-400'
                            }`}
                          >
                            {msg.sender === 'Estimator' ? 'ON-SITE:' : 'MIXER:'}
                          </span>
                          <span className="text-slate-200 break-words flex-1">{msg.text}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Input Form */}
                  <form
                    onSubmit={handleSend}
                    className="p-2 border-t border-slate-800 flex items-center gap-2 bg-slate-900/60 shrink-0"
                  >
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={`Dispatch note as ${currentUser}...`}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono min-w-0"
                    />
                    <button
                      type="submit"
                      disabled={!text.trim()}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-[11px] font-bold font-mono uppercase rounded-lg disabled:opacity-50 transition-colors flex items-center gap-1 shrink-0"
                    >
                      <Send className="w-3 h-3" />
                      <span className="hidden sm:inline">Send</span>
                    </button>
                  </form>
                </div>

                {/* Right Mini-Telemetry Strip */}
                <div className="hidden md:flex md:w-60 lg:w-68 p-3 bg-slate-900/40 border-l border-slate-800 flex-col justify-between shrink-0">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">
                      <span>System Telemetry</span>
                      <span className="text-emerald-400 font-normal">Online</span>
                    </div>

                    <div className="space-y-1 text-[10px] font-mono">
                      <div className="flex justify-between items-center bg-slate-950/60 px-2 py-1 rounded border border-slate-800/80">
                        <span className="text-slate-400">API Latency</span>
                        <span className="text-emerald-400 font-semibold">24ms</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-950/60 px-2 py-1 rounded border border-slate-800/80">
                        <span className="text-slate-400">Market Agent</span>
                        <span className="text-amber-400 font-semibold">Live Spot Sync</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-950/60 px-2 py-1 rounded border border-slate-800/80">
                        <span className="text-slate-400">GPS Radar</span>
                        <span className="text-indigo-400 font-semibold">Sector 4 Anchor</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setActiveHudView('market')}
                      className="w-full py-1 px-2 rounded bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 text-[10px] font-mono flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-1">
                        <Bot className="w-3 h-3 text-amber-400" />
                        <span>Open Market Intel</span>
                      </span>
                      <span>›</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Animated SVG GPS Map Modal */}
      {selectedMapMaterial && (
        <SupplierGpsAnimatedMapModal
          isOpen={!!selectedMapMaterial}
          selectedMaterial={selectedMapMaterial}
          onClose={() => setSelectedMapMaterial(null)}
          onSelectAnotherMaterial={(mat) => setSelectedMapMaterial(mat)}
        />
      )}
    </footer>
  );
}
