import React from 'react';
import { SiteContact, PaintProject } from '../types';
import {
  Bot,
  FileCode2,
  FileEdit,
  FileCheck,
  X,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Radio,
  FileText,
  MapPin,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';

export type ContactSubMenuOption = 'materials_listings' | 'export_project' | 'draft_quotation' | 'final_quotation';

interface ContactSubMenuModalProps {
  isOpen: boolean;
  contact: SiteContact | null;
  project?: PaintProject | null;
  onClose: () => void;
  onSelectOption: (option: ContactSubMenuOption, contact: SiteContact) => void;
}

export function ContactSubMenuModal({
  isOpen,
  contact,
  project,
  onClose,
  onSelectOption,
}: ContactSubMenuModalProps) {
  if (!isOpen || !contact) return null;

  const options = [
    {
      id: 'materials_listings' as ContactSubMenuOption,
      optionNumber: 'Option #1',
      title: 'Send Materials Listings',
      subtitle: 'Autonomous Market Research Agent Payload',
      description: 'List compiled by autonomous market research agent with live chemical spot rates, stock availability, and supplier quotes, transferred to contact application.',
      icon: Bot,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/20 border-amber-500/40',
      badge: 'Market Agent AI',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      borderHover: 'hover:border-amber-500/60 hover:bg-amber-950/20',
      actionText: 'Open Materials List',
    },
    {
      id: 'export_project' as ContactSubMenuOption,
      optionNumber: 'Option #2',
      title: 'Export Project',
      subtitle: 'Complete Project Source File (.paintproj.json)',
      description: 'The entire project source file containing 3D LiDAR mesh, surface calculations, layer formulations, and environmental telemetry transferred to contact application.',
      icon: FileCode2,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/20 border-blue-500/40',
      badge: 'Full Source Package',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      borderHover: 'hover:border-blue-500/60 hover:bg-blue-950/20',
      actionText: 'Export Source File',
    },
    {
      id: 'draft_quotation' as ContactSubMenuOption,
      optionNumber: 'Option #3',
      title: 'Send Draft Quotation',
      subtitle: 'Interactive Editable HUD Version',
      description: 'Sends an editable version to the contact\'s application HUD for real-time live editing, unit rate adjustments, contractor margins, and live updates.',
      icon: FileEdit,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/20 border-purple-500/40',
      badge: 'Live Co-Editing HUD',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      borderHover: 'hover:border-purple-500/60 hover:bg-purple-950/20',
      actionText: 'Launch Live Draft HUD',
    },
    {
      id: 'final_quotation' as ContactSubMenuOption,
      optionNumber: 'Option #4',
      title: 'Send Final Quotation',
      subtitle: 'Official PDF Quotation Document',
      description: 'Generates a full detailed Quotation document in PDF format (with itemized chemical breakdown, labor, terms, and digital seal) and sends to contact application.',
      icon: FileCheck,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20 border-emerald-500/40',
      badge: 'Official PDF Document',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      borderHover: 'hover:border-emerald-500/60 hover:bg-emerald-950/20',
      actionText: 'Generate & Send PDF',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs font-sans animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Sub-menu Modal Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${contact.avatarBg} flex items-center justify-center text-white font-mono font-bold text-sm shadow-md`}>
              {contact.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                  Contact Action Sub-Menu
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Long-Press Activated
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Target: <strong className="text-white">{contact.name}</strong> • {contact.roleCaption}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contact Specs Quick Strip */}
        <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-300">{contact.siteLocation}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-300">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>HUD Telemetry Connected</span>
          </div>
        </div>

        {/* 4 Sub-Menu Action Options Grid */}
        <div className="p-4 space-y-2.5 overflow-y-auto flex-1 text-xs">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider px-1">
            Select Dispatch Action for {contact.name}
          </p>

          <div className="space-y-2.5">
            {options.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onSelectOption(opt.id, contact)}
                  className={`w-full text-left p-3.5 bg-slate-900 border border-slate-800 rounded-xl transition-all duration-150 flex items-start gap-3.5 group cursor-pointer ${opt.borderHover}`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl ${opt.iconBg} border flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                    <Icon className={`w-5 h-5 ${opt.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase text-slate-500">
                          {opt.optionNumber}
                        </span>
                        <h3 className="font-bold text-white text-xs font-mono group-hover:text-indigo-300 transition-colors">
                          {opt.title}
                        </h3>
                      </div>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded border font-semibold ${opt.badgeColor}`}>
                        {opt.badge}
                      </span>
                    </div>

                    <div className="text-[11px] font-medium text-slate-300">{opt.subtitle}</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{opt.description}</p>
                  </div>

                  {/* Arrow action */}
                  <div className="shrink-0 self-center pl-1 text-slate-600 group-hover:text-white transition-colors">
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500 shrink-0">
          <span>Tip: You can also hold down any contact card for 500ms to open this menu</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
