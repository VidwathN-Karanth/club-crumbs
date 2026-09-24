import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireClubManager } from '@/lib/authz';
import { isCohort } from '@/lib/cohorts';
import { uploadToUserDrive } from '@/lib/googleDrive';

const BUCKET = 'chat-images';
/** Vercel's serverless request body cap is ~4.5MB — stay under it. */
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

/**
 * Upload one image for a club chat message, returning its public URL.
 *
 * The image goes into the uploader's own Google Drive, shared "anyone with the
 * link", so it costs us no storage. Only if Drive is unavailable (no Google
 * account linked, API error) does it fall back to the Supabase bucket, so
 * image sharing never breaks. The composer compresses images before upload.
 *
 * Only a club manager (admin, or a leader of that club) may upload, and only
 * into a club they manage — the cohort is a form field, checked with
 * requireClubManager. The object key is prefixed with the cohort and the
 * uploader's id, mirroring how certificate deletes are scoped to the caller.
 * The composer stores the returned URL on the message via /api/chat/manage.
 */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Expected a file upload.' }, { status: 400 });

  const cohort = form.get('cohort');
  if (!isCohort(cohort)) {
    return NextResponse.json({ error: 'Missing or invalid "cohort".' }, { status: 400 });
  }

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No image provided.' }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, GIF or WebP images are allowed.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Images must be 4MB or smaller.' }, { status: 400 });
  }

  const ext = EXT[file.type] ?? 'bin';
  // cohort/authorId/<timestamp>-<rand>.ext — grouped by club, attributed to the uploader.
  const key = `${cohort}/${guard.requester.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    const drive = await uploadToUserDrive(
      guard.requester.userId,
      { bytes, name: `club-chat-${cohort}-${Date.now()}.${ext}`, mimeType: file.type },
      true
    );
    // Direct image URL (the /view link is an HTML page and won't render in <img>).
    return NextResponse.json({ url: `https://lh3.googleusercontent.com/d/${drive.id}=w1600` });
  } catch (err) {
    console.warn('[chat/upload] Drive upload failed, falling back to storage:', err);
  }

  try {
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(key, bytes, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(key);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    console.error('[chat/upload] failed:', err);
    return NextResponse.json({ error: 'Could not upload the image.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
