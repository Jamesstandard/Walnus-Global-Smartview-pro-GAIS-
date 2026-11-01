import React, { useState, useEffect } from 'react';
import { EstimatorApp } from './components/EstimatorApp';
import { MixerApp } from './components/MixerApp';
import { ChatSystem } from './components/ChatSystem';
import { SyncManager } from './components/SyncManager';
import { AdvancedSettingsPanel } from './components/AdvancedSettingsPanel';
import { GoogleWorkspacePanel } from './components/GoogleWorkspacePanel';
import { ContactsDrawer } from './components/ContactsDrawer';
import { VideoConferenceModal } from './components/VideoConferenceModal';
import { AICopilotDrawer } from './components/AICopilotDrawer';
import { StakeholderExportModal } from './components/StakeholderExportModal';
import { FileManagementMenu } from './components/FileManagementMenu';
import { FloatingMinimizedPanels } from './components/FloatingMinimizedPanels';
import { SiteContact } from './types';
import { Layers, Beaker, Wrench, HardDrive, Users, Bot, Sparkles, Share2, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getStoredThemeSettings, applyThemeSettings } from './lib/themeEngine';
import { playClickSound, playTabSound } from './lib/soundUtils';
import { ToastNotificationCenter } from './components/ToastNotificationCenter';
import { checkDeviceLocationAndCalibrate } from './lib/locationCalibrationService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'estimator' | 'mixer'>('estimator');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [activeVideoContact, setActiveVideoContact] = useState<SiteContact | null>(null);

  // Notify floating buttons stack of visibility obstruction in App
  useEffect(() => {
    const obstructed = isCopilotOpen || isSettingsOpen || isWorkspaceOpen || isContactsOpen || isPublishOpen || !!activeVideoContact;
    if (obstructed) {
      window.dispatchEvent(new CustomEvent('paint_sync_panels_obstructed', { detail: { obstructed: true } }));
    }
  }, [isCopilotOpen, isSettingsOpen, isWorkspaceOpen, isContactsOpen, isPublishOpen, activeVideoContact]);

  // Minimized Floating Panels Set - Starts clean; panels can be minimized dynamically
  const [minimizedPanels, setMinimizedPanels] = useState<Set<string>>(
    () => new Set([])
  );

  const handleMinimizePanel = (id: string) => {
    setMinimizedPanels((prev) => new Set(prev).add(id));
    if (id === 'copilot') setIsCopilotOpen(false);
    if (id === 'settings') setIsSettingsOpen(false);
    if (id === 'workspace') setIsWorkspaceOpen(false);
    if (id === 'contacts') setIsContactsOpen(false);
    if (id === 'publish') setIsPublishOpen(false);
  };

  const handleRestorePanel = (id: string) => {
    setMinimizedPanels((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (id === 'copilot') setIsCopilotOpen(true);
    if (id === 'settings') setIsSettingsOpen(true);
    if (id === 'workspace') setIsWorkspaceOpen(true);
    if (id === 'contacts') setIsContactsOpen(true);
    if (id === 'publish') setIsPublishOpen(true);
    if (id === 'weather') {
      setActiveTab('estimator');
      window.dispatchEvent(new CustomEvent('paint_sync_navigate_page', { detail: { page: 'WEATHER' } }));
    }
    if (id === 'photogrammetric_overlay') {
      setActiveTab('estimator');
      window.dispatchEvent(new CustomEvent('paint_sync_navigate_page', { detail: { page: '3D_RECONSTRUCT' } }));
    }
    if (id === 'project_mode') {
      setActiveTab('estimator');
      window.dispatchEvent(new CustomEvent('paint_sync_navigate_page', { detail: { page: 'PROJECT_MODE' } }));
    }
    if (id === 'site_payload' || id === 'paint_spec') {
      setActiveTab('estimator');
      window.dispatchEvent(new CustomEvent('paint_sync_navigate_page', { detail: { page: 'PAINT_SPEC' } }));
    }
  };

  const handleDismissPanel = (id: string) => {
    setMinimizedPanels((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Reset entire application to default (clears draft and resets all values to empty/null/default)
  const handleResetToDefault = () => {
    localStorage.removeItem('siteview_estimator_input_draft_v1');
    localStorage.removeItem('factory_mixer_queue_order_v1');
    localStorage.removeItem('factory_mixer_raw_materials_inventory_v1');
    localStorage.removeItem('factory_mixer_dismissed_alerts_v1');
    localStorage.removeItem('paint_sync_video_settings');
    localStorage.removeItem('siteview_saved_projects_v1');
    localStorage.removeItem('paint_sync_localization_v1');
    
    setMinimizedPanels(new Set(['weather', 'project_mode', 'photogrammetric_overlay', 'chat', 'paint_spec', 'site_payload']));
    setIsCopilotOpen(false);
    setIsSettingsOpen(false);
    setIsWorkspaceOpen(false);
    setIsContactsOpen(false);
    setIsPublishOpen(false);
    window.location.reload();
  };

  // Initialize theme engine on app load
  useEffect(() => {
    const settings = getStoredThemeSettings();
    applyThemeSettings(settings);

    const handleThemeUpdate = (e: any) => {
      if (e.detail) {
        applyThemeSettings(e.detail);
      }
    };
    window.addEventListener('paint_sync_theme_updated', handleThemeUpdate);
    return () => window.removeEventListener('paint_sync_theme_updated', handleThemeUpdate);
  }, []);

  // Global event listener for opening AI Co-Pilot from any sub-component or shortcut
  useEffect(() => {
    const handleToggle = () => setIsCopilotOpen((prev) => !prev);
    const handleOpenAgents = () => setIsCopilotOpen(true);
    window.addEventListener('paint_sync_toggle_copilot', handleToggle);
    window.addEventListener('paint_sync_open_agent_manager', handleOpenAgents);
    return () => {
      window.removeEventListener('paint_sync_toggle_copilot', handleToggle);
      window.removeEventListener('paint_sync_open_agent_manager', handleOpenAgents);
    };
  }, []);

  const handleStartVideoCall = (contact: SiteContact) => {
    playClickSound();
    setActiveVideoContact(contact);
  };

  const handleTabChange = (tab: 'estimator' | 'mixer') => {
    playTabSound();
    setActiveTab(tab);
  };

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans hardware-accelerated select-none">
      {/* App Switcher & Systems Navigation Bar - Stacked Two-Tier Floating Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 flex flex-col shadow-lg select-none">
        {/* Tier 1: App Identity & Primary Switcher (Walnus Pro & Estimator/Mixer) */}
        <div className="h-10 px-2 sm:px-3 border-b border-slate-800/50 flex items-center justify-between gap-2 text-xs">
          {/* Top Left: Logo & Company Title */}
          <div className="flex items-center gap-2 shrink-0">
            <img 
              src="/assets/aistudio/logo_63e7b5b3.webp" 
              alt="Walnus Logo" 
              className="w-7 h-7 object-cover rounded-full border border-amber-500/50 shadow-sm"
            />
            <div className="flex flex-col">
              <span className="text-[11px] font-black tracking-wider text-amber-400 uppercase leading-none">
                Walnus SmartView Pro
              </span>
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight">
                Global Ventures • SmartCoat™
              </span>
            </div>
          </div>

          {/* Top Right: Estimator & Mixer Tab Switcher */}
          <nav className="flex bg-slate-900/90 p-1 rounded-lg gap-1 border border-slate-800 shrink-0 ml-auto">
            <button 
              id="tab-estimator-btn"
              type="button"
              onClick={() => handleTabChange('estimator')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'estimator' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>Estimator</span>
            </button>
            <button 
              id="tab-mixer-btn"
              type="button"
              onClick={() => handleTabChange('mixer')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'mixer' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Beaker className="w-3.5 h-3.5 shrink-0" />
              <span>Mixer</span>
            </button>
          </nav>
        </div>

        {/* Tier 2: System Controls & Tool Actions (Icon-Only Copilot, Integration & Agents) */}
        <div className="h-9 px-2 sm:px-3 flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar text-xs bg-slate-950/80">
          {/* Left-Justified Icon Buttons Group */}
          <div className="flex items-center gap-1.5 shrink-0 justify-start">
            {/* 1. AI Co-Pilot Button (Icon Only) */}
            <button
              id="ai-copilot-toggle-btn"
              type="button"
              onClick={() => {
                playClickSound();
                setIsCopilotOpen((prev) => !prev);
              }}
              title="AI Co-Pilot (Cmd+K)"
              className={`w-7 h-7 sm:w-8 sm:h-8 p-1 rounded-lg border transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                isCopilotOpen
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                  : 'bg-purple-950/80 hover:bg-purple-900 text-purple-300 border-purple-800/60'
              }`}
            >
              <Bot className="w-4 h-4 text-purple-300 shrink-0" />
            </button>

            {/* 2. Integration (Google Workspace & External Services) Button (Icon Only) */}
            <button
              id="google-workspace-btn"
              type="button"
              onClick={() => {
                playClickSound();
                setIsWorkspaceOpen(true);
              }}
              title="Google Workspace & System Integrations"
              className="w-7 h-7 sm:w-8 sm:h-8 p-1 rounded-lg bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-800/60 transition-all flex items-center justify-center shrink-0 cursor-pointer"
            >
              <HardDrive className="w-4 h-4 text-blue-400 shrink-0" />
            </button>

            {/* 3. Field Agents & Contacts Button (Icon Only) */}
            <button
              id="contacts-drawer-toggle-btn"
              type="button"
              onClick={() => {
                playClickSound();
                setIsContactsOpen(!isContactsOpen);
              }}
              title="Field Site Agents & Video Calls"
              className={`w-7 h-7 sm:w-8 sm:h-8 p-1 rounded-lg border transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                isContactsOpen
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-400 shrink-0" />
            </button>
          </div>

          {/* Right Side: Sync & Advanced Settings */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            <SyncManager />

            {/* Settings Spanner Icon */}
            <button
              id="advanced-settings-toggle-btn"
              type="button"
              onClick={() => {
                playClickSound();
                setIsSettingsOpen(true);
              }}
              title="Settings & Diagnostics Console"
              className="w-7 h-7 sm:w-8 sm:h-8 p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Wrench className="w-4 h-4 text-slate-300 shrink-0" />
            </button>

            {/* File Management Hamburger Menu */}
            <FileManagementMenu
              onOpenStakeholderPublish={() => setIsPublishOpen(true)}
              onStartVideoCall={handleStartVideoCall}
            />

            {/* Stakeholder Export Icon */}
            <button
              id="publish-stakeholder-export-btn"
              type="button"
              onClick={() => {
                playClickSound();
                setIsPublishOpen(true);
              }}
              title="Publish Stakeholder Export"
              className="w-7 h-7 sm:w-8 sm:h-8 p-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/60 transition-all flex items-center justify-center shrink-0"
            >
              <Share2 className="w-4 h-4 text-indigo-300 shrink-0" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Full-Bleed Viewport Container (Positioned 10px below 76px header) */}
      <main className="fixed top-[86px] inset-x-0 bottom-0 z-0 overflow-hidden bg-slate-950 hardware-accelerated">
        <AnimatePresence mode="wait">
          {activeTab === 'estimator' ? (
            <motion.div
              key="estimator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full h-full relative inset-0"
            >
              <EstimatorApp
                isCopilotOpen={isCopilotOpen}
                setIsCopilotOpen={setIsCopilotOpen}
                onOpenWorkspace={() => setIsWorkspaceOpen(true)}
                minimizedPanels={minimizedPanels}
                onMinimizePanel={handleMinimizePanel}
                onRestorePanel={handleRestorePanel}
              />
            </motion.div>
          ) : (
            <motion.div
              key="mixer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full h-full overflow-y-auto"
            >
              <MixerApp onOpenWorkspace={() => setIsWorkspaceOpen(true)} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Persistent Field Chat System */}
      {!minimizedPanels.has('chat') && (
        <ChatSystem onMinimize={() => handleMinimizePanel('chat')} />
      )}

      {/* AI Co-Pilot Drawer */}
      <AICopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onMinimize={() => handleMinimizePanel('copilot')}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setIsCopilotOpen(false);
        }}
        onOpenWorkspace={() => {
          setIsCopilotOpen(false);
          setIsWorkspaceOpen(true);
        }}
        onOpenSettings={() => {
          setIsCopilotOpen(false);
          setIsSettingsOpen(true);
        }}
        onOpenContacts={() => {
          setIsCopilotOpen(false);
          setIsContactsOpen(true);
        }}
        onOpenInventory={() => {
          setActiveTab('mixer');
          setIsCopilotOpen(false);
        }}
        onOpenQuotation={() => {
          setIsCopilotOpen(false);
          setIsWorkspaceOpen(true);
        }}
        onOpenPublish={() => {
          setIsCopilotOpen(false);
          setIsPublishOpen(true);
        }}
      />

      {/* Interactive Stakeholder 3D Export Portal */}
      <StakeholderExportModal
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        onMinimize={() => handleMinimizePanel('publish')}
      />

      {/* Contacts Drawer */}
      <ContactsDrawer
        isOpen={isContactsOpen}
        onClose={() => setIsContactsOpen(false)}
        onMinimize={() => handleMinimizePanel('contacts')}
        onStartVideoCall={handleStartVideoCall}
      />

      {/* Full-Duplex Video Conferencing Modal */}
      <VideoConferenceModal
        isOpen={!!activeVideoContact}
        contact={activeVideoContact}
        onClose={() => setActiveVideoContact(null)}
        onOpenSettings={() => {
          setActiveVideoContact(null);
          setIsSettingsOpen(true);
        }}
      />

      {/* Google Workspace Modal */}
      <GoogleWorkspacePanel
        isOpen={isWorkspaceOpen}
        onClose={() => setIsWorkspaceOpen(false)}
        onMinimize={() => handleMinimizePanel('workspace')}
      />

      {/* Advanced Settings Modal */}
      <AdvancedSettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onMinimize={() => handleMinimizePanel('settings')}
      />

      {/* Draggable Minimized Panels Floating Dock */}
      <FloatingMinimizedPanels
        minimizedPanels={minimizedPanels}
        onRestore={handleRestorePanel}
        onDismiss={handleDismissPanel}
      />

      {/* Global In-App Toast Notification Center */}
      <ToastNotificationCenter />
    </div>
  );
}
