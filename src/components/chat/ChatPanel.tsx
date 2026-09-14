'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Eye, X } from 'lucide-react';

import ChatComposer from './ChatComposer';
import ChatMessageList from './ChatMessageList';
import type { ChatMessageActions } from './ChatMessage';
import type { ChatMessage as ChatMessageT } from './useClubChat';

/**
 * The club chat surface: a right-side slide-over on desktop/tablet, a
 * full-height sheet on mobile. One responsive component rather than three —
 * Tailwind breakpoints and the app's existing drawer motion do the work.
 *
 * Members see a read-only "view only" footer; managers (leaders/admins) get the
 * composer and inline edit/delete on their messages.
 */
export default function ChatPanel({
  open,
  onClose,
  title,
  messages,
  loading,
  error,
  canPost,
  sending,
  onSend,
  onUpload,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  messages: ChatMessageT[];
  loading: boolean;
  error: string;
  canPost?: boolean;
  sending?: boolean;
  onSend?: (text: string, imageUrl?: string | null) => Promise<boolean>;
  onUpload?: (file: File) => Promise<string | null>;
  actions?: ChatMessageActions;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />

          {/* Panel: full-width sheet on mobile, fixed rail on sm+ */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="fixed top-0 right-0 bottom-0 z-[61] w-full sm:w-[380px] max-w-full
              bg-surface border-l border-outline-variant shadow-2xl flex flex-col"
            role="dialog"
            aria-label={`${title} chat`}
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-4 h-14 border-b border-outline-variant">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-on-surface truncate">{title}</h2>
                <p className="text-[10px] font-mono text-on-surface-variant/70 uppercase tracking-wide">Club chat</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close chat"
                className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-on-surface/5 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <ChatMessageList messages={messages} loading={loading} error={error} actions={actions} />

            {/* The list only shows an error when the feed is empty; surface
                send/edit/delete failures here too, above the composer. */}
            {error && messages.length > 0 && (
              <div className="shrink-0 px-3 py-1.5 border-t border-outline-variant bg-rose-500/10 text-[11px] text-rose-400">
                {error}
              </div>
            )}

            {canPost && onSend && onUpload ? (
              <ChatComposer onSend={onSend} onUpload={onUpload} sending={!!sending} />
            ) : (
              <div className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-3 border-t border-outline-variant text-xs text-on-surface-variant">
                <Eye className="w-3.5 h-3.5" strokeWidth={1.5} /> View only
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
