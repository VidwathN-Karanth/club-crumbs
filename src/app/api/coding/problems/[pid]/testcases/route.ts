import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { guardProblem } from '@/lib/codingAuth';

/**
 * The full set of test cases for a problem.
 *
 * PUT replaces the whole set in one shot (the editor sends the current list),
 * which keeps ordering and sample/hidden flags consistent without diffing.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ pid: string }> }) {
  const { pid } = await params;
  const guard = await guardProblem(pid);
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  const incoming = Array.isArray(body.testcases) ? body.testcases : null;
  if (!incoming) return NextResponse.json({ error: 'A testcases array is required.' }, { status: 400 });

  const rows = incoming.map((t: Record<string, unknown>, i: number) => ({
    problem_id: pid,
    position: i,
    stdin: typeof t.stdin === 'string' ? t.stdin : '',
    expected_output: typeof t.expected_output === 'string' ? t.expected_output : '',
    is_sample: Boolean(t.is_sample),
  }));

  // Replace: clear then insert. A problem has a handful of test cases, so the
  // simplicity of a full rewrite beats diffing.
  const { error: delError } = await supabaseAdmin.from('coding_testcases').delete().eq('problem_id', pid);
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

  if (rows.length > 0) {
    const { error: insError } = await supabaseAdmin.from('coding_testcases').insert(rows);
    if (insError) return NextResponse.json({ error: insError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: rows.length });
}

export const dynamic = 'force-dynamic';
