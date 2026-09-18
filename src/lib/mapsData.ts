import 'server-only';

import { supabaseAdmin } from './supabaseAdmin';

/**
 * Leader roadmap maps ("Mind Maps") — a leader's private mastery roadmaps.
 *
 * Unlike launchers/courses/tasks (arrays inside the shared user_states blob),
 * a map is a graph that grows unbounded and is written on every drag, so it
 * lives in its own table. Every function here is scoped by `owner_id`, so a
 * leader can only ever touch their own maps — the id in the URL never widens
 * that reach.
 */

export interface MapNode {
  id: string;
  position: { x: number; y: number };
  data: { topic: string; link: string; pinned: boolean; courseId?: string };
  type?: string;
}

export interface MapEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export interface MapGraph {
  nodes: MapNode[];
  edges: MapEdge[];
}

export interface LeaderMap {
  id: string;
  owner_id: string;
  cohort: string;
  title: string;
  data: MapGraph;
  created_at: string;
  updated_at: string;
}

/** Map rows for the list view — without the (potentially large) graph body. */
export type LeaderMapSummary = Omit<LeaderMap, 'data'> & { nodeCount: number };

const TABLE = 'leader_maps';

export async function listMaps(ownerId: string): Promise<LeaderMapSummary[]> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select('id, owner_id, cohort, title, data, created_at, updated_at')
    .eq('owner_id', ownerId)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`Could not load maps: ${error.message}`);
  return (data || []).map((row) => {
    const graph = (row.data as MapGraph) || { nodes: [], edges: [] };
    const { data: _drop, ...rest } = row as LeaderMap;
    void _drop;
    return { ...rest, nodeCount: Array.isArray(graph.nodes) ? graph.nodes.length : 0 };
  });
}

export async function getMap(ownerId: string, id: string): Promise<LeaderMap | null> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select('*')
    .eq('owner_id', ownerId)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`Could not load map: ${error.message}`);
  return (data as LeaderMap) || null;
}

export async function createMap(ownerId: string, cohort: string, title: string): Promise<LeaderMap> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .insert({ owner_id: ownerId, cohort, title: title.slice(0, 200), data: { nodes: [], edges: [] } })
    .select('*')
    .single();

  if (error) throw new Error(`Could not create map: ${error.message}`);
  return data as LeaderMap;
}

export async function updateMap(
  ownerId: string,
  id: string,
  fields: { title?: string; data?: MapGraph }
): Promise<LeaderMap | null> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof fields.title === 'string') patch.title = fields.title.slice(0, 200);
  if (fields.data) patch.data = fields.data;

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update(patch)
    .eq('owner_id', ownerId)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) throw new Error(`Could not save map: ${error.message}`);
  return (data as LeaderMap) || null;
}

export async function deleteMap(ownerId: string, id: string): Promise<void> {
  const { error } = await supabaseAdmin.from(TABLE).delete().eq('owner_id', ownerId).eq('id', id);
  if (error) throw new Error(`Could not delete map: ${error.message}`);
}
