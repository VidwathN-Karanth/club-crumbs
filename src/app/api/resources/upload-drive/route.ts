import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { uploadToUserDrive, DriveError } from '@/lib/googleDrive';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const makePublic = formData.get('makePublic') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const uploaded = await uploadToUserDrive(
      userId,
      {
        bytes: Buffer.from(await file.arrayBuffer()),
        name: name || file.name,
        mimeType: file.type || 'application/octet-stream',
      },
      makePublic
    );

    return NextResponse.json({
      success: true,
      file: { name: uploaded.name, url: uploaded.url, driveId: uploaded.id },
    });
  } catch (error) {
    if (error instanceof DriveError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Google Drive sync exception:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
