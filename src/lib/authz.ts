import 'server-only';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth, currentUser } from '@clerk/nextjs/server';

import { COHORTS, isCohort, type Cohort } from './cohorts';
import { isCollegeEmail } from './roster';
import { CTX_COOKIE, resolveActiveContext, type ActiveContext } from './accessContext';
import {
  getGrantsForEmail,
  identitiesFor,
  isAdminGrant,
  ledCohorts,
  memberCohort,
  type Grant,
  type Identity,
} from './accessGrants';
import {
  isDevAuthBypass,
  MOCK_DEV_USER_ID,
  MOCK_DEV_EMAIL,
  MOCK_DEV_NAME,
  MOCK_DEV_GRANTS,
  MOCK_DEV_IDENTITIES,
  MOCK_DEV_LED_COHORTS,
  MOCK_DEV_COHORT,
} from './devAuth';

export type AccessDenialReason = 'signed_out' | 'wrong_domain' | 'not_on_roster';

export interface Requester {
  userId: string;
  email: string;
  /** Display name from the Google account. Never taken from client input. */
  name: string;
  /** Every grant this account holds (admin / leader-of-club / member-of-club). */
  grants: Grant[];
  /** Everything they may act as: admin, a card per club led, and a member card. */
  identities: Identity[];
  isAdmin: boolean;
  /** The clubs they lead (empty for a non-leader). */
  ledCohorts: Cohort[];
  /** The club they belong to as a member — null if they hold no member grant. */
  cohort: Cohort | null;
  /**
   * Which identity they are currently acting as, from the validated cc_ctx
   * cookie (or their only identity). Lets a person who is both staff and a
   * member use the member workspace when they chose the member card.
   */
  activeContext: ActiveContext | null;
  allowed: boolean;
  denialReason: AccessDenialReason | null;
}

/**
 * Resolves who is making this request and everything they are entitled to.
 *
 * Roles come from the database (public.access_grants), so one account can hold
 * several — admin AND a leader, a leader of two clubs, or staff AND a member.
 * The active-context cookie says which one they are acting as right now.
 */
export async function getRequester(): Promise<Requester | null> {
  if (isDevAuthBypass()) {
    const rawCtx = (await cookies()).get(CTX_COOKIE)?.value ?? null;
    const activeContext = resolveActiveContext(rawCtx, MOCK_DEV_IDENTITIES) || { role: 'admin' };
    return {
      userId: MOCK_DEV_USER_ID,
      email: MOCK_DEV_EMAIL,
      name: MOCK_DEV_NAME,
      grants: MOCK_DEV_GRANTS,
      identities: MOCK_DEV_IDENTITIES,
      isAdmin: true,
      ledCohorts: [...MOCK_DEV_LED_COHORTS],
      cohort: MOCK_DEV_COHORT,
      activeContext,
      allowed: true,
      denialReason: null,
    };
  }

  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress || '';
  const name = user?.fullName || user?.firstName || email.split('@')[0] || 'Student';

  const grants = await getGrantsForEmail(email);
  const identities = identitiesFor(grants);
  const isAdmin = isAdminGrant(grants);
  const led = ledCohorts(grants);
  const cohort = memberCohort(grants);

  const rawCtx = (await cookies()).get(CTX_COOKIE)?.value ?? null;
  const activeContext = resolveActiveContext(rawCtx, identities);

  const base = { userId, email, name, grants, identities, isAdmin, ledCohorts: led, cohort, activeContext };

  if (identities.length === 0) {
    // No grant at all. A non-college address that is not an admin is the wrong
    // domain; a college address with no grant is simply not on any roster yet.
    const reason: AccessDenialReason = isCollegeEmail(email) ? 'not_on_roster' : 'wrong_domain';
    return { ...base, allowed: false, denialReason: reason };
  }

  return { ...base, allowed: true, denialReason: null };
}

type Guard<T> = { ok: true; requester: T } | { ok: false; response: NextResponse };

function deny(status: number, error: string, reason?: AccessDenialReason): { ok: false; response: NextResponse } {
  return { ok: false, response: NextResponse.json({ error, reason }, { status }) };
}

/** Requires a signed-in admin (holds an admin grant). */
export async function requireAdmin(): Promise<Guard<Requester>> {
  const requester = await getRequester();
  if (!requester) return deny(401, 'Unauthorized', 'signed_out');
  if (!requester.isAdmin) return deny(401, 'Unauthorized admin access');
  return { ok: true, requester };
}

/**
 * Requires a signed-in member. The returned cohort is non-null and derived from
 * the session — never a query parameter — so nobody can ask for another club's
 * data.
 *
 * Someone who is ONLY staff is turned away (they use the console). But a person
 * who is both staff and a member may use the workspace when they are acting in
 * their member context (chosen on the sign-in chooser), so an admin who is also
 * a DevStudio member can open the DevStudio workspace.
 */
export async function requireStudent(): Promise<Guard<Requester & { cohort: Cohort }>> {
  const requester = await getRequester();
  if (!requester) return deny(401, 'Unauthorized', 'signed_out');

  const isStaff = requester.isAdmin || requester.ledCohorts.length > 0;
  const inMemberContext = requester.activeContext?.role === 'member';

  if (isStaff && !inMemberContext) {
    return deny(403, 'Staff use the console, not the student workspace.');
  }
  if (requester.denialReason === 'wrong_domain') {
    return deny(403, 'Club Crumbs is open only to college accounts.', 'wrong_domain');
  }
  if (!requester.cohort) {
    return deny(403, 'Your email is not on a club roster yet.', 'not_on_roster');
  }

  return { ok: true, requester: { ...requester, cohort: requester.cohort } };
}

/**
 * Requires a signed-in admin AND an explicit, valid `?cohort=` parameter.
 *
 * The admin console shows one club at a time, so every admin data route must
 * say which club it means.
 */
export async function requireAdminCohort(url: string): Promise<Guard<Requester & { cohort: Cohort }>> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const raw = new URL(url).searchParams.get('cohort');
  if (!isCohort(raw)) {
    return deny(400, `Missing or invalid "cohort" parameter. Expected one of: ${COHORTS.join(', ')}.`);
  }

  return { ok: true, requester: { ...guard.requester, cohort: raw } };
}

/**
 * Requires someone allowed to MANAGE a specific club: an admin (any club) or a
 * leader of THAT club. This is the guard the member add/remove/list routes use.
 *
 * The cohort is passed in (from the route path), and a leader is checked
 * against their own led clubs — so a leader of one club can never touch
 * another's members, and the URL alone never grants that reach.
 */
export async function requireClubManager(cohort: Cohort): Promise<Guard<Requester & { cohort: Cohort }>> {
  const requester = await getRequester();
  if (!requester) return deny(401, 'Unauthorized', 'signed_out');

  const canManage = requester.isAdmin || requester.ledCohorts.includes(cohort);
  if (!canManage) return deny(403, `You do not manage ${cohort}.`);

  return { ok: true, requester: { ...requester, cohort } };
}
