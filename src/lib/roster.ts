import "server-only";

import { COLLEGE_EMAIL_DOMAIN, normalizeEmail, type Cohort } from "./cohorts";
import {
  getGrantsForEmail,
  memberCohort,
  memberEmailsForCohort,
} from "./accessGrants";

/**
 * ============================================================================
 *  THE CLUB ROSTER — now backed by the database, not a hardcoded list.
 * ============================================================================
 *
 *  Membership used to live in this file as a literal map. It now lives in
 *  public.access_grants and is edited from the app (admins on the Access
 *  Management screen, club leaders on their Members screen). This module is a
 *  thin, backward-compatible façade over src/lib/accessGrants.ts so the many
 *  callers that ask "which club is this student in?" keep working — the reads
 *  are just async now.
 *
 *  The three rules are unchanged, only their home moved:
 *   - An address must end in @mite.ac.in (a member) — admins are the exception,
 *     and they are checked separately, not here.
 *   - An address with no grant cannot sign in.
 *   - Each student belongs to exactly one club (one member grant).
 *
 *  NOTE: admins live in access_grants too (role 'admin'). There is no hardcoded
 *  access of any kind — the last admin simply cannot be removed.
 * ============================================================================
 */

/** Whether this address belongs to the college at all. Pure domain check. */
export function isCollegeEmail(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email);
  return normalized.endsWith(`@${COLLEGE_EMAIL_DOMAIN}`);
}

/** The student's club, or null if they hold no member grant. */
export async function getCohortForEmail(
  email: string | null | undefined,
): Promise<Cohort | null> {
  return memberCohort(await getGrantsForEmail(email));
}

/**
 * The one question the student gate asks: is this address a club member?
 *
 * A member needs both a college address and a member grant. Admins and leaders
 * are staff, not members — they are allowed in through their own guards, not
 * this one.
 */
export async function isOnRoster(email: string | null | undefined): Promise<boolean> {
  if (!isCollegeEmail(email)) return false;
  return (await getCohortForEmail(email)) !== null;
}

/** Every member address for one club, lowercased. Used to scope DB queries. */
export async function emailsForCohort(cohort: Cohort): Promise<string[]> {
  return memberEmailsForCohort(cohort);
}
