'use client';

import { useState } from 'react';
import { ExternalLink, Plus, Rocket, Trash2, X } from 'lucide-react';

import { useStore } from '@/store/useStore';
import { MAX_LAUNCHER_COURSE_ITEMS } from '@/lib/limits';

/**
 * The leader's own quick launchers — the same links the browser extension
 * surfaces. Reads and writes the signed-in account's synced workspace, so
 * anything added here also shows up in the extension once connected.
 */
export default function LeaderQuickLaunchPage() {
  const websites = useStore((s) => s.websites);
  const courses = useStore((s) => s.courses);
  const addWebsite = useStore((s) => s.addWebsite);
  const removeWebsite = useStore((s) => s.removeWebsite);
  const atCap = websites.length + courses.length >= MAX_LAUNCHER_COURSE_ITEMS;

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const add = () => {
    setError('');
    const trimmedName = name.trim();
    let link = url.trim();
    if (!trimmedName || !link) { setError('Give it a name and a link.'); return; }
    if (atCap) { setError(`Launchers and courses are capped at ${MAX_LAUNCHER_COURSE_ITEMS} combined. Remove one to add another.`); return; }
    if (!/^https?:\/\//i.test(link)) link = `https://${link}`;
    try { new URL(link); } catch { setError('That does not look like a valid link.'); return; }
    addWebsite({ name: trimmedName, url: link, timeSpentGoal: 0 });
    setName(''); setUrl(''); setAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2"><Rocket className="w-5 h-5" /> Quick launch</h1>
          <p className="text-xs text-white/40 mt-0.5">One-click links, also shown in the browser extension.</p>
        </div>
        <button onClick={() => { setName(''); setUrl(''); setError(''); setAdding(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer">
          <Plus className="w-4 h-4" /> Add link
        </button>
      </div>

      {websites.length === 0 ? (
        <div className="glass-panel border border-white/10 rounded-2xl p-10 text-center text-xs text-white/40 font-mono">No launchers yet. Add one.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {websites.map((w) => (
            <div key={w.id} className="group relative glass-panel border border-white/10 rounded-2xl p-4 hover:border-white/25 transition">
              <a href={w.url} target="_blank" rel="noopener noreferrer" className="block">
                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div className="mt-3 font-bold text-white text-sm truncate">{w.name}</div>
                <div className="text-[10px] text-white/40 truncate">{w.url.replace(/^https?:\/\//, '')}</div>
              </a>
              <button onClick={() => removeWebsite(w.id)} title="Remove"
                className="absolute top-2 right-2 p-1 rounded-lg border border-white/10 text-white/40 hover:text-rose-400 hover:border-rose-400 opacity-0 group-hover:opacity-100 transition cursor-pointer">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div onClick={() => setAdding(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div role="dialog" aria-modal="true" className="glass-panel border border-white/15 p-6 rounded-2xl max-w-md w-full relative z-10 bg-[#1E2126] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Add a launcher</h3>
              <button onClick={() => setAdding(false)} className="text-white/50 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-white/40">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="GitHub"
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30" />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-white/40">Link</label>
              <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} placeholder="https://github.com"
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30" />
            </div>
            {error && <p className="text-[11px] text-rose-300 font-mono">{error}</p>}
            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => setAdding(false)} className="px-4 py-2 border border-white/10 text-white/60 hover:text-white rounded-xl text-xs font-bold cursor-pointer">CANCEL</button>
              <button onClick={add} className="px-4 py-2 bg-white/10 border border-white/15 hover:bg-white/15 text-white rounded-xl text-xs font-bold cursor-pointer">ADD</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
