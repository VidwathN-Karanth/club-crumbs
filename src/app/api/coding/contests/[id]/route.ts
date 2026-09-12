import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { guardContest } from '@/lib/codingAuth';

/**
 * One contest, for authoring.
 *
 * GET    → the contest plus its problems (with test-case counts).
 * PATCH  → edit fields, or publish/unpublish. Publishing is refused unless the
 *          contest is actually solvable (problems, languages, test cases).
 * DELETE → remove the contest and everything under it (cascade).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await guardContest(id);
  if (!guard.ok) return guard.response;

  const { data: problems, error } = await supabaseAdmin
    .from('coding_problems')
    .select('*, coding_testcases(count)')
    .eq('contest_id', id)
    .order('position', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const shaped = (problems || []).map((p: Record<string, unknown>) => ({
    ...p,
    testcaseCount: Array.isArray(p.coding_testcases) ? (p.coding_testcases[0] as { count?: number })?.count ?? 0 : 0,
    coding_testcases: undefined,
  }));

  return NextResponse.json({ contest: guard.data, problems: shaped });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await guardContest(id);
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};

  if (typeof body.title === 'string') patch.title = body.title.trim();
  if ('description' in body) patch.description = body.description ?? null;
  if ('starts_at' in body) patch.starts_at = body.starts_at || null;
  if ('duration_mins' in body) patch.duration_mins = Number(body.duration_mins) || 120;

  if (body.status === 'draft' || body.status === 'published') {
    if (body.status === 'published') {
      const problem = await assertPublishable(id);
      if (problem) return NextResponse.json({ error: problem }, { status: 400 });
    }
    patch.status = body.status;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('coding_contests')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contest: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await guardContest(id);
  if (!guard.ok) return guard.response;

  const { error } = await supabaseAdmin.from('coding_contests').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

/** Returns an error string if the contest is not ready to publish, else null. */
async function assertPublishable(contestId: string): Promise<string | null> {
  const { data: problems } = await supabaseAdmin
    .from('coding_problems')
    .select('id, languages, coding_testcases(count)')
    .eq('contest_id', contestId);

  if (!problems || problems.length === 0) return 'Add at least one problem before publishing.';

  for (const p of problems as Array<{ id: string; languages: string[]; coding_testcases: { count: number }[] }>) {
    if (!Array.isArray(p.languages) || p.languages.length === 0) {
      return 'Every problem needs at least one allowed language.';
    }
    const tc = Array.isArray(p.coding_testcases) ? p.coding_testcases[0]?.count ?? 0 : 0;
    if (tc === 0) return 'Every problem needs at least one test case.';
  }
  return null;
}

export const dynamic = 'force-dynamic';
