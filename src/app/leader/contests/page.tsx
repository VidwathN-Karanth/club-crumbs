'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, ChevronRight, Clock, Code2, Plus, X } from 'lucide-react';

import { apiFetch, errorMessage, readJson } from '@/lib/apiClient';
import { formatDateTime } from '@/lib/dateFormat';
import { useLeader } from '../LeaderContext';

interface Contest {
  id: string;
  title: string;
  description: string | null;
  starts_at: string | null;
  duration_mins: number;
  status: 'draft' | 'published';
  problemCount: number;
}

export default function LeaderContestsPage() {
  const router = useRouter();
  const { cohort } = useLeader();

  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [duration, setDuration] = useState(120);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await readJson<{ contests: Contest[] }>(
        await apiFetch(`/api/coding/contests?cohort=${encodeURIComponent(cohort)}`)
      );
      setContests(Array.isArray(data.contests) ? data.contests : []);
    } catch (err) {
      setError(errorMessage(err, 'Could not load contests.'));
    } finally {
      setLoading(false);
    }
  }, [cohort]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setCreateError('');
    try {
      const data = await readJson<{ contest: Contest }>(
        await apiFetch('/api/coding/contests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cohort,
            title: title.trim(),
            starts_at: startsAt ? new Date(startsAt).toISOString() : null,
            duration_mins: duration,
          }),
        })
      );
      router.push(`/leader/contests/${data.contest.id}`);
    } catch (err) {
      setCreateError(errorMessage(err, 'Could not create the contest.'));
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5" /> {cohort} contests
          </h1>
          <p className="text-xs text-white/40 mt-0.5">Create timed coding contests for your members.</p>
        </div>
        <button
          onClick={() => { setCreating(true); setTitle(''); setStartsAt(''); setDuration(120); setCreateError(''); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New contest
        </button>
      </div>

      <section className="glass-panel border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-xs text-white/40 font-mono">Loading…</p>
        ) : error ? (
          <p className="p-8 text-center text-xs text-rose-400 font-mono">{error}</p>
        ) : contests.length === 0 ? (
          <p className="p-8 text-center text-xs text-white/40 font-mono">No contests yet. Create your first one.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {contests.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => router.push(`/leader/contests/${c.id}`)}
                  className="w-full flex items-center justify-between gap-4 p-4 hover:bg-white/3 transition cursor-pointer text-left"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white truncate">{c.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 ${
                        c.status === 'published'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-white/5 text-white/50 border border-white/10'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-white/40 font-mono">
                      <span>{c.problemCount} problem{c.problemCount === 1 ? '' : 's'}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {c.starts_at ? formatDateTime(new Date(c.starts_at)) : 'No start set'}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {c.duration_mins}m</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AnimatePresence>
        {creating && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !saving && setCreating(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              role="dialog" aria-modal="true"
              className="glass-panel border border-white/15 p-6 rounded-2xl max-w-md w-full relative z-10 bg-[#1E2126] space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">New contest</h3>
                <button onClick={() => setCreating(false)} className="text-white/50 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-mono uppercase text-white/40">Title</label>
                  <input
                    value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
                    placeholder="Weekly Contest 1"
                    className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-white/40">Starts at</label>
                    <input
                      type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)}
                      className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase text-white/40">Duration (min)</label>
                    <input
                      type="number" min={10} value={duration}
                      onChange={(e) => setDuration(Math.max(10, parseInt(e.target.value) || 120))}
                      className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                </div>
                {createError && <p className="text-[11px] text-rose-300 font-mono">{createError}</p>}
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setCreating(false)} disabled={saving} className="px-4 py-2 border border-white/10 text-white/60 hover:text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40">CANCEL</button>
                <button onClick={create} disabled={saving || !title.trim()} className="px-4 py-2 bg-white/10 border border-white/15 hover:bg-white/15 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40">{saving ? 'CREATING…' : 'CREATE'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
