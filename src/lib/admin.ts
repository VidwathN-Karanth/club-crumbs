import 'server-only';

/**
 * Who the department admins are.
 *
 * Server-only, and that import is the whole point rather than a formality: this
 * module used to be imported by browser-side pages — including the public
 * landing page — which meant Next bundled all three addresses into JavaScript
 * served to every visitor of the site, signed in or not. The list is not a
 * credential, but it names exactly which three Google accounts to go after to
 * own the department's data, and nobody needs to be told that.
 *
 * The marker makes that a build failure instead of a silent leak: import this
 * from a client component and the build stops.
 *
 * The browser never needs the list — only whether *it* is an admin. /api/me
 * answers that, and SyncProvider puts the boolean in the store as `isAdmin`.
 * Authorization itself never rests on that flag; every admin route re-checks
 * server-side through requireAdmin() in authz.ts.
 */
export const ADMIN_EMAILS = [
  'vidwathkaranth@gmail.com',
  'shreejith@mite.ac.in',
  'ravinarayana@mite.ac.in',
  'vidhithpai@gmail.com'
];

/**
 * The one admin that lives in code forever.
 *
 * Admins are now stored in the database (public.access_grants) so they can be
 * managed at runtime — but that means a botched migration or a database outage
 * could otherwise leave the app with no admin at all and no way in. This single
 * address is therefore always treated as an admin regardless of the table, and
 * every demote/revoke path refuses to touch it. It is the master key.
 */
export const ROOT_ADMIN = 'vidwathkaranth@gmail.com';

export function isRootAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() === ROOT_ADMIN;
}

/**
 * @deprecated Admins now live in public.access_grants. This static check
 * remains only as the in-code fallback the middleware and grant resolver fold
 * in alongside the database (so the root admin, and the legacy seeds, keep
 * working even before the seed migration runs). Prefer the async resolver in
 * src/lib/accessGrants.ts for authorization decisions.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}
