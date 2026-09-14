import { NextResponse } from 'next/server';
import { requireClubManager } from '@/lib/authz';
import { Report } from '@/lib/models/Report';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Report ID is required.' }, { status: 400 });
  }

  const report = await Report.findById(id);
  if (!report) {
    return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
  }

  const guard = await requireClubManager(report.cohort);
  if (!guard.ok) return guard.response;

  return NextResponse.json({ report });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Report ID is required.' }, { status: 400 });
  }

  const report = await Report.findById(id);
  if (!report) {
    return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
  }

  const guard = await requireClubManager(report.cohort);
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { title, status, documentJson, documentHtml, documentCss } = body;

  try {
    const updated = await Report.update(id, {
      title: typeof title === 'string' && title.trim() ? title.trim() : undefined,
      status: status && ['draft', 'published', 'archived'].includes(status) ? status : undefined,
      documentJson: typeof documentJson === 'object' ? documentJson : undefined,
      documentHtml: typeof documentHtml === 'string' ? documentHtml : undefined,
      documentCss: typeof documentCss === 'string' ? documentCss : undefined,
      updatedBy: guard.requester.userId,
    });

    return NextResponse.json({ report: updated });
  } catch (err: any) {
    console.error('[reports/[id]/PATCH] failed:', err);
    return NextResponse.json(
      { error: err.message || 'Could not update report.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Report ID is required.' }, { status: 400 });
  }

  const report = await Report.findById(id);
  if (!report) {
    return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
  }

  const guard = await requireClubManager(report.cohort);
  if (!guard.ok) return guard.response;

  try {
    await Report.remove(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[reports/[id]/DELETE] failed:', err);
    return NextResponse.json(
      { error: err.message || 'Could not delete report.' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
