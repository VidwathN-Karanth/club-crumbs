import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRequester } from '@/lib/authz';
import { CTX_COOKIE, resolveActiveContext, serializeContext } from '@/lib/accessContext';

/**
 * Who am I, and everything I may act as?
 *
 * The single place the browser learns its own access. The grants are
 * server-only, so this endpoint hands back only the derived facts the UI needs:
 * whether the account is an admin, which club it belongs to (for a member), the
 * full list of identities (for the chooser), and which one is currently active.
 *
 * `needsChoice` is true when the account has more than one identity and has not
 * yet picked one — the client sends them to /choose-access.
 */
export async function GET() {
  const requester = await getRequester();

  if (!requester) {
    return NextResponse.json(
      { signedIn: false, allowed: false, reason: 'signed_out' },
      { status: 401 }
    );
  }

  const rawCtx = (await cookies()).get(CTX_COOKIE)?.value ?? null;
  const active = resolveActiveContext(rawCtx, requester.identities);

  return NextResponse.json({
    signedIn: true,
    email: requester.email,
    isAdmin: requester.isAdmin,
    // Kept for backward compatibility with SyncProvider's roster gate.
    cohort: requester.cohort,
    allowed: requester.allowed,
    reason: requester.denialReason,
    identities: requester.identities,
    ledCohorts: requester.ledCohorts,
    activeContext: active ? serializeContext(active) : null,
    needsChoice: requester.identities.length > 1 && active === null,
  });
}

export const dynamic = 'force-dynamic';
