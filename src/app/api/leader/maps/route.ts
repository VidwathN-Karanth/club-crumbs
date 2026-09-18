import { NextResponse } from 'next/server';

import { isCohort } from '@/lib/cohorts';
import { requireLeader } from '@/lib/leaderApiGuard';
import { createMap, listMaps } from '@/lib/mapsData';

export async function GET() {
  const guard = await requireLeader();
  if (!guard.ok) return guard.response;

  try {
    return NextResponse.json({ maps: await listMaps(guard.requester.userId) });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const guard = await requireLeader();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));
  const title = String((body as { title?: string }).title || '').trim();
  if (!title) return NextResponse.json({ error: 'A heading is required.' }, { status: 400 });

  // Tag the map with a club the leader actually leads (their own claim only).
  const asked = (body as { cohort?: string }).cohort;
  const cohort = isCohort(asked) && guard.requester.ledCohorts.includes(asked)
    ? asked
    : guard.requester.ledCohorts[0];

  try {
    return NextResponse.json({ map: await createMap(guard.requester.userId, cohort, title) });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
