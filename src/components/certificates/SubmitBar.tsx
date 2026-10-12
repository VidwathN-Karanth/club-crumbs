'use client';

import React, { useState } from 'react';
import {
  Rocket,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { startJob } from '@/lib/certificates/jobWorker';
import type { CertificateTemplate, OutputFormat, Recipient } from '@/lib/certificates/types';

interface SubmitBarProps {
  title: string;
  organizationName: string;
  issuedDate: string;
  selectedTemplate: CertificateTemplate | null;
  outputFormat: OutputFormat;
  recipients: Recipient[];
  onJobStarted: (jobId: string) => void;
}

export default function SubmitBar({
  title,
  organizationName,
  issuedDate,
  selectedTemplate,
  outputFormat = 'pdf',
  recipients,
  onJobStarted,
}: SubmitBarProps) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isCustom = selectedTemplate?.kind === 'custom';

  const isFormValid =
    Boolean(selectedTemplate) &&
    recipients.length > 0 &&
    (isCustom || (Boolean(title && title.trim()) && Boolean(issuedDate)));

  const handleSubmit = async () => {
    if (!isFormValid || !selectedTemplate || submitting) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await startJob({
        title: title ? title.trim() : null,
        organization_name: organizationName ? organizationName.trim() : null,
        issued_date: issuedDate || null,
        output_format: outputFormat,
        template: selectedTemplate,
        recipients,
      });

      onJobStarted(res.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to launch certificate job';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface border border-outline-variant rounded-2xl p-6 space-y-4 shadow-sm font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-xs font-bold">
              04
            </span>
            <h2 className="text-lg font-bold tracking-tight text-on-surface">
              Generate &amp; Status
            </h2>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                isFormValid
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-outline-variant text-outline'
              }`}
            >
              {isFormValid ? 'Ready to batch' : 'Awaiting inputs'}
            </span>
          </div>
          <p className="text-xs text-outline mt-1">
            Review queued parameters and run the client-side batch generator.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="space-y-1.5 text-xs">
          <div className="font-bold text-on-surface flex items-center gap-2">
            <span className="text-primary font-black text-sm">{recipients.length}</span> recipient{recipients.length === 1 ? '' : 's'} queued
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-outline">
            <span className="uppercase">Format: {outputFormat}</span>
            <span>•</span>
            <span>{selectedTemplate ? selectedTemplate.name : 'No template selected'}</span>
            {!isCustom && (!title.trim() || !issuedDate) && (
              <>
                <span>•</span>
                <span className="text-amber-400">Title &amp; date required</span>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFormValid || submitting}
          className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-xs hover:brightness-110 transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Dispatching generation worker…
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" />
              Generate {recipients.length} Certificate{recipients.length === 1 ? '' : 's'} ({outputFormat.toUpperCase()})
            </>
          )}
        </button>
      </div>
    </div>
  );
}
