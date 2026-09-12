import { isCohort, type Cohort } from './cohorts';
import type { Identity } from './accessGrants';

/**
 * The "active context" — which of their identities a multi-role account is
 * currently acting as.
 *
 * A person who is both an admin and a club leader, or who leads two clubs, has
 * to pick one to look at. That choice is remembered in a cookie so it survives
 * navigation, and the "Switch role" control just rewrites it. The cookie is
 * NEVER trusted on its own: every request re-validates it against the account's
 * real grants (see `contextMatchesIdentity`), so a forged cookie grants nothing.
 *
 * This module is pure string/shape logic with no server imports, so both the
 * proxy (Node) and route handlers can share it.
 */

export const CTX_COOKIE = 'cc_ctx';

export type ActiveContext =
  | { role: 'admin' }
  | { role: 'leader'; cohort: Cohort }
  | { role: 'member'; cohort: Cohort };

/** The console area a context belongs to. */
export function areaForContext(ctx: ActiveContext): '/admin' | '/leader' | '/dashboard' {
  if (ctx.role === 'admin') return '/admin';
  if (ctx.role === 'leader') return '/leader';
  return '/dashboard';
}

/** Cookie value form: `admin`, `leader:Coders%20Club`, `member:Coders%20Club`. */
export function serializeContext(ctx: ActiveContext): string {
  if (ctx.role === 'admin') return 'admin';
  return `${ctx.role}:${encodeURIComponent(ctx.cohort)}`;
}

export function parseContext(raw: string | null | undefined): ActiveContext | null {
  if (!raw) return null;
  if (raw === 'admin') return { role: 'admin' };

  const idx = raw.indexOf(':');
  if (idx === -1) return null;
  const role = raw.slice(0, idx);
  const cohort = decodeURIComponent(raw.slice(idx + 1));
  if (!isCohort(cohort)) return null;
  if (role === 'leader') return { role: 'leader', cohort };
  if (role === 'member') return { role: 'member', cohort };
  return null;
}

function identityToContext(identity: Identity): ActiveContext {
  return identity.kind === 'admin'
    ? { role: 'admin' }
    : { role: identity.kind, cohort: identity.cohort };
}

/** Whether a context corresponds to one of the account's real identities. */
export function contextMatchesIdentity(ctx: ActiveContext, identities: Identity[]): boolean {
  return identities.some((id) => {
    if (id.kind === 'admin') return ctx.role === 'admin';
    return ctx.role === id.kind && ctx.cohort === id.cohort;
  });
}

/**
 * The context to use for this request, given the cookie and the real identities.
 *
 *   - no identities            → null (denied elsewhere)
 *   - exactly one identity     → that one, always (the cookie is irrelevant)
 *   - many, cookie valid       → the cookie's choice
 *   - many, cookie missing/bad → null (the caller sends them to the chooser)
 */
export function resolveActiveContext(
  rawCookie: string | null | undefined,
  identities: Identity[]
): ActiveContext | null {
  if (identities.length === 0) return null;
  if (identities.length === 1) return identityToContext(identities[0]);

  const parsed = parseContext(rawCookie);
  if (parsed && contextMatchesIdentity(parsed, identities)) return parsed;
  return null;
}
