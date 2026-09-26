import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Heartbeat: marks the caller as online right now.
 *
 * Deliberately uses only `auth()` (verifies the session token locally) and not
 * `currentUser()` — this fires every minute from every open tab, and a Clerk
 * Backend API call per ping is exactly what hit Clerk's rate limit before.
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabaseAdmin.from('users').update({ last_seen_at: new Date().toISOString() }).eq('id', userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
