'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, Puzzle, Settings } from 'lucide-react';
import ResumePanel from '@/components/ResumePanel';
import { useLeader } from '../LeaderContext';

export default function LeaderSettingsPage() {
  const router = useRouter();
  const { leaderName, leaderEmail } = useLeader();

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-lg font-bold text-white flex items-center gap-2"><Settings className="w-5 h-5" /> Settings</h1>
        <p className="text-xs text-white/40 mt-0.5">{leaderName} · {leaderEmail}</p>
      </div>

      {/* Reuses the shared CV panel, pointed at the staff endpoint. Admins can
          see leader CVs alongside student ones in the admin Resumes area. */}
      <ResumePanel endpoint="/api/staff/resume" />

      {/* Browser extension — opens the shared pairing page and returns here. */}
      <button
        onClick={() => router.push('/extension?return=/leader/settings')}
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
