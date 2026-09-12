'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Rocket, Save, Trash2 } from 'lucide-react';

import { apiFetch, errorMessage, readJson } from '@/lib/apiClient';
import ProblemEditor from './ProblemEditor';

interface Contest {
  id: string;
  title: string;
  description: string | null;
  starts_at: string | null;
  duration_mins: number;
  status: 'draft' | 'published';
}
interface ProblemSummary {
  id: string;
  title: string;
  position: number;
  languages: string[];
  testcaseCount: number;
}

/** datetime-local wants "YYYY-MM-DDTHH:mm" in local time. */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ContestEditorPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [contest, setContest] = useState<Contest | null>(null);
  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await readJson<{ contest: Contest; problems: ProblemSummary[] }>(
        await apiFetch(`/api/coding/contests/${id}`)
      );
      setContest(data.contest);
      setProblems(data.problems || []);
    } catch (err) {
      setError(errorMessage(err, 'Could not load the contest.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const saveContest = async () => {
    if (!contest) return;
    setSaving(true);
    setNote('');
    try {
      await readJson(await apiFetch(`/api/coding/contests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: contest.title,
          description: contest.description,
          starts_at: contest.starts_at,
          duration_mins: contest.duration_mins,
        }),
      }));
      setNote('Saved.');
    } catch (err) {
      setNote(errorMessage(err, 'Could not save.'));
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    if (!contest) return;
    setSaving(true);
    setNote('');
    const next = contest.status === 'published' ? 'draft' : 'published';
    try {
      const data = await readJson<{ contest: Contest }>(await apiFetch(`/api/coding/contests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      }));
      setContest(data.contest);
      setNote(next === 'published' ? 'Published — members can see it now.' : 'Unpublished.');
    } catch (err) {
      setNote(errorMessage(err, 'Could not change status.'));
    } finally {
      setSaving(false);
    }
  };

  const addProblem = async () => {
    const data = await readJson<{ problem: { id: string } }>(await apiFetch(`/api/coding/contests/${id}/problems`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Untitled problem' }),
    }));
    await load();
    setExpanded(data.problem.id);
  };

  const deleteContest = async () => {
    await apiFetch(`/api/coding/contests/${id}`, { method: 'DELETE' });
    router.push('/leader/contests');
  };

  if (loading) return <p className="p-8 text-center text-xs text-white/40 font-mono">Loading…</p>;
  if (error || !contest) return <p className="p-8 text-center text-xs text-rose-400 font-mono">{error || 'Not found.'}</p>;

  const input = 'w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30';

  return (
    <div className="space-y-6">
      <button onClick={() => router.push('/leader/contests')} className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white cursor-pointer">
        <ArrowLeft className="w-3.5 h-3.5" /> All contests
      </button>

      {/* Contest settings */}
      <section className="glass-panel border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-base font-bold text-white">Contest settings</h1>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
            contest.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-white/50 border border-white/10'
          }`}>{contest.status}</span>
        </div>
        <div>
          <label className="text-[10px] font-mono uppercase text-white/40">Title</label>
          <input className={`${input} mt-1`} value={contest.title} onChange={(e) => setContest({ ...contest, title: e.target.value })} />
        </div>
        <div>
          <label className="text-[10px] font-mono uppercase text-white/40">Description (optional)</label>
          <textarea className={`${input} mt-1 resize-y`} rows={2} value={contest.description ?? ''} onChange={(e) => setContest({ ...contest, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-mono uppercase text-white/40">Starts at</label>
            <input type="datetime-local" className={`${input} mt-1`} value={toLocalInput(contest.starts_at)} onChange={(e) => setContest({ ...contest, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase text-white/40">Duration (min)</label>
            <input type="number" min={10} className={`${input} mt-1`} value={contest.duration_mins} onChange={(e) => setContest({ ...contest, duration_mins: Math.max(10, parseInt(e.target.value) || 120) })} />
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <button onClick={deleteContest} className="flex items-center gap-1.5 text-[11px] font-mono text-rose-400/80 hover:text-rose-400 cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" /> Delete contest
          </button>
          <div className="flex items-center gap-3">
            {note && <span className="text-[11px] font-mono text-white/50">{note}</span>}
            <button onClick={saveContest} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-40">
              <Save className="w-4 h-4" /> Save
            </button>
            <button onClick={togglePublish} disabled={saving} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-40 border ${
              contest.status === 'published' ? 'border-white/15 text-white/70 hover:bg-white/5' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
            }`}>
              <Rocket className="w-4 h-4" /> {contest.status === 'published' ? 'Unpublish' : 'Publish'}
            </button>
          </div>
        </div>
      </section>

      {/* Problems */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Problems ({problems.length})</h2>
          <button onClick={addProblem} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Add problem
          </button>
        </div>

        {problems.length === 0 ? (
          <p className="glass-panel border border-white/10 rounded-2xl p-6 text-center text-xs text-white/40 font-mono">No problems yet. Add one to build the contest.</p>
        ) : (
          <div className="space-y-2">
            {problems.map((p, i) => (
              <div key={p.id} className="glass-panel border border-white/10 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                  className="w-full flex items-center justify-between gap-4 p-4 hover:bg-white/3 transition cursor-pointer text-left"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-white truncate">{i + 1}. {p.title}</span>
                    <div className="text-[10px] text-white/40 font-mono mt-0.5">
                      {p.testcaseCount} test case{p.testcaseCount === 1 ? '' : 's'} · {p.languages.length} language{p.languages.length === 1 ? '' : 's'}
                    </div>
                  </div>
                  {expanded === p.id ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                </button>
                {expanded === p.id && (
                  <ProblemEditor
                    problemId={p.id}
                    onChanged={load}
                    onDeleted={() => { setExpanded(null); load(); }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
