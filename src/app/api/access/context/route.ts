import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRequester } from '@/lib/authz';
import {
  CTX_COOKIE,
  areaForContext,
  contextMatchesIdentity,
  parseContext,
} from '@/lib/accessContext';

/**
 * Sets the active-context cookie — which identity a multi-role account is
 * acting as. This is what the /choose-access cards and the "Switch role"
 * control call.
 *
 * The chosen context is validated against the account's real identities before
 * it is written, so the cookie can never name a role the account does not hold.
 * The response says where to land, and the proxy re-checks the cookie on every
 * navigation regardless.
 */
export async function POST(request: Request) {
  const requester = await getRequester();
  if (!requester) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const ctx = parseContext((body as { context?: string }).context);

  if (!ctx || !contextMatchesIdentity(ctx, requester.identities)) {
    return NextResponse.json({ error: 'That is not one of your roles.' }, { status: 400 });
  }

  const store = await cookies();
  store.set(CTX_COOKIE, (body as { context: string }).context, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return NextResponse.json({ success: true, redirect: areaForContext(ctx) });
}

export const dynamic = 'force-dynamic';
