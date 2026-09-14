/**
 * Structured flow-based DOCX exporter for Club Crumbs Report Builder.
 * Converts canonical document_json into a native Word (.docx) document.
 */

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  PageBreak,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import { DEFAULT_COLLEGE_HEADER } from '@/components/report-builder/collegeHeader';
import { MITE_LOGO_BASE64 } from '@/components/report-builder/logoBase64';
import { PageMargins, DEFAULT_PAGE_MARGINS } from '@/components/report-builder/reportBlocks';

interface ReportComponentNode {
  type?: string;
  tagName?: string;
  content?: string;
  classes?: string[];
  attributes?: Record<string, string>;
  src?: string;
  components?: ReportComponentNode[];
  [key: string]: unknown;
}

function stripHtml(html: string = ''): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function getRootComponents(projectData: unknown): ReportComponentNode[] {
  if (!projectData) return [];
  if (Array.isArray(projectData)) return projectData as ReportComponentNode[];
  const obj = projectData as Record<string, unknown>;
  if (Array.isArray(obj.components)) return obj.components as ReportComponentNode[];
  const pages = obj.pages as
    | Array<{ frames?: Array<{ component?: { components?: ReportComponentNode[] } }> }>
    | undefined;
  if (pages?.[0]?.frames?.[0]?.component?.components) {
    return pages[0].frames[0].component.components;
  }
  return [];
}

function extractLiItems(content: string = ''): string[] {
  const matches = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
  if (!matches) return [];
  return matches.map((m) => stripHtml(m));
}

function createCollegeHeaderElements(): (Paragraph | Table)[] {
  const invisibleBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  };

  try {
    const base64Raw = MITE_LOGO_BASE64.split(',')[1];
    const binaryString = atob(base64Raw);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: invisibleBorders,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 16, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
                borders: invisibleBorders,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new ImageRun({
                        data: bytes.buffer,
                        transformation: { width: 64, height: 80 },
                        type: 'png',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 84, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
                borders: invisibleBorders,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 0, after: 20 },
                    children: [
                      new TextRun({
                        text: DEFAULT_COLLEGE_HEADER.institutionName,
                        bold: true,
                        size: 25,
                        color: '002DB3',
                        font: 'Times New Roman',
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 0, after: 15 },
                    children: [
                      new TextRun({
                        text: DEFAULT_COLLEGE_HEADER.trustLine,
                        size: 19,
                        color: '111827',
                        font: 'Times New Roman',
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 0, after: 15 },
                    children: [
                      new TextRun({
                        text: DEFAULT_COLLEGE_HEADER.affiliationLine,
                        size: 18,
                        color: '111827',
                        font: 'Times New Roman',
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 0, after: 80 },
                    children: [
                      new TextRun({
                        text: DEFAULT_COLLEGE_HEADER.accreditationLine,
                        size: 18,
                        color: '111827',
                        font: 'Times New Roman',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ];
  } catch (err) {
    console.error('[docxExport] Error generating header logo table:', err);
    return [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 30 },
        children: [
          new TextRun({
            text: DEFAULT_COLLEGE_HEADER.institutionName,
            bold: true,
            size: 26,
            color: '002DB3',
            font: 'Times New Roman',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 20 },
        children: [
          new TextRun({
            text: DEFAULT_COLLEGE_HEADER.trustLine,
            size: 19,
            color: '111827',
            font: 'Times New Roman',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 20 },
        children: [
          new TextRun({
            text: DEFAULT_COLLEGE_HEADER.affiliationLine,
            size: 18,
            color: '111827',
            font: 'Times New Roman',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
        children: [
          new TextRun({
            text: DEFAULT_COLLEGE_HEADER.accreditationLine,
            size: 18,
            color: '111827',
            font: 'Times New Roman',
          }),
        ],
      }),
    ];
  }
}

function createSignatureTable(): Table {
  const invisibleBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  };

  const createSignCell = (role: string, subtitle: string) =>
    new TableCell({
      width: { size: 33, type: WidthType.PERCENTAGE },
      borders: invisibleBorders,
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 40 },
          border: {
            bottom: { color: '334155', space: 2, style: BorderStyle.SINGLE, size: 6 },
          },
          children: [new TextRun({ text: ' ' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 40, after: 20 },
          children: [new TextRun({ text: role, bold: true, size: 19, color: '0F172A' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 80 },
          children: [new TextRun({ text: subtitle, size: 16, color: '64748B' })],
        }),
      ],
    });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: invisibleBorders,
    rows: [
      new TableRow({
        children: [
          createSignCell('Event Co-ordinator', 'Signature & Date'),
          createSignCell('Head of Department', 'Signature & Seal'),
          createSignCell('Principal', 'Signature & Seal'),
        ],
      }),
    ],
  });
}

async function convertComponentToElements(comp: ReportComponentNode): Promise<(Paragraph | Table)[]> {
  const type = comp.type || '';
  const tagName = (comp.tagName || '').toLowerCase();
  const content = typeof comp.content === 'string' ? comp.content : '';
  const attrs = comp.attributes || {};

  // 1. College Header
  if (type === 'college-header' || comp.classes?.includes('college-header')) {
    return createCollegeHeaderElements();
  }

  // 2. Page Content container (recurse through its children)
  if (type === 'page-content' || comp.classes?.includes('report-page-content')) {
    const children = comp.components || [];
    const elements: (Paragraph | Table)[] = [];
    for (const child of children) {
      const converted = await convertComponentToElements(child);
      elements.push(...converted);
    }
    return elements;
  }

  // 3. Headings
  if (tagName === 'h1' || type === 'heading-1') {
    const text = stripHtml(content) || 'Heading 1';
    return [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
        children: [new TextRun({ text, bold: true, size: 28, color: '0F172A' })],
      }),
    ];
  }

  if (tagName === 'h2' || type === 'heading-2') {
    const text = stripHtml(content) || 'Heading 2';
    return [
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
        children: [new TextRun({ text, bold: true, size: 24, color: '1E293B' })],
      }),
    ];
  }

  if (tagName === 'h3' || type === 'heading-3') {
    const text = stripHtml(content) || 'Heading 3';
    return [
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 160, after: 80 },
        children: [new TextRun({ text, bold: true, size: 20, color: '334155' })],
      }),
    ];
  }

  // 4. Lists
  if (tagName === 'ul' || type === 'bullet-list') {
    const items = extractLiItems(content);
    if (items.length === 0) {
      const directChildren = comp.components || [];
      const liTexts = directChildren
        .filter((c: ReportComponentNode) => (c.tagName || '').toLowerCase() === 'li')
        .map((c: ReportComponentNode) => stripHtml(c.content || ''));
      items.push(...liTexts);
    }
    return items.map(
      (text) =>
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 40, after: 40 },
          children: [new TextRun({ text, size: 20, color: '334155' })],
        })
    );
  }

  if (tagName === 'ol' || type === 'numbered-list') {
    const items = extractLiItems(content);
    if (items.length === 0) {
      const directChildren = comp.components || [];
      const liTexts = directChildren
        .filter((c: ReportComponentNode) => (c.tagName || '').toLowerCase() === 'li')
        .map((c: ReportComponentNode) => stripHtml(c.content || ''));
      items.push(...liTexts);
    }
    return items.map(
      (text, idx) =>
        new Paragraph({
          spacing: { before: 40, after: 40 },
          children: [new TextRun({ text: `${idx + 1}. ${text}`, size: 20, color: '334155' })],
        })
    );
  }

  // 5. Signature Block
  if (type === 'signature-block' || comp.classes?.includes('signature-block')) {
    return [createSignatureTable()];
  }

  // 6. Image / Image Placeholder
  if (type === 'image-placeholder' || type === 'image' || tagName === 'img') {
    let src = attrs['src'] || attrs['data-src'] || comp.src || '';
    if (!src && content) {
      const srcMatch = content.match(/src=["']([^"']+)["']/i);
      if (srcMatch) src = srcMatch[1];
    }

    if (src) {
      try {
        let arrayBuffer: ArrayBuffer;
        if (src.startsWith('data:')) {
          // Data URI decoding
          const base64Data = src.split(',')[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          arrayBuffer = bytes.buffer;
        } else {
          // External/storage URL fetch
          const res = await fetch(src);
          arrayBuffer = await res.arrayBuffer();
        }

        const imgType: 'png' | 'jpg' = src.includes('.png') || src.startsWith('data:image/png') ? 'png' : 'jpg';

        return [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 160, after: 160 },
            children: [
              new ImageRun({
                data: arrayBuffer,
                transformation: { width: 440, height: 260 },
                type: imgType,
              }),
            ],
          }),
        ];
      } catch (err) {
        console.warn('[docxExport] Failed to fetch image, using fallback:', err);
        return [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 120 },
            children: [
              new TextRun({
                text: `[Report Image: ${src}]`,
                italics: true,
                color: '64748B',
                size: 18,
              }),
            ],
          }),
        ];
      }
    } else {
      return [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [
            new TextRun({
              text: '[Image Placeholder (unfilled)]',
              italics: true,
              color: '94A3B8',
              size: 18,
            }),
          ],
        }),
      ];
    }
  }

  // 7. Divider rule
  if (tagName === 'hr' || type === 'divider') {
    return [
      new Paragraph({
        border: {
          bottom: { color: 'CBD5E1', space: 2, style: BorderStyle.SINGLE, size: 6 },
        },
        spacing: { before: 140, after: 140 },
        children: [new TextRun({ text: '' })],
      }),
    ];
  }

  // 8. Spacer
  if (type === 'spacer' || comp.classes?.includes('report-spacer')) {
    return [new Paragraph({ spacing: { before: 240 } })];
  }

  // 9. Text / Paragraph / Text Placeholder / Default fallback
  const cleanText = stripHtml(content);
  if (cleanText) {
    return [
      new Paragraph({
        spacing: { before: 60, after: 100 },
        children: [new TextRun({ text: cleanText, size: 20, color: '334155' })],
      }),
    ];
  }

  // If component has nested children, process them
  if (Array.isArray(comp.components) && comp.components.length > 0) {
    const nested: (Paragraph | Table)[] = [];
    for (const child of comp.components) {
      const converted = await convertComponentToElements(child);
      nested.push(...converted);
    }
    return nested;
  }

  return [];
}

/**
 * Builds the complete DOCX Document from the structured GrapesJS project data.
 */
export async function exportReportToDocx(title: string, documentJson: unknown): Promise<Blob> {
  const rootComponents = getRootComponents(documentJson);
  const docElements: (Paragraph | Table)[] = [];

  // Find all A4 report-page components
  const pageComponents = rootComponents.filter(
    (c: ReportComponentNode) => c.type === 'report-page' || c.classes?.includes('report-page')
  );

  const pagesToProcess = pageComponents.length > 0 ? pageComponents : [{ components: rootComponents }];

  for (let pageIdx = 0; pageIdx < pagesToProcess.length; pageIdx++) {
    const page = pagesToProcess[pageIdx];

    // Page break before every page except the first
    if (pageIdx > 0) {
      docElements.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
    }

    const pageChildren = page.components || [];
    for (const child of pageChildren) {
      const converted = await convertComponentToElements(child);
      docElements.push(...converted);
    }
  }

  // If no elements were generated, insert report title as fallback
  if (docElements.length === 0) {
    docElements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: title || 'Event Report', bold: true, size: 28 })],
      })
    );
  }

  const pageMargins: PageMargins =
    (documentJson as any)?.pageMargins || DEFAULT_PAGE_MARGINS;

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: Math.round((pageMargins.top ?? 20) * 56.7),
              right: Math.round((pageMargins.right ?? 20) * 56.7),
              bottom: Math.round((pageMargins.bottom ?? 20) * 56.7),
              left: Math.round((pageMargins.left ?? 20) * 56.7),
            },
          },
        },
        children: docElements,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Generates and triggers browser download of the report as a .docx file.
 */
export async function downloadReportDocx(title: string, documentJson: unknown): Promise<void> {
  const blob = await exportReportToDocx(title, documentJson);
  const filename = `${(title || 'Event-Report').replace(/[^a-zA-Z0-9_-]+/g, '_')}.docx`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
