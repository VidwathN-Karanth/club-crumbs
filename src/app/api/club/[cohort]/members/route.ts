import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireClubManager } from '@/lib/authz';
import { addGrant, memberEmailsForCohort, removeGrant } from '@/lib/accessGrants';
import { purgeMemberByEmail } from '@/lib/purge';
import { isCollegeEmail } from '@/lib/roster';
import { isCohort, normalizeEmail, type Cohort } from '@/lib/cohorts';
import { collectEmails } from '@/lib/emails';
import { AdminLog } from '@/lib/models/AdminLog';

/**
 * A club's members — the screen leaders live on, and admins share.
 *
 * Every method is gated by requireClubManager(cohort): an admin (any club) or a
 * leader of THIS club. The club comes from the path and is re-derived on the
 * server, so a leader of one club can never reach another's members by editing
 * a URL.
 */

async function resolveCohort(params: Promise<{ cohort: string }>): Promise<Cohort | null> {
  const { cohort } = await params;
  const decoded = decodeURIComponent(cohort);
  return isCohort(decoded) ? decoded : null;
}

interface MemberRow {
  email: string;
  name: string | null;
  hasAccount: boolean;
  onboarded: boolean;
  lastSync: string | null;
}

/** GET — the roster of this club, each member with their sign-in status. */
export async function GET(request: Request, { params }: { params: Promise<{ cohort: string }> }) {
  const cohort = await resolveCohort(params);
  if (!cohort) return NextResponse.json({ error: 'Unknown club.' }, { status: 400 });

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  try {
    const emails = await memberEmailsForCohort(cohort);
    const emailSet = new Set(emails);

    // One scan of the synced workspaces, matched back to the roster by the
    // email each state row carries.
    const { data, error } = await supabaseAdmin
      .from('user_states')
      .select('id, state, updated_at')
      .neq('id', 'global_settings')
      .neq('id', 'global_resources');
    if (error) throw error;

    const byEmail = new Map<string, { name: string | null; onboarded: boolean; lastSync: string | null }>();
    for (const row of data || []) {
      const state = (row as { state?: { user?: { email?: string; name?: string; isOnboarded?: boolean } } }).state;
      const email = normalizeEmail(state?.user?.email);
      if (!email || !emailSet.has(email)) continue;
      byEmail.set(email, {
        name: state?.user?.name ?? null,
        onboarded: Boolean(state?.user?.isOnboarded),
        lastSync: (row as { updated_at?: string }).updated_at ?? null,
      });
    }

    const members: MemberRow[] = emails
      .map((email) => {
        const hit = byEmail.get(email);
        return {
          email,
          name: hit?.name ?? null,
          hasAccount: Boolean(hit),
          onboarded: hit?.onboarded ?? false,
          lastSync: hit?.lastSync ?? null,
        };
      })
      .sort((a, b) => a.email.localeCompare(b.email));

    return NextResponse.json({ cohort, members });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Club members fetch failed for ${cohort}:`, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST — add one or many members.
 *
 * Accepts `{ email }` (one) or `{ emails: [...] }` (bulk paste). Every address
 * is validated on its own, so one bad entry in a pasted block does not sink the
 * rest: the response reports what was added and what was skipped and why.
 */
export async function POST(request: Request, { params }: { params: Promise<{ cohort: string }> }) {
  const cohort = await resolveCohort(params);
  if (!cohort) return NextResponse.json({ error: 'Unknown club.' }, { status: 400 });

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));
  const list = collectEmails(body);
  if (list.length === 0) {
    return NextResponse.json({ error: 'At least one email is required.' }, { status: 400 });
  }

  const added: string[] = [];
  const skipped: { email: string; reason: string }[] = [];

  for (const email of list) {
    if (!isCollegeEmail(email)) {
      skipped.push({ email, reason: 'Not an @mite.ac.in address' });
      continue;
    }
    const result = await addGrant({ email, role: 'member', cohort }, guard.requester.email);
    if (result.ok) added.push(email);
    else skipped.push({ email, reason: result.message || 'Could not add' });
  }

  if (added.length > 0) {
    await AdminLog.record({
      actor: guard.requester,
      action: 'member.add',
      summary:
        added.length === 1
          ? `Added ${added[0]} to ${cohort}`
          : `Added ${added.length} members to ${cohort}`,
      target: added.length === 1 ? added[0] : `${added.length} members`,
      cohort,
    });
  }

  return NextResponse.json({ success: true, added, skipped });
}

/** DELETE — remove a member and purge all of their data. */
export async function DELETE(request: Request, { params }: { params: Promise<{ cohort: string }> }) {
  const cohort = await resolveCohort(params);
  if (!cohort) return NextResponse.json({ error: 'Unknown club.' }, { status: 400 });

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail((body as { email?: string }).email);
  if (!email) return NextResponse.json({ error: 'An email is required.' }, { status: 400 });

  // Revoke access first: even if the data purge below partially fails, the
  // person can no longer sign in, which is the point of "remove".
  const result = await removeGrant({ email, role: 'member', cohort }, guard.requester.email);
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  const { purged } = await purgeMemberByEmail(email);

  await AdminLog.record({
    actor: guard.requester,
    action: 'member.remove',
    summary: purged
      ? `Removed ${email} from ${cohort} and purged their workspace`
      : `Removed ${email} from ${cohort} (no synced workspace to purge)`,
    target: email,
    cohort,
  });

  return NextResponse.json({ success: true, purged });
}

export const dynamic = 'force-dynamic';
