import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { guardMemberProblem } from '@/lib/codingAuth';
import { isLanguageKey } from '@/lib/languages';
import { runCode, JudgeNotConfiguredError } from '@/lib/judge';

/**
 * Run — executes the member's code against the SAMPLE test cases only and
 * returns their outputs. Nothing is stored; this is the "try it" button.
 *
 * The session timer is authoritative: a run after the window closed is refused.
 */
export async function POST(req: Request, { params }: { params: Promise<{ pid: string }> }) {
  const { pid } = await params;
  const guard = await guardMemberProblem(pid);
  if (!guard.ok) return guard.response;

  const problem = guard.data;
  const body = await req.json().catch(() => ({}));
  const language = (body as { language?: string }).language;
  const sourceCode = String((body as { source_code?: string }).source_code || '');

  if (!isLanguageKey(language) || !problem.languages.includes(language)) {
    return NextResponse.json({ error: 'That language is not allowed for this problem.' }, { status: 400 });
  }
  if (!sourceCode.trim()) return NextResponse.json({ error: 'Write some code first.' }, { status: 400 });

  // Timer check — from the server clock, never the client's.
  const { data: session } = await supabaseAdmin
    .from('coding_sessions')
    .select('ends_at')
    .eq('contest_id', problem.contest_id)
    .eq('user_id', guard.requester.userId)
    .maybeSingle();
  if (!session) return NextResponse.json({ error: 'Start the contest first.' }, { status: 400 });
  if (Date.now() >= new Date(session.ends_at).getTime()) {
    return NextResponse.json({ error: 'Your time is up.' }, { status: 403 });
  }

  const { data: samples } = await supabaseAdmin
    .from('coding_testcases')
    .select('stdin, expected_output')
    .eq('problem_id', pid)
    .eq('is_sample', true)
    .order('position', { ascending: true });

  if (!samples || samples.length === 0) {
    return NextResponse.json({ error: 'This problem has no sample cases to run against.' }, { status: 400 });
  }

  try {
    const results = await runCode({
      languageKey: language,
      sourceCode,
      cases: samples.map((s) => ({ stdin: s.stdin, expectedOutput: s.expected_output })),
      cpuTimeLimitSec: Math.max(1, Math.round(problem.time_limit_ms / 1000)),
      memoryLimitKb: problem.memory_limit_kb,
      reveal: true,
    });

    const cases = results.map((r, i) => ({
      index: i,
      verdict: r.verdict,
      stdin: samples[i].stdin,
      expected: samples[i].expected_output,
      stdout: r.stdout ?? '',
      stderr: r.stderr ?? '',
      compileOutput: r.compileOutput ?? '',
      timeMs: r.timeMs ?? null,
    }));
    const passed = cases.filter((c) => c.verdict === 'accepted').length;

    return NextResponse.json({ passed, total: cases.length, cases });
  } catch (err) {
    if (err instanceof JudgeNotConfiguredError) {
      return NextResponse.json({ error: 'The code judge is not set up yet. Ask an admin.' }, { status: 503 });
    }
    console.error('Run failed:', err);
    return NextResponse.json({ error: 'The judge could not run your code. Try again.' }, { status: 502 });
  }
}

export const dynamic = 'force-dynamic';
