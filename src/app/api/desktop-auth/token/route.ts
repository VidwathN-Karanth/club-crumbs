import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

import { getRequester } from '@/lib/authz';
import { isCollegeEmail } from '@/lib/roster';

/**
 * Hands the desktop app a one-time Clerk sign-in token.
 *
 * Google refuses OAuth inside Electron's window, so the app sends the student
 * to /desktop-auth in their normal browser. Once signed in there, that page
 * calls this route and bounces the token back via clubcrumbs://auth?ticket=…,
 * where the app redeems it with the `ticket` strategy.
 *
 * Session-only, and the roster is checked here again: the token is a full
 * sign-in, so it must never be minted for someone the website would turn away.
 * The token itself is never logged.
 */

const TOKEN_TTL_SECONDS = 60;

// ponytail: per-instance limiter, resets on cold start; move to a shared store if abuse shows up.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const recent = new Map<string, number[]>();

function rateLimited(userId: string): boolean {
  const now = Date.now();
  const hits = (recent.get(userId) || []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(userId, hits);
  return hits.length > MAX_PER_WINDOW;
}

export async function POST() {
  const requester = await getRequester();
  if (!requester) {
    return NextResponse.json({ error: 'Unauthorized', reason: 'signed_out' }, { status: 401 });
  }
  // Same rule as the rest of the site: a grant is required, and only admins
  // may hold one on a non-college address.
  if (!requester.allowed || (!requester.isAdmin && !isCollegeEmail(requester.email))) {
    return NextResponse.json(
      { error: 'Your account is not on a club roster yet.', reason: requester.denialReason },
      { status: 403 }
    );
  }
  if (rateLimited(requester.userId)) {
    return NextResponse.json({ error: 'Too many attempts. Wait a minute and try again.' }, { status: 429 });
  }

  try {
    const client = await clerkClient();
    const { token } = await client.signInTokens.createSignInToken({
      userId: requester.userId,
      expiresInSeconds: TOKEN_TTL_SECONDS,
    });
    return NextResponse.json({ ticket: token }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Desktop sign-in token failed:', message);
    return NextResponse.json({ error: 'Could not create a sign-in token.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
