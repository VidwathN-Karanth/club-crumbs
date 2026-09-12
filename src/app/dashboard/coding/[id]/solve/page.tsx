'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AlertTriangle, ArrowLeft, Ban, Clock, Loader2, Play } from 'lucide-react';

import { apiFetch, errorMessage, readJson } from '@/lib/apiClient';
import { CODING_LANGUAGES, monacoLanguage, starterCode } from '@/lib/languages';

// Monaco is browser-only; never render it on the server.
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface ProblemSummary { id: string; position: number; title: string; points: number; languages: string[] }
interface Session { ends_at: string }
interface Sample { stdin: string; expected_output: string }
interface ProblemDetail { id: string; title: string; statement_md: string; languages: string[]; points: number }
interface RunCase { index: number; verdict: string; stdin: string; expected: string; stdout: string; stderr: string; compileOutput: string; timeMs: number | null }

const VERDICT_LABEL: Record<string, string> = {
  accepted: 'Passed', wrong_answer: 'Wrong answer', tle: 'Time limit', re: 'Runtime error', ce: 'Compile error', error: 'Error',
};

function fmtRemaining(ms: number): string {
  if (ms <= 0) return '00:00';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export default function SolvePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProblemDetail | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [language, setLanguage] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState('');
  const [runCases, setRunCases] = useState<RunCase[] | null>(null);

  // Server-authoritative timer: keep the offset between the server and this browser.
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const offsetRef = useRef(0);
  const [remaining, setRemaining] = useState<number>(0);

  const [split, setSplit] = useState(50); // left pane % width
  const draggingRef = useRef(false);

  // Load the contest (problems + session). No session → back to overview.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await readJson<{ problems: ProblemSummary[]; session: Session | null; serverNow: string }>(
          await apiFetch(`/api/coding/member/contests/${id}`)
        );
        if (cancelled) return;
        if (!data.session) { router.replace(`/dashboard/coding/${id}`); return; }
        offsetRef.current = new Date(data.serverNow).getTime() - Date.now();
        setEndsAt(new Date(data.session.ends_at).getTime());
        setProblems(data.problems);
        setActiveId(data.problems[0]?.id ?? null);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, 'Could not load the contest.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, router]);

  // Load the active problem.
  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    (async () => {
      setRunCases(null); setRunError('');
      try {
        const data = await readJson<{ problem: ProblemDetail; samples: Sample[] }>(
          await apiFetch(`/api/coding/member/problems/${activeId}`)
        );
        if (cancelled) return;
        setDetail(data.problem);
        setSamples(data.samples);
        const lang = data.problem.languages[0] || 'python';
        setLanguage(lang);
        setCode(loadCode(activeId, lang) ?? starterCode(lang));
      } catch (err) {
        if (!cancelled) setRunError(errorMessage(err, 'Could not load the problem.'));
      }
    })();
    return () => { cancelled = true; };
  }, [activeId]);

  // Timer tick.
  useEffect(() => {
    if (endsAt === null) return;
    const tick = () => setRemaining(endsAt - (Date.now() + offsetRef.current));
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [endsAt]);

  const timeUp = endsAt !== null && remaining <= 0;

  const onLanguageChange = (lang: string) => {
    setLanguage(lang);
    if (activeId) setCode(loadCode(activeId, lang) ?? starterCode(lang));
  };

  const onCodeChange = (value?: string) => {
    const v = value ?? '';
    setCode(v);
    if (activeId && language) saveCode(activeId, language, v);
  };

  const run = async () => {
    if (!activeId || timeUp) return;
    setRunning(true); setRunError(''); setRunCases(null);
    try {
      const data = await readJson<{ cases: RunCase[] }>(
        await apiFetch(`/api/coding/member/problems/${activeId}/run`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language, source_code: code }),
        })
      );
      setRunCases(data.cases);
    } catch (err) {
      setRunError(errorMessage(err, 'Could not run your code.'));
    } finally {
      setRunning(false);
    }
  };

  // Divider drag.
  const onDividerDown = useCallback(() => { draggingRef.current = true; }, []);
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const pct = (e.clientX / window.innerWidth) * 100;
      setSplit(Math.min(72, Math.max(28, pct)));
    };
    const up = () => { draggingRef.current = false; };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, []);

  const timerColor = remaining < 60000 ? 'text-rose-400' : remaining < 300000 ? 'text-amber-400' : 'text-on-surface';

  if (loading) return <p className="text-sm text-on-surface-variant">Loading…</p>;
  if (error) return <p className="text-sm text-rose-400">{error}</p>;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] min-h-[520px]">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-outline-variant">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.push(`/dashboard/coding/${id}`)} className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface cursor-pointer shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" /> Exit
          </button>
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {problems.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setActiveId(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition cursor-pointer border ${
                  activeId === p.id ? 'bg-primary/15 text-primary border-primary/25' : 'text-on-surface-variant border-transparent hover:bg-white/5'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
        <div className={`flex items-center gap-1.5 font-mono font-bold tabular-nums ${timerColor}`}>
          <Clock className="w-4 h-4" /> {fmtRemaining(remaining)}
        </div>
      </div>

      {timeUp && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-950/20 px-3 py-2 text-xs text-rose-300">
          <AlertTriangle className="w-4 h-4" /> Your time is up. The editor is locked.
        </div>
      )}

      {/* Split */}
      <div className="flex-1 flex min-h-0 mt-3">
        {/* Left: statement (copy-disabled) */}
        <div
          className="min-w-0 overflow-y-auto pr-4 select-none"
          style={{ width: `${split}%`, WebkitUserSelect: 'none', userSelect: 'none' }}
          onCopy={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
        >
          {detail && (
            <div>
              <h1 className="text-lg font-bold text-on-surface">{detail.title}</h1>
              <span className="text-[11px] font-mono text-on-surface-variant">{detail.points} points</span>
              <div className="prose-invert mt-3 text-sm text-on-surface leading-relaxed coding-statement">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{detail.statement_md || '_No statement provided._'}</ReactMarkdown>
              </div>
              {samples.length > 0 && (
                <div className="mt-5 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Examples</h3>
                  {samples.map((s, i) => (
                    <div key={i} className="rounded-lg border border-outline-variant bg-black/20 p-3 text-xs font-mono">
                      <div className="text-on-surface-variant">Input</div>
                      <pre className="whitespace-pre-wrap text-on-surface mt-0.5">{s.stdin || '(none)'}</pre>
                      <div className="text-on-surface-variant mt-2">Output</div>
                      <pre className="whitespace-pre-wrap text-on-surface mt-0.5">{s.expected_output}</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div onMouseDown={onDividerDown} className="w-1.5 shrink-0 cursor-col-resize bg-outline-variant/40 hover:bg-primary/40 transition rounded" />

        {/* Right: editor + run */}
        <div className="min-w-0 flex flex-col" style={{ width: `${100 - split}%` }}>
          <div className="flex items-center justify-between gap-2 pl-4 pb-2">
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="bg-black/40 border border-outline-variant rounded-lg px-2 py-1.5 text-xs text-on-surface focus:outline-none cursor-pointer"
            >
              {(detail?.languages ?? []).map((key) => {
                const l = CODING_LANGUAGES.find((x) => x.key === key);
                return <option key={key} value={key}>{l?.label ?? key}</option>;
              })}
            </select>
            <span className="flex items-center gap-1 text-[10px] font-mono text-on-surface-variant" title="Pasting is disabled">
              <Ban className="w-3 h-3" /> paste off
            </span>
          </div>

          <div className="flex-1 min-h-0 pl-4 border border-outline-variant rounded-lg overflow-hidden">
            <MonacoEditor
              key={language}
              language={monacoLanguage(language)}
              theme="vs-dark"
              value={code}
              onChange={onCodeChange}
              options={{
                readOnly: timeUp,
                minimap: { enabled: false },
                fontSize: 13,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                contextmenu: false,
              }}
              onMount={(editor, monaco) => {
                // Block paste — keyboard, menu and drop — as a deterrent.
                const node = editor.getDomNode();
                if (node) {
                  node.addEventListener('paste', (e) => { e.preventDefault(); e.stopPropagation(); }, true);
                  node.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); }, true);
                }
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => { /* no-op: paste disabled */ });
              }}
            />
          </div>

          {/* Run + results */}
          <div className="pl-4 pt-2">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={run}
                disabled={running || timeUp}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-outline-variant hover:bg-white/15 text-on-surface text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-40"
              >
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Run
              </button>
              <button
                disabled
                title="Submitting against hidden tests arrives in the next update"
                className="px-4 py-2 rounded-lg bg-primary/40 text-white/70 text-xs font-bold uppercase tracking-wider cursor-not-allowed"
              >
                Submit (soon)
              </button>
            </div>

            {runError && <p className="mt-2 text-xs text-rose-400">{runError}</p>}
            {runCases && (
              <div className="mt-2 max-h-40 overflow-y-auto space-y-2">
                {runCases.map((c) => (
                  <div key={c.index} className={`rounded-lg border p-2.5 text-xs font-mono ${
                    c.verdict === 'accepted' ? 'border-emerald-500/25 bg-emerald-950/10' : 'border-rose-500/25 bg-rose-950/10'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={c.verdict === 'accepted' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        Case {c.index + 1}: {VERDICT_LABEL[c.verdict] ?? c.verdict}
                      </span>
                      {c.timeMs != null && <span className="text-on-surface-variant">{c.timeMs}ms</span>}
                    </div>
                    {c.verdict !== 'accepted' && (
                      <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div><span className="text-on-surface-variant">Expected</span><pre className="whitespace-pre-wrap text-on-surface">{c.expected}</pre></div>
                        <div><span className="text-on-surface-variant">Got</span><pre className="whitespace-pre-wrap text-on-surface">{c.compileOutput || c.stderr || c.stdout || '(no output)'}</pre></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Per-problem, per-language draft persistence — a convenience, so a refresh
   does not wipe work in progress. Best-effort; never throws. */
function codeKey(problemId: string, lang: string) { return `cc-code-${problemId}-${lang}`; }
function loadCode(problemId: string, lang: string): string | null {
  try { return window.localStorage.getItem(codeKey(problemId, lang)); } catch { return null; }
}
function saveCode(problemId: string, lang: string, value: string) {
  try { window.localStorage.setItem(codeKey(problemId, lang), value); } catch { /* ignore */ }
}
