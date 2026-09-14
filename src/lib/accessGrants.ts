import 'server-only';

import { supabaseAdmin } from './supabaseAdmin';
import { COHORTS, isCohort, normalizeEmail, type Cohort } from './cohorts';

/**
 * ============================================================================
 *  ACCESS GRANTS — the runtime source of truth for who may sign in, and as what.
 * ============================================================================
 *
 *  This replaces the two hardcoded lists (admin.ts's ADMIN_EMAILS and
 *  roster.ts's COHORT_ROSTER). Membership now lives in public.access_grants so
 *  admins and club leaders can change it from the app with no redeploy.
 *
 *  One email may hold SEVERAL grants — that is the entire reason this is a
 *  table. A person can be an admin AND lead a club, or lead two clubs. Each
 *  grant is one (role, club) they hold:
 *
 *      { role: 'admin',  cohort: null           }
 *      { role: 'leader', cohort: 'Coders Club'  }
 *      { role: 'member', cohort: 'Crypton Club' }
 *
 *  There is NO hardcoded access of any kind — not even a root admin. Every
 *  admin, leader and member lives in the table and is managed from the console.
 *
 *  INVARIANTS (enforced here, on every write — never trust the caller):
 *   • staff (admin/leader) and member are mutually exclusive on one email
 *   • only an admin may create/remove admin or leader grants
 *   • a leader may create/remove member grants only for a club THEY lead
 *   • the LAST admin can never be removed, so the app can never be locked out
 * ============================================================================
 */

export type Role = 'admin' | 'leader' | 'member';

export interface Grant {
  email: string;
  role: Role;
  /** Null for admin; the club for leader/member. */
  cohort: Cohort | null;
}

/** One thing a signed-in account can choose to act as, on the chooser screen. */
export type Identity =
  | { kind: 'admin' }
  | { kind: 'leader'; cohort: Cohort }
  | { kind: 'member'; cohort: Cohort };

interface RawGrantRow {
  email: string;
  role: string;
  cohort: string | null;
}

/**
 * A tiny per-instance cache of "all grants for this email".
 *
 * Every gate resolves grants by email, and a protected navigation can trigger
 * several resolutions. Serverless instances are short-lived, so this is
 * best-effort: it collapses the repeats within one instance's life and expires
 * quickly enough that a grant change is visible within seconds. Writes through
 * this module bust the entry for the touched email immediately.
 */
const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { at: number; grants: Grant[] }>();

function coerceCohort(value: string | null): Cohort | null {
  return isCohort(value) ? value : null;
}

/** Every grant an email holds, straight from the table, memoised briefly. */
export async function getGrantsForEmail(email: string | null | undefined): Promise<Grant[]> {
  const normalized = normalizeEmail(email);
  if (!normalized) return [];

  const hit = cache.get(normalized);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.grants;

  let rows: RawGrantRow[] = [];
  try {
    const { data, error } = await supabaseAdmin
      .from('access_grants')
      .select('email, role, cohort')
      .eq('email', normalized);
    if (error) throw error;
    rows = (data as RawGrantRow[]) || [];
  } catch (err) {
    // The database is unreachable. With no hardcoded access, everyone is denied
    // until the table is readable again — the safe direction to fail.
    console.error('[accessGrants] Could not read grants; denying until readable:', err);
    rows = [];
  }

  const parsed: Grant[] = rows
    .filter((r) => r.role === 'admin' || r.role === 'leader' || r.role === 'member')
    .map((r) => ({
      email: normalized,
      role: r.role as Role,
      cohort: r.role === 'admin' ? null : coerceCohort(r.cohort),
    }))
    // A leader/member row whose cohort no longer names a real club is dropped
    // rather than trusted — a renamed club must not silently grant access.
    .filter((g) => g.role === 'admin' || g.cohort !== null);

  cache.set(normalized, { at: Date.now(), grants: parsed });
  return parsed;
}

/** Drop the cached grants for one email (after a write). */
export function invalidateGrants(email: string | null | undefined): void {
  const normalized = normalizeEmail(email);
  if (normalized) cache.delete(normalized);
}

/* ── Derived facts ─────────────────────────────────────────────────────────
   Staff (admin/leader) and member are mutually exclusive, so a person is only
   ever "staff" or "a member", never both. The helpers below encode that. */

export function isAdminGrant(grants: Grant[]): boolean {
  return grants.some((g) => g.role === 'admin');
}

/** The clubs an account leads, in the canonical club order. */
export function ledCohorts(grants: Grant[]): Cohort[] {
  const led = new Set(grants.filter((g) => g.role === 'leader').map((g) => g.cohort));
  return COHORTS.filter((c) => led.has(c));
}

export function isStaffGrant(grants: Grant[]): boolean {
  return grants.some((g) => g.role === 'admin' || g.role === 'leader');
}

/** The single club an account is a member of, if any (independent of staff roles). */
export function memberCohort(grants: Grant[]): Cohort | null {
  const member = grants.find((g) => g.role === 'member');
  return member?.cohort ?? null;
}

/**
 * Everything a signed-in account may act as, in a stable order: admin first,
 * then one card per club led, then the member workspace.
 *
 * ONE card per grant — including a member card alongside staff roles. An email
 * that is both an admin and a member, or a leader of one club and a member of
 * another, is shown a card for each and chooses on /choose-access. An account
 * with a single grant has one identity and never sees the chooser.
 */
export function identitiesFor(grants: Grant[]): Identity[] {
  const out: Identity[] = [];
  if (isAdminGrant(grants)) out.push({ kind: 'admin' });
  for (const cohort of ledCohorts(grants)) out.push({ kind: 'leader', cohort });
  const club = memberCohort(grants);
  if (club) out.push({ kind: 'member', cohort: club });
  return out;
}

/** Whether this email is an admin right now (DB grant or in-code fallback). */
export async function isAdminNow(email: string | null | undefined): Promise<boolean> {
  return isAdminGrant(await getGrantsForEmail(email));
}

/* ── Roster reads (used by the admin data routes) ──────────────────────────── */

/** Every email holding a given role in one club, lowercased. */
async function emailsForRole(cohort: Cohort, role: Role): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('access_grants')
      .select('email')
      .eq('cohort', cohort)
      .eq('role', role);
    if (error) throw error;
    return (data || []).map((r: { email: string }) => normalizeEmail(r.email)).filter(Boolean);
  } catch (err) {
    console.error(`[accessGrants] Could not list ${role}s of ${cohort}:`, err);
    return [];
  }
}

/** Every member email of one club, lowercased. Scopes a club's data queries. */
export async function memberEmailsForCohort(cohort: Cohort): Promise<string[]> {
  return emailsForRole(cohort, 'member');
}

/** Every leader email of one club, lowercased. */
export async function leaderEmailsForCohort(cohort: Cohort): Promise<string[]> {
  return emailsForRole(cohort, 'leader');
}

/* ── Writes ────────────────────────────────────────────────────────────────
   Low-level, invariant-preserving. The API layer decides WHO may call these
   (see requireClubManager / the access routes); these guarantee the data stays
   consistent no matter who does. */

export type GrantError =
  | 'invalid'
  | 'staff_member_conflict'
  | 'db_error';

export interface GrantResult {
  ok: boolean;
  error?: GrantError;
  message?: string;
}

function fail(error: GrantError, message: string): GrantResult {
  return { ok: false, error, message };
}

/**
 * Adds one grant, keeping the invariants.
 *
 * `actorEmail` is recorded for the audit trail only; it does NOT decide
 * permission — the route guard does that before calling in.
 */
export async function addGrant(
  input: { email: string; role: Role; cohort: Cohort | null },
  actorEmail: string
): Promise<GrantResult> {
  const email = normalizeEmail(input.email);
  if (!email) return fail('invalid', 'An email is required.');

  if (input.role === 'admin') {
    if (input.cohort) return fail('invalid', 'An admin grant carries no club.');
  } else {
    if (!isCohort(input.cohort)) return fail('invalid', 'A leader or member grant needs a valid club.');
  }

  // Roles may now coexist on one email (e.g. admin + member, or leader of one
  // club + member of another). Each becomes a card on the sign-in chooser.
  try {
    const { error } = await supabaseAdmin.from('access_grants').insert({
      email,
      role: input.role,
      cohort: input.role === 'admin' ? null : input.cohort,
      granted_by: normalizeEmail(actorEmail) || null,
    });
    // A duplicate (same email/role/club) is a no-op success, not a failure.
    if (error && !String(error.message).toLowerCase().includes('duplicate')) throw error;
  } catch (err) {
    console.error('[accessGrants] addGrant failed:', err);
    return fail('db_error', 'Could not save that grant.');
  }

  invalidateGrants(email);
  return { ok: true };
}

/**
 * Removes one grant. The last-admin guard lives in the route (it needs the
 * live count), so this is a plain delete.
 */
export async function removeGrant(
  input: { email: string; role: Role; cohort: Cohort | null },
  _actorEmail: string
): Promise<GrantResult> {
  const email = normalizeEmail(input.email);
  if (!email) return fail('invalid', 'An email is required.');

  try {
    let q = supabaseAdmin.from('access_grants').delete().eq('email', email).eq('role', input.role);
    q = input.cohort ? q.eq('cohort', input.cohort) : q.is('cohort', null);
    const { error } = await q;
    if (error) throw error;
  } catch (err) {
    console.error('[accessGrants] removeGrant failed:', err);
    return fail('db_error', 'Could not remove that grant.');
  }

  invalidateGrants(email);
  return { ok: true };
}

/** How many distinct admins exist right now. Guards the last-admin case. */
export async function adminCount(): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin
      .from('access_grants')
      .select('email')
      .eq('role', 'admin');
    if (error) throw error;
    const emails = new Set(
      (data || []).map((r: { email: string }) => normalizeEmail(r.email))
    );
    return emails.size;
  } catch (err) {
    console.error('[accessGrants] adminCount failed:', err);
    // Report more-than-one on failure so a delete is refused rather than
    // risking the removal of a genuine last admin against a bad read.
    return 2;
  }
}
