'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  Loader2,
  XCircle,
  FileArchive,
  Layers,
} from 'lucide-react';
import {
  getJobProgress,
  getFailedCertificates,
  downloadJobZip,
} from '@/lib/certificates/jobWorker';
import type { BatchJobProgress, FailedCertificateItem } from '@/lib/certificates/types';

interface StatusPanelProps {
  jobId: string;
  onReset: () => void;
}

const FINAL_STATUSES = ['completed', 'completed_with_errors', 'failed'];

export default function StatusPanel({ jobId, onReset }: StatusPanelProps) {
  const [progress, setProgress] = useState<BatchJobProgress | null>(null);
  const [failedCerts, setFailedCerts] = useState<FailedCertificateItem[]>([]);
  const [downloading, setDownloading] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const poll = () => {
      const data = getJobProgress(jobId);
      if (data) {
        setProgress(data);

        if (FINAL_STATUSES.includes(data.status)) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          if (data.failed > 0) {
            const failedData = getFailedCertificates(jobId);
            setFailedCerts(failedData.items || []);
          }
        }
      }
    };

    poll();
    pollTimerRef.current = setInterval(poll, 300);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [jobId]);

  if (!progress) {
    return (
      <div className="bg-surface border border-outline-variant rounded-2xl p-6 font-mono text-center space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
        <p className="text-xs text-outline">Connecting to in-browser generation worker…</p>
      </div>
    );
  }

  const isCompleted = FINAL_STATUSES.includes(progress.status);
  const statusLabel = progress.status.replace(/_/g, ' ');

  const handleDownload = () => {
    setDownloading(true);
    try {
      downloadJobZip(jobId, `club_crumbs_certificates_${Date.now()}.zip`);
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  return (
    <div className="bg-surface border border-outline-variant rounded-2xl p-6 space-y-6 shadow-sm font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-xs font-bold">
              04
            </span>
            <h2 className="text-lg font-bold tracking-tight text-on-surface">
              {isCompleted ? 'Batch Generation Finished' : 'Rendering Certificates…'}
            </h2>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                progress.status === 'completed'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : progress.status === 'failed'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-primary/10 text-primary border border-primary/20'
              }`}
            >
              {statusLabel}
            </span>
          </div>
          <p className="text-xs text-outline mt-1">
            Job ID: <code className="text-primary font-mono">{jobId}</code> • 100% In-Browser Execution
          </p>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface text-xs font-medium transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Start New Batch
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-on-surface font-bold">Rendering Progress</span>
          <span className="text-primary font-bold">{progress.percent}%</span>
        </div>
        <div className="w-full h-3 rounded-full bg-surface-container overflow-hidden border border-outline-variant">
          <div
            className="h-full bg-gradient-to-r from-primary to-cyber-purple transition-all duration-300"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      {/* Telemetry Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-surface-container/60 border border-outline-variant">
          <span className="text-[10px] uppercase text-outline block mb-1">Total Queue</span>
          <span className="text-lg font-bold text-on-surface">{progress.total}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <span className="text-[10px] uppercase text-emerald-400 block mb-1">Succeeded</span>
          <span className="text-lg font-bold text-emerald-400">{progress.succeeded}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20">
          <span className="text-[10px] uppercase text-rose-400 block mb-1">Failed</span>
          <span className="text-lg font-bold text-rose-400">{progress.failed}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-container/60 border border-outline-variant">
          <span className="text-[10px] uppercase text-outline block mb-1">Pending</span>
          <span className="text-lg font-bold text-outline">{progress.pending}</span>
        </div>
      </div>

      {/* Action Bar when ready to download */}
      {isCompleted && progress.succeeded > 0 && (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-primary/20 text-primary">
              <FileArchive className="w-5 h-5" />
            </span>
            <div>
              <h4 className="text-xs font-bold text-on-surface">
                {progress.succeeded} Certificate{progress.succeeded === 1 ? '' : 's'} Ready
              </h4>
              <p className="text-[11px] text-outline">
                Bundled into a single high-compression ZIP archive in your browser memory
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs hover:brightness-110 transition shadow-lg flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Packaging ZIP…
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Download ZIP Archive
              </>
            )}
          </button>
        </div>
      )}

      {/* Failed Certificates Breakdown Table */}
      {failedCerts.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-rose-400 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Failed Recipients Breakdown ({failedCerts.length})
          </h4>
          <div className="max-h-48 overflow-y-auto border border-rose-500/20 rounded-xl divide-y divide-rose-500/10 text-xs">
            {failedCerts.map((f, idx) => (
              <div key={idx} className="p-3 bg-rose-500/5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-on-surface">
                    {f.recipient_name || '<Blank Name>'}
                  </span>
                  {f.recipient_email && (
                    <span className="text-[10px] text-outline block">
                      {f.recipient_email}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-rose-400 font-medium">
                  {f.error_message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
