'use client';

import { useRef, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react';
import { Trash2 } from 'lucide-react';

/** Hold a link for 3s to reveal a small bin, then click it to delete the link. */
const HOLD_MS = 3000;

export default function DeletableEdge({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd,
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
  });

  const [showBin, setShowBin] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  const beginHold = () => {
    cancel();
    timer.current = setTimeout(() => {
      setShowBin(true);
      // Auto-dismiss if the user doesn't act, so a stray bin never lingers.
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setShowBin(false), 4000);
    }, HOLD_MS);
  };

  const remove = () => setEdges((eds) => eds.filter((e) => e.id !== id));

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      {/* Wide invisible hit-area so the thin line is easy to press-and-hold. */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ cursor: 'pointer' }}
        onPointerDown={beginHold}
        onPointerUp={cancel}
        onPointerLeave={cancel}
      />
      {showBin && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <button
              onClick={remove}
              title="Delete this link"
              className="p-1.5 rounded-lg border shadow-lg text-rose-400 hover:bg-rose-500/15 hover:border-rose-400 transition cursor-pointer"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-outline)' }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
