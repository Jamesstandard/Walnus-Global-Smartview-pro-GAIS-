import React, { useState } from 'react';
import {
  Link,
  X,
  Key,
  Mail,
  Phone,
  User,
  Building2,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Radio,
  Sliders,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SiteContact } from '../types';
import { saveContactOffline } from '../db';
import { generateId } from '../lib/utils';
import { playClickSound } from '../lib/soundUtils';
import { showAppToast } from './ToastNotificationCenter';

interface LinkContactSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactLinked?: (contact: SiteContact) => void;
}

export function LinkContactSettingsModal({
  isOpen,
  onClose,
  onContactLinked,
}: LinkContactSettingsModalProps) {
  // Required Information Fields
  const [applicationId, setApplicationId] = useState(`APP-WALNUS-${generateId().toUpperCase().slice(0, 6)}`);
  const [emailOrPhone, setEmailOrPhone] = useState('m.vance@walnus-field.com');
  const [name, setName] = useState('Marcus Vance');
  const [role, setRole] = useState<'Engineer' | 'Painter' | 'Manager' | 'Bricklayer' | 'Subcontractor' | 'Client'>('Manager');
  const [department, setDepartment] = useState('Logistics, Safety & Jobsite Dispatch');
  const [siteLocation, setSiteLocation] = useState('Central Dispatch Command Hub');
  
  // Connection Settings
  const [connectionProtocol, setConnectionProtocol] = useState('Full Dual-Sync (Structural Telemetry & Scans)');
  const [bandwidthProfile, setBandwidthProfile] = useState<'fiber' | '4g' | 'satellite'>('4g');
  const [authToken, setAuthToken] = useState(`sec_tok_${generateId()}_${generateId()}`);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleGenerateNewAppId = () => {
    playClickSound();
    setApplicationId(`APP-WALNUS-${generateId().toUpperCase().slice(0, 6)}`);
    setAuthToken(`sec_tok_${generateId()}_${generateId()}`);
    showAppToast({
      title: 'New Key Generated',
      message: 'Generated fresh Application ID & 256-bit connection token.',
      type: 'info',
    });
  };

  const handleEstablishConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId.trim() || !emailOrPhone.trim() || !name.trim()) return;

    playClickSound();
    setIsSubmitting(true);

    try {
      const isEmail = emailOrPhone.includes('@');
      const email = isEmail ? emailOrPhone.trim() : `${name.toLowerCase().replace(/\s+/g, '.')}@walnus-field.com`;
      const phone = !isEmail ? emailOrPhone.trim() : '+1 (555) 456-7890';

      const linkedContact: SiteContact = {
        id: `contact_linked_${generateId()}`,
        name: name.trim(),
        role,
        roleCaption: `${role} - Connected Instance`,
        department: department.trim(),
        avatarBg: 'from-indigo-600 to-purple-600',
        initials: name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        status: 'online',
        phone,
        email,
        applicationId: applicationId.trim(),
        isLinked: true,
        linkedAt: Date.now(),
        connectionProtocol,
        siteLocation: siteLocation.trim(),
        specialty: 'SiteView Pro Network Interop, Real-time telemetry feed',
        experienceYears: 8,
        assignedProjects: 5,
      };

      await saveContactOffline(linkedContact);

      // Broadcast custom event
      window.dispatchEvent(
        new CustomEvent('paint_sync_contact_linked', { detail: linkedContact })
      );

      showAppToast({
        title: 'Connection Established',
        message: `Linked ${linkedContact.name} (${linkedContact.applicationId}) successfully.`,
        type: 'success',
      });

      onContactLinked?.(linkedContact);
      onClose();
    } catch (err) {
      console.error('Failed to link contact:', err);
      showAppToast({
        title: 'Linking Failed',
        message: 'Could not establish connection settings in offline DB.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col text-slate-100 max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Link className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Link Contact & Connection Settings
                </h3>
                <p className="text-[11px] text-purple-300/80 font-mono">
                  Establish connection parameters to synchronize field telemetry & quotes
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

          {/* Content */}
          <form onSubmit={handleEstablishConnection} className="p-4 space-y-3.5 text-xs font-mono overflow-y-auto">
            {/* Required Connection Parameters Section */}
            <div className="p-3 bg-purple-950/30 border border-purple-800/50 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-purple-800/40 pb-2">
                <span className="text-[11px] font-bold text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Required Connection Credentials</span>
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-purple-900 text-purple-200 font-bold">
                  Mandatory
                </span>
              </div>

              {/* Application ID */}
              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Application ID <span className="text-rose-400">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Key className="w-3.5 h-3.5 text-purple-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      required
                      value={applicationId}
                      onChange={(e) => setApplicationId(e.target.value)}
                      placeholder="e.g. APP-WALNUS-81C9"
                      className="w-full bg-slate-950 border border-purple-500/50 focus:border-purple-400 rounded-lg pl-8 pr-2.5 py-2 text-slate-100 font-bold outline-none transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateNewAppId}
                    className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white border border-slate-700 text-[10px] font-bold flex items-center gap-1 shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Auto-Key</span>
                  </button>
                </div>
              </div>

              {/* Email / Phone Number */}
              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Email / Phone Number <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-purple-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    required
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder="e.g. marcus.vance@walnus-field.com or +1 (555) 456-7890"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-lg pl-8 pr-2.5 py-2 text-slate-100 outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Contact Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Marcus Vance"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-lg pl-8 pr-2.5 py-2 text-slate-100 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Contact Role
                </label>
                <select
                  value={role}
                  onChange={(e: any) => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-lg px-3 py-2 text-slate-100 outline-none transition-colors"
                >
                  <option value="Engineer">Engineer (Structural & Coating)</option>
                  <option value="Painter">Painter (Master Applicator)</option>
                  <option value="Manager">Manager (Operations & Dispatch)</option>
                  <option value="Bricklayer">Bricklayer (Substrate Prep)</option>
                  <option value="Subcontractor">Subcontractor (Field Team)</option>
                  <option value="Client">Client / Stakeholder</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-lg px-3 py-2 text-slate-100 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Site / Pier Location
                </label>
                <input
                  type="text"
                  value={siteLocation}
                  onChange={(e) => setSiteLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-lg px-3 py-2 text-slate-100 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Protocol & Bandwidth Settings */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                Connection Protocol & Sync Scope
              </label>
              <select
                value={connectionProtocol}
                onChange={(e) => setConnectionProtocol(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-purple-500 rounded-lg px-3 py-2 text-slate-100 outline-none transition-colors text-[11px]"
              >
                <option value="Full Dual-Sync (Structural Telemetry & Scans)">
                  Full Dual-Sync (2-Way Project & Measurement Telemetry)
                </option>
                <option value="Read-Only Quotation Review Access">
                  Read-Only Quotation Review Access (Stakeholder Approval)
                </option>
                <option value="Field Execution & Viscosity Recipe Feed">
                  Field Execution & Viscosity Recipe Feed (Mixing Operations)
                </option>
              </select>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
                <div>
                  <span className="text-slate-500 block mb-1">Bandwidth Profile:</span>
                  <select
                    value={bandwidthProfile}
                    onChange={(e: any) => setBandwidthProfile(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                  >
                    <option value="4g">4G LTE Field Sync (500ms)</option>
                    <option value="fiber">High-Speed Fiber (100ms)</option>
                    <option value="satellite">Satellite / Low Bandwidth</option>
                  </select>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Auth Token:</span>
                  <input
                    type="text"
                    readOnly
                    value={authToken}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-purple-400 font-mono text-[9px] truncate"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onClose();
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
              >
                <Link className="w-4 h-4" />
                <span>Establish & Link Contact</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
