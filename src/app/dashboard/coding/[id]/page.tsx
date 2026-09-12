'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, ListChecks, Play, Trophy } from 'lucide-react';

import { apiFetch, errorMessage, readJson } from '@/lib/apiClient';
import { formatDateTime } from '@/lib/dateFormat';
import { languageLabel } from '@/lib/languages';

interface Contest {
  id: string;
  title: string;
  description: string | null;
  starts_at: string | null;
  duration_mins: number;
}
interface ProblemSummary {
  id: string;
  position: number;
  title: string;
  points: number;
  languages: string[];
}
interface Session { started_at: string; ends_at: string }

export default function ContestOverviewPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [contest, setContest] = useState<Contest | null>(null);
  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [serverNow, setServerNow] = useState<number>(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await readJson<{ contest: Contest; problems: ProblemSummary[]; session: Session | null; serverNow: string }>(
        await apiFetch(`/api/coding/member/contests/${id}`)
      );
      setContest(data.contest);
      setProblems(data.problems || []);
      setSession(data.session);
      setServerNow(new Date(data.serverNow).getTime());
    } catch (err) {
      setError(errorMessage(err, 'Could not load the contest.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const start = async () => {
    setStarting(true);
    setError('');
    try {
      await readJson(await apiFetch(`/api/coding/member/contests/${id}/start`, { method: 'POST' }));
      router.push(`/dashboard/coding/${id}/solve`);
    } catch (err) {
      setError(errorMessage(err, 'Could not start the contest.'));
      setStarting(false);
    }
  };

  if (loading) return <p className="text-sm text-on-surface-variant">Loading…</p>;
  if (error && !contest) return <p className="text-sm text-rose-400">{error}</p>;
  if (!contest) return null;

  const startsAt = contest.starts_at ? new Date(contest.starts_at).getTime() : null;
  const windowEnd = startsAt ? startsAt + contest.duration_mins * 60000 : null;
  const notYet = startsAt !== null && serverNow < startsAt;
  const ended = windowEnd !== null && serverNow >= windowEnd;
  const totalPoints = problems.reduce((s, p) => s + p.points, 0);

  return (
    <div className="space-y-6 max-w-3xl">
      <button onClick={() => router.push('/dashboard/coding')} className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface cursor-pointer">
        <ArrowLeft className="w-3.5 h-3.5" /> All contests
      </button>

      <div className="glass-card border border-outline-variant rounded-2xl p-6 space-y-4">
        <h1 className="text-2xl font-bold text-on-surface">{contest.title}</h1>
        {contest.description && <p className="text-sm text-on-surface-variant leading-relaxed">{contest.description}</p>}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat icon={ListChecks} label="Problems" value={String(problems.length)} />
          <Stat icon={Clock} label="Duration" value={`${contest.duration_mins}m`} />
          <Stat icon={Trophy} label="Points" value={String(totalPoints)} />
          <Stat icon={Clock} label="Starts" value={contest.starts_at ? formatDateTime(new Date(contest.starts_at)) : 'Anytime'} />
        </div>

        <div className="rounded-xl border border-outline-variant bg-black/20 p-4 text-xs text-on-surface-variant leading-relaxed">
          Once you start, a <strong className="text-on-surface">{contest.duration_mins}-minute timer</strong> begins and cannot be paused.
          The code editor blocks pasting and the problem text cannot be copied. Solve honestly — good luck!
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        {ended ? (
          <div className="text-sm text-on-surface-variant font-mono">This contest has ended.</div>
        ) : notYet ? (
          <div className="text-sm text-amber-400 font-mono">Opens {formatDateTime(new Date(contest.starts_at!))}.</div>
        ) : (
          <button
            onClick={start}
            disabled={starting}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition cursor-pointer disabled:opacity-50"
          >
            <Play className="w-4 h-4" /> {session ? 'Continue solving' : 'Start solving'}
          </button>
        )}
      </div>

      <div className="glass-card border border-outline-variant rounded-2xl divide-y divide-outline-variant/50">
        {problems.map((p, i) => (
          <div key={p.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <span className="font-semibold text-on-surface">{i + 1}. {p.title}</span>
              <div className="text-[11px] text-on-surface-variant font-mono mt-0.5 truncate">
                {p.languages.map(languageLabel).join(' · ') || 'No languages set'}
              </div>
            </div>
            <span className="text-xs font-mono text-on-surface-variant shrink-0">{p.points} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-black/20 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="mt-1 text-sm font-bold text-on-surface truncate">{value}</div>
    </div>
  );
}
