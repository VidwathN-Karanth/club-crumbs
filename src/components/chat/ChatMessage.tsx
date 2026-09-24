'use client';

import { Fragment, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Pencil, Pin, PinOff, Shield, Star, Trash2, X } from 'lucide-react';

import type { ChatMessage as ChatMessageT } from './useClubChat';

/** Matches http(s) URLs so they can be turned into links. */
const URL_RE = /(https?:\/\/[^\s]+)/g;

/**
 * Renders a message body as text with any URLs turned into blue, new-tab links.
 *
 * The text is plain React children throughout — never dangerouslySetInnerHTML —
 * so a message containing "<script>" is shown literally and can do nothing.
 */
function linkify(text: string) {
  const parts = text.split(URL_RE);
  return parts.map((part, i) =>
    URL_RE.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 break-all hover:opacity-80"
      >
        {part}
      </a>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}

function initialOf(name: string): string {
  return (name.trim()[0] || '?').toUpperCase();
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fullLabel(iso: string): string {
  return new Date(iso).toLocaleString();
}

/** A role chip — admins and leaders are the only posters. */
function RoleBadge({ role }: { role: string }) {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-0.5 text-[9px] font-mono font-bold uppercase tracking-wide text-amber-400">
        <Shield className="w-2.5 h-2.5" strokeWidth={2} /> Admin
      </span>
    );
  }
  if (role === 'leader') {
    return (
      <span className="inline-flex items-center gap-0.5 text-[9px] font-mono font-bold uppercase tracking-wide text-cyber-blue">
        <Star className="w-2.5 h-2.5" strokeWidth={2} /> Leader
      </span>
    );
  }
  return null;
}

export interface ChatMessageActions {
  /** True in a manager view (leader/admin). */
  canManage?: boolean;
  /** True if the viewer is an admin (may moderate anyone's message). */
  isAdmin?: boolean;
  /** The viewer's Clerk id, to decide whether this is their own message. */
  currentUserId?: string;
  onEdit?: (id: string, text: string) => Promise<boolean> | void;
  onDelete?: (id: string) => Promise<boolean> | void;
  /** Pin/unpin — any manager of the club, on any live message. */
  onTogglePin?: (id: string, pin: boolean) => Promise<boolean> | void;
}

export default function ChatMessage({
  message,
  canManage,
  isAdmin,
  currentUserId,
  onEdit,
  onDelete,
  onTogglePin,
}: { message: ChatMessageT } & ChatMessageActions) {
  const [editing, setEditing] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [draft, setDraft] = useState(message.body);

  // An admin may moderate anything; a leader only their own posts.
  const mayModify =
    !!canManage && !message.deleted && (isAdmin || (!!currentUserId && message.senderId === currentUserId));

  const saveEdit = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const ok = await onEdit?.(message.id, trimmed);
    if (ok !== false) setEditing(false);
  };

  return (
    <div className="group flex gap-2.5 px-1 py-2">
      {/* Avatar / initial */}
      <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center font-mono font-bold text-sm text-primary select-none">
        {initialOf(message.senderName)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 leading-none">
          <span className="text-xs font-semibold text-on-surface truncate">{message.senderName}</span>
          <RoleBadge role={message.senderRole} />
          <span
            className="text-[10px] font-mono text-on-surface-variant/70"
            title={fullLabel(message.createdAt)}
          >
            {timeLabel(message.createdAt)}
          </span>
          {message.edited && !message.deleted && (
            <span className="text-[9px] font-mono text-on-surface-variant/50">(edited)</span>
          )}
          {message.pinned && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-mono text-primary">
              <Pin className="w-2.5 h-2.5" strokeWidth={2} /> Pinned
            </span>
          )}

          {/* Manager actions. Any manager may pin; edit/delete only where the viewer may modify. */}
          {canManage && !message.deleted && !editing && (
            <span className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
              {onTogglePin && (
                <button
                  onClick={() => onTogglePin(message.id, !message.pinned)}
                  aria-label={message.pinned ? 'Unpin message' : 'Pin message'}
                  title={message.pinned ? 'Unpin' : 'Pin as announcement'}
                  className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-on-surface/5"
                >
                  {message.pinned ? <PinOff className="w-3.5 h-3.5" strokeWidth={1.5} /> : <Pin className="w-3.5 h-3.5" strokeWidth={1.5} />}
                </button>
              )}
              {mayModify && (<>
              <button
                onClick={() => { setDraft(message.body); setEditing(true); }}
                aria-label="Edit message"
                className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-on-surface/5"
              >
                <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => { if (confirm('Delete this message?')) onDelete?.(message.id); }}
                aria-label="Delete message"
                className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
              </>)}
            </span>
          )}
        </div>

        {message.deleted ? (
          <div className="mt-1 inline-block max-w-[85%] rounded-2xl rounded-tl-sm border border-outline-variant bg-surface-container/50 px-3 py-2">
            <p className="text-sm italic text-on-surface-variant/50">This message was removed.</p>
          </div>
        ) : editing ? (
          <div className="mt-1">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); }
                if (e.key === 'Escape') setEditing(false);
              }}
              rows={2}
              autoFocus
              className="w-full resize-none rounded-lg bg-surface-container border border-outline-variant
                px-2.5 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 scrollbar-none"
            />
            <div className="mt-1 flex items-center gap-1.5">
              <button
                onClick={saveEdit}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary text-white text-xs font-semibold hover:opacity-90"
              >
                <Check className="w-3.5 h-3.5" /> Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-on-surface-variant hover:bg-on-surface/5 text-xs"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          // A WhatsApp-style bubble: shrinks to the text, wraps to as many
          // lines as it needs, capped at 85% of the row width.
          <div className="mt-1 inline-block max-w-[85%] rounded-2xl rounded-tl-sm border border-outline-variant bg-surface-container px-3 py-2 align-top">
            {message.body && (
              <p className="text-sm text-on-surface whitespace-pre-wrap break-words leading-relaxed">
                {linkify(message.body)}
              </p>
            )}
            {message.imageUrl && (
              <button
                type="button"
                onClick={() => setZoomed(true)}
                aria-label="Open image full size"
                className={`${message.body ? 'mt-2 ' : ''}block cursor-zoom-in`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={message.imageUrl}
                  alt="Shared image"
                  loading="lazy"
                  decoding="async"
                  className="max-w-full sm:max-w-[15rem] rounded-lg"
                />
              </button>
            )}
            {zoomed && message.imageUrl && (
              <ImageLightbox src={message.imageUrl} onClose={() => setZoomed(false)} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Full-screen view of a chat image. Click anywhere or press Esc to close. */
function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Portalled to <body>: the chat panel is a transformed element, which would
  // otherwise trap a `fixed` overlay inside it.
  return createPortal(
    <div
      role="dialog"
      aria-label="Image"
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Shared image, full size" className="max-w-full max-h-full object-contain rounded-lg" />
      <button
        onClick={onClose}
        aria-label="Close image"
        className="absolute top-3 right-3 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 min-w-[44px] min-h-[44px] flex items-center justify-center"
      >
        <X className="w-5 h-5" />
      </button>
    </div>,
    document.body
  );
}
