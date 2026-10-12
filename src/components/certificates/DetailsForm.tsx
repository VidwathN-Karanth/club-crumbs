'use client';

import React from 'react';
import {
  FileText,
  Calendar,
  Building,
  FileType,
  Sparkles,
  Info,
} from 'lucide-react';
import type { OutputFormat } from '@/lib/certificates/types';

const FORMAT_OPTIONS: { id: OutputFormat; label: string; sub: string; desc: string }[] = [
  { id: 'pdf', label: 'PDF', sub: 'Print • 300 DPI', desc: 'Vector A4 landscape print-ready document with crisp font rendering.' },
  { id: 'png', label: 'PNG', sub: 'Lossless Raster', desc: 'Full-resolution lossless raster image (3508×2480).' },
  { id: 'jpg', label: 'JPG', sub: 'Web-Ready 92', desc: 'Lightweight web-ready image with high 92-quality compression.' },
];

interface DetailsFormProps {
  title: string;
  setTitle: (t: string) => void;
  organizationName: string;
  setOrganizationName: (o: string) => void;
  issuedDate: string;
  setIssuedDate: (d: string) => void;
  outputFormat: OutputFormat;
  setOutputFormat: (f: OutputFormat) => void;
  isCustom?: boolean;
}

export default function DetailsForm({
  title,
  setTitle,
  organizationName,
  setOrganizationName,
  issuedDate,
  setIssuedDate,
  outputFormat = 'pdf',
  setOutputFormat,
  isCustom = false,
}: DetailsFormProps) {
  return (
    <div className="bg-surface border border-outline-variant rounded-2xl p-6 space-y-6 shadow-sm">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-mono text-xs font-bold">
              03
            </span>
            <h2 className="text-lg font-bold font-mono tracking-tight text-on-surface flex items-center gap-2">
              Details &amp; Export Format
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-primary/10 text-primary border border-primary/20 uppercase">
              {outputFormat}
            </span>
          </div>
          <p className="text-xs text-outline font-mono mt-1">
            {isCustom
              ? 'Choose output export format. Title and organization details are embedded in your uploaded artwork.'
              : 'Enter certificate title, issuing body, date, and choose your preferred output format.'}
          </p>
        </div>
      </div>

      {isCustom ? (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs font-mono text-purple-300">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-purple-400" />
          <p>
            <strong className="text-purple-200">Custom Template Active:</strong> Course title, credentials, and institutional seals are already designed into your artwork background. Only the recipient&apos;s name will be dynamically positioned and rendered.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-outline mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-primary" />
              Course or Certificate Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Web Development Bootcamp / Crypton CTF 2026"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container border border-outline-variant text-on-surface placeholder:text-outline focus:border-primary focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-outline mb-1.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-primary" />
              Issuing Organization (Optional)
            </label>
            <input
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="e.g. MITE Coders Club &amp; Dept. of CSE"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container border border-outline-variant text-on-surface placeholder:text-outline focus:border-primary focus:outline-none transition"
            />
          </div>

          <div className="md:col-span-2 sm:max-w-xs">
            <label className="block text-[10px] uppercase font-bold text-outline mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              Issue Date <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              value={issuedDate}
              onChange={(e) => setIssuedDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container border border-outline-variant text-on-surface focus:border-primary focus:outline-none transition"
            />
          </div>
        </div>
      )}

      {/* Output Format Picker */}
      <div className="space-y-2 pt-2">
        <label className="block text-[10px] uppercase font-mono font-bold text-outline flex items-center gap-1.5">
          <FileType className="w-3.5 h-3.5 text-primary" />
          Select Export Format
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FORMAT_OPTIONS.map((opt) => {
            const isSelected = outputFormat === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setOutputFormat(opt.id)}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between font-mono cursor-pointer ${
                  isSelected
                    ? 'bg-primary/10 border-primary ring-1 ring-primary/30 shadow-sm'
                    : 'bg-surface-container/60 border-outline-variant hover:border-primary/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-on-surface uppercase">
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-outline">
                      {opt.sub}
                    </span>
                  </div>
                  <p className="text-[11px] text-outline leading-relaxed">
                    {opt.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
