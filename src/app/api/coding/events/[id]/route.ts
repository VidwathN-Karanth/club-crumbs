import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireClubManager } from '@/lib/authz';
import { isCohort } from '@/lib/cohorts';

/**
 * DELETE — remove a coding event entirely. The event's own club is resolved
 * from the row and re-checked, so a leader can only delete their own club's
 * cards. Deleting the row is the whole deletion (there is no other data).
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: event, error: findError } = await supabaseAdmin
    .from('coding_events')
    .select('cohort')
    .eq('id', id)
    .maybeSingle();
  if (findError || !event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });

  const cohort = (event as { cohort: string }).cohort;
  if (!isCohort(cohort)) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  const { error } = await supabaseAdmin.from('coding_events').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export const dynamic = 'force-dynamic';
