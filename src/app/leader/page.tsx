'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Clock, UserPlus, Users } from 'lucide-react';

import { apiFetch, readJson } from '@/lib/apiClient';
import { CLUB_META } from '@/lib/cohorts';
import { useLeader } from './LeaderContext';

interface Member {
  email: string;
  hasAccount: boolean;
  onboarded: boolean;
}

export default function LeaderOverviewPage() {
  const router = useRouter();
  const { cohort, leaderName } = useLeader();
  const accent = CLUB_META[cohort].accent;

  const [members, setMembers] = useState<Member[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await readJson<{ members: Member[] }>(
          await apiFetch(`/api/club/${encodeURIComponent(cohort)}/members`)
        );
        if (!cancelled) setMembers(Array.isArray(data.members) ? data.members : []);
      } catch {
        if (!cancelled) setMembers([]);
      }
    })();
    return () => { cancelled = true; };
  }, [cohort]);

  const total = members?.length ?? 0;
  const active = members?.filter((m) => m.hasAccount && m.onboarded).length ?? 0;
  const pending = members?.filter((m) => !m.hasAccount).length ?? 0;

  const stats = [
    { label: 'Members', value: total, icon: Users, tint: accent },
    { label: 'Active', value: active, icon: CheckCircle2, tint: '#34D399' },
    { label: 'Not joined yet', value: pending, icon: Clock, tint: '#FBBF24' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-white/40">Welcome back</p>
        <h1 className="text-2xl font-bold text-white mt-1">{leaderName}</h1>
        <p className="text-sm mt-1" style={{ color: accent }}>{CLUB_META[cohort].tagline}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-panel border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">{s.label}</span>
                <Icon className="w-4 h-4" style={{ color: s.tint }} />
              </div>
              <div className="mt-2 text-3xl font-bold text-white tabular-nums">
                {members === null ? '—' : s.value}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => router.push('/leader/members')}
        className="group w-full glass-panel border border-white/10 rounded-2xl p-5 flex items-center justify-between hover:border-white/25 transition cursor-pointer text-left"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${accent}22`, color: accent }}>
            <UserPlus className="w-5 h-5" />
          </span>
          <span>
            <span className="block font-bold text-white">Manage members</span>
            <span className="block text-xs text-white/40">Add students to {cohort}, or remove them</span>
          </span>
        </span>
        <ArrowRight className="w-4 h-4 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white/60" />
      </button>
    </div>
  );
}
