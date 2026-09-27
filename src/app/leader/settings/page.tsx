'use client';

import { ChevronRight, Lock, Puzzle, Settings, User } from 'lucide-react';
import ResumePanel from '@/components/ResumePanel';
import { RemindersControl, InterfacePanel, DesktopAppPanel } from '@/components/DeviceSettings';
import { useLeader } from '../LeaderContext';

export default function LeaderSettingsPage() {
  const { leaderName, leaderEmail } = useLeader();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-lg font-bold text-white flex items-center gap-2"><Settings className="w-5 h-5" /> Settings</h1>
        <p className="text-xs text-white/40 mt-0.5">Reminders and how the console looks on this device.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* --- ACCOUNT & REMINDERS --- */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-outline-variant pb-2">
            <User className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-mono font-bold tracking-wider text-primary">Account</h3>
          </div>

          {/* Neither is editable: both come from the college Google account. */}
          <div>
            <span className="block text-[10px] font-mono text-outline mb-1">Name</span>
            <div className="w-full bg-surface-container border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface-variant flex items-center justify-between gap-2">
              <span className="truncate">{leaderName}</span>
              <Lock className="w-3 h-3 text-outline shrink-0" />
            </div>
          </div>

          <div>
            <span className="block text-[10px] font-mono text-outline mb-1">Leader email</span>
            <div className="w-full bg-surface-container border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface-variant flex items-center justify-between gap-2">
              <span className="truncate">{leaderEmail}</span>
              <Lock className="w-3 h-3 text-outline shrink-0" />
            </div>
            <p className="text-[9px] font-mono text-outline mt-1">
              Leader access is granted by this address. It is set in the console, not here.
            </p>
          </div>

          <RemindersControl />
        </div>

        {/* --- INTERFACE --- */}
        <InterfacePanel />

        <DesktopAppPanel />
      </div>

      {/* Reuses the shared CV panel, pointed at the staff endpoint. Admins can
          see leader CVs alongside student ones in the admin Resumes area. */}
      <ResumePanel endpoint="/api/staff/resume" />

      {/* Browser extension — opens the shared pairing page and returns here. */}
      <button
        // Full load, not router.push: the extension's bridge is a content script
        // that only injects on a real page load of /extension.
        onClick={() => window.location.assign('/extension?return=/leader/settings')}
        className="w-full glass-card rounded-2xl p-5 flex items-center justify-between gap-3 hover:border-primary/40 border border-transparent transition cursor-pointer text-left"
      >
        <span className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Puzzle className="w-4 h-4" />
          </span>
          <span>
            <span className="block text-sm font-bold text-on-surface">Browser extension</span>
            <span className="block text-xs text-on-surface-variant">Install and connect Quick Access for one-click launchers and courses.</span>
          </span>
        </span>
        <ChevronRight className="w-4 h-4 text-on-surface-variant shrink-0" />
      </button>
    </div>
  );
}
