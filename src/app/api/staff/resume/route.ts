import { NextResponse } from 'next/server';
import { User } from '@/lib/models/User';
import { getRequester, type Requester } from '@/lib/authz';

/**
 * A staff member's (leader or admin) own CV.
 *
 * Mirrors the student resume route, but for staff — leaders upload theirs from
 * their Settings. The file lives in the uploader's own Drive; we store the link
 * on their users row, so admins can collect leader CVs alongside student ones.
 */
async function requireStaff(): Promise<
  { ok: true; requester: Requester } | { ok: false; response: NextResponse }
> {
  const requester = await getRequester();
  if (!requester) return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const isStaff = requester.isAdmin || requester.ledCohorts.length > 0;
  if (!isStaff) return { ok: false, response: NextResponse.json({ error: 'Staff only.' }, { status: 403 }) };
  return { ok: true, requester };
}

export async function GET() {
  const guard = await requireStaff();
  if (!guard.ok) return guard.response;

  const user = await User.findById(guard.requester.userId);
  return NextResponse.json({
    resume: user?.resumeUrl
      ? { url: user.resumeUrl, name: user.resumeName, uploadedAt: user.resumeUploadedAt }
      : null,
  });
}

export async function POST(request: Request) {
  const guard = await requireStaff();
  if (!guard.ok) return guard.response;

  try {
    const { url, name } = await request.json();
    if (typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({ error: 'A link to your CV is required.' }, { status: 400 });
    }
    let parsed: URL;
    try { parsed = new URL(url.trim()); } catch {
      return NextResponse.json({ error: 'That does not look like a valid link.' }, { status: 400 });
    }
    if (parsed.protocol !== 'https:') {
      return NextResponse.json({ error: 'The link must start with https://' }, { status: 400 });
    }

    const existing = await User.findById(guard.requester.userId);
    if (existing?.resumeUrl) {
      return NextResponse.json({ error: 'You already have a CV uploaded. Remove it first.' }, { status: 409 });
    }
    if (!existing) {
      await User.create({ id: guard.requester.userId, name: guard.requester.name, email: guard.requester.email });
    }

    const updated = await User.update(guard.requester.userId, {
      resumeUrl: parsed.toString(),
      resumeName: (typeof name === 'string' && name.trim()) || 'Resume',
      resumeUploadedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      resume: { url: updated?.resumeUrl, name: updated?.resumeName, uploadedAt: updated?.resumeUploadedAt },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE() {
  const guard = await requireStaff();
  if (!guard.ok) return guard.response;

  await User.update(guard.requester.userId, { resumeUrl: null, resumeName: null, resumeUploadedAt: null });
  return NextResponse.json({ success: true, resume: null });
}

export const dynamic = 'force-dynamic';
