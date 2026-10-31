import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Bot, Wifi, WifiOff } from 'lucide-react';
import { playClickSound } from '../lib/soundUtils';

export function SyncManager() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const syncQueue = useLiveQuery(() => db.syncQueue.toArray()) || [];

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline && syncQueue.length > 0) {
      processQueue();
    }
  }, [isOnline, syncQueue.length]);

  const processQueue = async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      // Simulate network request to sync data
      await new Promise((resolve) => setTimeout(resolve, 1500));

      for (const item of syncQueue) {
        if (item.type === 'project') {
          await db.projects.update(item.payload.id, { syncStatus: 'synced' });
        } else if (item.type === 'message') {
          await db.messages.update(item.payload.id, { syncStatus: 'synced' });
        }
        await db.syncQueue.delete(item.id);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleActivateAgentManager = () => {
    playClickSound();
    window.dispatchEvent(
      new CustomEvent('paint_sync_open_agent_manager')
    );
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] font-mono">
      {/* Autonomous Agent Management Activation Button */}
      <button 
        id="header-agent-management-btn"
        type="button"
        onClick={handleActivateAgentManager}
        className="flex items-center gap-1.5 text-[11px] font-mono text-purple-300 hover:text-white bg-purple-950/70 hover:bg-purple-900/90 border border-purple-600/50 hover:border-purple-400/80 py-1 px-2 sm:px-2.5 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
        title="Open Autonomous Multi-Agent Management Console"
      >
        <Bot className="w-3.5 h-3.5 text-purple-400 shrink-0" />
        <span className="hidden sm:inline font-bold">Agent Manager</span>
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse shrink-0" />
      </button>

      {/* Sync Status Indicator */}
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950/60 border border-slate-800 shrink-0">
         <div className={`w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.6)] ${!isOnline ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : isSyncing ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse' : 'bg-emerald-500'}`} />
         <span className={`text-[10px] font-mono uppercase tracking-wider truncate max-w-[100px] sm:max-w-none ${!isOnline ? 'text-rose-400' : isSyncing ? 'text-amber-400' : 'text-slate-300'}`}>
           {!isOnline ? 'Offline' : isSyncing ? 'Syncing...' : syncQueue.length > 0 ? `${syncQueue.length} Pending` : 'In Sync'}
         </span>
      </div>
    </div>
  );
}
