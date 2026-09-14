import { areaForContext, resolveActiveContext, type ActiveContext } from './accessContext';
import type { Identity } from './accessGrants';

/**
 * Which surface a signed-in account belongs on, given its identities and the
 * active-context cookie.
 *
 * The middleware asks this on every protected navigation, so it lives here as a
 * pure, testable function — a wrong answer is a redirect loop, and a redirect
 * loop locks everyone out. The one rule that keeps it loop-free is unchanged:
 * it only ever returns a path that would itself answer `null` on the next pass.
 *
 * Returns the path to redirect to, or null to let the request through.
 *
 * The model:
 *   - one identity  → that console; the cookie is irrelevant.
 *   - many, chosen  → the chosen console; other consoles bounce back to it.
 *   - many, unchosen → the chooser at /choose-access.
 * Switching role means visiting /choose-access and picking again — so a
 * console area is entered only when it matches the ACTIVE context.
 */

type Area = 'admin' | 'leader' | 'member' | 'choose' | 'other';

function areaOfPath(pathname: string): Area {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return 'admin';
  if (pathname === '/leader' || pathname.startsWith('/leader/')) return 'leader';
  if (
    pathname === '/dashboard' || pathname.startsWith('/dashboard/') ||
    pathname === '/onboarding' || pathname.startsWith('/onboarding/')
  ) return 'member';
  if (pathname === '/choose-access') return 'choose';
  return 'other';
}

function areaOfContext(ctx: ActiveContext): Area {
  const path = areaForContext(ctx); // '/admin' | '/leader' | '/dashboard'
  return path === '/admin' ? 'admin' : path === '/leader' ? 'leader' : 'member';
}

export function resolveDestination(
  pathname: string,
  identities: Identity[],
  rawContextCookie: string | null | undefined
): string | null {
  // No identities means "denied", which the caller handles before asking here.
  if (identities.length === 0) return null;

  const active = resolveActiveContext(rawContextCookie, identities);
  const here = areaOfPath(pathname);

  // Multiple identities and none chosen yet → force the chooser.
  if (active === null) {
    return here === 'choose' ? null : '/choose-access';
  }

  const home = areaForContext(active); // a concrete console path
  const activeArea = areaOfContext(active);

  // On the chooser with a single identity, there is nothing to choose.
  if (here === 'choose') {
    return identities.length === 1 ? home : null;
  }

  // Inside a console area: allowed only when it matches the active context.
  if (here === 'admin' || here === 'leader' || here === 'member') {
    return here === activeArea ? null : home;
  }

  // Neutral protected routes (e.g. /extension) are open to everyone allowed.
  return null;
}
