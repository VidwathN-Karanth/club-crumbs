import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireClubManager } from '@/lib/authz';
import { isCohort } from '@/lib/cohorts';

/**
 * Contests for one club — the leader's authoring list.
 *
 * GET  ?cohort=…  → every contest of that club (drafts included), with a
 *                   problem count. Guarded by requireClubManager.
 * POST            → create a draft contest for a club the caller manages.
 */
export async function GET(request: Request) {
  const cohort = new URL(request.url).searchParams.get('cohort');
  if (!isCohort(cohort)) return NextResponse.json({ error: 'A valid club is required.' }, { status: 400 });

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  const { data, error } = await supabaseAdmin
    .from('coding_contests')
    .select('*, coding_problems(count)')
    .eq('cohort', cohort)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const contests = (data || []).map((c: Record<string, unknown>) => ({
    ...c,
    problemCount: Array.isArray(c.coding_problems) ? (c.coding_problems[0] as { count?: number })?.count ?? 0 : 0,
    coding_problems: undefined,
  }));

  return NextResponse.json({ contests });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const cohort = (body as { cohort?: string }).cohort;
  if (!isCohort(cohort)) return NextResponse.json({ error: 'A valid club is required.' }, { status: 400 });

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  const title = String((body as { title?: string }).title || '').trim();
  if (!title) return NextResponse.json({ error: 'A title is required.' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('coding_contests')
    .insert({
      cohort,
      title,
      description: (body as { description?: string }).description ?? null,
      starts_at: (body as { starts_at?: string }).starts_at || null,
      duration_mins: Number((body as { duration_mins?: number }).duration_mins) || 120,
      created_by: guard.requester.email,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contest: data });
}

export const dynamic = 'force-dynamic';
