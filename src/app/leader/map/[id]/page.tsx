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
        <button onClick={() => router.push('/leader/map')} className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white transition cursor-pointer" title="Back to maps">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled map"
          className="flex-1 min-w-0 bg-transparent text-lg font-bold text-white focus:outline-none border-b border-transparent focus:border-white/20"
        />
        <span className="text-[11px] font-mono text-white/40 flex items-center gap-1.5 w-20 justify-end">
          {saveState === 'saving' ? (<><Loader2 className="w-3 h-3 animate-spin" /> Saving</>)
            : saveState === 'saved' ? (<><Check className="w-3 h-3 text-emerald-400" /> Saved</>) : null}
        </span>
        <button onClick={addCard} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer">
          <Plus className="w-4 h-4" /> Add card
        </button>
      </div>

      {error && <p className="text-[11px] text-rose-300 font-mono mb-2">{error}</p>}

      <div className="flex-1 rounded-2xl border border-white/10 overflow-hidden bg-[#0b0d10]">
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs text-white/40 font-mono">Loading…</div>
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
              fitView
              proOptions={{ hideAttribution: true }}
            >
              <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} color="#2a2f38" />
              <Controls className="!bg-white/5 !border-white/10" />
              <MiniMap pannable zoomable className="!bg-[#16181C]" maskColor="rgba(0,0,0,0.6)" nodeColor="#8b5cf6" />
            </ReactFlow>
          </MapNodeActionsContext.Provider>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div onClick={() => setEditing(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div role="dialog" aria-modal="true" className="glass-panel border border-white/15 p-6 rounded-2xl max-w-md w-full relative z-10 bg-[#1E2126] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Card</h3>
              <button onClick={() => setEditing(null)} className="text-white/50 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-white/40">Topic name</label>
              <input value={editing.topic} onChange={(e) => setEditing({ ...editing, topic: e.target.value })} autoFocus placeholder="e.g. Hooks & state"
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30" />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-white/40">Course link (URL)</label>
              <input value={editing.link} onChange={(e) => setEditing({ ...editing, link: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); }} placeholder="https://…"
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30" />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => setEditing(null)} className="px-4 py-2 border border-white/10 text-white/60 hover:text-white rounded-xl text-xs font-bold cursor-pointer">CANCEL</button>
              <button onClick={saveEdit} className="px-4 py-2 bg-white/10 border border-white/15 hover:bg-white/15 text-white rounded-xl text-xs font-bold cursor-pointer">SAVE</button>
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
