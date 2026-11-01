/**
 * SmartView Pro™ - Surveys Dashboard & Registry Screen
 * Walnus Global Ventures
 * Milestone: SV-004 Survey Workspace & Capture Management
 *
 * Displays overview of site surveys, search/filter controls, and creation entry point.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  FolderOpen,
  Camera,
  MapPin,
  Building2,
  User,
  Trash2,
  Check,
  ArrowRight,
} from 'lucide-react';
import { Survey } from '../types';
import { surveyCaptureRepository } from '../lib/surveyCaptureRepository';
import { playClickSound, playSuccessSound, playAlertChime } from '../lib/soundUtils';
import { ConfirmModal } from './ConfirmModal';

interface SurveysDashboardProps {
  activeSurveyId: string | null;
  onSelectSurvey: (survey: Survey) => void;
  onOpenNewSurveyModal: () => void;
}

export function SurveysDashboard({
  activeSurveyId,
  onSelectSurvey,
  onOpenNewSurveyModal,
}: SurveysDashboardProps) {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'completed' | 'archived'>('ALL');
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; survey: Survey | null }>({ isOpen: false, survey: null });

  const loadSurveys = async () => {
    try {
      const list = await surveyCaptureRepository.getAllSurveys();
      setSurveys(list);
    } catch (e) {
      console.warn('Failed to load surveys in dashboard:', e);
    }
  };

  useEffect(() => {
    loadSurveys();
  }, []);

  const totalCapturesCount = useMemo(() => {
    return surveys.reduce((acc, s) => acc + (s.captureCount || 0), 0);
  }, [surveys]);

  const activeSurveysCount = useMemo(() => {
    return surveys.filter((s) => s.status === 'active').length;
  }, [surveys]);

  const filteredSurveys = useMemo(() => {
    return surveys.filter((s) => {
      const matchesSearch =
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.clientName && s.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.siteAddress && s.siteAddress.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.surveyorName && s.surveyorName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [surveys, searchQuery, statusFilter]);

  const handleDeleteSurvey = async (survey: Survey, e: React.MouseEvent) => {
    e.stopPropagation();
    playAlertChime('warning');
    setDeleteConfirmation({ isOpen: true, survey });
  };

  const confirmDelete = async () => {
    const survey = deleteConfirmation.survey;
    if (!survey) return;

    setIsDeletingId(survey.id);
    try {
      await surveyCaptureRepository.deleteSurvey(survey.id);
      playSuccessSound();
      await loadSurveys();
    } catch (err) {
      console.error('Failed to delete survey:', err);
    } finally {
      setIsDeletingId(null);
      setDeleteConfirmation({ isOpen: false, survey: null });
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <ConfirmModal
        isOpen={deleteConfirmation.isOpen}
        title="Delete Survey"
        message={`Delete survey "${deleteConfirmation.survey?.title}"?\n\nWARNING: All ${deleteConfirmation.survey?.captureCount || 0} associated photo captures and local media files will be cascade deleted immediately.`}
        onConfirm={confirmDelete}
        onClose={() => setDeleteConfirmation({ isOpen: false, survey: null })}
      />
      {/* Top Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 shrink-0">
        <div className="max-w-5xl mx-auto space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
                  SmartView Pro™
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Field Survey Management
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white font-mono mt-0.5">
                Site Survey Registry & Workspace
              </h1>
            </div>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                onOpenNewSurveyModal();
              }}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Survey</span>
            </button>
          </div>

          {/* Telemetry Summary Cards */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block uppercase">
                  Total Registered
                </span>
                <strong className="text-lg font-mono font-bold text-white">
                  {surveys.length}
                </strong>
              </div>
              <Layers className="w-5 h-5 text-indigo-400 hidden sm:block" />
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block uppercase">
                  Active Surveys
                </span>
                <strong className="text-lg font-mono font-bold text-emerald-400">
                  {activeSurveysCount}
                </strong>
              </div>
              <Check className="w-5 h-5 text-emerald-400 hidden sm:block" />
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block uppercase">
                  Saved Photo Captures
                </span>
                <strong className="text-lg font-mono font-bold text-indigo-300">
                  {totalCapturesCount}
                </strong>
              </div>
              <Camera className="w-5 h-5 text-indigo-400 hidden sm:block" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 max-w-5xl mx-auto w-full space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, client, address..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono w-full sm:w-auto overflow-x-auto">
            {(['ALL', 'active', 'completed', 'archived'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  playClickSound();
                  setStatusFilter(st);
                }}
                className={`px-3 py-1 rounded-lg transition-all capitalize cursor-pointer whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Surveys' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Survey Cards List */}
        {filteredSurveys.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 sm:p-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
              <FolderOpen className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-bold text-slate-200">
                No Surveys Found
              </h3>
              <p className="text-xs font-mono text-slate-400 mt-1 max-w-sm">
                {surveys.length === 0
                  ? 'No site surveys registered yet. Initiate your first digital site survey to start capturing field observations.'
                  : 'No registered surveys match your current search or filter criteria.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onOpenNewSurveyModal();
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-mono text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Start First Site Survey</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSurveys.map((survey) => {
              const isActiveContext = activeSurveyId === survey.id;
              return (
                <div
                  key={survey.id}
                  onClick={() => {
                    playClickSound();
                    onSelectSurvey(survey);
                  }}
                  className={`group p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
                    isActiveContext
                      ? 'bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border-indigo-500 shadow-indigo-500/10'
                      : 'bg-slate-900/50 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                        {survey.title}
                      </span>

                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${
                          survey.status === 'active'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : survey.status === 'completed'
                            ? 'bg-blue-950 text-blue-400 border-blue-800'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {survey.status}
                      </span>

                      {isActiveContext && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-700 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                          <span>Active Context</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono text-slate-400">
                      <div className="flex items-center gap-1.5 truncate">
                        <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{survey.clientName || 'Client Unset'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{survey.siteAddress || 'Address Unset'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{survey.surveyorName || 'Inspector'}</span>
                      </div>
                    </div>

                    {survey.notes && (
                      <p className="text-[10px] font-mono text-slate-400 truncate pt-0.5">
                        {survey.notes}
                      </p>
                    )}
                  </div>

                  {/* Right side stats & actions */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="text-right font-mono">
                      <span className="text-xs font-bold text-indigo-300 flex items-center justify-end gap-1">
                        <Camera className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{survey.captureCount || 0} Captures</span>
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {new Date(survey.createdAtEpochMs).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSurvey(survey, e)}
                        title="Delete Survey"
                        disabled={isDeletingId === survey.id}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950 hover:text-rose-400 text-slate-400 border border-slate-800 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="w-8 h-8 rounded-xl bg-indigo-950/80 group-hover:bg-indigo-600 text-indigo-400 group-hover:text-white flex items-center justify-center border border-indigo-800 group-hover:border-indigo-500 transition-all">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
