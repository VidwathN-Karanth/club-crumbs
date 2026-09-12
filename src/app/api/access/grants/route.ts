import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/authz';
import { addGrant, adminCount, removeGrant, type Role } from '@/lib/accessGrants';
import { purgeMemberByEmail } from '@/lib/purge';
import { isCollegeEmail } from '@/lib/roster';
import { isCohort, normalizeEmail, type Cohort } from '@/lib/cohorts';
import { collectEmails } from '@/lib/emails';
import { AdminLog } from '@/lib/models/AdminLog';

/**
 * Access management — the admin-only screen for who is an admin, who leads a
 * club, and (across all clubs) who is a member.
 *
 * Every method requires an admin. Leaders never reach here: adding admins or
 * leaders is an admin-only power, and a leader manages their own club's members
 * through /api/club/[cohort]/members instead.
 */

interface GrantView {
  email: string;
  role: Role;
  cohort: Cohort | null;
  granted_by: string | null;
  created_at: string;
}

/** GET — every grant, for the admin console to group and render. */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { data, error } = await supabaseAdmin
      .from('access_grants')
      .select('email, role, cohort, granted_by, created_at')
      .order('role', { ascending: true })
      .order('email', { ascending: true });
    if (error) throw error;

    return NextResponse.json({ grants: (data as GrantView[]) || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Access grants fetch failed:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function parseRole(value: unknown): Role | null {
  return value === 'admin' || value === 'leader' || value === 'member' ? value : null;
}

/**
 * POST — grant a role to one or many emails. Admins may grant any role.
 *
 * Accepts `{ email }` (one) or `{ emails: [...] }` (bulk paste). Each address is
 * validated independently and the response reports what was added and what was
 * skipped, so a single bad line never rejects a whole pasted batch.
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));
  const role = parseRole((body as { role?: string }).role);
  const rawCohort = (body as { cohort?: string }).cohort;
  const cohort: Cohort | null = isCohort(rawCohort) ? rawCohort : null;

  if (!role) return NextResponse.json({ error: 'A valid role is required.' }, { status: 400 });
  if ((role === 'leader' || role === 'member') && !cohort) {
    return NextResponse.json({ error: 'A club is required for a leader or member.' }, { status: 400 });
  }

  const list = collectEmails(body);
  if (list.length === 0) {
    return NextResponse.json({ error: 'At least one email is required.' }, { status: 400 });
  }

  const added: string[] = [];
  const skipped: { email: string; reason: string }[] = [];

  for (const email of list) {
    // Students (leaders and members) use their college account; only admins may
    // be an external (e.g. gmail) address.
    if ((role === 'leader' || role === 'member') && !isCollegeEmail(email)) {
      skipped.push({ email, reason: 'Not an @mite.ac.in address' });
      continue;
    }
    const result = await addGrant({ email, role, cohort }, guard.requester.email);
    if (result.ok) added.push(email);
    else skipped.push({ email, reason: result.message || 'Could not add' });
  }

  if (added.length > 0) {
    const action = role === 'admin' ? 'admin.grant' : role === 'leader' ? 'leader.grant' : 'member.add';
    const label = role === 'admin' ? 'admin' : `${role} of ${cohort}`;
    await AdminLog.record({
      actor: guard.requester,
      action,
      summary:
        added.length === 1
          ? `Made ${added[0]} ${role === 'admin' ? 'an admin' : `a ${label}`}`
          : `Added ${added.length} ${role}s${cohort ? ` to ${cohort}` : ''}`,
      target: added.length === 1 ? added[0] : `${added.length} ${role}s`,
      cohort: cohort ?? null,
    });
  }

  return NextResponse.json({ success: true, added, skipped });
}

/** DELETE — revoke a role. Removing a member also purges their data. */
export async function DELETE(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail((body as { email?: string }).email);
  const role = parseRole((body as { role?: string }).role);
  const rawCohort = (body as { cohort?: string }).cohort;
  const cohort: Cohort | null = isCohort(rawCohort) ? rawCohort : null;

  if (!email) return NextResponse.json({ error: 'An email is required.' }, { status: 400 });
  if (!role) return NextResponse.json({ error: 'A valid role is required.' }, { status: 400 });

  if (role === 'admin' && (await adminCount()) <= 1) {
    return NextResponse.json({ error: 'At least one admin must remain.' }, { status: 409 });
  }

  const result = await removeGrant({ email, role, cohort }, guard.requester.email);
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  let purged = false;
  if (role === 'member') {
    ({ purged } = await purgeMemberByEmail(email));
  }

  const action = role === 'admin' ? 'admin.revoke' : role === 'leader' ? 'leader.revoke' : 'member.remove';
  await AdminLog.record({
    actor: guard.requester,
    action,
    summary:
      role === 'admin'
        ? `Revoked admin from ${email}`
        : role === 'leader'
          ? `Removed ${email} as a leader of ${cohort}`
          : `Removed ${email} from ${cohort}${purged ? ' and purged their workspace' : ''}`,
    target: email,
    cohort: cohort ?? null,
  });

  return NextResponse.json({ success: true, purged });
}

/**
 * PATCH — flip a person between member and leader of a club, keeping their data.
 *
 * Promotion (member → leader) and demotion (leader → member) are two grant
 * writes, not a delete: because staff and member are mutually exclusive, the
 * old grant is removed first and the new one added — but NEVER through the
 * member-purge path, so a promoted student keeps their workspace and history.
 * Admin-only: a leader can never appoint another leader.
 */
export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail((body as { email?: string }).email);
  const to = (body as { to?: string }).to;
  const rawCohort = (body as { cohort?: string }).cohort;
  const cohort: Cohort | null = isCohort(rawCohort) ? rawCohort : null;

  if (!email) return NextResponse.json({ error: 'An email is required.' }, { status: 400 });
  if (!cohort) return NextResponse.json({ error: 'A club is required.' }, { status: 400 });
  if (to !== 'leader' && to !== 'member') {
    return NextResponse.json({ error: 'Target role must be leader or member.' }, { status: 400 });
  }
  if (!isCollegeEmail(email)) {
    return NextResponse.json({ error: 'Leaders and members must have an @mite.ac.in address.' }, { status: 400 });
  }

  const from: Role = to === 'leader' ? 'member' : 'leader';
  // Remove the old role first so the exclusivity check lets the new one in.
  // This does NOT purge data — only the member-remove routes do.
  const removed = await removeGrant({ email, role: from, cohort }, guard.requester.email);
  if (!removed.ok) return NextResponse.json({ error: removed.message }, { status: 400 });

  const added = await addGrant({ email, role: to, cohort }, guard.requester.email);
  if (!added.ok) {
    // Roll back so we never leave the person with neither role.
    await addGrant({ email, role: from, cohort }, guard.requester.email);
    const status = added.error === 'staff_member_conflict' ? 409 : 400;
    return NextResponse.json({ error: added.message }, { status });
  }

  await AdminLog.record({
    actor: guard.requester,
    action: to === 'leader' ? 'leader.grant' : 'leader.revoke',
    summary:
      to === 'leader'
        ? `Promoted ${email} to a leader of ${cohort}`
        : `Returned ${email} to a member of ${cohort}`,
    target: email,
    cohort,
  });

  return NextResponse.json({ success: true });
}

export const dynamic = 'force-dynamic';
