import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/authz';
import { addGrant, adminCount, removeGrant, type Role } from '@/lib/accessGrants';
import { purgeMemberByEmail } from '@/lib/purge';
import { isCollegeEmail } from '@/lib/roster';
import { isCohort, normalizeEmail, type Cohort } from '@/lib/cohorts';
import { AdminLog } from '@/lib/models/AdminLog';
import { isRootAdmin } from '@/lib/admin';

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

/** POST — grant a role. Admins may grant any role. */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail((body as { email?: string }).email);
  const role = parseRole((body as { role?: string }).role);
  const rawCohort = (body as { cohort?: string }).cohort;
  const cohort: Cohort | null = isCohort(rawCohort) ? rawCohort : null;

  if (!email) return NextResponse.json({ error: 'An email is required.' }, { status: 400 });
  if (!role) return NextResponse.json({ error: 'A valid role is required.' }, { status: 400 });
  if ((role === 'leader' || role === 'member') && !cohort) {
    return NextResponse.json({ error: 'A club is required for a leader or member.' }, { status: 400 });
  }
  // Students (leaders and members) use their college account; only admins may
  // be an external (e.g. gmail) address.
  if ((role === 'leader' || role === 'member') && !isCollegeEmail(email)) {
    return NextResponse.json({ error: 'Leaders and members must have an @mite.ac.in address.' }, { status: 400 });
  }

  const result = await addGrant({ email, role, cohort }, guard.requester.email);
  if (!result.ok) {
    const status = result.error === 'staff_member_conflict' ? 409 : 400;
    return NextResponse.json({ error: result.message }, { status });
  }

  const action = role === 'admin' ? 'admin.grant' : role === 'leader' ? 'leader.grant' : 'member.add';
  await AdminLog.record({
    actor: guard.requester,
    action,
    summary:
      role === 'admin'
        ? `Made ${email} an admin`
        : `Made ${email} a ${role} of ${cohort}`,
    target: email,
    cohort: cohort ?? null,
  });

  return NextResponse.json({ success: true });
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

  if (role === 'admin') {
    if (isRootAdmin(email)) {
      return NextResponse.json({ error: 'The root admin cannot be removed.' }, { status: 403 });
    }
    if ((await adminCount()) <= 1) {
      return NextResponse.json({ error: 'At least one admin must remain.' }, { status: 409 });
    }
  }

  const result = await removeGrant({ email, role, cohort }, guard.requester.email);
  if (!result.ok) {
    const status = result.error === 'root_admin_protected' ? 403 : 400;
    return NextResponse.json({ error: result.message }, { status });
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

export const dynamic = 'force-dynamic';
