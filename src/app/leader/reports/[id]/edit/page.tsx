'use client';

import React, { useEffect, useState, use } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { apiFetch, errorMessage, readJson } from '@/lib/apiClient';

const ReportEditor = dynamic(
  () => import('@/components/report-builder/ReportEditor'),
  { ssr: false }
);

export default function LeaderReportEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          setError(errorMessage(err, 'Could not load report.'));
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

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-3 bg-[#16181C] text-white font-mono">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-xs text-outline">Loading Report Builder...</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-[#16181C] text-white p-6 text-center font-mono">
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

  return <ReportEditor report={report} backUrl="/leader/reports" />;
}
