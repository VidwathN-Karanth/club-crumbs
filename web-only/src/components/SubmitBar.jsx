import React, { useState } from 'react';
import { createJob } from '../api';

export default function SubmitBar({
  title,
  organizationName,
  issuedDate,
  selectedTemplateId,
  isCustom = false,
  outputFormat = 'pdf',
  recipients,
  onJobStarted,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Built-in templates require title & issuedDate; Custom templates only require templateId & recipients
  const isFormValid =
    Boolean(selectedTemplateId) &&
    recipients.length > 0 &&
    (isCustom || (Boolean(title && title.trim()) && Boolean(issuedDate)));

  const handleSubmit = async () => {
    if (!isFormValid || submitting) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        title: title ? title.trim() : null,
        organization_name: organizationName ? organizationName.trim() : null,
        issued_date: issuedDate || null,
        output_format: (outputFormat || 'pdf').toLowerCase(),
        template_id: selectedTemplateId,
        recipients: recipients.map((r) => ({
          name: (r.name || '').trim(),
          email: (r.email || '').trim() || null,
        })),
      };

      const res = await createJob(payload);
      onJobStarted(res.id);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit bulk certificate job.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="section-card" id="section-generate">
      <div className="section-header">
        <div className="section-heading-group">
          <span className="section-number">04</span>
          <h2 className="section-title">Generate &amp; Status</h2>
          <span className={`section-status-tag ${isFormValid ? 'ready' : ''}`}>
            {isFormValid ? 'Ready to batch' : 'Awaiting inputs'}
          </span>
        </div>
        <p className="section-subtitle">
          Review queue summary and dispatch certificate rendering worker.
        </p>
      </div>

      {errorMsg && (
        <div className="alert-box alert-danger" role="alert" aria-live="polite">
          <span aria-hidden="true">⚠</span>
          <div>{errorMsg}</div>
        </div>
      )}

      <div className="generate-action-bar">
        <div className="generate-meta-column">
          <div className="generate-status-summary tabular-nums">
            {recipients.length} recipient{recipients.length === 1 ? '' : 's'} queued
          </div>
          <div className="generate-meta-chips" id="generate-requirements-hint">
            <span>Format: {outputFormat.toUpperCase()}</span>
            {!selectedTemplateId && <span>• Select a template</span>}
            {recipients.length === 0 && <span>• Import at least 1 recipient</span>}
            {!isCustom && (!title?.trim() || !issuedDate) && <span>• Enter title &amp; date</span>}
          </div>
        </div>

        <button
          type="button"
          className="btn-primary-generate tabular-nums"
          disabled={!isFormValid || submitting}
          aria-describedby="generate-requirements-hint"
          onClick={handleSubmit}
        >
          {submitting ? (
            <>Dispatching job…</>
          ) : (
            <>Generate {recipients.length} Certificate{recipients.length === 1 ? '' : 's'} ({outputFormat.toUpperCase()})</>
          )}
        </button>
      </div>
    </div>
  );
}
