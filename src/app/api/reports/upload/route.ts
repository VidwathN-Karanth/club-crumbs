import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireClubManager } from '@/lib/authz';
import { isCohort } from '@/lib/cohorts';
import { Report } from '@/lib/models/Report';

const BUCKET = 'report-images';
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Expected a multipart form upload.' }, { status: 400 });

  const cohort = form.get('cohort');
  if (!isCohort(cohort)) {
    return NextResponse.json({ error: 'Missing or invalid "cohort".' }, { status: 400 });
  }

  const reportId = form.get('reportId');
  if (!reportId || typeof reportId !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid "reportId".' }, { status: 400 });
  }

  // 1. Guard check: requester manages this cohort
  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  // 2. Report verification: report exists and belongs to this cohort
  const report = await Report.findById(reportId);
  if (!report) {
    return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
  }
  if (report.cohort !== cohort) {
    return NextResponse.json({ error: 'Report does not belong to the specified club.' }, { status: 403 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: 'Only JPEG, PNG, or WebP images are allowed.' },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Images must be 4MB or smaller.' }, { status: 400 });
  }

  const ext = EXT[file.type] ?? 'jpg';
  const key = `${cohort}/${reportId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(key, bytes, { contentType: file.type, upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(key);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err: any) {
    console.error('[reports/upload] failed:', err);
    return NextResponse.json(
      { error: err.message || 'Could not upload report image.' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
