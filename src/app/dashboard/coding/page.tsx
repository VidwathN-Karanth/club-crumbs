'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Code2, ListChecks } from 'lucide-react';

import { apiFetch, errorMessage, readJson } from '@/lib/apiClient';
import { formatDateTime } from '@/lib/dateFormat';

interface ContestCard {
  id: string;
  title: string;
  description: string | null;
  starts_at: string | null;
  duration_mins: number;
  problemCount: number;
  status: 'open' | 'upcoming' | 'live' | 'ended';
}

const STATUS_STYLE: Record<ContestCard['status'], string> = {
  live: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  upcoming: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  open: 'bg-primary/15 text-primary border-primary/25',
  ended: 'bg-white/5 text-white/40 border-white/10',
};

export default function CodingPage() {
  const router = useRouter();
  const [contests, setContests] = useState<ContestCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await readJson<{ contests: ContestCard[] }>(await apiFetch('/api/coding/member/contests'));
        if (!cancelled) setContests(Array.isArray(data.contests) ? data.contests : []);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, 'Could not load contests.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
          <Code2 className="w-6 h-6 text-primary" /> Coding
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">Timed coding contests from your club.</p>
      </div>

      {loading ? (
        <p className="text-sm text-on-surface-variant">Loading…</p>
      ) : error ? (
        <p className="text-sm text-rose-400">{error}</p>
      ) : contests.length === 0 ? (
        <div className="glass-card border border-outline-variant rounded-2xl p-10 text-center">
          <Code2 className="w-8 h-8 text-on-surface-variant/40 mx-auto" />
          <p className="mt-3 text-sm text-on-surface-variant">No contests yet. Your club lead will post them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contests.map((c) => (
            <button
              key={c.id}
              onClick={() => router.push(`/dashboard/coding/${c.id}`)}
              className="group text-left glass-card border border-outline-variant rounded-2xl p-5 hover:border-primary/40 transition cursor-pointer flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-on-surface leading-snug">{c.title}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border shrink-0 ${STATUS_STYLE[c.status]}`}>
                  {c.status}
                </span>
              </div>
              {c.description && <p className="text-xs text-on-surface-variant line-clamp-2">{c.description}</p>}
              <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-on-surface-variant font-mono">
                <span className="flex items-center gap-1"><ListChecks className="w-3.5 h-3.5" /> {c.problemCount} problem{c.problemCount === 1 ? '' : 's'}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {c.duration_mins}m</span>
                {c.starts_at && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDateTime(new Date(c.starts_at))}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
