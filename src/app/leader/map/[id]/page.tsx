'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, Check, Loader2, Plus, X } from 'lucide-react';

import { apiFetch, errorMessage, readJson } from '@/lib/apiClient';
import { useStore } from '@/store/useStore';
import TopicNode, { MapNodeActionsContext, type TopicNodeData } from '@/components/map/TopicNode';
import type { MapGraph, MapNode } from '@/lib/mapsData';

type FlowNode = Node<TopicNodeData>;

const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/** Strip React Flow internals down to what we persist. */
function serialize(nodes: FlowNode[], edges: Edge[]): MapGraph {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      position: n.position,
      data: {
        topic: n.data.topic || '',
        link: n.data.link || '',
        pinned: Boolean(n.data.pinned),
        ...(n.data.courseId ? { courseId: n.data.courseId } : {}),
      },
    })) as MapNode[],
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
    })),
  };
}

function MapEditor() {
  const router = useRouter();
  const mapId = String(useParams().id);
  const { screenToFlowPosition } = useReactFlow();
  const themeMode = useStore((s) => s.themeMode);
  const isLight = themeMode === 'light';

  const [title, setTitle] = useState('');
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [pinningId, setPinningId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; topic: string; link: string } | null>(null);

  // Suppress the autosave that would otherwise fire right after the initial load.
  const hydratedRef = useRef(false);

  const nodeTypes = useMemo(() => ({ topic: TopicNode }), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await readJson<{ map: { title: string; data: MapGraph } }>(
          await apiFetch(`/api/leader/maps/${mapId}`)
        );
        if (cancelled) return;
        setTitle(data.map.title);
        setNodes((data.map.data?.nodes || []).map((n) => ({ ...n, type: 'topic' })) as FlowNode[]);
        setEdges((data.map.data?.edges || []) as Edge[]);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, 'Could not load the map.'));
      } finally {
        if (!cancelled) { setLoading(false); requestAnimationFrame(() => { hydratedRef.current = true; }); }
      }
    })();
    return () => { cancelled = true; };
  }, [mapId, setNodes, setEdges]);

  // One place that writes to the server; returns the promise so pinning can flush first.
  const save = useCallback(async () => {
    setSaveState('saving');
    try {
      await apiFetch(`/api/leader/maps/${mapId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title, data: serialize(nodes, edges) }),
      });
      setSaveState('saved');
    } catch (err) {
      setError(errorMessage(err, 'Could not save.'));
      setSaveState('idle');
    }
  }, [mapId, title, nodes, edges]);

  // Debounced autosave on any change to title / graph.
  useEffect(() => {
    if (!hydratedRef.current) return;
    setSaveState('saving');
    const t = setTimeout(() => { void save(); }, 800);
    return () => clearTimeout(t);
  }, [title, nodes, edges, save]);

  const onConnect = useCallback(
    (c: Connection) => setEdges((eds) => addEdge({ ...c, id: uid('e') }, eds)),
    [setEdges]
  );

  const addCard = useCallback(() => {
    const center = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const id = uid('n');
    setNodes((nds) => [
      ...nds,
      { id, type: 'topic', position: { x: center.x - 112, y: center.y - 40 }, data: { topic: '', link: '', pinned: false } },
    ]);
    setEditing({ id, topic: '', link: '' });
  }, [screenToFlowPosition, setNodes]);

  const onEdit = useCallback((id: string) => {
    const n = nodes.find((x) => x.id === id);
    if (n) setEditing({ id, topic: n.data.topic || '', link: n.data.link || '' });
  }, [nodes]);

  const saveEdit = useCallback(() => {
    if (!editing) return;
    setNodes((nds) => nds.map((n) => n.id === editing.id
      ? { ...n, data: { ...n.data, topic: editing.topic.trim(), link: editing.link.trim() } }
      : n));
    setEditing(null);
  }, [editing, setNodes]);

  const onDelete = useCallback((id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  }, [setNodes, setEdges]);

  const onTogglePin = useCallback(async (id: string) => {
    const node = nodes.find((n) => n.id === id);
    if (!node) return;
    const nextPinned = !node.data.pinned;
    setPinningId(id);
    setError('');
    try {
      await save(); // ensure the server has this node before it looks it up
      const res = await apiFetch(`/api/leader/maps/${mapId}/pin`, {
        method: 'POST',
        body: JSON.stringify({ nodeId: id, pinned: nextPinned }),
      });
      const payload = await readJson<{ node: { data: TopicNodeData }; error?: string }>(res);
      setNodes((nds) => nds.map((n) => n.id === id
        ? { ...n, data: { ...n.data, pinned: payload.node.data.pinned, courseId: payload.node.data.courseId } }
        : n));
    } catch (err) {
      setError(errorMessage(err, 'Could not update the pin.'));
    } finally {
      setPinningId(null);
    }
  }, [nodes, mapId, save, setNodes]);

  const actions = useMemo(() => ({ onEdit, onDelete, onTogglePin, pinningId }), [onEdit, onDelete, onTogglePin, pinningId]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 mb-3">
        <button onClick={() => router.push('/leader/map')} className="p-2 rounded-lg border transition cursor-pointer" style={{ borderColor: 'var(--color-outline)', color: 'var(--color-on-surface-variant)' }} title="Back to maps">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled map"
          style={{ color: 'var(--color-on-surface)' }}
          className="flex-1 min-w-0 bg-transparent text-lg font-bold focus:outline-none border-b border-transparent focus:border-white/20"
        />
        <span className="text-[11px] font-mono flex items-center gap-1.5 w-20 justify-end" style={{ color: 'var(--color-on-surface-variant)' }}>
          {saveState === 'saving' ? (<><Loader2 className="w-3 h-3 animate-spin" /> Saving</>)
            : saveState === 'saved' ? (<><Check className="w-3 h-3 text-emerald-400" /> Saved</>) : null}
        </span>
        <button onClick={addCard} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer hover:brightness-110" style={{ background: '#8b5cf6' }}>
          <Plus className="w-4 h-4" /> Add card
        </button>
      </div>

      {error && <p className="text-[11px] text-rose-300 font-mono mb-2">{error}</p>}

      <div
        className="flex-1 rounded-2xl border overflow-hidden"
        style={{ background: 'var(--color-cyber-dark)', borderColor: 'var(--color-outline)' }}
      >
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs font-mono" style={{ color: 'var(--color-on-surface-variant)' }}>Loading…</div>
        ) : (
          <MapNodeActionsContext.Provider value={actions}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              defaultEdgeOptions={{ type: 'default' }}
              colorMode={themeMode}
              fitView
              proOptions={{ hideAttribution: true }}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={22}
                size={1.6}
                color={isLight ? '#b8bdc9' : '#5a6273'}
              />
              <Controls
                style={{
                  // Solid, theme-aware buttons — the default was invisible on the dark canvas.
                  ['--xy-controls-button-background-color' as string]: isLight ? '#ffffff' : '#272B31',
                  ['--xy-controls-button-background-color-hover' as string]: isLight ? '#eef0f4' : '#32373E',
                  ['--xy-controls-button-color' as string]: isLight ? '#16181C' : '#F2F2F7',
                  ['--xy-controls-button-color-hover' as string]: '#8b5cf6',
                  ['--xy-controls-button-border-color' as string]: 'var(--color-outline)',
                }}
              />
              <MiniMap
                pannable
                zoomable
                bgColor={isLight ? '#eef0f4' : '#16181C'}
                nodeColor="#8b5cf6"
                nodeStrokeColor="#8b5cf6"
                nodeStrokeWidth={3}
                nodeBorderRadius={6}
                maskColor={isLight ? 'rgba(120,130,150,0.18)' : 'rgba(0,0,0,0.55)'}
                maskStrokeColor="#8b5cf6"
                maskStrokeWidth={2}
                style={{ border: '1px solid var(--color-outline)', borderRadius: 8 }}
              />
            </ReactFlow>
          </MapNodeActionsContext.Provider>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div onClick={() => setEditing(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div role="dialog" aria-modal="true" className="glass-panel border p-6 rounded-2xl max-w-md w-full relative z-10 space-y-3" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-outline)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold" style={{ color: 'var(--color-on-surface)' }}>Card</h3>
              <button onClick={() => setEditing(null)} className="cursor-pointer" style={{ color: 'var(--color-on-surface-variant)' }}><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase" style={{ color: 'var(--color-on-surface-variant)' }}>Topic name</label>
              <input value={editing.topic} onChange={(e) => setEditing({ ...editing, topic: e.target.value })} autoFocus placeholder="e.g. Hooks & state"
                style={{ background: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-outline)', color: 'var(--color-on-surface)' }}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase" style={{ color: 'var(--color-on-surface-variant)' }}>Course link (URL)</label>
              <input value={editing.link} onChange={(e) => setEditing({ ...editing, link: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); }} placeholder="https://…"
                style={{ background: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-outline)', color: 'var(--color-on-surface)' }}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none" />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => setEditing(null)} className="px-4 py-2 border rounded-xl text-xs font-bold cursor-pointer" style={{ borderColor: 'var(--color-outline)', color: 'var(--color-on-surface-variant)' }}>CANCEL</button>
              <button onClick={saveEdit} className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer text-white" style={{ background: '#8b5cf6' }}>SAVE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeaderMapEditorPage() {
  return (
    <ReactFlowProvider>
      <MapEditor />
    </ReactFlowProvider>
  );
}
