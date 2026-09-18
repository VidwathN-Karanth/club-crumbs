'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Network, Plus, Trash2, X } from 'lucide-react';

import { apiFetch, errorMessage, readJson } from '@/lib/apiClient';
import { formatDate } from '@/lib/dateFormat';
import { useLeader } from '../LeaderContext';

interface MapSummary {
  id: string;
  title: string;
  cohort: string;
  nodeCount: number;
  updated_at: string;
}

export default function LeaderMapListPage() {
  const router = useRouter();
  const { cohort } = useLeader();

  const [maps, setMaps] = useState<MapSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<MapSummary | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await readJson<{ maps: MapSummary[] }>(await apiFetch('/api/leader/maps'));
      setMaps(Array.isArray(data.maps) ? data.maps : []);
    } catch (err) {
      setError(errorMessage(err, 'Could not load your maps.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    const heading = title.trim();
    if (!heading) return;
    setSaving(true);
    setError('');
    try {
      const data = await readJson<{ map: { id: string } }>(
        await apiFetch('/api/leader/maps', {
          method: 'POST',
          body: JSON.stringify({ title: heading, cohort }),
        })
      );
      router.push(`/leader/map/${data.map.id}`);
    } catch (err) {
      setError(errorMessage(err, 'Could not create the map.'));
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setConfirmDelete(null);
    try {
      await apiFetch(`/api/leader/maps/${id}`, { method: 'DELETE' });
      setMaps((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(errorMessage(err, 'Could not delete the map.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2"><Network className="w-5 h-5" /> Maps</h1>
          <p className="text-xs text-white/40 mt-0.5">Roadmaps of what to learn to master a topic. Pin a card to add it to your courses.</p>
        </div>
        <button onClick={() => { setTitle(''); setError(''); setCreating(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer">
          <Plus className="w-4 h-4" /> New map
        </button>
      </div>

      {error && <p className="text-[11px] text-rose-300 font-mono">{error}</p>}

      {loading ? (
        <div className="glass-panel border border-white/10 rounded-2xl p-10 text-center text-xs text-white/40 font-mono">Loading…</div>
      ) : maps.length === 0 ? (
        <div className="glass-panel border border-white/10 rounded-2xl p-10 text-center text-xs text-white/40 font-mono">No maps yet. Create one to start a roadmap.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {maps.map((m) => (
            <div key={m.id} className="group relative glass-panel border border-white/10 rounded-2xl p-4 hover:border-white/25 transition">
              <button onClick={() => router.push(`/leader/map/${m.id}`)} className="block text-left w-full cursor-pointer">
                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
                  <Network className="w-4 h-4" />
                </div>
                <div className="mt-3 font-bold text-white text-sm truncate">{m.title}</div>
                <div className="text-[10px] text-white/40 mt-0.5">{m.nodeCount} card{m.nodeCount === 1 ? '' : 's'} · updated {formatDate(new Date(m.updated_at))}</div>
              </button>
              <button onClick={() => setConfirmDelete(m)} title="Delete map"
                className="absolute top-2 right-2 p-1 rounded-lg border border-white/10 text-white/40 hover:text-rose-400 hover:border-rose-400 opacity-0 group-hover:opacity-100 transition cursor-pointer">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div onClick={() => !saving && setCreating(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div role="dialog" aria-modal="true" className="glass-panel border border-white/15 p-6 rounded-2xl max-w-md w-full relative z-10 bg-[#1E2126] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">New map</h3>
              <button onClick={() => setCreating(false)} className="text-white/50 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-white/40">Topic / heading</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') create(); }} autoFocus placeholder="e.g. Mastering React"
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30" />
            </div>
            {error && <p className="text-[11px] text-rose-300 font-mono">{error}</p>}
            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => setCreating(false)} className="px-4 py-2 border border-white/10 text-white/60 hover:text-white rounded-xl text-xs font-bold cursor-pointer">CANCEL</button>
              <button onClick={create} disabled={saving} className="px-4 py-2 bg-white/10 border border-white/15 hover:bg-white/15 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50">{saving ? 'CREATING…' : 'CREATE'}</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div onClick={() => setConfirmDelete(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div role="dialog" aria-modal="true" className="glass-panel border border-white/15 p-6 rounded-2xl max-w-md w-full relative z-10 bg-[#1E2126] space-y-3">
            <h3 className="text-base font-bold text-white">Delete “{confirmDelete.title}”?</h3>
            <p className="text-xs text-white/50">This removes the map and its cards. Pinned courses already in your list stay.</p>
            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 border border-white/10 text-white/60 hover:text-white rounded-xl text-xs font-bold cursor-pointer">CANCEL</button>
              <button onClick={() => remove(confirmDelete.id)} className="px-4 py-2 bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 text-rose-300 rounded-xl text-xs font-bold cursor-pointer">DELETE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
