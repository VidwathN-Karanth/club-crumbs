'use client';

import { createContext, useContext } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ExternalLink, Pencil, Pin, PinOff, Trash2 } from 'lucide-react';

export interface TopicNodeData {
  topic: string;
  link: string;
  pinned: boolean;
  courseId?: string;
  [key: string]: unknown;
}

interface NodeActions {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  pinningId: string | null;
}

/** Editor supplies the card actions here so they never end up in saved node data. */
export const MapNodeActionsContext = createContext<NodeActions>({
  onEdit: () => {},
  onDelete: () => {},
  onTogglePin: () => {},
  pinningId: null,
});

const SIDES: { pos: Position; key: string }[] = [
  { pos: Position.Top, key: 'top' },
  { pos: Position.Right, key: 'right' },
  { pos: Position.Bottom, key: 'bottom' },
  { pos: Position.Left, key: 'left' },
];

const HANDLE_STYLE = { width: 9, height: 9, background: '#8b5cf6', border: '1px solid #0b0d10' };

export default function TopicNode({ id, data, selected }: NodeProps) {
  const { onEdit, onDelete, onTogglePin, pinningId } = useContext(MapNodeActionsContext);
  const d = data as TopicNodeData;
  const busy = pinningId === id;

  return (
    <div
      className={`relative rounded-2xl border bg-[#1E2126] px-4 py-3 w-56 shadow-lg transition ${
        selected ? 'border-violet-400' : 'border-white/15'
      } ${d.pinned ? 'ring-1 ring-violet-400/50' : ''}`}
    >
      {/* Four sides, each usable as connection start and end. */}
      {SIDES.map(({ pos, key }) => (
        <div key={key}>
          <Handle id={`t-${key}`} type="target" position={pos} style={HANDLE_STYLE} />
          <Handle id={`s-${key}`} type="source" position={pos} style={HANDLE_STYLE} />
        </div>
      ))}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-bold text-white text-sm truncate">{d.topic || 'Untitled topic'}</div>
          {d.link ? (
            <a href={d.link} target="_blank" rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-[10px] text-violet-300 hover:text-violet-200 truncate max-w-[10rem]">
              <ExternalLink className="w-3 h-3 shrink-0" /> <span className="truncate">{d.link.replace(/^https?:\/\//, '')}</span>
            </a>
          ) : (
            <div className="mt-1 text-[10px] text-white/30">No course link</div>
          )}
        </div>
        <button
          onClick={() => onTogglePin(id)}
          disabled={busy}
          title={d.pinned ? 'Pinned to your courses — click to unpin' : 'Pin to your courses'}
          className={`shrink-0 p-1 rounded-lg border transition cursor-pointer disabled:opacity-40 ${
            d.pinned ? 'text-violet-300 border-violet-400/40 bg-violet-500/10' : 'text-white/40 border-white/10 hover:text-white'
          }`}
        >
          {d.pinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <button onClick={() => onEdit(id)} title="Edit" className="p-1 rounded-lg border border-white/10 text-white/40 hover:text-white transition cursor-pointer">
          <Pencil className="w-3 h-3" />
        </button>
        <button onClick={() => onDelete(id)} title="Delete card" className="p-1 rounded-lg border border-white/10 text-white/40 hover:text-rose-400 hover:border-rose-400 transition cursor-pointer">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
