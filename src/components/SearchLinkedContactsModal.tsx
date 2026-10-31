import React, { useState } from 'react';
import {
  Search,
  X,
  UserCheck,
  Phone,
  Mail,
  Key,
  Video,
  MessageSquare,
  Link,
  Unlink,
  CheckCircle2,
  AlertCircle,
  Building2,
  Copy,
  Sparkles,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SiteContact } from '../types';
import { INITIAL_CONTACTS } from '../data/contacts';
import { playClickSound } from '../lib/soundUtils';
import { showAppToast } from './ToastNotificationCenter';

interface SearchLinkedContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartVideoCall?: (contact: SiteContact) => void;
  onOpenLinkModal?: () => void;
}

export function SearchLinkedContactsModal({
  isOpen,
  onClose,
  onStartVideoCall,
  onOpenLinkModal,
}: SearchLinkedContactsModalProps) {
  const [contacts, setContacts] = useState<SiteContact[]>(INITIAL_CONTACTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'linked' | 'unlinked'>('all');
  const [copiedAppId, setCopiedAppId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real-time filtering by Application ID, Email, Phone Number, Name, or Role
  const filteredContacts = contacts.filter((c) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      c.name.toLowerCase().includes(query) ||
      c.role.toLowerCase().includes(query) ||
      (c.applicationId && c.applicationId.toLowerCase().includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query)) ||
      c.phone.toLowerCase().includes(query) ||
      c.department.toLowerCase().includes(query);

    if (filterMode === 'linked') return matchesQuery && c.isLinked;
    if (filterMode === 'unlinked') return matchesQuery && !c.isLinked;
    return matchesQuery;
  });

  const handleCopy = (text: string, label: string) => {
    playClickSound();
    navigator.clipboard.writeText(text);
    setCopiedAppId(text);
    showAppToast({
      title: 'Copied',
      message: `${label}: ${text}`,
      type: 'info',
    });
    setTimeout(() => setCopiedAppId(null), 2000);
  };

  const handleToggleLink = (contactId: string) => {
    playClickSound();
    setContacts((prev) =>
      prev.map((c) => {
        if (c.id === contactId) {
          const newLinkedState = !c.isLinked;
          showAppToast({
            title: newLinkedState ? 'Contact Linked' : 'Contact Unlinked',
            message: `${c.name} is now ${newLinkedState ? 'linked to your application instance' : 'unlinked'}.`,
            type: newLinkedState ? 'success' : 'warning',
          });
          return {
            ...c,
            isLinked: newLinkedState,
            linkedAt: newLinkedState ? Date.now() : undefined,
          };
        }
        return c;
      })
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col text-slate-100 max-h-[85vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Search & Connect Linked Contacts
                </h3>
                <p className="text-[11px] text-blue-300/80 font-mono">
                  Search by Application ID, Email, or Phone to verify active linkages
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Bar & Filters */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/60 space-y-3 font-mono">
            <div className="relative">
              <Search className="w-4 h-4 text-blue-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Application ID (e.g. APP-ENG-81C9), Email, or Phone..."
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-2.5 py-1 rounded font-bold transition-colors ${
                    filterMode === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({contacts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('linked')}
                  className={`px-2.5 py-1 rounded font-bold transition-colors flex items-center gap-1 ${
                    filterMode === 'linked'
                      ? 'bg-emerald-600 text-white'
                      : 'text-emerald-400/80 hover:text-emerald-300'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Linked ({contacts.filter((c) => c.isLinked).length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('unlinked')}
                  className={`px-2.5 py-1 rounded font-bold transition-colors ${
                    filterMode === 'unlinked'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Unlinked ({contacts.filter((c) => !c.isLinked).length})
                </button>
              </div>

              {onOpenLinkModal && (
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onOpenLinkModal();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Link New Contact</span>
                </button>
              )}
            </div>
          </div>

          {/* Contact Cards List */}
          <div className="p-4 overflow-y-auto space-y-3 font-mono flex-1">
            {filteredContacts.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-400">No contacts match your query.</p>
                <p className="text-[11px] text-slate-600 max-w-sm mx-auto">
                  Verify the Application ID (e.g. APP-ENG-81C9) or email address, or use "Link New Contact" to establish a connection.
                </p>
              </div>
            ) : (
              filteredContacts.map((c) => (
                <div
                  key={c.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    c.isLinked
                      ? 'bg-slate-950/80 border-emerald-500/40 hover:border-emerald-500/80 shadow-md'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    {/* Contact Info */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.avatarBg} text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-md`}
                      >
                        {c.initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">{c.name}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-blue-300 font-semibold border border-slate-700">
                            {c.role}
                          </span>
                          {c.isLinked ? (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Linked
                            </span>
                          ) : (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800/80 font-bold">
                              Unlinked
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">{c.roleCaption}</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{c.department}</span> • <span>{c.siteLocation}</span>
                        </p>
                      </div>
                    </div>

                    {/* Quick Link Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleLink(c.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                        c.isLinked
                          ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80'
                          : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80'
                      }`}
                    >
                      {c.isLinked ? (
                        <>
                          <Unlink className="w-3 h-3" />
                          <span>Unlink</span>
                        </>
                      ) : (
                        <>
                          <Link className="w-3 h-3" />
                          <span>Link Contact</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Required Connection Parameters Bar */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
                    {/* Application ID */}
                    <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-500">App ID:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(c.applicationId || 'APP-UNASSIGNED', 'Application ID')}
                        className="font-mono text-blue-400 hover:underline flex items-center gap-1 font-bold"
                      >
                        <Key className="w-2.5 h-2.5 text-blue-400" />
                        <span>{c.applicationId || 'APP-UNASSIGNED'}</span>
                        <Copy className="w-2.5 h-2.5 text-slate-500" />
                      </button>
                    </div>

                    {/* Email */}
                    <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-500">Email:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(c.email || 'N/A', 'Email')}
                        className="font-mono text-slate-200 hover:underline flex items-center gap-1 truncate max-w-[130px]"
                      >
                        <Mail className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        <span className="truncate">{c.email || 'N/A'}</span>
                      </button>
                    </div>

                    {/* Phone */}
                    <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-500">Phone:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(c.phone, 'Phone')}
                        className="font-mono text-slate-200 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-2.5 h-2.5 text-slate-400" />
                        <span>{c.phone}</span>
                      </button>
                    </div>
                  </div>

                  {/* Call Actions if Linked */}
                  {c.isLinked && (
                    <div className="mt-2.5 flex items-center justify-end gap-2">
                      {onStartVideoCall && (
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound();
                            onStartVideoCall(c);
                          }}
                          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm transition-colors"
                        >
                          <Video className="w-3 h-3" />
                          <span>Video Call</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
