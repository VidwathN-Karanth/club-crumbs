'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { apiFetch, apiJson, errorMessage, readJson } from '@/lib/apiClient';
import { chatChannelName, type Cohort } from '@/lib/cohorts';
import { supabase } from '@/lib/supabaseClient';

/** A message as the feed renders it (mirrors ChatMessageRow server-side). */
export interface ChatMessage {
  id: string;
  cohort: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  body: string;
  imageUrl: string | null;
  edited: boolean;
  deleted: boolean;
  createdAt: string;
}

/** How often to poll while the panel is open, and while it is closed. */
const OPEN_POLL_MS = 10_000;
const CLOSED_POLL_MS = 30_000;

export interface UseClubChatOptions {
  /** Manager mode (leader/admin): posting is enabled and the feed comes from
   *  the club-manager endpoints for an explicit cohort. Omit for a member. */
  manage?: boolean;
  /** The club to manage. Required in manage mode; ignored for members (their
   *  club is decided server-side). */
  cohort?: Cohort | null;
}

/**
 * The club chat feed, its unread count, polling, and (in manage mode) posting.
 *
 * Member mode hits the session-scoped endpoints (cohort from the server, never
 * a parameter). Manager mode hits /api/chat/manage with an explicit cohort,
 * guarded by requireClubManager — the same split as coding events.
 *
 * Polling is visibility-aware, matching NotificationCenter: a hidden tab does
 * not poll.
 */
export function useClubChat(open: boolean, opts: UseClubChatOptions = {}) {
  const manage = !!opts.manage;
  const cohort = opts.cohort ?? null;
  const canPost = manage && !!cohort;
  /** In manage mode we need a cohort before we can do anything. */
  const inactive = manage && !cohort;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const cursorRef = useRef<string | null>(null);
  const seenRef = useRef<Set<string>>(new Set());

  /** Build a feed URL for the current mode, with optional extra query. */
  const feedUrl = useCallback(
    (after: string | null) => {
      if (manage) {
        const c = encodeURIComponent(cohort as string);
        return after ? `/api/chat/manage?cohort=${c}&after=${encodeURIComponent(after)}` : `/api/chat/manage?cohort=${c}`;
      }
      return after ? `/api/chat/messages?after=${encodeURIComponent(after)}` : '/api/chat/messages';
    },
    [manage, cohort]
  );

  const markRead = useCallback(async () => {
    if (manage) return; // managers are the posters; no read marker for them
    try {
      await apiFetch('/api/chat/read', { method: 'POST' });
      setUnread(0);
    } catch {
      // Harmless — the badge self-corrects on the next poll.
    }
  }, [manage]);

  const loadInitial = useCallback(async () => {
    if (inactive) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiJson<{ messages: ChatMessage[] }>(feedUrl(null));
      const list = Array.isArray(data.messages) ? data.messages : [];
      seenRef.current = new Set(list.map((m) => m.id));
      cursorRef.current = list.length ? list[list.length - 1].createdAt : null;
      setMessages(list);
    } catch (err) {
      setError(errorMessage(err, 'Could not load the chat.'));
    } finally {
      setLoading(false);
    }
  }, [inactive, feedUrl]);

  const poll = useCallback(async () => {
    if (inactive) return;
    try {
      const data = await apiJson<{ messages: ChatMessage[] }>(feedUrl(cursorRef.current));
      const incoming = (Array.isArray(data.messages) ? data.messages : []).filter(
        (m) => !seenRef.current.has(m.id)
      );
      if (incoming.length) {
        incoming.forEach((m) => seenRef.current.add(m.id));
        cursorRef.current = incoming[incoming.length - 1].createdAt;
        setMessages((prev) => [...prev, ...incoming]);
      }
    } catch {
      // Transient poll failures are ignored; the next tick retries.
    }
  }, [inactive, feedUrl]);

  const refreshUnread = useCallback(async () => {
    if (manage) return;
    try {
      const data = await apiJson<{ count: number }>('/api/chat/unread');
      setUnread(typeof data.count === 'number' ? data.count : 0);
    } catch {
      // Keep the last known count on a transient failure.
    }
  }, [manage]);

  // OPEN: load tail, mark read, poll. CLOSED: keep the badge current (members).
  useEffect(() => {
    let cancelled = false;
    const visible = () => typeof document === 'undefined' || !document.hidden;

    if (open) {
      (async () => {
        await loadInitial();
        if (cancelled) return;
        await markRead();
      })();

      const id = setInterval(async () => {
        if (!visible()) return;
        await poll();
        if (!cancelled) markRead();
      }, OPEN_POLL_MS);
      return () => { cancelled = true; clearInterval(id); };
    }

    (async () => { await refreshUnread(); })();
    const id = setInterval(() => { if (visible()) refreshUnread(); }, CLOSED_POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [open, loadInitial, markRead, poll, refreshUnread]);

  // Realtime (optional): a broadcast ping on the club's channel means "refetch
  // now" — the feed if open, the badge if closed. Purely a latency win over the
  // polling above; if Supabase Realtime is off or never connects, nothing here
  // fires and polling still delivers. Refs keep the subscription stable across
  // open/close so it does not re-subscribe on every toggle.
  const openRef = useRef(open);
  const pollRef = useRef(poll);
  const refreshRef = useRef(refreshUnread);
  // Keep the refs current in an effect (never during render).
  useEffect(() => {
    openRef.current = open;
    pollRef.current = poll;
    refreshRef.current = refreshUnread;
  });

  useEffect(() => {
    const client = supabase;
    if (!cohort || !client) return;
    const channel = client
      .channel(chatChannelName(cohort))
      .on('broadcast', { event: 'new-message' }, () => {
        if (openRef.current) pollRef.current();
        else refreshRef.current();
      })
      .subscribe();
    return () => { client.removeChannel(channel); };
  }, [cohort]);

  /* ── Manager actions ──────────────────────────────────────────────────── */

  /**
   * Upload an image and return its URL, or null on failure (with `error` set).
   * The composer calls this before send() so the message carries a stored URL.
   */
  const uploadImage = useCallback(
    async (file: File): Promise<string | null> => {
      if (!canPost) return null;
      setError('');
      try {
        const fd = new FormData();
        fd.append('cohort', cohort as string);
        fd.append('file', file);
        const res = await apiFetch('/api/chat/upload', { method: 'POST', body: fd });
        const data = await readJson<{ url: string }>(res);
        return data.url ?? null;
      } catch (err) {
        setError(errorMessage(err, 'Could not upload the image.'));
        return null;
      }
    },
    [canPost, cohort]
  );

  /** Post a message (text, image, or both). Returns true on success. */
  const send = useCallback(
    async (text: string, imageUrl?: string | null): Promise<boolean> => {
      const trimmed = text.trim();
      if (!canPost || (!trimmed && !imageUrl)) return false;
      setSending(true);
      setError('');
      try {
        const res = await apiFetch('/api/chat/manage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cohort, body: trimmed, imageUrl: imageUrl ?? null }),
        });
        const data = await readJson<{ message: ChatMessage }>(res);
        const msg = data.message;
        if (msg && !seenRef.current.has(msg.id)) {
          seenRef.current.add(msg.id);
          cursorRef.current = msg.createdAt;
          setMessages((prev) => [...prev, msg]);
        }
        return true;
      } catch (err) {
        setError(errorMessage(err, 'Could not send the message.'));
        return false;
      } finally {
        setSending(false);
      }
    },
    [canPost, cohort]
  );

  /** Edit a message's text. */
  const editMessage = useCallback(
    async (id: string, text: string): Promise<boolean> => {
      const trimmed = text.trim();
      if (!canPost || !trimmed) return false;
      try {
        const res = await apiFetch(`/api/chat/manage/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cohort, body: trimmed }),
        });
        const data = await readJson<{ message: ChatMessage }>(res);
        setMessages((prev) => prev.map((m) => (m.id === id ? data.message : m)));
        return true;
      } catch (err) {
        setError(errorMessage(err, 'Could not edit the message.'));
        return false;
      }
    },
    [canPost, cohort]
  );

  /** Soft-delete a message. */
  const deleteMessage = useCallback(
    async (id: string): Promise<boolean> => {
      if (!canPost) return false;
      try {
        await apiFetch(`/api/chat/manage/${id}?cohort=${encodeURIComponent(cohort as string)}`, {
          method: 'DELETE',
        });
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, deleted: true, body: '', imageUrl: null } : m))
        );
        return true;
      } catch (err) {
        setError(errorMessage(err, 'Could not delete the message.'));
        return false;
      }
    },
    [canPost, cohort]
  );

  return {
    messages,
    unread,
    loading,
    error,
    sending,
    canPost,
    reload: loadInitial,
    send,
    uploadImage,
    editMessage,
    deleteMessage,
  };
}
