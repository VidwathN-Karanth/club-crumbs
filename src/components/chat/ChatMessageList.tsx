'use client';

import { useEffect, useRef } from 'react';
import { MessagesSquare } from 'lucide-react';

import ChatMessage, { type ChatMessageActions } from './ChatMessage';
import type { ChatMessage as ChatMessageT } from './useClubChat';

/**
 * The scrollable feed. Sticks to the bottom (newest) as messages arrive, the
 * way a chat is expected to behave — but only when the reader is already near
 * the bottom, so scrolling up to read history is not yanked back down.
 *
 * `actions` is forwarded to each row; in a manager view it enables inline
 * edit/delete, and is a no-op for the read-only member feed.
 */
export default function ChatMessageList({
  messages,
  loading,
  error,
  actions,
}: {
  messages: ChatMessageT[];
  loading: boolean;
  error: string;
  actions?: ChatMessageActions;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-3 py-2 scrollbar-none">
      {loading && messages.length === 0 ? (
        <p className="text-sm text-on-surface-variant py-6 text-center">Loading…</p>
      ) : error ? (
        <p className="text-sm text-rose-400 py-6 text-center">{error}</p>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-10">
          <MessagesSquare className="w-8 h-8 text-on-surface-variant/40" strokeWidth={1.5} />
          <p className="text-sm text-on-surface-variant">No messages yet.</p>
          <p className="text-xs text-on-surface-variant/60">Announcements from your club leaders show up here.</p>
        </div>
      ) : (
        <div className="divide-y divide-outline-variant/40">
          {messages.map((m) => (
            <ChatMessage key={m.id} message={m} {...actions} />
          ))}
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
