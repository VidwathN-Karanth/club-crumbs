import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { guardMemberProblem } from '@/lib/codingAuth';

/**
 * A member's view of one problem to solve: the statement, the allowed
 * languages, and only the SAMPLE test cases. Hidden cases are never sent.
 * Also returns the member's session window so the client can show the timer.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ pid: string }> }) {
  const { pid } = await params;
  const guard = await guardMemberProblem(pid);
  if (!guard.ok) return guard.response;

  const p = guard.data;

  const { data: samples } = await supabaseAdmin
    .from('coding_testcases')
    .select('stdin, expected_output')
    .eq('problem_id', pid)
    .eq('is_sample', true)
    .order('position', { ascending: true });

  const { data: session } = await supabaseAdmin
    .from('coding_sessions')
    .select('started_at, ends_at')
    .eq('contest_id', p.contest_id)
    .eq('user_id', guard.requester.userId)
    .maybeSingle();

  return NextResponse.json({
    problem: {
      id: p.id,
      contest_id: p.contest_id,
      title: p.title,
      statement_md: p.statement_md,
      languages: p.languages,
      points: p.points,
    },
    samples: samples || [],
    session: session || null,
    serverNow: new Date().toISOString(),
  });
}

export const dynamic = 'force-dynamic';
