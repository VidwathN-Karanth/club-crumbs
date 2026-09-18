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

export default function DeletableEdge({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd,
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
  });

  const [showBin, setShowBin] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Press the line → the bin shows straight away (no hold timer).
  const reveal = () => {
    setShowBin(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowBin(false), 4000);
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
        onPointerDown={reveal}
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
