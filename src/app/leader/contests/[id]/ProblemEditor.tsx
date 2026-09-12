'use client';

import { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';

import { apiFetch, errorMessage, readJson } from '@/lib/apiClient';
import { CODING_LANGUAGES } from '@/lib/languages';

interface Problem {
  id: string;
  title: string;
  statement_md: string;
  languages: string[];
  time_limit_ms: number;
  memory_limit_kb: number;
  points: number;
}

interface TestCase {
  stdin: string;
  expected_output: string;
  is_sample: boolean;
}

/**
 * The editor for one problem: statement, allowed languages, limits and the
 * test cases (each marked sample — shown to students on Run — or hidden). Saves
 * the fields and the test-case set in one action.
 */
export default function ProblemEditor({
  problemId,
  onChanged,
  onDeleted,
}: {
  problemId: string;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [cases, setCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await readJson<{ problem: Problem; testcases: TestCase[] }>(
          await apiFetch(`/api/coding/problems/${problemId}`)
        );
        if (cancelled) return;
        setProblem(data.problem);
        setCases(data.testcases.map((t) => ({ stdin: t.stdin, expected_output: t.expected_output, is_sample: t.is_sample })));
      } catch (err) {
        if (!cancelled) setNote(errorMessage(err, 'Could not load the problem.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [problemId]);

  const toggleLang = (key: string) => {
    setProblem((p) => p && ({
      ...p,
      languages: p.languages.includes(key) ? p.languages.filter((l) => l !== key) : [...p.languages, key],
    }));
  };

  const setCase = (i: number, patch: Partial<TestCase>) =>
    setCases((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const save = async () => {
    if (!problem) return;
    setSaving(true);
    setNote('');
    try {
      await readJson(await apiFetch(`/api/coding/problems/${problemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: problem.title,
          statement_md: problem.statement_md,
          languages: problem.languages,
          points: problem.points,
          time_limit_ms: problem.time_limit_ms,
          memory_limit_kb: problem.memory_limit_kb,
        }),
      }));
      await readJson(await apiFetch(`/api/coding/problems/${problemId}/testcases`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testcases: cases }),
      }));
      setNote('Saved.');
      onChanged();
    } catch (err) {
      setNote(errorMessage(err, 'Could not save.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    await apiFetch(`/api/coding/problems/${problemId}`, { method: 'DELETE' });
    onDeleted();
  };

  if (loading || !problem) {
    return <p className="p-4 text-xs text-white/40 font-mono">Loading problem…</p>;
  }

  const input = 'w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30';

  return (
    <div className="space-y-4 p-4 border-t border-white/5">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-3">
          <label className="text-[10px] font-mono uppercase text-white/40">Title</label>
          <input className={`${input} mt-1`} value={problem.title} onChange={(e) => setProblem({ ...problem, title: e.target.value })} />
        </div>
        <div>
          <label className="text-[10px] font-mono uppercase text-white/40">Points</label>
          <input type="number" min={0} className={`${input} mt-1`} value={problem.points} onChange={(e) => setProblem({ ...problem, points: Math.max(0, parseInt(e.target.value) || 0) })} />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-mono uppercase text-white/40">Statement (Markdown — use ![alt](image-url) for figures)</label>
        <textarea
          className={`${input} mt-1 font-mono resize-y`} rows={7}
          value={problem.statement_md}
          onChange={(e) => setProblem({ ...problem, statement_md: e.target.value })}
          placeholder={'Describe the problem.\n\n## Input\n...\n\n## Output\n...'}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-1">
          <label className="text-[10px] font-mono uppercase text-white/40">Time limit (ms)</label>
          <input type="number" className={`${input} mt-1`} value={problem.time_limit_ms} onChange={(e) => setProblem({ ...problem, time_limit_ms: parseInt(e.target.value) || 2000 })} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-[10px] font-mono uppercase text-white/40">Allowed languages (the compiler students get)</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {CODING_LANGUAGES.map((l) => {
              const on = problem.languages.includes(l.key);
              return (
                <button
                  key={l.key}
                  onClick={() => toggleLang(l.key)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer border ${
                    on ? 'bg-white/15 text-white border-white/25' : 'text-white/50 border-white/10 hover:text-white'
                  }`}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Test cases */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-mono uppercase text-white/40">Test cases (mark sample = shown to students on Run)</label>
          <button
            onClick={() => setCases((cs) => [...cs, { stdin: '', expected_output: '', is_sample: cs.length === 0 }])}
            className="flex items-center gap-1 text-[10px] font-mono font-bold text-white/60 hover:text-white cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add case
          </button>
        </div>
        {cases.length === 0 && <p className="text-[11px] text-white/30 font-mono">No test cases yet.</p>}
        <div className="space-y-2">
          {cases.map((c, i) => (
            <div key={i} className="rounded-lg border border-white/10 bg-black/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-white/40">Case {i + 1}</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-[10px] font-mono text-white/60 cursor-pointer">
                    <input type="checkbox" checked={c.is_sample} onChange={(e) => setCase(i, { is_sample: e.target.checked })} />
                    Sample
                  </label>
                  <button onClick={() => setCases((cs) => cs.filter((_, idx) => idx !== i))} className="text-white/40 hover:text-rose-400 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <textarea className={`${input} font-mono resize-y`} rows={3} placeholder="stdin" value={c.stdin} onChange={(e) => setCase(i, { stdin: e.target.value })} />
                <textarea className={`${input} font-mono resize-y`} rows={3} placeholder="expected output" value={c.expected_output} onChange={(e) => setCase(i, { expected_output: e.target.value })} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button onClick={remove} className="flex items-center gap-1.5 text-[11px] font-mono text-rose-400/80 hover:text-rose-400 cursor-pointer">
          <Trash2 className="w-3.5 h-3.5" /> Delete problem
        </button>
        <div className="flex items-center gap-3">
          {note && <span className="text-[11px] font-mono text-white/50">{note}</span>}
          <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-40">
            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save problem'}
          </button>
        </div>
      </div>
    </div>
  );
}
