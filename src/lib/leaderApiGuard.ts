import 'server-only';

import { NextResponse } from 'next/server';

import { getRequester, type Requester } from './authz';

type Guard = { ok: true; requester: Requester } | { ok: false; response: NextResponse };

/**
 * A leader of at least one club. Map/roadmap routes are owned by the account
 * (scoped by `owner_id = userId`), not by a club roster, so any leader passes
 * and the per-row owner check does the real isolation.
 */
export async function requireLeader(): Promise<Guard> {
  const requester = await getRequester();
  if (!requester) return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (requester.ledCohorts.length === 0) {
    return { ok: false, response: NextResponse.json({ error: 'Leaders only.' }, { status: 403 }) };
  }
  return { ok: true, requester };
}
