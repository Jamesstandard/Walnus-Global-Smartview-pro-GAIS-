import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  Building2,
  User,
  ShieldCheck,
  FileCheck,
  Eye,
  Sliders,
  Sparkles,
  RefreshCw,
  Award,
  Radio,
  FileSignature,
  Maximize2,
  Minimize2,
  Pin,
  PinOff,
  ExternalLink,
  Send,
  CheckCircle2,
  DollarSign,
  Layers,
  FileText,
  Activity,
  HardDrive,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playClickSound } from '../lib/soundUtils';
import {
  PaintProject,
  UserProfileSettings,
  LocalizationSettings,
  SiteContact,
  DraftQuotation,
  QuotationLineItem
} from '../types';
import {
  getStoredUserProfile,
  getStoredLocalization,
  formatLocalizedCurrency,
  formatLocalizedArea,
  formatLocalizedVolume
} from '../data/userProfileSettings';
import {
  Stakeholder3DViewer,
  BuildingFace,
  INITIAL_BUILDING_FACES,
  PAINT_TYPE_SPECS
} from './Stakeholder3DViewer';
import { generateStandaloneStakeholderHtml } from '../lib/standaloneHtmlGenerator';
import { generateQuotationPdf } from '../lib/pdfQuotationGenerator';
import { saveMessageOffline } from '../db';
import { generateId } from '../lib/utils';

interface StakeholderExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  project?: PaintProject | null;
}

export function StakeholderExportModal({
  isOpen,
  onClose,
  onMinimize,
  project,
}: StakeholderExportModalProps) {
  // User Profile & Localization
  const [profile, setProfile] = useState<UserProfileSettings>(getStoredUserProfile);
  const [loc, setLoc] = useState<LocalizationSettings>(getStoredLocalization);

  // Collapsible Company & Contact Info (Default Collapsed to prevent UI obstruction)
  const [isCompanyInfoCollapsed, setIsCompanyInfoCollapsed] = useState<boolean>(true);

  // 3D Building Faces State
  const [faces, setFaces] = useState<BuildingFace[]>(INITIAL_BUILDING_FACES);
  const [selectedFaceId, setSelectedFaceId] = useState<string | null>('face_north_facade');

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Export & Action UI Feedback States
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isExportingHtml, setIsExportingHtml] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [approvalName, setApprovalName] = useState<string>('');
  const [approvalOrg, setApprovalOrg] = useState<string>('');
  const [approvalSuccess, setApprovalSuccess] = useState<boolean>(false);
  const [feedbackNote, setFeedbackNote] = useState<string>('');
  const [feedbackSuccess, setFeedbackSuccess] = useState<boolean>(false);

  // Active Project Data
  const currentProject: PaintProject = useMemo(() => {
    return (
      project || {
        id: 'proj_commercial_facade_01',
        name: 'Sector 4 Commercial Façade & Elevation',
        surfaceAreaSqFt: 3150,
        paintType: 'Exterior Acrylic Latex',
        colorName: 'Cerulean Sky',
        colorHex: '#3b82f6',
        volumeGallons: 9.0,
        status: 'estimated',
        syncStatus: 'synced',
        lastUpdated: Date.now(),
        images: [],
      }
    );
  }, [project]);

  // Sync profile & localization on mount or change events
  useEffect(() => {
    if (isOpen) {
      setProfile(getStoredUserProfile());
      setLoc(getStoredLocalization());
    }
  }, [isOpen]);

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

  // Compute live geometric and coating metrics from faces
  const totalSurfaceArea = useMemo(() => {
    return faces.reduce((sum, f) => sum + f.areaSqFt, 0);
  }, [faces]);

  const totalVolumeGallons = useMemo(() => {
    return parseFloat((totalSurfaceArea / 350).toFixed(2));
  }, [totalSurfaceArea]);

  // Compute Real-Time Dynamic Quote Line Items based on active faces and paint specs
  const dynamicQuote = useMemo(() => {
    const lineItems: QuotationLineItem[] = [];

    // 1. Coating Formulations by Product Category
    const productGroups = new Map<string, { area: number; faces: string[]; costPerSqFt: number }>();
    faces.forEach((f) => {
      const existing = productGroups.get(f.paintType) || {
        area: 0,
        faces: [],
        costPerSqFt: f.costPerSqFt,
      };
      existing.area += f.areaSqFt;
      existing.faces.push(f.name);
      productGroups.set(f.paintType, existing);
    });

    productGroups.forEach((val, paintType) => {
      const gallonsNeeded = Math.round((val.area / 350) * 100) / 100;
      const spec = PAINT_TYPE_SPECS.find((s) => s.type === paintType);
      const unitRate = spec ? spec.baseRate : 34.50;
      const totalCost = Math.round(gallonsNeeded * unitRate * 100) / 100;

      lineItems.push({
        id: `mat_${paintType.toLowerCase().replace(/\s+/g, '_')}`,
        category: 'Materials',
        description: `${paintType} (${val.faces.join(', ')}) — ${gallonsNeeded} Gal formulated`,
        quantity: gallonsNeeded,
        unit: 'Gallons',
        unitRate,
        total: totalCost,
        isEditable: true,
      });
    });

    // 2. Substrate Surface Preparation
    const prepCost = Math.round(totalSurfaceArea * 0.48 * 100) / 100;
    lineItems.push({
      id: 'item_prep_hydro',
      category: 'Substrate Prep',
      description: 'High-Pressure Hydro-wash (4,000 PSI), Mechanical Abrasion & Primer Keying (SSPC-SP13)',
      quantity: totalSurfaceArea,
      unit: 'Sq Ft',
      unitRate: 0.48,
      total: prepCost,
      isEditable: true,
    });

    // 3. Certified Application Labor
    const laborCost = Math.round(totalSurfaceArea * 1.45 * 100) / 100;
    lineItems.push({
      id: 'item_labor_nace',
      category: 'Labor',
      description: 'Certified Dual-Coat Airless Spray Application & Trim Cut-in (NACE Level 3 Supervised)',
      quantity: totalSurfaceArea,
      unit: 'Sq Ft',
      unitRate: 1.45,
      total: laborCost,
      isEditable: true,
    });

    // 4. Equipment & Scaffolding
    lineItems.push({
      id: 'item_equip_rig',
      category: 'Equipment',
      description: 'Hydraulic Graco Airless Spray Rig, Mobile Boom Lift & Environmental Dust Barrier',
      quantity: 4,
      unit: 'Days',
      unitRate: 165.0,
      total: 660.0,
      isEditable: true,
    });

    // 5. QC & Elcometer DFT Auditing
    lineItems.push({
      id: 'item_qc_audit',
      category: 'Quality & Compliance',
      description: 'Dry Film Thickness (DFT) Elcometer Gauge Scan, Adhesion Pull Test & ASTM Verification',
      quantity: 1,
      unit: 'Certification',
      unitRate: 380.0,
      total: 380.0,
      isEditable: true,
    });

    // Totals Math
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const marginRate = loc.defaultMarginRate || 15.0;
    const contingencyRate = loc.defaultContingencyRate || 5.0;
    const taxRate = loc.defaultTaxRate || 8.25;

    const marginAmount = Math.round(subtotal * (marginRate / 100) * 100) / 100;
    const contingencyAmount = Math.round(subtotal * (contingencyRate / 100) * 100) / 100;
    const taxableBase = subtotal + marginAmount + contingencyAmount;
    const taxAmount = Math.round(taxableBase * (taxRate / 100) * 100) / 100;
    const total = Math.round((taxableBase + taxAmount) * 100) / 100;

    return {
      lineItems,
      subtotal,
      marginAmount,
      contingencyAmount,
      taxAmount,
      total,
      marginRate,
      contingencyRate,
      taxRate,
    };
  }, [faces, totalSurfaceArea, loc]);

  if (!isOpen) return null;

  // Handle Shareable URL Copy
  const handleCopyShareableUrl = () => {
    const url = `${window.location.origin}${window.location.pathname}#stakeholder-export=${encodeURIComponent(
      currentProject.id
    )}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Handle Standalone HTML Download
  const handleDownloadStandaloneHtml = () => {
    setIsExportingHtml(true);

    const exportData = {
      projectName: currentProject.name,
      userProfile: profile,
      localization: loc,
      faces,
      totalSurfaceArea,
      totalVolumeGallons,
      quoteTotal: dynamicQuote.total,
      quoteSubtotal: dynamicQuote.subtotal,
      quoteTax: dynamicQuote.taxAmount,
      quoteMargin: dynamicQuote.marginAmount,
      lineItems: dynamicQuote.lineItems.map((i) => ({
        category: i.category,
        description: i.description,
        quantity: i.quantity,
        unit: i.unit,
        rate: i.unitRate,
        total: i.total,
      })),
      exportTimestamp: Date.now(),
    };

    const htmlContent = generateStandaloneStakeholderHtml(exportData);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name.replace(/\s+/g, '_')}_Interactive_Stakeholder_Portal.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setTimeout(() => setIsExportingHtml(false), 800);
  };

  // Handle PDF Quotation Download
  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      const mockContact: SiteContact = {
        id: 'contact_stakeholder',
        name: approvalName || 'Project Stakeholder / Client',
        role: 'Manager',
        roleCaption: 'Executive Client Representative',
        department: approvalOrg || 'Client Commercial Development',
        avatarBg: '#3b82f6',
        initials: 'CS',
        status: 'online',
        phone: profile.phone,
        siteLocation: 'Commercial Sector 4 Elevation',
        specialty: 'Architectural Approval',
        experienceYears: 10,
        assignedProjects: 1,
      };

      const quotationData: DraftQuotation = {
        id: generateId(),
        projectId: currentProject.id,
        projectName: currentProject.name,
        quotationNumber: `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        targetContact: mockContact,
        version: 2.1,
        lineItems: dynamicQuote.lineItems,
        contractorMarginPercent: dynamicQuote.marginRate,
        taxRatePercent: dynamicQuote.taxRate,
        contingencyPercent: dynamicQuote.contingencyRate,
        subtotal: dynamicQuote.subtotal,
        marginAmount: dynamicQuote.marginAmount,
        taxAmount: dynamicQuote.taxAmount,
        contingencyAmount: dynamicQuote.contingencyAmount,
        total: dynamicQuote.total,
        paymentTerms: '30% Mobilization Deposit, 40% Intermediate Base Coat, 30% Final DFT Sign-off',
        validityDays: 30,
        lastUpdated: Date.now(),
        status: 'approved',
      };

      const pdfResult = generateQuotationPdf(quotationData, currentProject, profile, loc);
      pdfResult.doc.save(pdfResult.fileName);
    } catch (err) {
      console.error('PDF Generation Error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handle Stakeholder Authorization
  const handleAuthorizeSpecification = async () => {
    if (!approvalName) return;
    setApprovalSuccess(true);

    // Save offline confirmation message into Comms
    await saveMessageOffline({
      id: generateId(),
      sender: 'Manager',
      recipient: `${profile.userName} (Lead Surface Engineer)`,
      text: `[STAKEHOLDER SPECIFICATION APPROVED]:\nStakeholder "${approvalName}" (${approvalOrg || 'Client'}) has officially approved the 3D coating specification and quote for "${currentProject.name}" (Total: ${formatLocalizedCurrency(dynamicQuote.total, loc)}). 7 architectural faces locked for field formulation.`,
      timestamp: Date.now(),
      syncStatus: 'pending',
      type: 'text',
    });
  };

  // Handle Stakeholder Feedback Notes
  const handleSubmitFeedback = async () => {
    if (!feedbackNote) return;
    setFeedbackSuccess(true);

    await saveMessageOffline({
      id: generateId(),
      sender: 'Manager',
      recipient: 'Estimator',
      text: `[STAKEHOLDER REVISION NOTE]:\n"${feedbackNote}"\nProject: ${currentProject.name} • Revised Total: ${formatLocalizedCurrency(dynamicQuote.total, loc)}`,
      timestamp: Date.now(),
      syncStatus: 'pending',
      type: 'text',
    });

    setFeedbackNote('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto ${
          isFullscreen ? 'p-0' : ''
        }`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 40 }}
          transition={{ duration: 0.2 }}
          className={`bg-slate-950 border border-slate-800 flex flex-col shadow-2xl overflow-hidden w-full ${
            isFullscreen
              ? 'h-screen w-screen rounded-none border-none'
              : 'max-w-7xl max-h-[96vh] rounded-2xl'
          }`}
        >
        {/* ========================================================================= */}
        {/* HEADER SECTION (Derived Directly from User Profile) */}
        {/* ========================================================================= */}
        <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0 shadow-md">
          {/* Company Branding & Verification */}
          <div className="flex items-center gap-3.5">
            {profile.company.logoUrl ? (
              <img
                src={profile.company.logoUrl}
                alt={profile.company.name}
                className="w-12 h-12 rounded-xl object-cover border border-indigo-500/40 shadow"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white font-extrabold text-xl shadow-lg border border-indigo-400/30">
                {profile.company.name.charAt(0) || 'A'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  {profile.company.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  INTERACTIVE STAKEHOLDER PORTAL
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {profile.company.slogan || 'Commercial Surface Engineering Division'} •{' '}
                <span className="text-slate-300">{profile.company.legalRegistration}</span>
              </p>
            </div>
          </div>

          {/* User Profile Prepared By & Quick Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap">
            {/* User Profile Meta */}
            <div className="flex items-center gap-2.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs text-slate-300">
              <img
                src={profile.profilePicture}
                alt={profile.userName}
                className="w-7 h-7 rounded-full object-cover border border-indigo-500/40"
              />
              <div className="text-left">
                <span className="font-bold text-indigo-300 block leading-tight">
                  {profile.userName}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {profile.jobTitle} • {profile.applicationId}
                </span>
              </div>
            </div>

            {/* Header Control Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyShareableUrl}
                title="Copy Shareable Stakeholder Link"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1 text-xs font-mono"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold hidden sm:inline">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">Share Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadStandaloneHtml}
                disabled={isExportingHtml}
                title="Download Standalone Offline HTML Web App (Opens in any browser)"
                className="p-2 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-500/40 transition-colors flex items-center gap-1 text-xs font-mono"
              >
                <Download className={`w-3.5 h-3.5 ${isExportingHtml ? 'animate-bounce' : ''}`} />
                <span className="hidden sm:inline">Export HTML</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                title="Generate and Download Formal PDF Quotation"
                className="p-2 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 hover:text-white border border-emerald-500/40 transition-colors flex items-center gap-1 text-xs font-mono"
              >
                <FileCheck className={`w-3.5 h-3.5 ${isExportingPdf ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Export PDF</span>
              </button>

              {/* Pin / Fullscreen Toggle Button */}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? 'Unpin / Exit Fullscreen' : 'Pin & Expand Fullscreen View'}
                className={`p-2 rounded-lg border transition-colors ${
                  isFullscreen
                    ? 'bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-600/30'
                    : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                }`}
              >
                {isFullscreen ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onMinimize) onMinimize();
                  else onClose();
                }}
                title="Minimize to Floating Tiny Icon"
                className="p-2 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-500/40 transition-colors"
              >
                <Minimize2 className="w-4 h-4 text-indigo-400" />
              </button>

              <button
                type="button"
                onClick={onClose}
                title="Close Portal"
                className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 border border-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* MAIN BODY: 3D VIEWER + SWAPPER + ACCOMPANIED DATA + REAL-TIME QUOTE */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Project Summary Banner */}
          <div className="bg-slate-900/70 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold bg-indigo-950 px-2 py-0.5 rounded border border-indigo-500/30">
                  Finished Project Scope
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  Ready for Review
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white font-mono">
                {currentProject.name}
              </h1>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                Interact with the 3D elevation below using orbit, pan, and zoom controls. Select any architectural face to customize tone and coating formulation in real time with instant cost adjustments.
              </p>
            </div>

            {/* Quick Metrics Header Ledger */}
            <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono shrink-0 shadow-inner">
              <div className="text-center px-3 border-r border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block font-bold">Total Area</span>
                <span className="text-sm font-bold text-slate-200">
                  {formatLocalizedArea(totalSurfaceArea, loc)}
                </span>
              </div>
              <div className="text-center px-3 border-r border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block font-bold">Formulation Vol</span>
                <span className="text-sm font-bold text-indigo-300">
                  {formatLocalizedVolume(totalVolumeGallons, loc)}
                </span>
              </div>
              <div className="text-center px-3">
                <span className="text-[10px] text-slate-400 uppercase block font-bold">Live Quotation</span>
                <span className="text-base font-extrabold text-emerald-400">
                  {formatLocalizedCurrency(dynamicQuote.total, loc)}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive 3D Building Orbit / Pan / Zoom Viewer & Real-Time Color/Spec Swapper */}
          <div className="w-full">
            <Stakeholder3DViewer
              faces={faces}
              onFacesChange={setFaces}
              selectedFaceId={selectedFaceId}
              onSelectFace={setSelectedFaceId}
              localization={loc}
            />
          </div>

          {/* Accompanied Information & Chemical Formulation Telemetry */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Substrate & Environmental Scan Conditions */}
            <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-300 uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  LiDAR Scan & Substrate
                </span>
                <span className="text-[10px] font-mono text-emerald-400">Verified 99.4%</span>
              </div>
              <div className="space-y-1.5 text-xs font-mono text-slate-300 pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Substrate Class:</span>
                  <span className="font-semibold text-slate-200">Exterior Concrete & Stucco</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Moisture Content:</span>
                  <span className="font-semibold text-emerald-400">4.2% (Passes ASTM F2170)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Surface Profile:</span>
                  <span className="font-semibold text-slate-200">ICRI CSP-3 (Medium Key)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target DFT:</span>
                  <span className="font-semibold text-indigo-300">4.5 - 8.0 mils Dry Film</span>
                </div>
              </div>
            </div>

            {/* 2. Formulation Chemistry & Pigment Integrity */}
            <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-300 uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Chemistry & Weathering
                </span>
                <span className="text-[10px] font-mono text-indigo-400">ISO 12944 C4-High</span>
              </div>
              <div className="space-y-1.5 text-xs font-mono text-slate-300 pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">UV Resistance:</span>
                  <span className="font-semibold text-emerald-400">Grade 8 Lightfastness</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">VOC Compliance:</span>
                  <span className="font-semibold text-slate-200">&lt; 25 g/L (LEED v4.1 Compliant)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Elasticity:</span>
                  <span className="font-semibold text-slate-200">350% Crack-Bridging Elongation</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Expected Life:</span>
                  <span className="font-semibold text-indigo-300">15 - 20 Years Durability</span>
                </div>
              </div>
            </div>

            {/* 3. Field Execution & Quality Protocols */}
            <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-300 uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  Execution Protocols
                </span>
                <span className="text-[10px] font-mono text-purple-400">SSPC / NACE Standard</span>
              </div>
              <div className="space-y-1.5 text-xs font-mono text-slate-300 pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Application Method:</span>
                  <span className="font-semibold text-slate-200">Airless Hydraulic Spray + Back-roll</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Recoat Interval:</span>
                  <span className="font-semibold text-slate-200">4 - 6 Hours @ 25°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Inspection Hold:</span>
                  <span className="font-semibold text-slate-200">NACE III Sign-off between coats</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Warranty:</span>
                  <span className="font-semibold text-emerald-400">10-Yr Comprehensive Warranty</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* REAL-TIME LOGICAL QUOTATION LEDGER BREAKDOWN */}
          {/* ========================================================================= */}
          <div className="bg-slate-900/70 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white font-mono">
                    Itemized Architectural Quotation Ledger
                  </h3>
                  <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                    Live Dynamic Updates
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Itemized pricing synchronized with selected building face coatings and square footage.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Currency:</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-indigo-300">
                  {loc.currencyCode} ({loc.currencySymbol})
                </span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase bg-slate-900/80">
                    <th className="py-3 px-3.5">Category</th>
                    <th className="py-3 px-3.5">Item & Technical Description</th>
                    <th className="py-3 px-3.5 text-right">Quantity</th>
                    <th className="py-3 px-3.5 text-right">Unit Rate</th>
                    <th className="py-3 px-3.5 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {dynamicQuote.lineItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-3.5 font-semibold text-indigo-300 whitespace-nowrap">
                        {item.category}
                      </td>
                      <td className="py-3 px-3.5 text-slate-300 max-w-md">
                        {item.description}
                      </td>
                      <td className="py-3 px-3.5 text-right text-slate-400 whitespace-nowrap">
                        {item.quantity.toLocaleString()} {item.unit}
                      </td>
                      <td className="py-3 px-3.5 text-right text-slate-400 whitespace-nowrap">
                        {formatLocalizedCurrency(item.unitRate, loc)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-slate-200 whitespace-nowrap">
                        {formatLocalizedCurrency(item.total, loc)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Calculation Ledger */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="text-xs font-mono text-slate-400 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Commercial Quotation Terms & Handover Milestones:</span>
                </div>
                <p>• 30% Mobilization Deposit upon Substrate Sign-off</p>
                <p>• 40% Intermediate Base Coat & Elcometer Inspection</p>
                <p>• 30% Final DFT Handover & 10-Year Warranty Issuance</p>
              </div>

              <div className="w-full md:w-80 space-y-2 font-mono text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Materials & Labor Subtotal:</span>
                  <span className="text-slate-200 font-semibold">
                    {formatLocalizedCurrency(dynamicQuote.subtotal, loc)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Contractor Margin ({dynamicQuote.marginRate}%):</span>
                  <span className="text-slate-200">
                    {formatLocalizedCurrency(dynamicQuote.marginAmount, loc)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Site Contingency Buffer ({dynamicQuote.contingencyRate}%):</span>
                  <span className="text-slate-200">
                    {formatLocalizedCurrency(dynamicQuote.contingencyAmount, loc)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Applicable Tax ({dynamicQuote.taxRate}%):</span>
                  <span className="text-slate-200">
                    {formatLocalizedCurrency(dynamicQuote.taxAmount, loc)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-emerald-400 pt-2.5 border-t border-slate-800">
                  <span>Total Project Quotation:</span>
                  <span>{formatLocalizedCurrency(dynamicQuote.total, loc)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* STAKEHOLDER INTERACTIVE APPROVAL & DIRECT FEEDBACK SECTION */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/60 rounded-2xl border border-slate-800 p-5 shadow-xl">
            {/* Stakeholder Approval Box */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Stakeholder Approval & Authorization
                </h4>
              </div>
              <p className="text-xs text-slate-400">
                Authorize the reviewed 3D color choices, dry film thickness standards, and itemized financial ledger.
              </p>

              <AnimatePresence>
                {approvalSuccess && (
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
                      setApprovalSuccess(false);
                    }}
                    className="p-3 rounded-lg bg-emerald-950/95 border border-emerald-500/60 text-emerald-200 text-xs font-mono flex items-center justify-between gap-2 cursor-pointer select-none transition-transform active:scale-[0.99] hover:bg-emerald-900/90 shadow-md"
                    title="Tap notification to dismiss"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate">Specification Approved! Signed record queued and verified.</span>
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
                          setApprovalSuccess(false);
                        }}
                        className="p-1 text-emerald-400 hover:text-white rounded hover:bg-emerald-800/60 transition-colors"
                        title="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Stakeholder Authorized Full Name"
                  value={approvalName}
                  onChange={(e) => setApprovalName(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Client Organization / Entity"
                  value={approvalOrg}
                  onChange={(e) => setApprovalOrg(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAuthorizeSpecification}
                  disabled={!approvalName}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-mono text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Authorize & Sign Specification</span>
                </button>
              </div>
            </div>

            {/* Direct Revision Feedback Box */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Transmit Revision Feedback to Field Team
                </h4>
              </div>
              <p className="text-xs text-slate-400">
                Send real-time change requests directly to the mixer laboratory and site engineer.
              </p>

              <AnimatePresence>
                {feedbackSuccess && (
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
                      setFeedbackSuccess(false);
                    }}
                    className="p-3 rounded-lg bg-indigo-950/95 border border-indigo-500/60 text-indigo-200 text-xs font-mono flex items-center justify-between gap-2 cursor-pointer select-none transition-transform active:scale-[0.99] hover:bg-indigo-900/90 shadow-md"
                    title="Tap notification to dismiss"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="truncate">Revision notes transmitted to field chat system!</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[9px] text-indigo-300 font-bold uppercase hidden sm:inline bg-indigo-900/80 px-1.5 py-0.5 rounded border border-indigo-500/40">
                        Tap to dismiss
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playClickSound();
                          setFeedbackSuccess(false);
                        }}
                        className="p-1 text-indigo-400 hover:text-white rounded hover:bg-indigo-800/60 transition-colors"
                        title="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <textarea
                rows={3}
                placeholder="Enter specific tone modifications, scaffolding schedule constraints, or staging instructions..."
                value={feedbackNote}
                onChange={(e) => setFeedbackNote(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleSubmitFeedback}
                disabled={!feedbackNote}
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-mono text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Field Revision Note</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FOOTER SECTION: Collapsible Company & Direct Contact Information */}
        {/* ========================================================================= */}
        <footer className="bg-slate-900 border-t border-slate-800 py-3 px-4 sm:px-6 shrink-0 text-slate-400 text-xs font-mono shadow-inner select-none">
          {/* Collapse / Expand Toggle Ledge Header */}
          <div className="flex items-center justify-between gap-2 pb-2">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setIsCompanyInfoCollapsed(!isCompanyInfoCollapsed);
              }}
              className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Company & Direct Contact Information</span>
              <span className="text-[10px] text-slate-500 font-normal">
                ({isCompanyInfoCollapsed ? 'Collapsed' : 'Expanded'})
              </span>
              {isCompanyInfoCollapsed ? (
                <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-indigo-400" />
              )}
            </button>
            <span className="text-[10px] text-slate-500 hidden sm:inline font-mono">
              © {new Date().getFullYear()} {profile.company.name}
            </span>
          </div>

          {/* Collapsible Content Body */}
          <AnimatePresence initial={false}>
            {!isCompanyInfoCollapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-slate-800/80 pt-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-4 border-b border-slate-800/80">
                  {/* Company Info */}
                  <div>
                    <h5 className="text-sm font-bold text-slate-200 mb-1.5">
                      {profile.company.name}
                    </h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {profile.company.address}
                    </p>
                    <p className="text-[11px] text-slate-400">{profile.company.cityStateZip}</p>
                    <p className="text-[11px] text-indigo-400 mt-1">
                      {profile.company.legalRegistration}
                    </p>
                  </div>

                  {/* Direct Contact & Field Operations */}
                  <div>
                    <h5 className="text-sm font-bold text-slate-200 mb-1.5">
                      Direct Contact & Operations
                    </h5>
                    <p className="text-[11px] text-slate-300">
                      Lead: <span className="text-white font-semibold">{profile.userName}</span>
                    </p>
                    <p className="text-[11px] text-slate-400">Email: {profile.email}</p>
                    <p className="text-[11px] text-slate-400">Phone: {profile.phone}</p>
                    <p className="text-[11px] text-slate-400">
                      Dispatch: {profile.communicationChannels.channelId}
                    </p>
                  </div>

                  {/* Accreditation & Digital Verification */}
                  <div>
                    <h5 className="text-sm font-bold text-slate-200 mb-1.5">
                      Accreditation & Signature
                    </h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {profile.certifications}
                    </p>
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-[10px] text-slate-300">
                        Digital Verification: {profile.digitalSignatureText}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-2 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 gap-2">
            <span>
              Application ID: {profile.applicationId} • Schema v2.4 • Cryptographic Audit Ready
            </span>
            <span>WalnusGlobal SmartView -Pro ©</span>
          </div>
        </footer>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
