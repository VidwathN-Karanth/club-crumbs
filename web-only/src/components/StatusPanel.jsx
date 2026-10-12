import React, { useState, useEffect, useRef } from 'react';
import { fetchJobProgress, fetchFailedCertificates, getJobZipDownloadUrl } from '../api';

const FINAL_STATUSES = ['completed', 'completed_with_errors', 'failed'];

export default function StatusPanel({ jobId, onReset }) {
  const [progress, setProgress] = useState(null);
  const [failedCerts, setFailedCerts] = useState([]);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const pollTimerRef = useRef(null);

  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const data = await fetchJobProgress(jobId);
        setProgress(data);

        // Check if finished
        if (FINAL_STATUSES.includes(data.status)) {
          clearInterval(pollTimerRef.current);

          // If there were failed certificates, fetch their details and reasons
          if (data.failed > 0) {
            setLoadingFailed(true);
            try {
              const failedData = await fetchFailedCertificates(jobId);
              setFailedCerts(failedData.items || []);
            } catch (err) {
              console.error('Error fetching failed certificates:', err);
            } finally {
              setLoadingFailed(false);
            }
          }
        }
      } catch (err) {
        setErrorMsg(`Failed to poll job status: ${err.message}`);
      }
    };

    // Initial poll
    poll();
    // Responsive poll every 400ms for smooth client updates
    pollTimerRef.current = setInterval(poll, 400);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [jobId]);

  if (!progress) {
    return (
      <div className="section-card" id="section-status">
        <div className="section-header">
          <div className="section-heading-group">
            <span className="section-number">04</span>
            <h2 className="section-title">Batch Progress &amp; Status</h2>
            <span className="section-status-tag">Connecting</span>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-4)' }} aria-live="polite">
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-ink)' }}>
            Connecting to generation worker…
          </div>
          <div className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted)', marginTop: 'var(--space-2)' }}>
            Job ID: {jobId}
          </div>
        </div>
      </div>
    );
  }

  const isCompleted = FINAL_STATUSES.includes(progress.status);
  const finishedCount = progress.succeeded + progress.failed;
  const statusLabel = progress.status.replace(/_/g, ' ');

  return (
    <div className="section-card" id="section-status" style={{ borderColor: 'var(--color-primary)' }}>
      <div className="section-header">
        <div className="section-heading-group">
          <span className="section-number">04</span>
          <h2 className="section-title">
            {isCompleted ? 'Batch Generation Complete' : 'Generating Certificates…'}
          </h2>
          <span
            className={`section-status-tag ${
              progress.status === 'completed'
                ? 'ready'
                : progress.status === 'failed'
                ? 'chip-error'
                : ''
            }`}
            style={{ textTransform: 'uppercase' }}
          >
            {statusLabel}
          </span>
        </div>
        <p className="section-subtitle">
          Job ID: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)', fontWeight: 600 }}>{jobId}</code>
        </p>
      </div>

      {errorMsg && (
        <div className="alert-box alert-danger" role="alert" aria-live="polite">
          <span aria-hidden="true">⚠</span>
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Accessible Real Progress Bar */}
      <div className="live-progress-container">
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Certificate generation progress"
          aria-valuenow={progress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${finishedCount} of ${progress.total} certificates processed, ${progress.percent}%`}
        >
          <div
            className="progress-bar-fill"
            style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
          />
        </div>

        {/* Live progress announcement */}
        <div className="progress-meta-row tabular-nums" aria-live="polite" aria-atomic="true">
          <span>
            <strong className="progress-count-strong">{finishedCount}</strong> of <strong className="progress-count-strong">{progress.total}</strong> processed ({progress.percent}%)
          </span>
          <span>
            {progress.pending > 0 ? `${progress.pending} in queue` : '✓ All rows processed'}
          </span>
        </div>
      </div>

      {/* Telemetry Counter Grid */}
      <div className="telemetry-grid">
        <div className="telemetry-card">
          <span className="telemetry-value success tabular-nums">{progress.succeeded}</span>
          <span className="telemetry-label">Succeeded</span>
        </div>
        <div className="telemetry-card">
          <span className={`telemetry-value ${progress.failed > 0 ? 'error' : ''} tabular-nums`}>
            {progress.failed}
          </span>
          <span className="telemetry-label">Failed</span>
        </div>
        <div className="telemetry-card">
          <span className="telemetry-value tabular-nums">{progress.total}</span>
          <span className="telemetry-label">Total</span>
        </div>
      </div>

      {/* Action triggers when complete */}
      {isCompleted && (
        <div className="completion-actions-row">
          {progress.succeeded > 0 && (
            <a
              href={getJobZipDownloadUrl(jobId)}
              className="btn-zip-download"
              download="certificates_batch.zip"
              aria-label="Download all generated certificates as ZIP archive"
            >
              <span aria-hidden="true">📦</span>
              <span>Download All Certificates (.ZIP)</span>
            </a>
          )}
          <button
            type="button"
            className="btn-secondary-action"
            onClick={onReset}
          >
            Start New Batch
          </button>
        </div>
      )}

      {/* Failed Recipients Breakdown Table */}
      {progress.failed > 0 && (
        <div className="failed-section-container">
          <h3 className="failed-heading">
            Failed Recipients ({progress.failed})
          </h3>
          <p className="failed-description">
            The following recipients encountered validation or rendering errors. Successful certificates are preserved in the ZIP download.
          </p>

          {loadingFailed ? (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted)' }} aria-live="polite">
              Loading failure reasons…
            </div>
          ) : (
            <div className="table-scroll-wrap">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th style={{ width: '48px' }}>#</th>
                    <th>Recipient Name</th>
                    <th>Email Address</th>
                    <th>Failure Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {failedCerts.map((cert, idx) => (
                    <tr key={cert.id} className="row-invalid">
                      <td className="tabular-nums" style={{ color: 'var(--color-ink-muted)', fontSize: 'var(--text-xs)' }}>
                        {idx + 1}
                      </td>
                      <td>{cert.recipient_name || <em>(empty)</em>}</td>
                      <td>{cert.recipient_email || <em>(empty)</em>}</td>
                      <td style={{ color: 'var(--color-error)', fontWeight: 600 }}>
                        {cert.error_message || 'Rendering error'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
