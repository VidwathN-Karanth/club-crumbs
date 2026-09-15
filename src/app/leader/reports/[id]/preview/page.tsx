'use client';

import React, { useEffect, useState, use } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, FileDown, Loader2, Printer } from 'lucide-react';
import { apiFetch, errorMessage, readJson } from '@/lib/apiClient';
import { downloadReportDocx } from '@/lib/docxExport';
import { CANVAS_CSS, getPageMarginsCss } from '@/components/report-builder/reportBlocks';

export default function LeaderReportPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportingDocx, setExportingDocx] = useState(false);
  // Portal the preview to document.body so it fills the screen instead of
  // sitting inside the portal chrome; only render the portal after mount
  // (this page is SSR'd, unlike the ssr:false editor).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await readJson<{ report: any }>(
          await apiFetch(`/api/reports/${id}/`)
        );
        if (!cancelled) {
          setReport(data.report);
        }
      } catch (err) {
        if (!cancelled) {
          setError(errorMessage(err, 'Could not load report preview.'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportDocx = async () => {
    if (!report) return;
    setExportingDocx(true);
    try {
      await downloadReportDocx(report.title, report.documentJson);
    } catch (err) {
      alert('Failed to export DOCX document.');
    } finally {
      setExportingDocx(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#525659] text-white font-mono">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-xs">Preparing A4 Print Preview...</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#16181C] text-white p-6 font-mono text-center">
        <div className="text-rose-400 text-sm">{error || 'Report not found'}</div>
        <button
          onClick={() => router.push('/leader/reports')}
          className="px-4 py-2 bg-white/10 hover:bg-white/15 text-xs rounded-xl transition"
        >
          Back to Reports
        </button>
      </div>
    );
  }

  const rawHtml = report.documentHtml || '';
  const rawCss = report.documentCss || '';
  const pageMargins = report.documentJson?.pageMargins;
  const marginsCss = pageMargins ? getPageMarginsCss(pageMargins) : '';

  if (!mounted) return null;

  return createPortal(
    <div id="report-preview-portal" className="fixed inset-0 z-[100] overflow-auto bg-[#525659] flex flex-col items-center py-6">
      {/* ── Injected Print and Document Styles ── */}
      <style dangerouslySetInnerHTML={{ __html: `${CANVAS_CSS}\n${marginsCss}\n${rawCss}` }} />

      {/* ── FLOATING CONTROLS (HIDDEN DURING PRINT) ── */}
      <nav className="no-print sticky top-4 z-50 flex items-center gap-2 bg-[#1E2126]/95 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-2.5 shadow-2xl text-white font-mono text-xs mb-6">
        <button
          onClick={() => router.push(`/leader/reports/${id}/edit`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Editor
        </button>

        <span className="h-4 w-[1px] bg-white/15" />

        <div className="font-bold text-white max-w-xs truncate px-1">
          {report.title}
        </div>

        <span className="h-4 w-[1px] bg-white/15" />

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-black font-bold transition cursor-pointer shadow-lg shadow-primary/20"
        >
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>

        <button
          onClick={handleExportDocx}
          disabled={exportingDocx}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 hover:border-emerald-400 text-white/80 hover:text-emerald-400 transition cursor-pointer disabled:opacity-50"
        >
          {exportingDocx ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>DOCX</span>
        </button>
      </nav>

      {/* ── A4 PAGES CONTAINER ── */}
      <main
        id="report-print-container"
        className="w-full flex flex-col items-center"
        dangerouslySetInnerHTML={{ __html: rawHtml }}
      />
    </div>,
    document.body
  );
}
