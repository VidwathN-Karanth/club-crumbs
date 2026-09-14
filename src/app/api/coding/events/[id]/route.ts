import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireClubManager } from '@/lib/authz';
import { isCohort } from '@/lib/cohorts';
import { Event } from '@/lib/models/Event';

/**
 * DELETE — remove a tournament card and its linked calendar event. The event's
 * club is resolved from the row and re-checked, so a leader can only delete
 * their own club's cards.
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: row, error: findError } = await supabaseAdmin
    .from('coding_events')
    .select('cohort, event_id')
    .eq('id', id)
    .maybeSingle();
  if (findError || !row) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });

  const cohort = (row as { cohort: string }).cohort;
  if (!isCohort(cohort)) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  const eventId = (row as { event_id: string | null }).event_id;
  if (eventId) {
    try { await Event.remove(eventId); } catch (err) { console.error('Calendar event cleanup failed:', err); }
  }

  const { error } = await supabaseAdmin.from('coding_events').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export const dynamic = 'force-dynamic';
