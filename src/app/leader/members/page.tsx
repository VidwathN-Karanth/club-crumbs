'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Search, Trash2, UserPlus, Users } from 'lucide-react';

import { apiFetch, errorMessage, readJson } from '@/lib/apiClient';
import { formatDateTime } from '@/lib/dateFormat';
import { useLeader } from '../LeaderContext';

interface Member {
  email: string;
  name: string | null;
  hasAccount: boolean;
  onboarded: boolean;
  lastSync: string | null;
}

export default function LeaderMembersPage() {
  const { cohort } = useLeader();
  const endpoint = `/api/club/${encodeURIComponent(cohort)}/members`;

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [addNote, setAddNote] = useState('');

  const [confirmRemove, setConfirmRemove] = useState<Member | null>(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await readJson<{ members: Member[] }>(await apiFetch(endpoint));
      setMembers(Array.isArray(data.members) ? data.members : []);
    } catch (err) {
      setError(errorMessage(err, 'Could not load your members.'));
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { load(); }, [load]);

  const addMember = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    setAdding(true);
    setAddNote('');
    try {
      await readJson(await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }));
      setNewEmail('');
      setAddNote(`Added ${email}.`);
      load();
    } catch (err) {
      setAddNote(errorMessage(err, 'Could not add that member.'));
    } finally {
      setAdding(false);
    }
  };

  const removeMember = async (member: Member) => {
    setRemoving(true);
    try {
      await readJson(await apiFetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: member.email }),
      }));
      setMembers((prev) => prev.filter((m) => m.email !== member.email));
      setConfirmRemove(null);
    } catch (err) {
      setError(errorMessage(err, 'Could not remove that member.'));
      load();
    } finally {
      setRemoving(false);
    }
  };

  const filtered = members.filter((m) =>
    m.email.toLowerCase().includes(query.toLowerCase()) ||
    (m.name || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5" /> {cohort} members
          </h1>
          <p className="text-xs text-white/40 mt-0.5">
            {members.length} on the roster. Adding an email lets that student sign in.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/30" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members…"
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30"
            />
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/30 text-white/70 hover:text-white transition cursor-pointer text-[10px] uppercase font-bold tracking-wider"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Reload
          </button>
        </div>
      </div>

      {/* Add member */}
      <section className="glass-panel border border-white/10 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addMember(); }}
            placeholder="student@mite.ac.in"
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
          />
          <button
            onClick={addMember}
            disabled={adding || !newEmail.trim()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-40"
          >
            <UserPlus className="w-4 h-4" /> Add member
          </button>
        </div>
        {addNote && <p className="mt-2 text-[11px] font-mono text-white/50">{addNote}</p>}
      </section>

      {/* Roster */}
      <section className="glass-panel border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-xs text-white/40 font-mono">Loading members…</p>
        ) : error ? (
          <p className="p-8 text-center text-xs text-rose-400 font-mono">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-xs text-white/40 font-mono">
            {members.length === 0 ? 'No members yet. Add one above.' : 'No member matches that search.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/40 font-bold uppercase tracking-wider">
                  <th className="p-4 font-normal">Member</th>
                  <th className="p-4 font-normal">Status</th>
                  <th className="p-4 font-normal">Last sync</th>
                  <th className="p-4 font-normal text-center w-20">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((m) => (
                  <tr key={m.email} className="hover:bg-white/3 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-sm text-white/70 shrink-0">
                          {(m.name || m.email).charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-bold text-white truncate">{m.name || '—'}</span>
                          <span className="block text-[10px] text-white/40 truncate">{m.email}</span>
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {!m.hasAccount ? (
                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10 text-[9px] font-semibold">INVITED</span>
                      ) : m.onboarded ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-semibold">ACTIVE</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-semibold">ONBOARDING</span>
                      )}
                    </td>
                    <td className="p-4 text-white/60">
                      {m.lastSync ? formatDateTime(new Date(m.lastSync)) : 'Never'}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => setConfirmRemove(m)}
                          className="p-1.5 rounded-lg border border-white/10 hover:border-rose-400 text-white/60 hover:text-rose-400 transition cursor-pointer"
                          title="Remove and purge"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Remove confirmation */}
      <AnimatePresence>
        {confirmRemove && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !removing && setConfirmRemove(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              role="dialog" aria-modal="true"
              className="glass-panel border border-red-500/30 p-6 rounded-2xl max-w-sm w-full relative z-10 bg-[#1E2126]"
            >
              <div className="flex items-center gap-3 text-red-400">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-base font-black tracking-wider uppercase">Remove member</h3>
              </div>
              <p className="text-xs text-white/60 font-mono mt-3 leading-relaxed">
                This removes{' '}
                <span className="text-red-400 font-semibold">{confirmRemove.email}</span>{' '}
                from {cohort} and <span className="text-red-400 font-semibold">permanently deletes</span> their
                workspace, streak and activity history. They lose access immediately. This cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setConfirmRemove(null)}
                  disabled={removing}
                  className="px-4 py-2 border border-white/10 hover:border-white/20 text-white/60 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition disabled:opacity-40"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => removeMember(confirmRemove)}
                  disabled={removing}
                  className="px-4 py-2 bg-red-950/45 hover:bg-red-900 border border-red-500/30 text-red-300 rounded-xl text-xs font-bold cursor-pointer transition disabled:opacity-60"
                >
                  {removing ? 'REMOVING…' : 'REMOVE & PURGE'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
