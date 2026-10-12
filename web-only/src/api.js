import {
  getTemplates,
  saveCustomTemplate,
  deleteCustomTemplate as removeCustomTemplate,
  getTemplateConfig,
} from './services/templateRegistry';
import {
  loadImage,
  drawCustomCanvas,
  renderPreviewDataUrl,
} from './services/certificateRenderer';
import {
  startJob,
  getJobProgress,
  getFailedCertificates,
  getJobZipBlob,
} from './services/jobWorker';

// Preview URL cache keyed by template ID
const previewUrlCache = new Map();

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Fetch all available templates (built-in + locally stored custom templates).
 * Pre-generates/caches preview images for all templates.
 */
export async function fetchTemplates() {
  const templates = await getTemplates();

  // Populate preview cache
  for (const tpl of templates) {
    if (!previewUrlCache.has(tpl.id)) {
      try {
        const previewUrl = await renderPreviewDataUrl(tpl, 'Sample Recipient');
        previewUrlCache.set(tpl.id, previewUrl);
      } catch (err) {
        console.warn(`Failed to render preview for template ${tpl.id}:`, err);
      }
    }
  }

  return templates;
}

/**
 * Returns data URL preview for template ID.
 */
export function getTemplatePreviewUrl(templateId) {
  return previewUrlCache.get(templateId) || '';
}

/**
 * Creates and persists a custom template locally in browser IndexedDB.
 */
export async function uploadCustomTemplate(data) {
  let name = '';
  let imageFile = null;
  let nameX = 50.0;
  let nameY = 57.0;
  let font = 'dejavu_sans';
  let fontSizePct = 5.0;
  let color = '#171717';
  let maxWidthPct = 70.0;

  if (data instanceof FormData) {
    name = data.get('name') || 'Custom Template';
    imageFile = data.get('image');
    nameX = parseFloat(data.get('name_x') ?? 50.0);
    nameY = parseFloat(data.get('name_y') ?? 57.0);
    font = String(data.get('font') || 'dejavu_sans');
    fontSizePct = parseFloat(data.get('font_size_pct') ?? 5.0);
    color = String(data.get('color') || '#171717');
    maxWidthPct = parseFloat(data.get('max_width_pct') ?? 70.0);
  } else {
    name = data.name || 'Custom Template';
    imageFile = data.image;
    nameX = parseFloat(data.name_x ?? 50.0);
    nameY = parseFloat(data.name_y ?? 57.0);
    font = String(data.font || 'dejavu_sans');
    fontSizePct = parseFloat(data.font_size_pct ?? 5.0);
    color = String(data.color || '#171717');
    maxWidthPct = parseFloat(data.max_width_pct ?? 70.0);
  }

  if (!imageFile) throw new Error('Certificate artwork image is required.');

  const backgroundDataUrl = typeof imageFile === 'string'
    ? imageFile
    : await fileToDataUrl(imageFile);

  const templateId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const template = {
    id: templateId,
    name: name.trim(),
    kind: 'custom',
    background_data: backgroundDataUrl,
    layout: {
      name_x: nameX,
      name_y: nameY,
      font,
      font_size_pct: fontSizePct,
      color,
      max_width_pct: maxWidthPct,
    },
    required_fields: ['name'],
  };

  await saveCustomTemplate(template);

  // Generate preview immediately
  try {
    const previewUrl = await renderPreviewDataUrl(template, 'Sample Recipient');
    previewUrlCache.set(templateId, previewUrl);
  } catch (err) {
    console.warn('Failed to pre-cache custom template preview:', err);
  }

  return template;
}

/**
 * Renders a draft preview for the custom template studio on canvas.
 */
export async function fetchDraftPreview(data) {
  let imageFile = null;
  let nameX = 50.0;
  let nameY = 57.0;
  let font = 'dejavu_sans';
  let fontSizePct = 5.0;
  let color = '#171717';
  let maxWidthPct = 70.0;
  let sampleName = 'Tanisha C Kotian';

  if (data instanceof FormData) {
    imageFile = data.get('image');
    nameX = parseFloat(data.get('name_x') ?? 50.0);
    nameY = parseFloat(data.get('name_y') ?? 57.0);
    font = String(data.get('font') || 'dejavu_sans');
    fontSizePct = parseFloat(data.get('font_size_pct') ?? 5.0);
    color = String(data.get('color') || '#171717');
    maxWidthPct = parseFloat(data.get('max_width_pct') ?? 70.0);
    sampleName = String(data.get('sample_name') || 'Tanisha C Kotian');
  } else {
    imageFile = data.image;
    nameX = parseFloat(data.name_x ?? 50.0);
    nameY = parseFloat(data.name_y ?? 57.0);
    font = String(data.font || 'dejavu_sans');
    fontSizePct = parseFloat(data.font_size_pct ?? 5.0);
    color = String(data.color || '#171717');
    maxWidthPct = parseFloat(data.max_width_pct ?? 70.0);
    sampleName = String(data.sample_name || 'Tanisha C Kotian');
  }

  if (!imageFile) throw new Error('No image provided for preview.');

  const src = typeof imageFile === 'string' ? imageFile : await fileToDataUrl(imageFile);
  const img = await loadImage(src);

  const W = img.naturalWidth || img.width;
  const H = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  // Scale down if image is huge for preview responsiveness
  const scale = Math.min(1, 1400 / W);
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  drawCustomCanvas(ctx, W, H, img, sampleName, {
    name_x: nameX,
    name_y: nameY,
    font,
    font_size_pct: fontSizePct,
    color,
    max_width_pct: maxWidthPct,
  });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(URL.createObjectURL(blob));
    }, 'image/png');
  });
}

/**
 * Creates and starts a client-side batch generation job.
 */
export async function createJob(jobPayload) {
  const templates = await getTemplates();
  const template = templates.find((t) => t.id === jobPayload.template_id) || {
    id: jobPayload.template_id,
    key: jobPayload.template_id,
    kind: 'builtin',
  };

  return startJob({
    title: jobPayload.title,
    organization_name: jobPayload.organization_name,
    issued_date: jobPayload.issued_date,
    output_format: jobPayload.output_format,
    template,
    recipients: jobPayload.recipients,
  });
}

/**
 * Polls client-side batch job progress.
 */
export async function fetchJobProgress(jobId) {
  const progress = getJobProgress(jobId);
  if (!progress) throw new Error(`Job ${jobId} not found.`);
  return progress;
}

/**
 * Fetches failed certificates for a job.
 */
export async function fetchFailedCertificates(jobId) {
  return getFailedCertificates(jobId);
}

/**
 * Returns an object URL for the completed ZIP file.
 */
export function getJobZipDownloadUrl(jobId) {
  const zipBlob = getJobZipBlob(jobId);
  if (!zipBlob) return '#';
  return URL.createObjectURL(zipBlob);
}

/**
 * Triggers direct browser download of the job ZIP archive.
 */
export function downloadJobZip(jobId, filename = 'certificates_batch.zip') {
  const zipBlob = getJobZipBlob(jobId);
  if (!zipBlob) return false;

  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
