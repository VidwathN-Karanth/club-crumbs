'use client';

import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import readXlsxFile from 'read-excel-file';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  ClipboardPaste,
  Sparkles,
  Trash2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Users,
} from 'lucide-react';
import type { Recipient } from '@/lib/certificates/types';

const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
const NAME_HEADER_REGEX = /^(name|student|student[\s_-]?name|full[\s_-]?name|recipient|recipient[\s_-]?name)$/i;
const EMAIL_HEADER_REGEX = /^(email|mail|e-mail|recipient[\s_-]?email)$/i;

const SAMPLE_RECIPIENTS: Recipient[] = [
  { name: 'Dr. Jane Chen', email: 'jane.chen@example.edu' },
  { name: 'Alex Rivera', email: 'alex.rivera@example.com' },
  { name: 'Marcus Vance', email: 'marcus.v@example.org' },
  { name: 'Sophia Kowalski', email: '' },
  { name: 'Alex Rivera', email: 'alex.rivera@example.com' }, // intentional sample duplicate to demonstrate detection
];

interface TabularData {
  headers: string[];
  rows: unknown[][];
}

interface ImportPanelProps {
  recipients: Recipient[];
  setRecipients: React.Dispatch<React.SetStateAction<Recipient[]>>;
}

export default function ImportPanel({ recipients, setRecipients }: ImportPanelProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pasteText, setPasteText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Tabular column mapping state (for CSV / XLSX)
  const [tabularData, setTabularData] = useState<TabularData | null>(null);
  const [nameColIdx, setNameColIdx] = useState(0);
  const [emailColIdx, setEmailColIdx] = useState(-1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyColumnMapping = (
    rows: unknown[][],
    nIdx: number,
    eIdx: number
  ) => {
    const parsed: Recipient[] = [];
    rows.forEach((row) => {
      const name = String(row[nIdx] ?? '').trim();
      const email = eIdx >= 0 ? String(row[eIdx] ?? '').trim() : '';
      if (!name && !email) return;
      parsed.push({ name, email });
    });
    setRecipients(parsed);
  };

  const handleTabularLoaded = (allRows: unknown[][]) => {
    if (!allRows || allRows.length === 0) {
      setErrorMsg('Uploaded file contains no data.');
      return;
    }

    const cleanedRows = allRows.filter(
      (r) => Array.isArray(r) && r.some((c) => c !== null && c !== undefined && String(c).trim() !== '')
    );

    if (cleanedRows.length === 0) {
      setErrorMsg('Uploaded file contains only empty rows.');
      return;
    }

    const firstRow = cleanedRows[0];
    let detectedName = -1;
    let detectedEmail = -1;

    firstRow.forEach((col, idx) => {
      const text = String(col ?? '').trim();
      if (NAME_HEADER_REGEX.test(text)) detectedName = idx;
      if (EMAIL_HEADER_REGEX.test(text)) detectedEmail = idx;
    });

    let headers: string[] = [];
    let dataRows: unknown[][] = [];
    let initialNameIdx = 0;
    let initialEmailIdx = -1;

    if (detectedName !== -1) {
      headers = firstRow.map((c, i) => String(c ?? '').trim() || `Column ${i + 1}`);
      dataRows = cleanedRows.slice(1);
      initialNameIdx = detectedName;
      initialEmailIdx = detectedEmail;
    } else {
      headers = firstRow.map((_, i) => `Column ${i + 1}`);
      dataRows = cleanedRows;
      initialNameIdx = 0;
      initialEmailIdx = -1;
    }

    setTabularData({ headers, rows: dataRows });
    setNameColIdx(initialNameIdx);
    setEmailColIdx(initialEmailIdx);
    applyColumnMapping(dataRows, initialNameIdx, initialEmailIdx);
    setErrorMsg('');
  };

  const parseTxtLines = (text: string) => {
    const lines = text.split(/\r?\n/);
    const parsed: Recipient[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const angleBracketMatch = trimmed.match(/^([^<]+)<([^>]+)>$/);
      if (angleBracketMatch) {
        parsed.push({
          name: angleBracketMatch[1].trim(),
          email: angleBracketMatch[2].trim(),
        });
        return;
      }

      const commaParts = trimmed.split(',');
      if (commaParts.length >= 2) {
        const name = commaParts[0].trim();
        const email = commaParts.slice(1).join(',').trim();
        parsed.push({ name, email });
        return;
      }

      parsed.push({ name: trimmed, email: '' });
    });

    setTabularData(null);
    setRecipients(parsed);
    setErrorMsg('');
  };

  const processFile = (file: File) => {
    if (!file) return;
    const lowerName = file.name.toLowerCase();

    if (lowerName.endsWith('.csv')) {
      Papa.parse(file, {
        skipEmptyLines: true,
        complete: (results) => {
          handleTabularLoaded(results.data as (string | number | null | undefined)[][]);
        },
        error: (err) => setErrorMsg(`Failed to parse CSV: ${err.message}`),
      });
    } else if (lowerName.endsWith('.xlsx')) {
      readXlsxFile(file)
        .then((rows) => handleTabularLoaded(rows))
        .catch((err) => setErrorMsg(`Failed to parse Excel (.xlsx) file: ${err?.message || 'format error'}`));
    } else if (lowerName.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = (event.target?.result as string) || '';
        parseTxtLines(content);
      };
      reader.readAsText(file);
    } else {
      setErrorMsg('Unsupported file format. Please upload a .csv, .xlsx, or .txt file.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handlePasteSubmit = () => {
    if (!pasteText.trim()) return;
    parseTxtLines(pasteText);
  };

  const handleNameColChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newIdx = parseInt(e.target.value, 10);
    setNameColIdx(newIdx);
    if (tabularData) {
      applyColumnMapping(tabularData.rows, newIdx, emailColIdx);
    }
  };

  const handleEmailColChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newIdx = parseInt(e.target.value, 10);
    setEmailColIdx(newIdx);
    if (tabularData) {
      applyColumnMapping(tabularData.rows, nameColIdx, newIdx);
    }
  };

  const removeRow = (index: number) => {
    setRecipients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLoadSample = () => {
    setTabularData(null);
    setRecipients(SAMPLE_RECIPIENTS);
    setErrorMsg('');
  };

  const nameCounts: Record<string, number> = {};
  recipients.forEach((r) => {
    const key = (r.name || '').trim().toLowerCase();
    if (key) {
      nameCounts[key] = (nameCounts[key] || 0) + 1;
    }
  });

  let readyCount = 0;
  let attentionCount = 0;

  recipients.forEach((r) => {
    const cleanName = (r.name || '').trim();
    const cleanEmail = (r.email || '').trim();
    const nameValid = cleanName.length > 0 && cleanName.length <= 200;
    const emailValid = !cleanEmail || EMAIL_REGEX.test(cleanEmail);

    if (nameValid && emailValid) {
      readyCount += 1;
    } else {
      attentionCount += 1;
    }
  });

  return (
    <div className="bg-surface border border-outline-variant rounded-2xl p-6 space-y-6 shadow-sm">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-mono text-xs font-bold">
              01
            </span>
            <h2 className="text-lg font-bold font-mono tracking-tight text-on-surface flex items-center gap-2">
              Import Recipients
            </h2>
            {recipients.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {recipients.length} Recipient{recipients.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <p className="text-xs text-outline font-mono mt-1">
            Import recipient names and emails from CSV, Excel, TXT, or direct paste. 100% client-side privacy.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadSample}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface text-xs font-mono font-medium transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Load Demo Roster
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs Switcher: Upload File vs Direct Paste */}
      <div className="flex items-center p-1 rounded-xl bg-surface-container border border-outline-variant font-mono text-xs max-w-sm">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('paste')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'paste'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <ClipboardPaste className="w-3.5 h-3.5" />
          Paste Text
        </button>
      </div>

      {activeTab === 'upload' ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-outline-variant hover:border-primary/50 bg-surface-container/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-mono font-bold text-on-surface">
              Drop file here or <span className="text-primary underline">browse</span>
            </p>
            <p className="text-xs text-outline font-mono">
              Supports CSV, Microsoft Excel (.xlsx), and UTF-8 TXT files
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-outline font-mono pt-1">
            <span className="flex items-center gap-1"><FileSpreadsheet className="w-3 h-3" /> .CSV / .XLSX</span>
            <span>•</span>
            <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> .TXT</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={`Paste participants, one per line:\nJane Chen, jane@mite.ac.in\nAlex Rivera <alex@mite.ac.in>\nMarcus Vance`}
            rows={5}
            className="w-full p-3.5 rounded-xl bg-surface-container border border-outline-variant font-mono text-xs text-on-surface placeholder:text-outline focus:border-primary focus:outline-none transition resize-y"
          />
          <button
            type="button"
            onClick={handlePasteSubmit}
            disabled={!pasteText.trim()}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary font-mono text-xs font-bold hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
          >
            Parse Recipients
          </button>
        </div>
      )}

      {/* Tabular Column Mapping Controls */}
      {tabularData && (
        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              Column Mapping
            </h4>
            <span className="text-[10px] text-outline">
              {tabularData.rows.length} rows loaded from spreadsheet
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[10px] uppercase text-outline mb-1 font-bold">
                Recipient Name Column <span className="text-rose-400">*</span>
              </label>
              <select
                value={nameColIdx}
                onChange={handleNameColChange}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-outline text-on-surface focus:border-primary focus:outline-none text-xs"
              >
                {tabularData.headers.map((h, i) => (
                  <option key={i} value={i}>
                    {h} (Col {i + 1})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase text-outline mb-1 font-bold">
                Email Address Column (Optional)
              </label>
              <select
                value={emailColIdx}
                onChange={handleEmailColChange}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-outline text-on-surface focus:border-primary focus:outline-none text-xs"
              >
                <option value={-1}>— None (Ignore Email) —</option>
                {tabularData.headers.map((h, i) => (
                  <option key={i} value={i}>
                    {h} (Col {i + 1})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Recipients Review & Validation Table */}
      {recipients.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {readyCount} Valid
              </span>
              {attentionCount > 0 && (
                <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {attentionCount} Incomplete
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setRecipients([])}
              className="text-[11px] text-rose-400 hover:text-rose-300 transition flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" /> Clear List
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto border border-outline-variant rounded-xl divide-y divide-outline-variant scrollbar-thin">
            {recipients.map((r, idx) => {
              const cleanName = (r.name || '').trim();
              const isDuplicate = cleanName && (nameCounts[cleanName.toLowerCase()] || 0) > 1;
              const hasName = Boolean(cleanName);

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3.5 py-2.5 text-xs font-mono bg-surface hover:bg-surface-container/50 transition group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[10px] text-outline w-6 text-right shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0 truncate">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold truncate ${hasName ? 'text-on-surface' : 'text-rose-400 italic'}`}>
                          {hasName ? r.name : 'Missing name'}
                        </span>
                        {isDuplicate && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400">
                            Duplicate
                          </span>
                        )}
                      </div>
                      {r.email && (
                        <span className="text-[10px] text-outline truncate block">
                          {r.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="text-outline hover:text-rose-400 transition p-1 cursor-pointer opacity-70 group-hover:opacity-100"
                    title="Remove recipient"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
