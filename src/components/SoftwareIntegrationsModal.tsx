import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Blocks, 
  Calculator, 
  Cloud, 
  MessageSquare, 
  HardHat, 
  Briefcase,
  ExternalLink,
  CheckCircle2,
  Server,
  RefreshCcw,
  Check
} from 'lucide-react';
import { playClickSound } from '../lib/soundUtils';

interface SoftwareIntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AppStatus = 'disconnected' | 'connecting' | 'connected';

interface IntegrationApp {
  id: string;
  name: string;
  desc: string;
  status: AppStatus;
}

interface IntegrationCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  apps: IntegrationApp[];
}

const INITIAL_CATEGORIES: IntegrationCategory[] = [
  {
    id: 'construction',
    title: 'Project Management',
    icon: <HardHat className="w-4 h-4" />,
    apps: [
      { id: 'procore', name: 'Procore', desc: 'Sync site estimations directly to project budgets and RFI logs.', status: 'disconnected' },
      { id: 'fieldwire', name: 'Fieldwire', desc: 'Attach 3D mesh scans and surface tasks to blueprints.', status: 'disconnected' },
      { id: 'buildertrend', name: 'BuilderTrend', desc: 'Push estimates into client proposals and schedules.', status: 'disconnected' },
      { id: 'acc', name: 'Autodesk Cloud', desc: 'Import BIM models and sync site measurements.', status: 'disconnected' }
    ]
  },
  {
    id: 'accounting',
    title: 'Accounting & Invoicing',
    icon: <Calculator className="w-4 h-4" />,
    apps: [
      { id: 'qbo', name: 'QuickBooks Online', desc: 'Automate invoice generation from formulated materials.', status: 'disconnected' },
      { id: 'xero', name: 'Xero', desc: 'Sync material costs and field labor expenses.', status: 'disconnected' },
      { id: 'sage300', name: 'Sage 300 CRE', desc: 'Enterprise construction accounting integration.', status: 'disconnected' }
    ]
  },
  {
    id: 'crm',
    title: 'CRM & Client Management',
    icon: <Briefcase className="w-4 h-4" />,
    apps: [
      { id: 'salesforce', name: 'Salesforce', desc: 'Attach site survey reports to opportunity records.', status: 'disconnected' },
      { id: 'hubspot', name: 'HubSpot', desc: 'Log site visits and estimation figures automatically.', status: 'disconnected' },
      { id: 'jobnimbus', name: 'JobNimbus', desc: 'Direct roofing and exterior estimator sync.', status: 'disconnected' }
    ]
  },
  {
    id: 'storage',
    title: 'Cloud & Data Storage',
    icon: <Cloud className="w-4 h-4" />,
    apps: [
      { id: 'google_workspace', name: 'Google Workspace', desc: 'Export datasets to Sheets and save PDFs to Drive.', status: 'disconnected' },
      { id: 'ms365', name: 'Microsoft 365', desc: 'Sync via OneDrive and SharePoint sites.', status: 'disconnected' },
      { id: 'dropbox', name: 'Dropbox', desc: 'Automated backup of all site capture images.', status: 'disconnected' }
    ]
  },
  {
    id: 'comms',
    title: 'Team Communications',
    icon: <MessageSquare className="w-4 h-4" />,
    apps: [
      { id: 'slack', name: 'Slack', desc: 'Send real-time alerts when a site survey is completed.', status: 'disconnected' },
      { id: 'teams', name: 'Microsoft Teams', desc: 'Post structural analysis payloads to team channels.', status: 'disconnected' }
    ]
  },
  {
    id: 'estimating',
    title: 'Estimating & Takeoff',
    icon: <Blocks className="w-4 h-4" />,
    apps: [
      { id: 'planswift', name: 'PlanSwift', desc: 'Export digitized area measurements for detailed takeoff.', status: 'disconnected' },
      { id: 'bluebeam', name: 'Bluebeam Revu', desc: 'Push markup and mesh telemetry into Revu sessions.', status: 'disconnected' },
      { id: 'stack', name: 'STACK Construct', desc: 'Cloud pre-construction takeoff sync.', status: 'disconnected' }
    ]
  }
];

export function SoftwareIntegrationsModal({ isOpen, onClose }: SoftwareIntegrationsModalProps) {
  const [categories, setCategories] = useState<IntegrationCategory[]>(INITIAL_CATEGORIES);

  const handleToggleConnect = (categoryId: string, appId: string, currentStatus: AppStatus) => {
    playClickSound();
    
    if (currentStatus === 'connected') {
      // Disconnect immediately
      updateAppStatus(categoryId, appId, 'disconnected');
      return;
    }

    // Start connecting simulation
    updateAppStatus(categoryId, appId, 'connecting');
    
    setTimeout(() => {
      updateAppStatus(categoryId, appId, 'connected');
    }, 1500);
  };

  const updateAppStatus = (categoryId: string, appId: string, status: AppStatus) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        apps: cat.apps.map(app => app.id === appId ? { ...app, status } : app)
      };
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-700/60 shadow-2xl rounded-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <Server className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Software Integrations</h2>
                  <p className="text-sm font-mono text-slate-400">Walnus SmartView Pro Extensibility Platform</p>
                </div>
              </div>
              <button
                onClick={() => {
                  playClickSound();
                  onClose();
                }}
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              
              <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-xl p-4 flex items-start gap-4">
                <div className="mt-0.5">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-indigo-300">Seamless Field-to-Office Pipeline</h4>
                  <p className="text-xs text-indigo-200/70 mt-1 leading-relaxed">
                    Connect Walnus SmartView Pro to your existing tech stack. Structural measurements, formulated materials, and 3D site captures sync automatically to your ERP, CRM, and accounting software.
                  </p>
                </div>
              </div>

              {categories.map((category) => (
                <div key={category.id} className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    <div className="w-7 h-7 rounded bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                      {category.icon}
                    </div>
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">{category.title}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.apps.map((app) => (
                      <div 
                        key={app.id}
                        className={`group relative p-4 rounded-xl border transition-all duration-300 \${
                          app.status === 'connected' 
                            ? 'bg-emerald-950/20 border-emerald-900/50 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                            : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h4 className={`font-bold \${app.status === 'connected' ? 'text-emerald-400' : 'text-slate-200'}`}>
                            {app.name}
                          </h4>
                          {app.status === 'connected' && (
                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                              <Check className="w-3 h-3 text-emerald-500" />
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-400 mb-5 min-h-[34px]">
                          {app.desc}
                        </p>
                        
                        <div className="flex items-center justify-between mt-auto">
                          <button
                            onClick={() => handleToggleConnect(category.id, app.id, app.status)}
                            disabled={app.status === 'connecting'}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 \${
                              app.status === 'connected'
                                ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                : app.status === 'connecting'
                                ? 'bg-indigo-600/50 text-indigo-200 cursor-wait'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'
                            }`}
                          >
                            {app.status === 'connecting' ? (
                              <>
                                <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                                Connecting
                              </>
                            ) : app.status === 'connected' ? (
                              'Disconnect'
                            ) : (
                              'Connect'
                            )}
                          </button>

                          {app.status !== 'connected' && (
                            <button className="text-slate-500 hover:text-slate-300 transition-colors p-1" title="Integration Settings">
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
