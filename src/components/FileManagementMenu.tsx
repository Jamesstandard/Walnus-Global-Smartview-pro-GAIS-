import { createPortal } from "react-dom";
import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  FolderPlus,
  Save,
  Users,
  FileCheck,
  UserCheck,
  Link,
  ChevronRight,
  Sparkles,
  X,
  FileText,
  HardDrive,
  Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playClickSound } from '../lib/soundUtils';
import { PaintProject, SiteContact } from '../types';
import { NewProjectModal } from './NewProjectModal';
import { SaveAsProjectModal } from './SaveAsProjectModal';
import { ExportTeamProjectModal } from './ExportTeamProjectModal';
import { SearchLinkedContactsModal } from './SearchLinkedContactsModal';
import { LinkContactSettingsModal } from './LinkContactSettingsModal';
import { SoftwareIntegrationsModal } from './SoftwareIntegrationsModal';

interface FileManagementMenuProps {
  currentProject?: PaintProject | null;
  onOpenStakeholderPublish: () => void;
  onStartVideoCall?: (contact: SiteContact) => void;
  onProjectCreated?: (project: PaintProject) => void;
}

export function FileManagementMenu({
  currentProject,
  onOpenStakeholderPublish,
  onStartVideoCall,
  onProjectCreated,
}: FileManagementMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<
    'new_project' | 'save_as' | 'export_team' | 'search_linked' | 'link_settings' | 'software_integrations' | null
  >(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOption = (modal: 'new_project' | 'save_as' | 'export_team' | 'search_linked' | 'link_settings' | 'software_integrations' | 'publish') => {
    playClickSound();
    setIsOpen(false);
    if (modal === 'publish') {
      onOpenStakeholderPublish();
    } else {
      setActiveModal(modal);
    }
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Hamburger Menu Trigger Button */}
      <button
        id="file-management-hamburger-btn"
        type="button"
        onClick={() => {
          console.log('Hamburger clicked, current isOpen:', isOpen);
          playClickSound();
          setIsOpen(!isOpen);
        }}
        title="File Management & Project Tools (New, Save As, Team Export, Quotation, Connect, Link Contact)"
        className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg border font-mono text-[11px] font-bold shadow-sm shrink-0 whitespace-nowrap transition-all ${
          isOpen
            ? 'bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-600/30'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700 hover:border-amber-500/50'
        }`}
      >
        <Menu className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="hidden sm:inline">File</span>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
      </button>

      {/* Hamburger Dropdown Menu Overlay Portalled to Body */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop listener to close when clicking outside */}
              <div
                className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-[1px]"
                onClick={() => setIsOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                transition={{ duration: 0.12 }}
                className="fixed right-2 top-[86px] w-64 bg-slate-900/98 backdrop-blur-xl border border-amber-500/40 rounded-xl shadow-2xl z-[9999] overflow-hidden font-mono text-xs text-slate-100 divide-y divide-slate-800"
              >
                {/* Menu Header */}
                <div className="p-2.5 bg-slate-950/90 flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800">
                  <span className="font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <Menu className="w-3.5 h-3.5" />
                    <span>File Management</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Menu Options Group 1: Project Operations */}
                <div className="p-1 space-y-0.5">
                  {/* 1. New Project */}
                  <button
                    type="button"
                    onClick={() => handleSelectOption('new_project')}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 flex items-center justify-between group transition-colors text-slate-200 hover:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-indigo-600/30 text-indigo-400 flex items-center justify-center shrink-0">
                        <FolderPlus className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold block text-[11px]">New Project</span>
                        <span className="text-[9px] text-slate-400 block">Initialize blank scan & estimate</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  </button>

                  {/* 2. Save As */}
                  <button
                    type="button"
                    onClick={() => handleSelectOption('save_as')}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 flex items-center justify-between group transition-colors text-slate-200 hover:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-cyan-600/30 text-cyan-400 flex items-center justify-center shrink-0">
                        <Save className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold block text-[11px]">Save As...</span>
                        <span className="text-[9px] text-slate-400 block">Clone or export .svproj file</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  </button>
                </div>

                {/* Software Integrations */}
                <div className="p-1 space-y-0.5 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleSelectOption('software_integrations')}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 flex items-center justify-between group transition-colors text-slate-200 hover:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                        <Server className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold block text-[11px]">Software Integrations</span>
                        <span className="text-[9px] text-slate-400 block">Connect ERP, CRM & Accounting</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  </button>
                </div>

                {/* Menu Options Group 2: Publishing & Export */}
                <div className="p-1 space-y-0.5">
                  {/* 3. Export Project: Team */}
                  <button
                    type="button"
                    onClick={() => handleSelectOption('export_team')}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 flex items-center justify-between group transition-colors text-slate-200 hover:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-600/30 text-emerald-400 flex items-center justify-center shrink-0">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold block text-[11px]">Export Project: Team</span>
                        <span className="text-[9px] text-slate-400 block">Internal field engineering bundle</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  </button>

                  {/* 4. Publish Quotation: Stakeholder */}
                  <button
                    type="button"
                    onClick={() => handleSelectOption('publish')}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 flex items-center justify-between group transition-colors text-slate-200 hover:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-sky-600/30 text-sky-400 flex items-center justify-center shrink-0">
                        <FileCheck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold block text-[11px]">Publish Quotation: Stakeholder</span>
                        <span className="text-[9px] text-slate-400 block">3D Viewer, PDF/HTML quote portal</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-sky-400 transition-colors" />
                  </button>
                </div>

                {/* Menu Options Group 3: Contact Interop */}
                <div className="p-1 space-y-0.5">
                  {/* 5. Connect (Search Linked Contacts) */}
                  <button
                    type="button"
                    onClick={() => handleSelectOption('search_linked')}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 flex items-center justify-between group transition-colors text-slate-200 hover:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-blue-600/30 text-blue-400 flex items-center justify-center shrink-0">
                        <UserCheck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold block text-[11px]">Connect</span>
                        <span className="text-[9px] text-slate-400 block">Search App ID, Email or Phone</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors" />
                  </button>

                  {/* 6. Link Contact (Connecting Settings) */}
                  <button
                    type="button"
                    onClick={() => handleSelectOption('link_settings')}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 flex items-center justify-between group transition-colors text-slate-200 hover:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-purple-600/30 text-purple-400 flex items-center justify-center shrink-0">
                        <Link className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold block text-[11px]">Link Contact</span>
                        <span className="text-[9px] text-slate-400 block">Connecting settings & credentials</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-purple-400 transition-colors" />
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Render Modal Dialogs */}
      {typeof document !== 'undefined' && createPortal(
        <>
          {activeModal === 'new_project' && (
            <NewProjectModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              onResetToDefault={() => window.location.reload()}
            />
          )}

          {activeModal === 'save_as' && (
            <SaveAsProjectModal
              isOpen={true}
              project={currentProject}
              onClose={() => setActiveModal(null)}
            />
          )}

          {activeModal === 'export_team' && (
            <ExportTeamProjectModal
              isOpen={true}
              project={currentProject}
              onClose={() => setActiveModal(null)}
            />
          )}

          {activeModal === 'search_linked' && (
            <SearchLinkedContactsModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              onStartVideoCall={onStartVideoCall}
              onOpenLinkModal={() => setActiveModal('link_settings')}
            />
          )}

          {activeModal === 'link_settings' && (
            <LinkContactSettingsModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
            />
          )}
        
          {activeModal === 'software_integrations' && (
            <SoftwareIntegrationsModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
            />
          )}
        </>,
        document.body

      )}
    </div>
  );
}
