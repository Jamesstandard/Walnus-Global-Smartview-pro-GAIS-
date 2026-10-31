import React, { useState, useEffect } from 'react';
import { SiteContact, PaintProject, DraftQuotation, QuotationLineItem, UserProfileSettings, LocalizationSettings } from '../types';
import { generateDefaultQuotation } from '../data/marketResearch';
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
  FileEdit,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Sliders,
  DollarSign,
  Layers,
  Percent,
  RefreshCw,
  Clock,
  Sparkles,
  Radio,
  User,
  Building2,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SendDraftQuotationModalProps {
  isOpen: boolean;
  contact: SiteContact;
  project?: PaintProject | null;
  onClose: () => void;
}

export function SendDraftQuotationModal({
  isOpen,
  contact,
  project,
  onClose,
}: SendDraftQuotationModalProps) {
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

  const [draft, setDraft] = useState<DraftQuotation>(() => {
    const defaultQuotation = generateDefaultQuotation(currentProject, contact);
    const storedLoc = getStoredLocalization();
    // Default with user configured margin & tax rates if set
    defaultQuotation.contractorMarginPercent = storedLoc.defaultMarginRate || 15.0;
    defaultQuotation.taxRatePercent = storedLoc.defaultTaxRate || 8.25;
    defaultQuotation.contingencyPercent = storedLoc.defaultContingencyRate || 5.0;
    
    // Calculate initial totals
    const subtotal = defaultQuotation.lineItems.reduce((sum, item) => sum + item.total, 0);
    const marginAmount = Math.round(subtotal * (defaultQuotation.contractorMarginPercent / 100) * 100) / 100;
    const contingencyAmount = Math.round(subtotal * (defaultQuotation.contingencyPercent / 100) * 100) / 100;
    const taxableBase = subtotal + marginAmount + contingencyAmount;
    const taxAmount = Math.round(taxableBase * (defaultQuotation.taxRatePercent / 100) * 100) / 100;
    const total = Math.round((taxableBase + taxAmount) * 100) / 100;

    return {
      ...defaultQuotation,
      subtotal,
      marginAmount,
      taxAmount,
      contingencyAmount,
      total,
    };
  });

  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmissionStep, setTransmissionStep] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [liveEditNotice, setLiveEditNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProfile(getStoredUserProfile());
      setLoc(getStoredLocalization());
    }

    const handleLocUpdate = (e: CustomEvent<LocalizationSettings>) => {
      if (e.detail) {
        setLoc(e.detail);
      }
    };
    window.addEventListener('paint_sync_localization_updated', handleLocUpdate as EventListener);
    return () => {
      window.removeEventListener('paint_sync_localization_updated', handleLocUpdate as EventListener);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Recalculate quotation financial totals
  const recalculateDraft = (
    items: QuotationLineItem[],
    marginPct: number,
    taxPct: number,
    contingencyPct: number
  ): DraftQuotation => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const marginAmount = Math.round(subtotal * (marginPct / 100) * 100) / 100;
    const contingencyAmount = Math.round(subtotal * (contingencyPct / 100) * 100) / 100;
    const taxableBase = subtotal + marginAmount + contingencyAmount;
    const taxAmount = Math.round(taxableBase * (taxPct / 100) * 100) / 100;
    const total = Math.round((taxableBase + taxAmount) * 100) / 100;

    return {
      ...draft,
      lineItems: items,
      contractorMarginPercent: marginPct,
      taxRatePercent: taxPct,
      contingencyPercent: contingencyPct,
      subtotal,
      marginAmount,
      taxAmount,
      contingencyAmount,
      total,
      lastUpdated: Date.now(),
    };
  };

  // Line item updates
  const handleItemChange = (id: string, field: 'description' | 'quantity' | 'unitRate', value: any) => {
    const updatedItems = draft.lineItems.map((item) => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unitRate') {
        const q = field === 'quantity' ? Number(value) || 0 : item.quantity;
        const r = field === 'unitRate' ? Number(value) || 0 : item.unitRate;
        updated.total = Math.round(q * r * 100) / 100;
      }
      return updated;
    });

    setDraft(
      recalculateDraft(
        updatedItems,
        draft.contractorMarginPercent,
        draft.taxRatePercent,
        draft.contingencyPercent
      )
    );
    triggerLiveNotice();
  };

  const handleAddItem = () => {
    const newItem: QuotationLineItem = {
      id: generateId(),
      category: 'Materials',
      description: 'Additional Chemical Formulation / Polymer Unit',
      quantity: 1,
      unit: loc.unitSystem === 'metric' ? 'L' : 'Gal',
      unitRate: 150.0,
      total: 150.0,
      isEditable: true,
    };

    const updatedItems = [...draft.lineItems, newItem];
    setDraft(
      recalculateDraft(
        updatedItems,
        draft.contractorMarginPercent,
        draft.taxRatePercent,
        draft.contingencyPercent
      )
    );
    triggerLiveNotice();
  };

  const handleRemoveItem = (id: string) => {
    const updatedItems = draft.lineItems.filter((i) => i.id !== id);
    setDraft(
      recalculateDraft(
        updatedItems,
        draft.contractorMarginPercent,
        draft.taxRatePercent,
        draft.contingencyPercent
      )
    );
    triggerLiveNotice();
  };

  const handleMarginChange = (val: number) => {
    setDraft(
      recalculateDraft(
        draft.lineItems,
        val,
        draft.taxRatePercent,
        draft.contingencyPercent
      )
    );
    triggerLiveNotice();
  };

  const handleTaxChange = (val: number) => {
    setDraft(
      recalculateDraft(
        draft.lineItems,
        draft.contractorMarginPercent,
        val,
        draft.contingencyPercent
      )
    );
    triggerLiveNotice();
  };

  const handleContingencyChange = (val: number) => {
    setDraft(
      recalculateDraft(
        draft.lineItems,
        draft.contractorMarginPercent,
        draft.taxRatePercent,
        val
      )
    );
    triggerLiveNotice();
  };

  const triggerLiveNotice = () => {
    setLiveEditNotice(true);
  };

  const handleSendDraftToHUD = async () => {
    setIsTransmitting(true);
    setTransferSuccess(false);

    setTransmissionStep(`Compiling live editable quotation (${draft.quotationNumber})...`);
    await new Promise((r) => setTimeout(r, 600));

    setTransmissionStep(`Binding live socket stream to ${contact.name}'s application HUD...`);
    await new Promise((r) => setTimeout(r, 700));

    setTransmissionStep(`Transmitting draft with issuer credentials (${profile.userName}, ${profile.applicationId})...`);
    await new Promise((r) => setTimeout(r, 800));

    // Save message dispatch
    await saveMessageOffline({
      id: generateId(),
      sender: 'Estimator',
      recipient: `${contact.name} (${contact.role})`,
      text: `[LIVE EDITABLE DRAFT QUOTATION SENT TO @${contact.name}]:\nDraft Quotation ${draft.quotationNumber} (v${draft.version.toFixed(1)}, Total: ${formatLocalizedCurrency(draft.total, loc)}, Issuer: ${profile.userName}, App ID: ${profile.applicationId}) has been transmitted directly to ${contact.name}'s HUD for interactive live review and adjustments.`,
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
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-md">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  Option #3
                </span>
                <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                  Send Draft Quotation (Live Editable HUD)
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Transfers an interactive editable quotation for live co-editing on{' '}
                <span className="text-indigo-300 font-semibold">{contact.name}</span>'s screen
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

        {/* Live Synchronization Top Bar */}
        <div className="px-4 py-2 bg-purple-950/30 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs font-mono">
          <div className="flex items-center gap-3 text-slate-300">
            <span className="flex items-center gap-1.5 text-purple-300">
              <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>Quote Ref: <strong>{draft.quotationNumber}</strong></span>
            </span>
            <span className="text-slate-500">•</span>
            <span>Surface: <strong className="text-white">{formatLocalizedArea(currentProject.surfaceAreaSqFt, loc)}</strong></span>
            <span className="text-slate-500">•</span>
            <span>Issuer: <strong className="text-indigo-300">{profile.userName}</strong> ({profile.applicationId})</span>
          </div>

          <AnimatePresence>
            {liveEditNotice && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -4, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                onClick={() => {
                  playClickSound();
                  setLiveEditNotice(false);
                }}
                className="text-[11px] text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-500/40 flex items-center gap-1 cursor-pointer select-none active:scale-95 transition-transform"
                title="Tap to dismiss"
              >
                <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Live calculations updated!</span>
                <span className="text-[9px] text-emerald-400 opacity-70 ml-1">✕</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scrollable Editable Quotation Form */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Target Contact HUD Connectivity Badge & Issuer Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-900 border border-purple-500/30 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${contact.avatarBg} flex items-center justify-center text-white font-mono font-bold text-xs shadow`}>
                  {contact.initials}
                </div>
                <div>
                  <div className="text-xs font-bold text-white font-mono">{contact.name}</div>
                  <div className="text-[11px] text-slate-400">{contact.roleCaption} • {contact.siteLocation}</div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" /> Live HUD Co-Edit
              </span>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={profile.profilePicture}
                  alt={profile.userName}
                  className="w-9 h-9 rounded-lg object-cover border border-slate-700 shadow"
                />
                <div>
                  <div className="text-xs font-bold text-white font-mono">{profile.userName}</div>
                  <div className="text-[11px] text-slate-400">{profile.jobTitle} • {profile.company.name}</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-500/30">
                {loc.currencyCode} ({loc.currencySymbol})
              </span>
            </div>
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
                    <div className="font-bold text-white">Editable draft quotation successfully transferred to HUD!</div>
                    <div className="text-[11px] text-emerald-300 mt-0.5">
                      {contact.name} now has live edit capabilities on Quotation {draft.quotationNumber}. Updates will sync seamlessly in real time.
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
            <div className="p-3.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-200 text-xs font-mono flex items-center gap-2.5 animate-pulse">
              <RefreshCw className="w-4 h-4 text-purple-400 animate-spin shrink-0" />
              <span>{transmissionStep}</span>
            </div>
          )}

          {/* Editable Line Items Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider px-1">
              <span>Interactive Line Items (Live Editing Enabled)</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 transition-colors font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Line Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {draft.lineItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    {/* Category Selector + Description */}
                    <div className="flex items-center gap-2 flex-1">
                      <select
                        value={item.category}
                        onChange={(e) => {
                          const updated = draft.lineItems.map((i) =>
                            i.id === item.id ? { ...i, category: e.target.value as any } : i
                          );
                          setDraft(
                            recalculateDraft(
                              updated,
                              draft.contractorMarginPercent,
                              draft.taxRatePercent,
                              draft.contingencyPercent
                            )
                          );
                          triggerLiveNotice();
                        }}
                        className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[10px] font-mono text-purple-300 focus:outline-none"
                      >
                        <option value="Materials">Materials</option>
                        <option value="Labor">Labor</option>
                        <option value="Substrate Prep">Substrate Prep</option>
                        <option value="Equipment">Equipment</option>
                        <option value="Quality & Compliance">Quality & Compliance</option>
                      </select>

                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        className="flex-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
                        placeholder="Description of work / specification..."
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors self-end sm:self-center"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quantity, Unit, Unit Rate, Total Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div>
                      <label className="text-[9px] font-mono text-slate-500 uppercase block mb-0.5">
                        Quantity
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                        className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-mono text-slate-500 uppercase block mb-0.5">
                        Unit
                      </label>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => {
                          const updated = draft.lineItems.map((i) =>
                            i.id === item.id ? { ...i, unit: e.target.value } : i
                          );
                          setDraft(
                            recalculateDraft(
                              updated,
                              draft.contractorMarginPercent,
                              draft.taxRatePercent,
                              draft.contingencyPercent
                            )
                          );
                        }}
                        className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-mono text-slate-500 uppercase block mb-0.5">
                        Unit Rate ({loc.currencySymbol})
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={item.unitRate}
                        onChange={(e) => handleItemChange(item.id, 'unitRate', e.target.value)}
                        className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-mono text-slate-500 uppercase block mb-0.5">
                        Line Total
                      </label>
                      <div className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-emerald-400 font-bold">
                        {formatLocalizedCurrency(item.total, loc)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Margins, Tax, and Contingency Modifiers */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Financial Modifiers & Margins (Live Adjustments)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Margin Slider */}
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Contractor Margin:</span>
                  <span className="text-purple-400 font-bold">{draft.contractorMarginPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={draft.contractorMarginPercent}
                  onChange={(e) => handleMarginChange(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
                <div className="text-[10px] text-slate-500 font-mono text-right">
                  +{formatLocalizedCurrency(draft.marginAmount, loc)}
                </div>
              </div>

              {/* Contingency */}
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Contingency Buffer:</span>
                  <span className="text-amber-400 font-bold">{draft.contingencyPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={draft.contingencyPercent}
                  onChange={(e) => handleContingencyChange(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <div className="text-[10px] text-slate-500 font-mono text-right">
                  +{formatLocalizedCurrency(draft.contingencyAmount, loc)}
                </div>
              </div>

              {/* Tax Rate */}
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Sales/Excise Tax:</span>
                  <span className="text-blue-400 font-bold">{draft.taxRatePercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="0.25"
                  value={draft.taxRatePercent}
                  onChange={(e) => handleTaxChange(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="text-[10px] text-slate-500 font-mono text-right">
                  +{formatLocalizedCurrency(draft.taxAmount, loc)}
                </div>
              </div>
            </div>

            {/* Financial Summary Grand Total Display */}
            <div className="p-3 bg-gradient-to-r from-purple-950/50 via-slate-950 to-slate-950 border border-purple-500/40 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">
                  Subtotal: {formatLocalizedCurrency(draft.subtotal, loc)}
                </span>
                <span className="text-xs font-mono text-slate-300">
                  Margin ({draft.contractorMarginPercent}%) + Contingency ({draft.contingencyPercent}%) + Tax ({draft.taxRatePercent}%)
                </span>
              </div>

              <div className="text-right">
                <div className="text-[10px] font-mono uppercase text-purple-400 font-bold">
                  Live Quotation Total ({loc.currencyCode})
                </div>
                <div className="text-lg font-bold text-emerald-400 font-mono">
                  {formatLocalizedCurrency(draft.total, loc)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] font-mono text-slate-400">
            Target HUD: <strong className="text-white">{contact.name}</strong> • Editable version v{draft.version.toFixed(1)}
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
              onClick={handleSendDraftToHUD}
              disabled={isTransmitting}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isTransmitting ? 'Transmitting to HUD...' : `Send Draft to ${contact.name}'s HUD`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
