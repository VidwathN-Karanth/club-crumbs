import { jsPDF } from 'jspdf';
import { getTemplateConfig } from './templateRegistry';
import type { BuiltinTemplateConfig, CertificateTemplate, CustomTemplateLayout, JobFields, OutputFormat } from './types';

export const BUILTIN_CANVAS_WIDTH = 3508;
export const BUILTIN_CANVAS_HEIGHT = 2480;

const FONT_FAMILIES: Record<string, string> = {
  dejavu_sans: "'Plus Jakarta Sans', 'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif",
  dejavu_serif: "'Times New Roman', 'DejaVu Serif', 'Georgia', serif",
  liberation_sans: "'Plus Jakarta Sans', 'Liberation Sans', Arial, sans-serif",
  liberation_serif: "'Liberation Serif', 'Times New Roman', 'Georgia', serif",
  sans: "'Plus Jakarta Sans', 'Geist', 'Helvetica Neue', Arial, sans-serif",
  serif: "'Times New Roman', 'Georgia', 'DejaVu Serif', serif",
};

/**
 * Utility to load an HTMLImageElement from a URL or DataURL.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image: ' + (typeof err === 'object' ? 'decode error' : String(err))));
    img.src = src;
  });
}

/**
 * Draws built-in certificate layout on a 3508x2480 canvas.
 */
export function drawBuiltinCanvas(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  name: string,
  jobFields: JobFields,
  config: BuiltinTemplateConfig
) {
  const cx = W / 2.0;

  const colors = config.colors || {};
  const border = config.border || {};

  const primaryHex = colors.primary || '#1A2530';
  const secondaryHex = colors.secondary || '#5A6B7C';
  const accentHex = colors.accent || '#C59B27';
  const borderHex = colors.border || '#C59B27';
  const innerBorderHex = colors.inner_border;

  const isSerif = config.key === 'classic' || config.key === 'elegant';
  const fontBody = isSerif ? FONT_FAMILIES.serif : FONT_FAMILIES.sans;

  // Background
  ctx.fillStyle = colors.background || '#FFFDF7';
  ctx.fillRect(0, 0, W, H);

  // Border calculations
  const outerM = Math.round((border.outer_margin || 24) * (W / 842.0));
  const borderW = Math.max(4, Math.round((border.width || 2) * (W / 842.0)));
  const borderStyle = border.style || 'single';

  if (borderStyle === 'gold_double') {
    const innerM = Math.round((border.inner_margin || 32) * (W / 842.0));
    ctx.strokeStyle = borderHex;
    ctx.lineWidth = borderW;
    ctx.strokeRect(outerM, outerM, W - 2 * outerM, H - 2 * outerM);

    if (innerBorderHex) {
      ctx.strokeStyle = innerBorderHex;
      ctx.lineWidth = Math.max(2, Math.floor(borderW / 2));
      ctx.strokeRect(innerM, innerM, W - 2 * innerM, H - 2 * innerM);
    }
  } else if (borderStyle === 'single_with_accent_bar') {
    ctx.strokeStyle = borderHex;
    ctx.lineWidth = borderW;
    ctx.strokeRect(outerM, outerM, W - 2 * outerM, H - 2 * outerM);

    const barH = Math.round(24 * (H / 595.0));
    ctx.fillStyle = accentHex;
    ctx.fillRect(outerM, outerM, W - 2 * outerM, barH);
  } else if (borderStyle === 'tech_frame') {
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = borderW;
    ctx.strokeRect(outerM, outerM, W - 2 * outerM, H - 2 * outerM);

    const cs = Math.round(40 * (W / 842.0));
    ctx.fillStyle = accentHex;
    // 4 Corner squares
    ctx.fillRect(outerM - cs / 2, outerM - cs / 2, cs, cs);
    ctx.fillRect(W - outerM - cs / 2, outerM - cs / 2, cs, cs);
    ctx.fillRect(outerM - cs / 2, H - outerM - cs / 2, cs, cs);
    ctx.fillRect(W - outerM - cs / 2, H - outerM - cs / 2, cs, cs);
  } else {
    ctx.strokeStyle = borderHex;
    ctx.lineWidth = borderW;
    ctx.strokeRect(outerM, outerM, W - 2 * outerM, H - 2 * outerM);
  }

  // Field values
  const title = String(jobFields?.title || 'Certificate of Achievement');
  const orgName = jobFields?.organization_name;
  const issuedDate = String(jobFields?.issued_date || '');

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 1. Header Title
  const headerTitle = config.header_title || 'CERTIFICATE OF ACHIEVEMENT';
  const headerFontSize = Math.round(72 * (H / 595.0));
  ctx.font = `bold ${headerFontSize}px ${fontBody}`;
  ctx.fillStyle = ['classic', 'bold', 'elegant'].includes(config.key) ? accentHex : primaryHex;
  ctx.fillText(headerTitle, cx, H * 0.18);

  // 2. Subtitle
  const subtitle = config.subtitle || 'THIS IS PROUDLY PRESENTED TO';
  const subFontSize = Math.round(28 * (H / 595.0));
  ctx.font = `${isSerif && config.key === 'elegant' ? 'italic ' : ''}${subFontSize}px ${fontBody}`;
  ctx.fillStyle = secondaryHex;
  ctx.fillText(subtitle, cx, H * 0.32);

  // 3. Recipient Name with Auto-Shrink
  const maxW = W * 0.75;
  let nameFontSize = Math.round(110 * (H / 595.0));
  while (nameFontSize > 24) {
    ctx.font = `bold ${nameFontSize}px ${fontBody}`;
    if (ctx.measureText(name).width <= maxW) break;
    nameFontSize -= 4;
  }
  ctx.fillStyle = primaryHex;
  ctx.fillText(name, cx, H * 0.45);

  // 4. Accent Divider Line below name
  if (config.decorations?.accent_line) {
    const lineW = Math.round(350 * (W / 842.0));
    const lineY = Math.round(H * 0.52);
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = Math.max(2, Math.floor(borderW / 2));
    ctx.beginPath();
    ctx.moveTo(cx - lineW, lineY);
    ctx.lineTo(cx + lineW, lineY);
    ctx.stroke();
  }

  // 5. Course Label
  const courseLabel = config.for_course_label || 'FOR SUCCESSFUL COMPLETION OF';
  ctx.font = `${subFontSize}px ${fontBody}`;
  ctx.fillStyle = secondaryHex;
  ctx.fillText(courseLabel, cx, H * 0.58);

  // 6. Title and Organization with Auto-Shrink
  let displayTitle = title;
  if (orgName) {
    displayTitle = `${title} — ${orgName}`;
  }
  let titleFontSize = Math.round(56 * (H / 595.0));
  while (titleFontSize > 20) {
    ctx.font = `bold ${titleFontSize}px ${fontBody}`;
    if (ctx.measureText(displayTitle).width <= maxW) break;
    titleFontSize -= 3;
  }
  ctx.fillStyle = primaryHex;
  ctx.fillText(displayTitle, cx, H * 0.66);

  // 7. Issued Date
  if (issuedDate) {
    const dateFontSize = Math.round(32 * (H / 595.0));
    ctx.font = `${dateFontSize}px ${fontBody}`;
    ctx.fillStyle = secondaryHex;
    ctx.fillText(`Issued Date: ${issuedDate}`, cx, H * 0.78);
  }
}

/**
 * Draws custom background certificate with user-placed name coordinates.
 */
export function drawCustomCanvas(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  bgImage: HTMLImageElement,
  name: string,
  layout: CustomTemplateLayout
) {
  // Draw base artwork
  ctx.drawImage(bgImage, 0, 0, W, H);

  // Layout parameters
  const nameXPct = parseFloat(String(layout?.name_x ?? 50.0));
  const nameYPct = parseFloat(String(layout?.name_y ?? 57.0));
  const fontKey = String(layout?.font || 'dejavu_sans').toLowerCase();
  const fontSizePct = parseFloat(String(layout?.font_size_pct ?? 5.0));
  const colorHex = String(layout?.color || '#1A202C').trim();
  const maxWidthPct = parseFloat(String(layout?.max_width_pct ?? 70.0));

  const X = W * (nameXPct / 100.0);
  const Y = H * (nameYPct / 100.0);
  const maxAllowedW = W * (maxWidthPct / 100.0);

  const initialFontSize = Math.max(10, Math.round(H * (fontSizePct / 100.0)));
  const fontFamily = FONT_FAMILIES[fontKey] || FONT_FAMILIES.dejavu_sans;

  let currentFontSize = initialFontSize;
  while (currentFontSize > 8) {
    ctx.font = `bold ${currentFontSize}px ${fontFamily}`;
    if (ctx.measureText(name).width <= maxAllowedW) break;
    currentFontSize -= 1;
  }

  ctx.fillStyle = colorHex;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, X, Y);
}

/**
 * Encodes an HTMLCanvasElement into the requested format (PDF, PNG, JPG) as Blob.
 */
export async function encodeCanvas(canvas: HTMLCanvasElement, outputFormat: OutputFormat = 'pdf'): Promise<Blob> {
  const fmt = (outputFormat || 'pdf').toLowerCase() as OutputFormat;

  if (fmt === 'png') {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) reject(new Error('Failed to encode canvas to PNG'));
        else resolve(blob);
      }, 'image/png');
    });
  }

  if (fmt === 'jpg') {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) reject(new Error('Failed to encode canvas to JPG'));
        else resolve(blob);
      }, 'image/jpeg', 0.92);
    });
  }

  // Default: PDF via jsPDF
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // Use JPEG 0.95 for fast, crisp PDF embedding
  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
  return pdf.output('blob');
}

/**
 * High-level certificate renderer for individual recipients.
 */
export async function renderCertificate({
  name,
  template,
  jobFields = {},
  outputFormat = 'pdf',
  preloadedImage = null,
}: {
  name: string;
  template: CertificateTemplate;
  jobFields?: JobFields;
  outputFormat?: OutputFormat;
  preloadedImage?: HTMLImageElement | null;
}): Promise<Blob> {
  if (template.kind === 'custom') {
    let img = preloadedImage;
    if (!img) {
      const src = template.background_data;
      if (!src) throw new Error('Custom template is missing background image.');
      img = await loadImage(src);
    }

    const W = img.naturalWidth || img.width;
    const H = img.naturalHeight || img.height;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not obtain canvas 2D context');

    drawCustomCanvas(ctx, W, H, img, name, template.layout);
    return encodeCanvas(canvas, outputFormat);
  }

  // Builtin template
  const key = template.key || 'classic';
  const config = getTemplateConfig(key);

  const canvas = document.createElement('canvas');
  canvas.width = BUILTIN_CANVAS_WIDTH;
  canvas.height = BUILTIN_CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not obtain canvas 2D context');

  drawBuiltinCanvas(ctx, BUILTIN_CANVAS_WIDTH, BUILTIN_CANVAS_HEIGHT, name, jobFields, config);
  return encodeCanvas(canvas, outputFormat);
}

/**
 * Quick preview renderer returning an image DataURL for template selector thumbnails.
 */
export async function renderPreviewDataUrl(template: CertificateTemplate, sampleName = 'Sample Recipient'): Promise<string> {
  if (template.kind === 'custom') {
    const src = template.background_data;
    if (!src) return '';
    const img = await loadImage(src);
    const W = img.naturalWidth || img.width;
    const H = img.naturalHeight || img.height;

    const canvas = document.createElement('canvas');
    // Scale preview down slightly for performance
    const scale = Math.min(1, 1200 / W);
    canvas.width = Math.round(W * scale);
    canvas.height = Math.round(H * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.scale(scale, scale);

    drawCustomCanvas(ctx, W, H, img, sampleName, template.layout);
    return canvas.toDataURL('image/jpeg', 0.85);
  }

  // Builtin template preview
  const key = template.key || 'classic';
  const config = getTemplateConfig(key);

  const canvas = document.createElement('canvas');
  const scale = 0.25; // 877 x 620
  canvas.width = Math.round(BUILTIN_CANVAS_WIDTH * scale);
  canvas.height = Math.round(BUILTIN_CANVAS_HEIGHT * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.scale(scale, scale);

  drawBuiltinCanvas(
    ctx,
    BUILTIN_CANVAS_WIDTH,
    BUILTIN_CANVAS_HEIGHT,
    sampleName,
    { title: 'Full-Stack Software Architecture', organization_name: 'Metropolitan Academy', issued_date: '2026-10-12' },
    config
  );

  return canvas.toDataURL('image/jpeg', 0.85);
}
