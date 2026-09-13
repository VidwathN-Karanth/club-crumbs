'use client';

import { Settings } from 'lucide-react';
import ResumePanel from '@/components/ResumePanel';
import { useLeader } from '../LeaderContext';

export default function LeaderSettingsPage() {
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
    </div>
  );
}
