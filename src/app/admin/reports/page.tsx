'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Download,
  Edit,
  Eye,
  FileSpreadsheet,
  FileText,
  Loader2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

import { apiFetch, errorMessage, readJson } from '@/lib/apiClient';
import { formatShortDate } from '@/lib/dateFormat';
import { downloadReportDocx } from '@/lib/docxExport';
import {
  PanelEmpty,
  PanelError,
  PanelLoading,
  SectionHeader,
} from '../_components/PanelState';
import { useAdmin } from '../AdminContext';

interface ReportItem {
  id: string;
  title: string;
  cohort: string;
  eventId: string | null;
  status: string;
  documentJson: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  creatorName: string | null;
}

export default function AdminReportsPage() {
  const router = useRouter();
  const { selectedCohort } = useAdmin();

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await readJson<{ reports: ReportItem[] }>(
        await apiFetch(`/api/reports/?cohort=${encodeURIComponent(selectedCohort)}`)
      );
      setReports(data.reports || []);
    } catch (err) {
      setError(errorMessage(err, `Could not load reports for ${selectedCohort}.`));
    } finally {
      setLoading(false);
    }
  }, [selectedCohort]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    setCreateError('');

    try {
      const data = await readJson<{ report: ReportItem }>(
        await apiFetch('/api/reports/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newTitle.trim(),
            cohort: selectedCohort,
          }),
        })
      );

      setCreateModalOpen(false);
      setNewTitle('');
      router.push(`/leader/reports/${data.report.id}/edit`);
    } catch (err) {
      setCreateError(errorMessage(err, 'Could not create report.'));
      setCreating(false);
    }
  };

  const handleDeleteReport = async (report: ReportItem) => {
    if (!confirm(`Delete "${report.title}"? This cannot be undone.`)) return;

    try {
      await readJson(await apiFetch(`/api/reports/${report.id}/`, { method: 'DELETE' }));
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    } catch (err) {
      alert(errorMessage(err, 'Could not delete report.'));
    }
  };

  const handleExportDocx = async (report: ReportItem) => {
    try {
      await downloadReportDocx(report.title, report.documentJson);
    } catch (err) {
      alert(errorMessage(err, 'Could not export DOCX.'));
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <SectionHeader
        icon={FileSpreadsheet}
        title="Event Reports"
        subtitle={`Official A4 reports, audits, and exportable documentation for ${selectedCohort}.`}
      >
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-black text-xs font-mono font-bold transition cursor-pointer shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> Create Report
        </button>
      </SectionHeader>

      {loading && <PanelLoading message={`Loading reports for ${selectedCohort}...`} />}
      {error && <PanelError message={error} onRetry={loadReports} />}

      {!loading && !error && reports.length === 0 && (
        <PanelEmpty>
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="p-4 rounded-full bg-white/5 border border-white/10">
              <FileText className="w-8 h-8 text-outline" />
            </div>
            <div className="font-mono text-sm text-on-surface font-semibold">
              No Reports in {selectedCohort}
            </div>
            <p className="text-xs text-outline max-w-sm">
              Create an official A4 event report with locked institutional headers, images, and signature blocks.
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 text-primary text-xs font-mono font-bold transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create First Report
            </button>
          </div>
        </PanelEmpty>
      )}

      {!loading && !error && reports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="glass-card rounded-2xl border border-outline-variant p-5 flex flex-col justify-between gap-4 hover:border-primary/40 transition group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-white/5 border border-outline-variant text-outline">
                    {report.status}
                  </span>
                  <span className="text-[10px] font-mono text-outline">
                    {formatShortDate(new Date(report.createdAt))}
                  </span>
                </div>

                <h3 className="text-sm font-mono font-bold text-on-surface mt-2.5 group-hover:text-primary transition line-clamp-2">
                  {report.title}
                </h3>

                {report.creatorName && (
                  <p className="text-[10px] font-mono text-outline mt-1">
                    By {report.creatorName}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-outline-variant/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => router.push(`/leader/reports/${report.id}/edit`)}
                    className="p-1.5 rounded-lg border border-outline-variant hover:border-primary text-outline hover:text-primary transition cursor-pointer"
                    title="Edit in Report Builder"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => router.push(`/leader/reports/${report.id}/preview`)}
                    className="p-1.5 rounded-lg border border-outline-variant hover:border-primary text-outline hover:text-primary transition cursor-pointer"
                    title="Print / Save as PDF"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleExportDocx(report)}
                    className="p-1.5 rounded-lg border border-outline-variant hover:border-emerald-400 text-outline hover:text-emerald-400 transition cursor-pointer"
                    title="Export as DOCX"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => handleDeleteReport(report)}
                  className="p-1.5 rounded-lg text-outline hover:text-rose-400 transition cursor-pointer"
                  title="Delete Report"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CREATE REPORT MODAL ── */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface border border-outline-variant rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <div>
                <h3 className="text-sm font-mono font-bold text-on-surface">Create Event Report</h3>
                <p className="text-[10px] font-mono text-outline">
                  Assemble an official A4 document for {selectedCohort}
                </p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-outline hover:text-on-surface transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-outline mb-1.5">
                  Report Title
                </label>
                <input
                  autoFocus
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Annual Hackathon Summary Report"
                  maxLength={120}
                  className="w-full bg-surface-container border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
                />
              </div>

              {createError && (
                <div className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl">
                  {createError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-outline-variant text-xs font-mono text-outline hover:text-on-surface transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-black text-xs font-mono font-bold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Open Builder</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
