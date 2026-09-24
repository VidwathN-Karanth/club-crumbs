'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

import { useStore } from '@/store/useStore';
import { shortCohortLabel, type Cohort } from '@/lib/cohorts';
import { announce, OPEN_CHAT_EVENT } from '@/lib/notifications';

import ChatPanel from './ChatPanel';
import { useClubChat } from './useClubChat';

/**
 * The floating chat button + unread badge, plus the panel it opens.
 *
 * Two modes:
 *   • member  (default) — read-only feed for the student's own club (from the
 *     store's cohort), using the session-scoped endpoints.
 *   • manager (manage)  — leaders/admins post to an explicit club and get inline
 *     edit/delete on messages they may modify.
 *
 * Mounted once per portal layout, next to NotificationCenter. With no club (or
 * before hydration) it renders nothing rather than an empty chat.
 */
export default function ChatLauncher({
  manage = false,
  cohort: cohortProp = null,
  title,
  isAdmin = false,
}: {
  manage?: boolean;
  cohort?: Cohort | null;
  title?: string;
  isAdmin?: boolean;
}) {
  const memberCohort = useStore((s) => s.cohort);
  const { user } = useUser();
  const [open, setOpen] = useState(false);

  const cohort = manage ? cohortProp : memberCohort;
  const {
    messages, pinned, unread, loading, error, sending, canPost, send, uploadImage, editMessage, deleteMessage, togglePin,
  } = useClubChat(open, { manage, cohort });

  const label = cohort ? title ?? shortCohortLabel(cohort) : '';

  // Let a chat toast / notification click open the panel (it has no route).
  useEffect(() => {
    const openPanel = () => setOpen(true);
    window.addEventListener(OPEN_CHAT_EVENT, openPanel);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, openPanel);
  }, []);

  // Announce new messages while the panel is closed (members only — managers
  // are the posters). The unread count already excludes the viewer's own posts,
  // so any rise is someone else's message. The first observed value is a
  // baseline, so opening the app never re-announces the existing backlog, and
  // the tag collapses repeats in the OS notification centre.
  const prevUnreadRef = useRef<number | null>(null);
  useEffect(() => {
    if (manage || !cohort) return;
    const prev = prevUnreadRef.current;
    prevUnreadRef.current = unread;
    if (open || prev === null || unread <= prev) return;
    announce({
      kind: 'chat',
      title: `New in ${label}`,
      body: unread === 1 ? '1 unread message' : `${unread} unread messages`,
      tag: `chat-${cohort}`,
    });
  }, [unread, open, manage, cohort, label]);

  if (!cohort) return null;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open club chat"
          title={`${cohort} chat`}
          className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-primary text-white
            shadow-lg shadow-primary/30 flex items-center justify-center hover:opacity-90
            active:scale-95 transition"
        >
          <MessageCircle className="w-6 h-6" strokeWidth={1.75} />
          {!manage && unread > 0 && (
            // A club-crumbs brand-colour dot marks unread. The white ring keeps
            // it legible even on the (also brand-coloured) launcher button.
            <span
              className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-cyber-blue ring-2 ring-white animate-pulse"
              aria-label={`${unread} unread messages`}
            />
          )}
        </button>
      )}

      <ChatPanel
        open={open}
        onClose={() => setOpen(false)}
        title={label}
        messages={messages}
        pinned={pinned}
        loading={loading}
        error={error}
        canPost={canPost}
        sending={sending}
        onSend={canPost ? send : undefined}
        onUpload={canPost ? uploadImage : undefined}
        actions={
          manage
            ? { canManage: true, isAdmin, currentUserId: user?.id, onEdit: editMessage, onDelete: deleteMessage, onTogglePin: togglePin }
            : undefined
        }
      />
    </>
  );
}
