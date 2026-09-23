import { NextResponse } from 'next/server';
import { requireAdmin, requireClubManager } from '@/lib/authz';
import { isCohort } from '@/lib/cohorts';
import { Report } from '@/lib/models/Report';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cohort = url.searchParams.get('cohort');

  // Admins can list every club's reports at once.
  if (cohort === 'all') {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;
    try {
      return NextResponse.json({ reports: await Report.findForCohort(null) });
    } catch (err: any) {
      console.error('[reports/GET] failed:', err);
      return NextResponse.json({ error: err.message || 'Could not load reports.' }, { status: 500 });
    }
  }

  if (!isCohort(cohort)) {
    return NextResponse.json(
      { error: 'Missing or invalid "cohort" query parameter.' },
      { status: 400 }
    );
  }

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  try {
    const reports = await Report.findForCohort(cohort);
    return NextResponse.json({ reports });
  } catch (err: any) {
    console.error('[reports/GET] failed:', err);
    return NextResponse.json(
      { error: err.message || 'Could not load reports.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { title, cohort, eventId, documentJson, documentHtml, documentCss } = body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'Report title is required.' }, { status: 400 });
  }

  if (!isCohort(cohort)) {
    return NextResponse.json({ error: 'Missing or invalid "cohort".' }, { status: 400 });
  }

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  try {
    const report = await Report.create({
      title: title.trim(),
      cohort,
      eventId: typeof eventId === 'string' && eventId.trim() ? eventId.trim() : null,
      documentJson: typeof documentJson === 'object' ? documentJson : {},
      documentHtml: typeof documentHtml === 'string' ? documentHtml : null,
      documentCss: typeof documentCss === 'string' ? documentCss : null,
      createdBy: guard.requester.userId,
      creatorName: guard.requester.name,
      creatorEmail: guard.requester.email,
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (err: any) {
    console.error('[reports/POST] failed:', err);
    return NextResponse.json(
      { error: err.message || 'Could not create report.' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
