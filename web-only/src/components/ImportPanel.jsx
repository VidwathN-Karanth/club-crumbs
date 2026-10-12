import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import readXlsxFile from 'read-excel-file';

const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
const NAME_HEADER_REGEX = /^(name|student|student[\s_-]?name|full[\s_-]?name|recipient|recipient[\s_-]?name)$/i;
const EMAIL_HEADER_REGEX = /^(email|mail|e-mail|recipient[\s_-]?email)$/i;

const SAMPLE_RECIPIENTS = [
  { name: 'Dr. Jane Chen', email: 'jane.chen@example.edu' },
  { name: 'Alex Rivera', email: 'alex.rivera@example.com' },
  { name: 'Marcus Vance', email: 'marcus.v@example.org' },
  { name: 'Sophia Kowalski', email: '' },
  { name: 'Dr. Jane Chen', email: 'jane.chen@example.edu' }, // intentional sample duplicate to show detection
];

export default function ImportPanel({ recipients, setRecipients }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'paste'
  const [pasteText, setPasteText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Tabular column mapping state (for CSV / XLSX)
  const [tabularData, setTabularData] = useState(null); // { headers: string[], rows: string[][] }
  const [nameColIdx, setNameColIdx] = useState(0);
  const [emailColIdx, setEmailColIdx] = useState(-1);

  const fileInputRef = useRef(null);

  // Apply column selection to tabular data and update parent recipients
  const applyColumnMapping = (rows, nIdx, eIdx) => {
    const parsed = [];
    rows.forEach((row) => {
      const name = String(row[nIdx] ?? '').trim();
      const email = eIdx >= 0 ? String(row[eIdx] ?? '').trim() : '';
      if (!name && !email) return; // skip completely empty rows
      parsed.push({ name, email });
    });
    setRecipients(parsed);
  };

  const handleTabularLoaded = (allRows) => {
    if (!allRows || allRows.length === 0) {
      setErrorMsg('Uploaded file contains no data.');
      return;
    }

    // Filter out completely empty rows
    const cleanedRows = allRows.filter((r) =>
      Array.isArray(r) && r.some((c) => c !== null && c !== undefined && String(c).trim() !== '')
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

    let headers = [];
    let dataRows = [];
    let initialNameIdx = 0;
    let initialEmailIdx = -1;

    if (detectedName !== -1) {
      // First row is a header
      headers = firstRow.map((c, i) => String(c ?? '').trim() || `Column ${i + 1}`);
      dataRows = cleanedRows.slice(1);
      initialNameIdx = detectedName;
      initialEmailIdx = detectedEmail;
    } else {
      // No recognized header: treat first row as data, name is column 0
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

  // TXT line-by-line parsing: supports "Name <email>", "Name, email", or bare name
  const parseTxtLines = (text) => {
    const lines = text.split(/\r?\n/);
    const parsed = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // 1. "Name <email@example.com>"
      const angleBracketMatch = trimmed.match(/^([^<]+)<([^>]+)>$/);
      if (angleBracketMatch) {
        parsed.push({
          name: angleBracketMatch[1].trim(),
          email: angleBracketMatch[2].trim(),
        });
        return;
      }

      // 2. "Name, email@example.com"
      const commaParts = trimmed.split(',');
      if (commaParts.length >= 2) {
        const name = commaParts[0].trim();
        const email = commaParts.slice(1).join(',').trim();
        parsed.push({ name, email });
        return;
      }

      // 3. Single name per line
      parsed.push({ name: trimmed, email: '' });
    });

    setTabularData(null);
    setRecipients(parsed);
    setErrorMsg('');
  };

  const processFile = (file) => {
    if (!file) return;
    const lowerName = file.name.toLowerCase();

    if (lowerName.endsWith('.csv')) {
      Papa.parse(file, {
        skipEmptyLines: true,
        complete: (results) => {
          handleTabularLoaded(results.data);
        },
        error: (err) => setErrorMsg(`Failed to parse CSV: ${err.message}`),
      });
    } else if (lowerName.endsWith('.xlsx')) {
      readXlsxFile(file)
        .then((rows) => handleTabularLoaded(rows))
        .catch((err) => setErrorMsg(`Failed to parse Excel (.xlsx) file: ${err.message}`));
    } else if (lowerName.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result || '';
        parseTxtLines(content);
      };
      reader.readAsText(file);
    } else {
      setErrorMsg('Unsupported file format. Please upload a .csv, .xlsx, or .txt file.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  // Drag and drop event handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
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

  const handleNameColChange = (e) => {
    const newIdx = parseInt(e.target.value, 10);
    setNameColIdx(newIdx);
    if (tabularData) {
      applyColumnMapping(tabularData.rows, newIdx, emailColIdx);
    }
  };

  const handleEmailColChange = (e) => {
    const newIdx = parseInt(e.target.value, 10);
    setEmailColIdx(newIdx);
    if (tabularData) {
      applyColumnMapping(tabularData.rows, nameColIdx, newIdx);
    }
  };

  const removeRow = (index) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const handleLoadSample = () => {
    setTabularData(null);
    setRecipients(SAMPLE_RECIPIENTS);
    setErrorMsg('');
  };

  // Duplicate name count calculation
  const nameCounts = {};
  recipients.forEach((r) => {
    const key = (r.name || '').trim().toLowerCase();
    if (key) {
      nameCounts[key] = (nameCounts[key] || 0) + 1;
    }
  });

  // Calculate statistics: Ready vs Attention
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
    <div className="section-card" id="section-recipients">
      <div className="section-header">
        <div className="section-heading-group">
          <span className="section-number">01</span>
          <h2 className="section-title">Import Recipients</h2>
          {recipients.length > 0 && (
            <span className="section-status-tag ready tabular-nums">
              {recipients.length} loaded
            </span>
          )}
        </div>
        <p className="section-subtitle">
          Upload a spreadsheet or paste recipient names. Headers are auto-detected with customizable column mapping.
        </p>
      </div>

      {/* Tabs */}
      <div className="tabs-nav" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'upload'}
          className={`tab-nav-btn ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          Upload File
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'paste'}
          className={`tab-nav-btn ${activeTab === 'paste' ? 'active' : ''}`}
          onClick={() => setActiveTab('paste')}
        >
          Paste Text
        </button>
      </div>

      {errorMsg && (
        <div className="alert-box alert-danger" role="alert" aria-live="polite">
          <span aria-hidden="true">⚠</span>
          <div>{errorMsg}</div>
        </div>
      )}

      {activeTab === 'upload' ? (
        <div>
          {/* Interactive Drag & Drop Area */}
          <div
            className={`dropzone ${isDragging ? 'drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="Upload recipient spreadsheet. Press Enter or Space to browse, or drag and drop a file."
          >
            <input
              ref={fileInputRef}
              type="file"
              name="recipientFile"
              accept=".csv, .xlsx, .txt"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              aria-hidden="true"
            />
            <div className="dropzone-icon" aria-hidden="true">📥</div>
            <div className="dropzone-primary-text">
              Drag and drop your spreadsheet, or click to browse
            </div>
            <div className="dropzone-secondary-text">
              Accepts CSV, Excel (.xlsx), or formatted text files
            </div>
            <div className="format-tags">
              <span className="format-pill">.CSV</span>
              <span className="format-pill">.XLSX</span>
              <span className="format-pill">.TXT</span>
            </div>
          </div>

          <div className="sample-load-row">
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted)' }}>
              Need test data?
            </span>
            <button
              type="button"
              className="btn-link-action"
              onClick={handleLoadSample}
            >
              Load 5 sample recipients
            </button>
          </div>
        </div>
      ) : (
        <div className="form-group">
          <label htmlFor="paste-textarea" className="form-label">
            Recipient entries (one per line):
          </label>
          <textarea
            id="paste-textarea"
            name="pasteText"
            className="form-input"
            rows={5}
            spellCheck={false}
            autoComplete="off"
            placeholder={`Alice Johnson\nBob Dylan <bob@example.com>\nCharlie Brown, charlie@example.com`}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <div style={{ marginTop: 'var(--space-2)', display: 'flex', gap: 'var(--space-2)' }}>
            <button
              type="button"
              className="btn-secondary-action"
              onClick={handlePasteSubmit}
            >
              Parse Text Entries
            </button>
            {pasteText && (
              <button
                type="button"
                className="btn-ghost-danger"
                onClick={() => setPasteText('')}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabular Column Mapping Controls */}
      {tabularData && tabularData.headers && tabularData.headers.length > 0 && (
        <div className="mapping-card">
          <div className="mapping-label">
            <span aria-hidden="true">⚙️</span>
            <span>Column Mapping:</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <label htmlFor="name-col-select" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-secondary)' }}>
              Name Column:
            </label>
            <select
              id="name-col-select"
              name="nameColumn"
              className="select-control"
              value={nameColIdx}
              onChange={handleNameColChange}
            >
              {tabularData.headers.map((h, i) => (
                <option key={i} value={i}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <label htmlFor="email-col-select" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-secondary)' }}>
              Email Column (Optional):
            </label>
            <select
              id="email-col-select"
              name="emailColumn"
              className="select-control"
              value={emailColIdx}
              onChange={handleEmailColChange}
            >
              <option value="-1">None (Omit Email)</option>
              {tabularData.headers.map((h, i) => (
                <option key={i} value={i}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Recipients Summary Line & Sticky Header Table */}
      {recipients.length > 0 ? (
        <div>
          <div className="recipients-summary-bar">
            <div className="recipients-count-line" aria-live="polite" aria-atomic="true">
              <span className="tabular-nums" style={{ fontWeight: 600 }}>
                {readyCount} ready
              </span>
              {attentionCount > 0 ? (
                <>
                  <span style={{ color: 'var(--color-ink-muted)' }}>•</span>
                  <span className="status-chip chip-attention tabular-nums">
                    {attentionCount} need attention
                  </span>
                </>
              ) : (
                <span className="status-chip chip-ready">All valid</span>
              )}
            </div>

            <button
              type="button"
              className="btn-ghost-danger"
              onClick={() => {
                setRecipients([]);
                setTabularData(null);
              }}
            >
              Clear all rows
            </button>
          </div>

          <div className="table-scroll-wrap">
            <table className="preview-table">
              <thead>
                <tr>
                  <th style={{ width: '48px' }}>#</th>
                  <th>Recipient Name</th>
                  <th>Email Address</th>
                  <th style={{ width: '64px', textAlign: 'center' }}>Remove</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((r, idx) => {
                  const cleanName = (r.name || '').trim();
                  const cleanEmail = (r.email || '').trim();
                  const isNameEmpty = cleanName.length === 0;
                  const isEmailInvalid = cleanEmail && !EMAIL_REGEX.test(cleanEmail);
                  const isDuplicate = cleanName && (nameCounts[cleanName.toLowerCase()] || 0) > 1;

                  return (
                    <tr
                      key={idx}
                      className={isNameEmpty ? 'row-invalid' : isEmailInvalid || isDuplicate ? 'row-flagged' : ''}
                    >
                      <td className="tabular-nums" style={{ color: 'var(--color-ink-muted)', fontSize: 'var(--text-xs)' }}>
                        {idx + 1}
                      </td>
                      <td>
                        {isNameEmpty ? (
                          <span className="status-chip chip-error">Missing name</span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                            <span>{cleanName}</span>
                            {isDuplicate && (
                              <span className="status-chip chip-attention">
                                Duplicate ({nameCounts[cleanName.toLowerCase()]})
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        {cleanEmail ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <span>{cleanEmail}</span>
                            {isEmailInvalid && (
                              <span className="status-chip chip-error">Invalid syntax</span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-ink-faint)', fontStyle: 'italic', fontSize: 'var(--text-xs)' }}>
                            (none)
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-row-remove"
                          title="Remove recipient"
                          aria-label={`Remove row ${idx + 1}: ${cleanName || 'unnamed'}`}
                          onClick={() => removeRow(idx)}
                        >
                          <span aria-hidden="true">✕</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 'var(--space-4)', textAlign: 'center', color: 'var(--color-ink-muted)', fontSize: 'var(--text-xs)' }}>
          Drop your recipient spreadsheet or paste text to start.
        </div>
      )}
    </div>
  );
}
