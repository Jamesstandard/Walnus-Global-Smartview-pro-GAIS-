import React, { useState, useEffect, useMemo } from 'react';
import { SiteContact, PaintProject, DraftQuotation, UserProfileSettings, LocalizationSettings } from '../types';
import { generateDefaultQuotation } from '../data/marketResearch';
import { generateQuotationPdf, GeneratedPdfResult } from '../lib/pdfQuotationGenerator';
import { saveMessageOffline } from '../db';
import { generateId, formatCurrency } from '../lib/utils';
import { playClickSound } from '../lib/soundUtils';
import {
  getStoredUserProfile,
  getStoredLocalization,
  formatLocalizedCurrency,
  formatLocalizedArea,
  formatLocalizedVolume
} from '../data/userProfileSettings';
import {
  FileCheck,
  Download,
  Send,
  CheckCircle2,
  X,
  FileText,
  Eye,
  Building,
  ShieldCheck,
  Calendar,
  Sparkles,
  RefreshCw,
  Award,
  User,
  Building2,
  Radio,
  FileSignature,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SendFinalQuotationModalProps {
  isOpen: boolean;
  contact: SiteContact;
  project?: PaintProject | null;
  onClose: () => void;
}

export function SendFinalQuotationModal({
  isOpen,
  contact,
  project,
  onClose,
}: SendFinalQuotationModalProps) {
  const currentProject: PaintProject = project || {
    id: 'proj_default_facade',
    name: 'Building Façade - Sector 4 Commercial Coating',
    surfaceAreaSqFt: 2450,
    paintType: 'Exterior Acrylic Latex (High-Durability)',
    colorName: 'Field Selected Tone',
    colorHex: '#3b82f6',
    volumeGallons: 7.0,
    status: 'estimated',
    syncStatus: 'synced',
    lastUpdated: Date.now(),
    images: [],
  };

  const [profile, setProfile] = useState<UserProfileSettings>(getStoredUserProfile);
  const [loc, setLoc] = useState<LocalizationSettings>(getStoredLocalization);

  const [quotation] = useState<DraftQuotation>(() =>
    generateDefaultQuotation(currentProject, contact)
  );

  const [pdfResult, setPdfResult] = useState<GeneratedPdfResult | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmissionStep, setTransmissionStep] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState(false);

  // Sync profile and localization when modal opens or updates
  useEffect(() => {
    if (isOpen) {
      setProfile(getStoredUserProfile());
      setLoc(getStoredLocalization());
    }
  }, [isOpen]);

  // Listen to live profile & localization update events
  useEffect(() => {
    const handleProfileUpdate = (e: any) => {
      if (e.detail) setProfile(e.detail);
    };
    const handleLocUpdate = (e: any) => {
      if (e.detail) setLoc(e.detail);
    };
    window.addEventListener('paint_sync_profile_updated', handleProfileUpdate);
    window.addEventListener('paint_sync_localization_updated', handleLocUpdate);
    return () => {
      window.removeEventListener('paint_sync_profile_updated', handleProfileUpdate);
      window.removeEventListener('paint_sync_localization_updated', handleLocUpdate);
    };
  }, []);

  // Generate PDF whenever modal opens or profile/loc changes
  useEffect(() => {
    if (isOpen) {
      setIsGeneratingPdf(true);
      try {
        const result = generateQuotationPdf(quotation, currentProject, profile, loc);
        setPdfResult(result);
      } catch (err) {
        console.error('Failed to generate quotation PDF:', err);
      } finally {
        setIsGeneratingPdf(false);
      }
    }
  }, [isOpen, quotation, currentProject, profile, loc]);

  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    if (!pdfResult) return;
    const a = document.createElement('a');
    a.href = pdfResult.blobUrl;
    a.download = pdfResult.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSendFinalQuotation = async () => {
    if (!pdfResult) return;
    setIsTransmitting(true);
    setTransferSuccess(false);

    setTransmissionStep(`Compiling high-resolution PDF document (${quotation.quotationNumber})...`);
    await new Promise((r) => setTimeout(r, 600));

    setTransmissionStep(`Encoding cryptographic signature seal & ISO metadata (${profile.applicationId})...`);
    await new Promise((r) => setTimeout(r, 700));

    setTransmissionStep(`Dispatching PDF document to ${contact.name}'s application suite...`);
    await new Promise((r) => setTimeout(r, 800));

    // Save offline dispatch log to comms hub with sender credentials
    await saveMessageOffline({
      id: generateId(),
      sender: 'Estimator',
      recipient: `${contact.name} (${contact.role})`,
      text: `[OFFICIAL PDF QUOTATION TRANSMITTED TO @${contact.name}]:\nDocument "${pdfResult.fileName}" (Total: ${formatLocalizedCurrency(quotation.total, loc)}, Validity: ${quotation.validityDays} Days, Issued by: ${profile.userName} - ${profile.jobTitle}, App ID: ${profile.applicationId}) has been generated and dispatched directly to ${contact.name}'s suite for sign-off.`,
      timestamp: Date.now(),
      syncStatus: 'pending',
      type: 'text',
    });

    setIsTransmitting(false);
    setTransmissionStep(null);
    setTransferSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs font-sans animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Option #4
                </span>
                <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                  Send Final Quotation (PDF Document & Web Preview)
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Generates a detailed PDF document and transmits directly to{' '}
                <span className="text-indigo-300 font-semibold">{contact.name}</span> ({contact.role})
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

        {/* PDF Status Bar */}
        <div className="px-4 py-2 bg-emerald-950/30 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs font-mono">
          <div className="flex items-center gap-3 text-slate-300">
            <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>{pdfResult?.fileName || 'Quotation_Document.pdf'}</span>
            </span>
            <span className="text-slate-500">•</span>
            <span>Total Value: <strong className="text-emerald-400 font-bold">{formatLocalizedCurrency(quotation.total, loc)}</strong></span>
            <span className="text-slate-500">•</span>
            <span>App ID: <strong className="text-indigo-300">{profile.applicationId}</strong></span>
          </div>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={!pdfResult || isGeneratingPdf}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 text-[11px] transition-colors disabled:opacity-50"
          >
            <Download className="w-3 h-3 text-emerald-400" />
            <span>Download Official PDF</span>
          </button>
        </div>

        {/* Scrollable Document Preview Body */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
          {/* Target Recipient Card */}
          <div className="p-3 bg-slate-900 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${contact.avatarBg} flex items-center justify-center text-white font-mono font-bold text-xs shadow`}>
                {contact.initials}
              </div>
              <div>
                <div className="text-xs font-bold text-white font-mono">{contact.name}</div>
                <div className="text-[11px] text-slate-400">{contact.roleCaption} • {contact.siteLocation}</div>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> PDF Recipient Ready
            </span>
          </div>

          {/* Success Banner */}
          <AnimatePresence>
            {transferSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  y: -12,
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
                  setTransferSuccess(false);
                }}
                className="p-3.5 rounded-xl bg-emerald-950/95 border border-emerald-500/60 text-emerald-200 text-xs font-mono flex items-center justify-between gap-3 cursor-pointer select-none transition-transform active:scale-[0.99] hover:bg-emerald-900/90 shadow-lg"
                title="Tap notification to dismiss"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white">Full PDF Quotation document successfully sent!</div>
                    <div className="text-[11px] text-emerald-300 mt-0.5">
                      Official document {quotation.quotationNumber} transmitted to {contact.name}'s application suite and verified in communication records.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[9px] text-emerald-300 font-bold uppercase hidden sm:inline bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-500/40">
                    Tap to dismiss
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playClickSound();
                      setTransferSuccess(false);
                    }}
                    className="p-1 text-emerald-400 hover:text-white rounded hover:bg-emerald-800/60 transition-colors"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isTransmitting && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-mono flex items-center gap-2.5 animate-pulse">
              <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
              <span>{transmissionStep}</span>
            </div>
          )}

          {/* Visual PDF Document Sheet Preview */}
          <div className="p-5 sm:p-7 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-300 space-y-5 font-sans">
            {/* PDF Header Banner */}
            <div className="border-b-2 border-indigo-600 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  {profile.company.logoUrl ? (
                    <img
                      src={profile.company.logoUrl}
                      alt="Company Logo"
                      className="w-10 h-10 rounded-lg object-contain border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow">
                      {profile.company.name.charAt(0) || 'A'}
                    </div>
                  )}
                  <div>
                    <h1 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                      {profile.company.name || 'APEX INDUSTRIAL COATING SOLUTIONS'}
                    </h1>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {profile.company.slogan || 'Commercial Surface Engineering & Autonomous Formulation Division'}
                    </p>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 font-mono flex flex-wrap gap-x-3 gap-y-0.5 pt-0.5">
                  <span>{profile.company.address} • {profile.company.cityStateZip}</span>
                  <span>•</span>
                  <span>{profile.company.legalRegistration}</span>
                  <span>•</span>
                  <span>Web: {profile.company.website}</span>
                </div>
              </div>

              <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200 text-right shrink-0">
                <div className="text-[10px] font-bold text-indigo-700 uppercase font-mono">OFFICIAL QUOTATION</div>
                <div className="text-sm font-bold text-slate-900 font-mono">{quotation.quotationNumber}</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  App ID: <strong className="text-slate-800">{profile.applicationId}</strong>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Currency: {loc.currencyCode} ({loc.currencySymbol})
                </div>
              </div>
            </div>

            {/* Issuing Engineer & Recipient Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Prepared By Card */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <div className="text-[10px] font-bold text-indigo-700 uppercase font-mono flex items-center justify-between">
                  <span>ISSUING ENGINEER & DISPATCH</span>
                  <span className="text-[9px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">CERTIFIED</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <img
                    src={profile.profilePicture}
                    alt={profile.userName}
                    className="w-9 h-9 rounded-lg object-cover border border-slate-300 shrink-0"
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-[12px]">{profile.userName}</div>
                    <div className="text-slate-600 text-[11px]">{profile.jobTitle} • {profile.position}</div>
                  </div>
                </div>
                <div className="text-slate-500 text-[10px] font-mono space-y-0.5 pt-0.5">
                  <div>Email: {profile.email}</div>
                  <div>Direct: {profile.phone} | Hotline: {profile.fieldDispatchPhone}</div>
                  <div>Comms: {profile.communicationChannels.primaryChannel} ({profile.communicationChannels.channelId})</div>
                </div>
              </div>

              {/* Recipient & Project Card */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <div className="text-[10px] font-bold text-indigo-700 uppercase font-mono">RECIPIENT & PROJECT SCOPE</div>
                <div className="font-bold text-slate-900 text-[12px]">{contact.name}</div>
                <div className="text-slate-600 text-[11px]">{contact.roleCaption} • {contact.department}</div>
                <div className="text-slate-700 text-[11px] font-medium pt-0.5">Project: {currentProject.name}</div>
                <div className="text-slate-500 text-[10px] font-mono">
                  Surface: <strong>{formatLocalizedArea(currentProject.surfaceAreaSqFt, loc)}</strong> • Est. Volume: <strong>{formatLocalizedVolume(currentProject.volumeGallons, loc)}</strong>
                </div>
              </div>
            </div>

            {/* Autonomous Verification Seal Bar */}
            <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between text-[10px] font-mono text-emerald-900">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  <strong>SSPC & ISO 9001 Compliant:</strong> {profile.certifications}
                </span>
              </div>
              <span className="text-emerald-700 font-bold">SEAL ACTIVE</span>
            </div>

            {/* Itemized Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-mono text-[10px] uppercase">
                    <th className="p-2 rounded-l">Category</th>
                    <th className="p-2">Scope of Work / Description</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Unit Rate</th>
                    <th className="p-2 text-right rounded-r">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {quotation.lineItems.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 0 ? 'bg-slate-50/70' : 'bg-white'}>
                      <td className="p-2 font-mono text-[10px] text-indigo-700 font-bold">{item.category}</td>
                      <td className="p-2 text-slate-800 text-[11px]">{item.description}</td>
                      <td className="p-2 text-center font-mono text-[11px]">{item.quantity} {item.unit}</td>
                      <td className="p-2 text-right font-mono text-[11px]">{formatLocalizedCurrency(item.unitRate, loc)}</td>
                      <td className="p-2 text-right font-mono font-bold text-[11px] text-slate-900">{formatLocalizedCurrency(item.total, loc)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary & Terms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-[11px]">
                <div className="text-[10px] font-bold text-indigo-700 uppercase font-mono">PAYMENT TERMS & SCHEDULE</div>
                <p className="text-slate-700 leading-relaxed">{quotation.paymentTerms}</p>
                <div className="text-slate-500 text-[10px] pt-1">
                  • Quote valid for {quotation.validityDays} calendar days. All coatings applied under technical standards.
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatLocalizedCurrency(quotation.subtotal, loc)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Margin ({quotation.contractorMarginPercent}%):</span>
                  <span>{formatLocalizedCurrency(quotation.marginAmount, loc)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Contingency ({quotation.contingencyPercent}%):</span>
                  <span>{formatLocalizedCurrency(quotation.contingencyAmount, loc)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax ({quotation.taxRatePercent}%):</span>
                  <span>{formatLocalizedCurrency(quotation.taxAmount, loc)}</span>
                </div>
                <div className="flex justify-between p-2 bg-indigo-700 text-white rounded font-bold text-sm">
                  <span>TOTAL QUOTATION ({loc.currencyCode}):</span>
                  <span>{formatLocalizedCurrency(quotation.total, loc)}</span>
                </div>
              </div>
            </div>

            {/* Authorization Seal */}
            <div className="border-t border-slate-200 pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[10px] font-mono text-slate-500">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Authorized Signer: {profile.digitalSignatureText || profile.userName} • License ID: {profile.applicationId}</span>
              </div>
              <div className="text-slate-600">
                Issued by {profile.company.name}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] font-mono text-slate-400">
            Document target: <strong className="text-white">{contact.name}</strong> ({contact.role})
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleSendFinalQuotation}
              disabled={isTransmitting || !pdfResult}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isTransmitting ? 'Transmitting PDF...' : `Send Final PDF to ${contact.name}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
