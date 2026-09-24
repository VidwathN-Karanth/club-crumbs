'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Send, X } from 'lucide-react';

const MAX_BODY = 4000;
const MAX_BYTES = 4 * 1024 * 1024;
/** Stills are shrunk to WebP before upload, so a big phone photo is fine. */
const MAX_STILL_BYTES = 20 * 1024 * 1024;

/**
 * The message input, rendered only for club managers (leaders/admins). Enter
 * sends; Shift+Enter makes a newline. A message may be text, an image, or both.
 *
 * The image is uploaded (via onUpload) only when the message is sent, so a
 * picked-then-cleared image never costs an upload. The server enforces the same
 * type/size limits again.
 */
export default function ChatComposer({
  onSend,
  onUpload,
  sending,
}: {
  onSend: (text: string, imageUrl?: string | null) => Promise<boolean>;
  onUpload: (file: File) => Promise<string | null>;
  sending: boolean;
}) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const clearImage = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setFileError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const pick = (f: File | null) => {
    setFileError('');
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setFileError('Only images can be attached.');
      return;
    }
    if (f.type === 'image/gif' ? f.size > MAX_BYTES : f.size > MAX_STILL_BYTES) {
      setFileError(f.type === 'image/gif' ? 'GIFs must be 4MB or smaller.' : 'Images must be 20MB or smaller.');
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const busy = sending || uploading;

  const submit = async () => {
    const trimmed = text.trim();
    if ((!trimmed && !file) || busy) return;

    let imageUrl: string | null = null;
    if (file) {
      setUploading(true);
      imageUrl = await onUpload(file);
      setUploading(false);
      if (!imageUrl) return; // upload failed; hook set the error, keep the draft
    }

    const ok = await onSend(trimmed, imageUrl);
    if (ok) {
      setText('');
      clearImage();
    }
  };

  const nearLimit = text.length > MAX_BODY - 200;

  return (
    <div className="shrink-0 border-t border-outline-variant p-2.5">
      {preview && (
        <div className="mb-2 relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Attachment preview" className="max-h-28 rounded-lg border border-outline-variant" />
          <button
            onClick={clearImage}
            aria-label="Remove image"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-surface border border-outline-variant text-on-surface-variant hover:text-on-surface flex items-center justify-center shadow"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
      )}

      {fileError && <p className="mb-1.5 text-[11px] text-rose-400">{fileError}</p>}

      <div className="flex items-end gap-2">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          aria-label="Attach an image"
          className="shrink-0 w-11 h-11 rounded-xl border border-outline-variant text-on-surface-variant
            hover:text-on-surface hover:bg-on-surface/5 flex items-center justify-center transition disabled:opacity-40"
        >
          <ImagePlus className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_BODY))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Message your club…"
          className="flex-1 resize-none max-h-32 rounded-xl bg-surface-container border border-outline-variant
            px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60
            focus:outline-none focus:ring-2 focus:ring-primary/40 scrollbar-none"
        />

        <button
          onClick={submit}
          disabled={(!text.trim() && !file) || busy}
          aria-label="Send message"
          className="shrink-0 w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center
            hover:opacity-90 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" strokeWidth={1.75} />}
        </button>
      </div>

      {nearLimit && (
        <div className="mt-1 text-right text-[10px] font-mono text-on-surface-variant/70">
          {text.length}/{MAX_BODY}
        </div>
      )}
    </div>
  );
}
