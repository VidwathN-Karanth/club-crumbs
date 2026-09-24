import { clerkClient } from '@clerk/nextjs/server';

/** Thrown with an HTTP status the route can pass straight through. */
export class DriveError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export interface DriveFile {
  id: string;
  name: string;
  url: string;
}

/**
 * Uploads a file into the signed-in user's own Google Drive (via the Google
 * token Clerk holds for them), optionally shared "anyone with the link".
 * Nothing touches Supabase storage.
 */
export async function uploadToUserDrive(
  userId: string,
  file: { bytes: Buffer; name: string; mimeType: string },
  makePublic: boolean
): Promise<DriveFile> {
  let token: string | undefined;
  try {
    const client = await clerkClient();
    const res = await client.users.getUserOauthAccessToken(userId, 'oauth_google');
    const tokens = Array.isArray(res) ? res : res?.data;
    token = tokens?.[0]?.token;
  } catch (err) {
    console.error('Clerk error fetching token for Google Drive:', err);
    throw new DriveError('Failed to fetch Google OAuth token from Clerk. Make sure you are logged in with Google.', 403);
  }
  if (!token) {
    throw new DriveError('Google account not connected. Please log in with Google to use Google Drive uploads.', 403);
  }

  // multipart/related: JSON metadata part, then the raw bytes.
  const boundary = '-------314159265358979323846';
  const body = Buffer.concat([
    Buffer.from(`\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`),
    Buffer.from(JSON.stringify({ name: file.name, mimeType: file.mimeType }) + '\r\n'),
    Buffer.from(`\r\n--${boundary}\r\nContent-Type: ${file.mimeType}\r\n\r\n`),
    file.bytes,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': body.length.toString(),
      },
      body,
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error('Google Drive API upload failed:', errText);
    let message = errText;
    try {
      message = JSON.parse(errText)?.error?.message || errText;
    } catch {}
    throw new DriveError(`Google Drive API error: ${message}`, response.status);
  }

  const data = await response.json();

  if (makePublic && data.id) {
    try {
      const perm = await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'reader', type: 'anyone' }),
      });
      if (!perm.ok) console.warn('Failed to set public permission on Google Drive file:', await perm.text());
    } catch (permErr) {
      console.error('Google Drive permission update exception:', permErr);
    }
  }

  return {
    id: data.id,
    name: data.name || file.name,
    url: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view?usp=drivesdk`,
  };
}
