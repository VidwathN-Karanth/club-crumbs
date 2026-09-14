import 'server-only';

import { chatChannelName, type Cohort } from './cohorts';

/**
 * Ping a club's chat channel so open clients refetch straight away.
 *
 * This is a Supabase Realtime BROADCAST — a pub/sub notification, not a data
 * feed. It carries no message content and grants no database access: clients
 * still read the actual messages through the guarded API routes. So it is a
 * pure latency optimisation over polling, and the whole feature degrades to
 * polling if Realtime is disabled, the call fails, or the client never
 * connects. That is why every failure here is swallowed.
 *
 * Sent over the stateless HTTP broadcast endpoint rather than a websocket, so
 * it is safe to call from a short-lived serverless route handler.
 */
export async function pingChatChannel(cohort: Cohort): Promise<void> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || key === 'placeholder-key') return;

  try {
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        messages: [{ topic: chatChannelName(cohort), event: 'new-message', payload: {} }],
      }),
    });
  } catch {
    // Best-effort only; polling is the guaranteed path.
  }
}
