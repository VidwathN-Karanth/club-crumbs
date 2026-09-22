import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdminCohort } from '@/lib/authz';
import { emailsForCohort } from '@/lib/roster';
import { leaderEmailsForCohort } from '@/lib/accessGrants';

/**
 * Student state rows for one academic year.
 *
 * The console shows one year at a time, so `?cohort=` is required. Cohort
 * membership lives in the roster rather than the database, so the filter is
 * applied here on the email each state row carries.
 */
export async function GET(request: Request) {
  try {
    const guard = await requireAdminCohort(request.url);
    if (!guard.ok) return guard.response;

    const { cohort } = guard.requester;

    const { data, error } = await supabaseAdmin
      .from('user_states')
      .select('*')
      .neq('id', 'global_settings')
      .neq('id', 'global_resources');

    if (error) throw error;

    const rosterEmails = new Set(await emailsForCohort(cohort));
    // Who leads this club, so a leader's own workspace shows alongside members'
    // — flagged with isLeader — even when they hold no member grant.
    const leaderEmails = new Set((await leaderEmailsForCohort(cohort)).map((e) => e.toLowerCase()));

    const scoped = (data || [])
      .filter((row: any) => {
        const email = (row?.state?.user?.email || '').trim().toLowerCase();
        return rosterEmails.has(email) || leaderEmails.has(email);
      })
      .map((row: any) => ({
        ...row,
        isLeader: leaderEmails.has((row?.state?.user?.email || '').trim().toLowerCase()),
      }));

    return NextResponse.json(scoped);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('Admin fetch users failed:', errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
