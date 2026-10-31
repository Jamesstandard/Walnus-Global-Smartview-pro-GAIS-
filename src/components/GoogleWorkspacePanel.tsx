import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  getCurrentUser,
  WORKSPACE_SCOPES,
} from '../lib/googleAuth';
import {
  listDriveFiles,
  getGoogleDoc,
  appendDocContent,
  exportProjectToGoogleDoc,
  exportFormulationToGoogleDoc,
  deleteDriveFile,
  uploadFileToDrive,
  createDriveFolder,
  DriveFileItem,
  GoogleDocContent,
} from '../lib/googleWorkspace';
import { PaintProject } from '../types';
import { playClickSound } from '../lib/soundUtils';
import {
  FileText,
  HardDrive,
  FolderPlus,
  RefreshCw,
  ExternalLink,
  Trash2,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Search,
  UploadCloud,
  FileCode,
  Folder,
  LogIn,
  LogOut,
  Sparkles,
  Edit3,
  X,
  Pin,
  PinOff,
  FilePlus2,
  Database,
  Minimize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GoogleWorkspacePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  currentProject?: PaintProject | null;
}

export function GoogleWorkspacePanel({
  isOpen,
  onClose,
  onMinimize,
  currentProject,
}: GoogleWorkspacePanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'drive' | 'docs' | 'backups'>('drive');
  const [isPinned, setIsPinned] = useState(false);

  // Drive state
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mimeFilter, setMimeFilter] = useState<'all' | 'docs' | 'folders' | 'json'>('all');
  const [driveError, setDriveError] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);

  // Docs state
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedDocContent, setSelectedDocContent] = useState<GoogleDocContent | null>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [appendNoteText, setAppendNoteText] = useState('');
  const [isExportingDoc, setIsExportingDoc] = useState(false);
  const [lastExportedDoc, setLastExportedDoc] = useState<{ id: string; url: string; title: string } | null>(null);

  // Destructive Action Confirmation Modal State
  const [pendingDeleteFile, setPendingDeleteFile] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingAppendConfirm, setPendingAppendConfirm] = useState(false);
  const [isUpdatingDoc, setIsUpdatingDoc] = useState(false);

  // Backup State
  const projects = useLiveQuery(() => db.projects.toArray()) || [];
  const messages = useLiveQuery(() => db.messages.toArray()) || [];
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccessMsg, setBackupSuccessMsg] = useState<string | null>(null);

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser, userToken) => {
        setUser(authedUser);
        setToken(userToken);
        setIsAuthenticated(true);
      },
      () => {
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Fetch Drive Files when authenticated or filter/search changes
  useEffect(() => {
    if (isAuthenticated && token && isOpen) {
      loadDriveFiles();
    }
  }, [isAuthenticated, token, isOpen, mimeFilter]);

  const loadDriveFiles = async () => {
    const activeToken = token || (await getAccessToken());
    if (!activeToken) return;

    setIsLoadingDrive(true);
    setDriveError(null);
    try {
      const files = await listDriveFiles(activeToken, {
        query: searchQuery,
        mimeTypeFilter: mimeFilter,
        pageSize: 30,
      });
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Error loading Google Drive files:', err);
      setDriveError(err.message || 'Failed to list Google Drive files');
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setDriveError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setIsAuthenticated(true);
        // Load files immediately
        const files = await listDriveFiles(result.accessToken, {
          mimeTypeFilter: mimeFilter,
        });
        setDriveFiles(files);
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setDriveError(err.message || 'Sign in failed. Please ensure popups are allowed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    setDriveFiles([]);
    setSelectedDocContent(null);
  };

  // Inspect Google Doc Content
  const handleInspectDoc = async (file: DriveFileItem) => {
    const activeToken = token || (await getAccessToken());
    if (!activeToken) return;

    setSelectedDocId(file.id);
    setIsLoadingDoc(true);
    try {
      const doc = await getGoogleDoc(activeToken, file.id);
      setSelectedDocContent(doc);
      setActiveWorkspaceTab('docs');
    } catch (err: any) {
      console.error('Error fetching Google Doc:', err);
      setDriveError(err.message || 'Could not load Google Doc');
    } finally {
      setIsLoadingDoc(false);
    }
  };

  // Export Current Estimator Project to Google Docs
  const handleExportProjectDoc = async () => {
    const activeToken = token || (await getAccessToken());
    if (!activeToken) {
      setDriveError('Please sign in to export to Google Docs');
      return;
    }

    const targetProject = currentProject || (projects.length > 0 ? projects[0] : null);
    if (!targetProject) {
      setDriveError('No paint project found to export. Please create an estimation first.');
      return;
    }

    setIsExportingDoc(true);
    setDriveError(null);
    try {
      const result = await exportProjectToGoogleDoc(activeToken, targetProject);
      setLastExportedDoc(result);
      await loadDriveFiles();
      // Load and view the exported doc
      const doc = await getGoogleDoc(activeToken, result.documentId);
      setSelectedDocContent(doc);
      setSelectedDocId(result.documentId);
      setActiveWorkspaceTab('docs');
    } catch (err: any) {
      console.error('Export error:', err);
      setDriveError(err.message || 'Failed to export specification to Google Docs');
    } finally {
      setIsExportingDoc(false);
    }
  };

  // Export Factory Formulation to Google Docs
  const handleExportFormulationDoc = async () => {
    const activeToken = token || (await getAccessToken());
    if (!activeToken) return;

    const targetProject = currentProject || (projects.length > 0 ? projects[0] : null);
    if (!targetProject) {
      setDriveError('No project found for batch formulation.');
      return;
    }

    setIsExportingDoc(true);
    setDriveError(null);
    try {
      const result = await exportFormulationToGoogleDoc(activeToken, targetProject, [
        { name: 'Titanium Dioxide (Base Pigment)', price: 3.45 },
        { name: 'Acrylic Polymer Binder', price: 2.10 },
        { name: 'Custom Tint PB15', price: 12.50 },
        { name: 'Solvents/Water Matrix', price: 0.80 },
      ]);
      setLastExportedDoc(result);
      await loadDriveFiles();
      const doc = await getGoogleDoc(activeToken, result.documentId);
      setSelectedDocContent(doc);
      setSelectedDocId(result.documentId);
      setActiveWorkspaceTab('docs');
    } catch (err: any) {
      console.error('Formulation export error:', err);
      setDriveError(err.message || 'Failed to export formulation sheet');
    } finally {
      setIsExportingDoc(false);
    }
  };

  // Append revision note to active Google Doc (Mutating operation - Requires confirmation)
  const handleExecuteAppend = async () => {
    if (!selectedDocContent || !appendNoteText.trim()) return;
    const activeToken = token || (await getAccessToken());
    if (!activeToken) return;

    setIsUpdatingDoc(true);
    try {
      const timestamp = new Date().toLocaleString();
      const noteToAppend = `[REVISION NOTE - ${timestamp} by ${user?.displayName || 'Estimator'}]\n${appendNoteText.trim()}`;
      await appendDocContent(activeToken, selectedDocContent.documentId, noteToAppend);
      // Reload the updated doc
      const updated = await getGoogleDoc(activeToken, selectedDocContent.documentId);
      setSelectedDocContent(updated);
      setAppendNoteText('');
      setPendingAppendConfirm(false);
    } catch (err: any) {
      console.error('Error appending to doc:', err);
      setDriveError(err.message || 'Failed to append text to Google Doc');
    } finally {
      setIsUpdatingDoc(false);
    }
  };

  // Delete file from Drive (Destructive operation - Handled via confirmation modal)
  const handleExecuteDelete = async () => {
    if (!pendingDeleteFile) return;
    const activeToken = token || (await getAccessToken());
    if (!activeToken) return;

    setIsDeleting(true);
    try {
      await deleteDriveFile(activeToken, pendingDeleteFile.id);
      if (selectedDocId === pendingDeleteFile.id) {
        setSelectedDocId(null);
        setSelectedDocContent(null);
      }
      setPendingDeleteFile(null);
      await loadDriveFiles();
    } catch (err: any) {
      console.error('Delete error:', err);
      setDriveError(err.message || 'Failed to delete file from Google Drive');
    } finally {
      setIsDeleting(false);
    }
  };

  // Create folder in Drive
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const activeToken = token || (await getAccessToken());
    if (!activeToken) return;

    try {
      await createDriveFolder(activeToken, newFolderName.trim());
      setNewFolderName('');
      setShowFolderModal(false);
      await loadDriveFiles();
    } catch (err: any) {
      console.error('Folder creation error:', err);
      setDriveError(err.message || 'Failed to create folder in Google Drive');
    }
  };

  // Full Database Backup to Google Drive
  const handleBackupToDrive = async () => {
    const activeToken = token || (await getAccessToken());
    if (!activeToken) return;

    setIsBackingUp(true);
    setBackupSuccessMsg(null);
    setDriveError(null);
    try {
      const backupPayload = {
        exportedAt: new Date().toISOString(),
        application: 'WalnusGlobal SmartView -Pro ©',
        projects,
        messages,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
        },
      };

      const filename = `paint_sync_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const uploaded = await uploadFileToDrive(activeToken, {
        name: filename,
        mimeType: 'application/json',
        content: JSON.stringify(backupPayload, null, 2),
      });

      setBackupSuccessMsg(`Backup successfully uploaded to Google Drive as "${uploaded.name}"`);
      await loadDriveFiles();
    } catch (err: any) {
      console.error('Backup error:', err);
      setDriveError(err.message || 'Failed to upload backup to Google Drive');
    } finally {
      setIsBackingUp(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`bg-slate-900 border border-slate-700 rounded-2xl w-full ${
            isPinned ? 'max-w-none h-full max-h-none rounded-none' : 'max-w-5xl h-[92vh] max-h-[850px]'
          } flex flex-col shadow-2xl overflow-hidden font-sans text-slate-200 transition-all duration-300`}
        >
          {/* Modal Header */}
          <div className="px-4 sm:px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider font-mono">
                  Google Workspace Hub
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Docs & Drive
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Generate official specifications in Google Docs & synchronize project assets to Google Drive
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-xs font-mono">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-5 h-5 rounded-full border border-slate-700"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-[10px] flex items-center justify-center font-bold text-white">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <span className="text-slate-300 max-w-[120px] truncate">{user?.displayName || user?.email}</span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  title="Sign out of Google"
                  className="text-slate-400 hover:text-rose-400 ml-1 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Pin & Expand Button */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setIsPinned(!isPinned);
              }}
              className={`p-1.5 rounded-lg border transition-colors ${
                isPinned
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
              }`}
              title={isPinned ? 'Unpin / Normal Workspace Modal' : 'Pin & Expand Workspace Panel'}
            >
              {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => {
                if (onMinimize) onMinimize();
                else onClose();
              }}
              title="Minimize to Floating Tiny Icon"
              className="p-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 hover:text-white border border-blue-500/40 transition-colors"
            >
              <Minimize2 className="w-4 h-4 text-blue-400" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {driveError && (
          <div className="bg-rose-950/80 border-b border-rose-800/80 px-4 py-2 text-xs text-rose-200 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{driveError}</span>
            </div>
            <button
              type="button"
              onClick={() => setDriveError(null)}
              className="text-rose-300 hover:text-white text-xs font-mono underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Not Authenticated State: Google Sign-In Banner */}
        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5 bg-slate-950">
            <div className="w-16 h-16 rounded-2xl bg-blue-950/60 border border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-950/50">
              <HardDrive className="w-8 h-8 text-blue-400" />
            </div>

            <div className="max-w-md space-y-2">
              <h3 className="text-lg font-bold text-white">Connect Google Docs & Google Drive</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Authorize WalnusGlobal SmartView -Pro © to generate live specification sheets in Google Docs, manage project revisions, and sync inspection media to your Google Drive.
              </p>
            </div>

            <div className="pt-2">
              {/* Official Google Sign-In Button style as mandated by workspace skill */}
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-white hover:bg-slate-100 text-slate-800 font-medium text-sm rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-50 border border-slate-200"
              >
                {isSigningIn ? (
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                )}
                <span>{isSigningIn ? 'Connecting to Google...' : 'Sign in with Google'}</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 font-mono pt-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>OAuth Scopes: Google Docs API & Google Drive API</span>
            </div>
          </div>
        ) : (
          /* Authenticated Workspace Hub */
          <div className="flex-1 flex flex-col min-h-0 bg-slate-900">
            {/* Sub-Navigation Bar */}
            <div className="px-4 sm:px-6 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 py-2">
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveWorkspaceTab('drive')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono uppercase tracking-wider transition-all ${
                    activeWorkspaceTab === 'drive'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Drive Explorer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveWorkspaceTab('docs')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono uppercase tracking-wider transition-all ${
                    activeWorkspaceTab === 'docs'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Google Docs Engine</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveWorkspaceTab('backups')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono uppercase tracking-wider transition-all ${
                    activeWorkspaceTab === 'backups'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Drive Backups</span>
                </button>
              </div>

              {/* Quick Doc Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportProjectDoc}
                  disabled={isExportingDoc}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-semibold uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50"
                >
                  <FilePlus2 className="w-3.5 h-3.5" />
                  <span>{isExportingDoc ? 'Generating Doc...' : 'Export Spec Doc'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportFormulationDoc}
                  disabled={isExportingDoc}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-semibold uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Formulation Doc</span>
                </button>
              </div>
            </div>

            {/* TAB 1: DRIVE EXPLORER */}
            {activeWorkspaceTab === 'drive' && (
              <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-5 space-y-3 overflow-hidden">
                {/* Search & Filter Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2 flex-1 max-w-md">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && loadDriveFiles()}
                        placeholder="Search files in Google Drive..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={loadDriveFiles}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
                      {(['all', 'docs', 'folders', 'json'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setMimeFilter(mode)}
                          className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                            mimeFilter === mode
                              ? 'bg-blue-600 text-white font-bold'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowFolderModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition-colors"
                    >
                      <FolderPlus className="w-3.5 h-3.5 text-blue-400" />
                      <span>New Folder</span>
                    </button>
                  </div>
                </div>

                {/* Drive Files List */}
                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl overflow-y-auto min-h-0 divide-y divide-slate-800/80">
                  {isLoadingDrive ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2">
                      <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                      <p className="text-xs font-mono">Querying Google Drive API...</p>
                    </div>
                  ) : driveFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-2 text-center p-4">
                      <HardDrive className="w-10 h-10 opacity-30 text-blue-400" />
                      <p className="text-xs font-mono uppercase tracking-wider">No Google Drive files found</p>
                      <p className="text-[11px] text-slate-500">
                        Click "Export Spec Doc" or "Drive Backups" to generate files in your Google Drive.
                      </p>
                    </div>
                  ) : (
                    driveFiles.map((file) => {
                      const isGoogleDoc = file.mimeType.includes('document');
                      const isFolder = file.mimeType.includes('folder');
                      const isJson = file.mimeType.includes('json');

                      return (
                        <div
                          key={file.id}
                          className="p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-slate-900/70 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                              {isGoogleDoc ? (
                                <FileText className="w-4 h-4 text-blue-400" />
                              ) : isFolder ? (
                                <Folder className="w-4 h-4 text-amber-400" />
                              ) : isJson ? (
                                <FileCode className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <HardDrive className="w-4 h-4 text-slate-400" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-200 truncate font-mono">
                                  {file.name}
                                </span>
                                {isGoogleDoc && (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-blue-500/20 text-blue-300 rounded font-mono">
                                    Google Doc
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                                <span>
                                  {file.modifiedTime
                                    ? new Date(file.modifiedTime).toLocaleDateString()
                                    : 'Recently updated'}
                                </span>
                                {file.owners?.[0]?.displayName && (
                                  <>
                                    <span>•</span>
                                    <span>{file.owners[0].displayName}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isGoogleDoc && (
                              <button
                                type="button"
                                onClick={() => handleInspectDoc(file)}
                                className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-lg text-[11px] font-mono transition-colors"
                              >
                                View / Edit
                              </button>
                            )}

                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open in Google Drive"
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => setPendingDeleteFile(file)}
                              title="Delete from Google Drive"
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-900/40 text-slate-500 hover:text-rose-400 border border-slate-800 hover:border-rose-700/50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: GOOGLE DOCS ENGINE */}
            {activeWorkspaceTab === 'docs' && (
              <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-800">
                {/* Left Doc Selector / Info */}
                <div className="w-full md:w-80 p-4 bg-slate-950 flex flex-col gap-3 shrink-0 overflow-y-auto">
                  <div className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">
                    Google Docs Generator
                  </div>

                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                    <div className="text-xs font-semibold text-slate-200">Generate Project Specification</div>
                    <p className="text-[11px] text-slate-400">
                      Creates an official SSPC/NACE compliant estimation report with surface area, volume, and HazMat specs.
                    </p>
                    <button
                      type="button"
                      onClick={handleExportProjectDoc}
                      disabled={isExportingDoc}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-mono font-semibold uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <FilePlus2 className="w-3.5 h-3.5" />
                      <span>{isExportingDoc ? 'Generating Doc...' : 'Export Estimation Doc'}</span>
                    </button>
                  </div>

                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                    <div className="text-xs font-semibold text-slate-200">Generate Formulation Sheet</div>
                    <p className="text-[11px] text-slate-400">
                      Creates a factory batch mixing procedure, dispersion ratios, and QC verification sheet.
                    </p>
                    <button
                      type="button"
                      onClick={handleExportFormulationDoc}
                      disabled={isExportingDoc}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-semibold uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isExportingDoc ? 'Generating Doc...' : 'Export Formulation Doc'}</span>
                    </button>
                  </div>

                  {lastExportedDoc && (
                    <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl space-y-1.5">
                      <div className="text-[10px] font-bold text-blue-400 uppercase font-mono">
                        Latest Exported Google Doc
                      </div>
                      <div className="text-xs text-slate-200 font-mono truncate">{lastExportedDoc.title}</div>
                      <a
                        href={lastExportedDoc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 underline font-mono"
                      >
                        <span>Open in Google Docs Editor</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Right Document Viewer & Mutation Console */}
                <div className="flex-1 flex flex-col min-h-0 bg-slate-900 p-4 sm:p-5 space-y-3 overflow-hidden">
                  {selectedDocContent ? (
                    <>
                      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-800 shrink-0">
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-100 font-mono truncate">
                            {selectedDocContent.title}
                          </h3>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Doc ID: {selectedDocContent.documentId} • Revision {selectedDocContent.revisionId}
                          </p>
                        </div>
                        <a
                          href={`https://docs.google.com/document/d/${selectedDocContent.documentId}/edit`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono transition-colors shadow-sm shrink-0"
                        >
                          <span>Open in Docs</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      {/* Doc Content Display */}
                      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {selectedDocContent.bodyText || 'Document body is empty.'}
                      </div>

                      {/* Append Revision Note Section */}
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 shrink-0">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Append Site Revision Note to Document</span>
                          </label>
                          <span className="text-[10px] text-slate-500 font-mono">Docs API batchUpdate</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={appendNoteText}
                            onChange={(e) => setAppendNoteText(e.target.value)}
                            placeholder="e.g. Inspector calibrated coating thickness to 2.2 mils DFT on south corner..."
                            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setPendingAppendConfirm(true)}
                            disabled={!appendNoteText.trim() || isUpdatingDoc}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-mono font-semibold uppercase disabled:opacity-50 transition-colors shrink-0"
                          >
                            {isUpdatingDoc ? 'Updating...' : 'Append'}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-2">
                      <FileText className="w-12 h-12 text-blue-400 opacity-20" />
                      <h4 className="text-sm font-semibold font-mono uppercase tracking-wider text-slate-300">
                        No Google Doc Loaded
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm">
                        Generate a new specification document on the left or select a Google Doc from the Drive Explorer tab.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: DRIVE BACKUPS */}
            {activeWorkspaceTab === 'backups' && (
              <div className="flex-1 flex flex-col p-4 sm:p-6 space-y-4 overflow-y-auto">
                <div className="max-w-2xl space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-100 font-mono">Google Drive Database Backup</h3>
                    <p className="text-xs text-slate-400">
                      Synchronize and persist offline Dexie IndexedDB estimations, formulations, and comms dispatch logs directly to Google Drive as structured JSON files.
                    </p>
                  </div>

                  {backupSuccessMsg && (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{backupSuccessMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-mono uppercase">Local Projects</span>
                      <div className="text-2xl font-bold font-mono text-white mt-1">{projects.length}</div>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-mono uppercase">Comms Messages</span>
                      <div className="text-2xl font-bold font-mono text-white mt-1">{messages.length}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleBackupToDrive}
                    disabled={isBackingUp}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <UploadCloud className={`w-4 h-4 ${isBackingUp ? 'animate-bounce' : ''}`} />
                    <span>{isBackingUp ? 'Uploading to Drive...' : 'Upload Database Snapshot to Drive'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL: Confirmation for Destructive Deletion (MANDATORY per Workspace guidelines) */}
        {pendingDeleteFile && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
            <div className="bg-slate-900 border border-rose-600/60 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3 text-rose-400">
                <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-800">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase font-mono">
                    Confirm Google Drive Deletion
                  </h3>
                  <p className="text-xs text-rose-300">This will permanently delete the file from Google Drive.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
                <div>
                  <span className="text-slate-500">File Name:</span> {pendingDeleteFile.name}
                </div>
                <div>
                  <span className="text-slate-500">File ID:</span> {pendingDeleteFile.id}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingDeleteFile(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-mono font-bold uppercase transition-colors"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Confirmation for Appending Revision to Google Doc (MANDATORY per Workspace guidelines) */}
        {pendingAppendConfirm && selectedDocContent && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
            <div className="bg-slate-900 border border-indigo-600/60 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3 text-indigo-400">
                <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-800">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase font-mono">
                    Confirm Google Doc Update
                  </h3>
                  <p className="text-xs text-slate-400">Append revision notes to the target Google Doc.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 space-y-2">
                <div>
                  <span className="text-slate-500">Target Doc:</span> {selectedDocContent.title}
                </div>
                <div className="border-t border-slate-800 pt-1 text-slate-300">
                  <span className="text-slate-500">Note Content:</span>
                  <p className="mt-1 text-[11px] text-indigo-200 bg-slate-900 p-2 rounded">
                    {appendNoteText}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingAppendConfirm(false)}
                  disabled={isUpdatingDoc}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteAppend}
                  disabled={isUpdatingDoc}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono font-bold uppercase transition-colors"
                >
                  {isUpdatingDoc ? 'Updating Doc...' : 'Confirm Update'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Create New Folder */}
        {showFolderModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
            <form
              onSubmit={handleCreateFolder}
              className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-2 text-blue-400">
                <FolderPlus className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white uppercase font-mono">Create Google Drive Folder</h3>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Folder Name</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. SmartView Specs"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-mono font-bold uppercase transition-colors disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
