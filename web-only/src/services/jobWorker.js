import JSZip from 'jszip';
import { renderCertificate, loadImage } from './certificateRenderer';

// In-memory registry of executed jobs in current browser session
const activeJobs = new Map();

function sanitizeFilename(name) {
  return String(name || 'recipient')
    .trim()
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .replace(/\s+/g, '_');
}

export function getJob(jobId) {
  return activeJobs.get(jobId) || null;
}

export function getJobProgress(jobId) {
  const job = activeJobs.get(jobId);
  if (!job) return null;
  return {
    id: job.id,
    status: job.status,
    total: job.total,
    succeeded: job.succeeded,
    failed: job.failed,
    pending: job.pending,
    percent: job.percent,
  };
}

export function getFailedCertificates(jobId) {
  const job = activeJobs.get(jobId);
  if (!job) return { items: [] };
  return { items: job.failed_certificates || [] };
}

export function getJobZipBlob(jobId) {
  const job = activeJobs.get(jobId);
  return job ? job.zipBlob : null;
}

/**
 * Dispatches an asynchronous client-side certificate batch generation job.
 */
export async function startJob({
  title,
  organization_name,
  issued_date,
  output_format = 'pdf',
  template,
  recipients = [],
}) {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const total = recipients.length;

  const job = {
    id: jobId,
    status: 'pending',
    total,
    succeeded: 0,
    failed: 0,
    pending: total,
    percent: 0,
    certificates: [],
    failed_certificates: [],
    zipBlob: null,
  };

  activeJobs.set(jobId, job);

  // Run generation asynchronously in background
  (async () => {
    job.status = 'processing';

    let preloadedImage = null;
    if (template.kind === 'custom') {
      try {
        const src = template.background_data || template.background_path;
        if (!src) throw new Error('Custom template artwork is missing.');
        preloadedImage = await loadImage(src);
      } catch (err) {
        // Entire job fails if custom background cannot be decoded
        job.status = 'failed';
        job.failed = total;
        job.pending = 0;
        job.percent = 100;
        job.failed_certificates = recipients.map((r, idx) => ({
          id: `${jobId}_cert_${idx + 1}`,
          recipient_name: r.name,
          recipient_email: r.email,
          error_message: `Custom template error: ${err.message}`,
        }));
        return;
      }
    }

    const jobFields = {
      title,
      organization_name,
      issued_date,
    };

    const ext = (output_format || 'pdf').toLowerCase();

    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i];
      const certId = `${jobId}_cert_${i + 1}`;
      const name = (r.name || '').trim();
      const email = (r.email || '').trim();

      // Check if name is missing
      if (!name) {
        job.failed += 1;
        job.pending -= 1;
        job.percent = Math.round(((job.succeeded + job.failed) / total) * 100);
        job.failed_certificates.push({
          id: certId,
          recipient_name: '',
          recipient_email: email,
          error_message: 'Missing recipient name',
        });
        // Small delay so UI renders progress bar
        await new Promise((resolve) => setTimeout(resolve, 30));
        continue;
      }

      try {
        const certBlob = await renderCertificate({
          name,
          template,
          jobFields,
          outputFormat: ext,
          preloadedImage,
        });

        const filename = `${String(i + 1).padStart(3, '0')}_${sanitizeFilename(name)}.${ext}`;
        job.succeeded += 1;
        job.pending -= 1;
        job.certificates.push({
          id: certId,
          recipient_name: name,
          recipient_email: email,
          blob: certBlob,
          filename,
        });
      } catch (err) {
        job.failed += 1;
        job.pending -= 1;
        job.failed_certificates.push({
          id: certId,
          recipient_name: name,
          recipient_email: email,
          error_message: err.message || 'Rendering error',
        });
      }

      job.percent = Math.round(((job.succeeded + job.failed) / total) * 100);
      // Small pause between renders to yield event loop for fluid UI animations
      await new Promise((resolve) => setTimeout(resolve, 40));
    }

    // Create ZIP archive for batch download
    if (job.succeeded > 0) {
      try {
        const zip = new JSZip();
        for (const cert of job.certificates) {
          zip.file(cert.filename, cert.blob);
        }
        job.zipBlob = await zip.generateAsync({
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 },
        });
      } catch (err) {
        console.error('Failed to create ZIP package:', err);
      }
    }

    if (job.failed === 0) {
      job.status = 'completed';
    } else if (job.succeeded > 0) {
      job.status = 'completed_with_errors';
    } else {
      job.status = 'failed';
    }
  })();

  return { id: jobId };
}
