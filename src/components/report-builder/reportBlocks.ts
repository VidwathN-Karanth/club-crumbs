/**
 * Custom GrapesJS Component Types and Block Palette definitions for Club Crumbs Report Builder.
 * Implements the explicit A4 page container architecture, locked institutional headers,
 * and structured report content blocks.
 */

import type { Editor } from 'grapesjs';
import { getCollegeHeaderHtml } from './collegeHeader';

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const DEFAULT_PAGE_MARGINS: PageMargins = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20,
};

export const MARGIN_PRESETS: Record<string, { label: string; desc: string; margins: PageMargins }> = {
  normal: {
    label: 'Normal',
    desc: '20mm all sides',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
  },
  narrow: {
    label: 'Narrow',
    desc: '12mm all sides (more content)',
    margins: { top: 12, right: 12, bottom: 12, left: 12 },
  },
  moderate: {
    label: 'Moderate',
    desc: 'Top/Bottom 20mm, Left/Right 15mm',
    margins: { top: 20, right: 15, bottom: 20, left: 15 },
  },
  wide: {
    label: 'Wide',
    desc: '25mm all sides',
    margins: { top: 25, right: 25, bottom: 25, left: 25 },
  },
};

export function getPageMarginsCss(margins: PageMargins = DEFAULT_PAGE_MARGINS): string {
  return `
    .report-page {
      padding: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm !important;
    }
    @media print {
      .report-page {
        padding: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm !important;
      }
    }
  `;
}

export const CANVAS_CSS = `
  html, body {
    background-color: #525659;
    margin: 0;
    padding: 24px 0 60px 0;
    min-height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #111827;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
  }

  .report-page {
    width: 210mm;
    min-height: 297mm;
    max-width: 210mm;
    padding: 20mm;
    margin: 16px auto;
    background: #ffffff;
    color: #111827;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
    box-sizing: border-box;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .report-page-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 160mm;
  }

  .college-header {
    user-select: none;
    font-family: 'Times New Roman', Times, serif !important;
  }
  .college-header img {
    max-height: 85px !important;
    width: auto !important;
    object-fit: contain !important;
    display: block !important;
  }

  .image-placeholder-box {
    border: 2px dashed #94a3b8;
    border-radius: 8px;
    padding: 20px 16px;
    text-align: center;
    background: #f8fafc;
    cursor: pointer;
    transition: all 0.2s ease;
    box-sizing: border-box;
  }
  .image-placeholder-box:hover {
    border-color: #2e95ff;
    background: #f0f7ff;
  }

  /* ── Program Description report template ── */
  .report-doc-title {
    text-align: center;
    font-family: 'Times New Roman', Times, serif;
    font-weight: bold;
    font-size: 14pt;
    color: #000;
    margin: 2px 0;
    line-height: 1.3;
  }
  .report-table {
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0;
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    color: #000;
  }
  .report-table td {
    border: 1px solid #000;
    padding: 5px 9px;
    vertical-align: top;
    line-height: 1.45;
  }
  .report-table.info-table td.report-cell-label { width: 38%; }
  .report-cell-label {
    font-weight: bold;
    font-family: 'Times New Roman', Times, serif;
  }
  .report-table p { margin: 0 0 4px 0; }
  .report-table p:last-child { margin-bottom: 0; }
  .report-table .image-placeholder-box { margin-top: 6px; }
  .report-section-heading {
    font-family: 'Times New Roman', Times, serif;
    font-weight: bold;
    font-size: 13pt;
    color: #000;
    margin: 12px 0 6px 0;
  }

  ul.report-bullet-list, ul {
    list-style-type: disc !important;
    margin: 8px 0 !important;
    padding-left: 28px !important;
  }

  ol.report-numbered-list, ol {
    list-style-type: decimal !important;
    margin: 8px 0 !important;
    padding-left: 28px !important;
  }

  ul li, ol li {
    margin: 4px 0 !important;
    line-height: 1.6 !important;
  }

  p, h1, h2, h3, ul, ol, img, table, .signature-block {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  @media print {
    @page {
      size: A4 portrait;
      margin: 0;
    }
    html, body {
      background: transparent !important;
      padding: 0 !important;
      margin: 0 !important;
      display: block !important;
    }
    .report-page {
      width: 210mm !important;
      min-height: 297mm !important;
      max-height: 297mm !important;
      margin: 0 !important;
      padding: 20mm !important;
      box-shadow: none !important;
      page-break-after: always !important;
      break-after: page !important;
      box-sizing: border-box !important;
    }
    .report-page:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
    }
    .no-print {
      display: none !important;
    }
  }
`;

/**
 * Creates the structured component tree for an A4 report page:
 * - A4 container (.report-page)
 * - Locked college header (.college-header)
 * - Drop-zone content container (.report-page-content)
 */
/** A dashed image drop-zone, matching the image-placeholder component. */
const IMAGE_PLACEHOLDER_HTML =
  '<div data-gjs-type="image-placeholder" class="image-placeholder-box"></div>';

/**
 * The default "Program Description" event-report template, matching the
 * official MITE format: a Program Description key/value table, a content table
 * (Brief Introduction / Pictures / Description / Key Outcomes), and the
 * Attendance and Feedback sections. The fixed labels are locked; only the value
 * cells and body text are editable, so a user just fills in the blanks and the
 * document keeps the same template.
 */
export function getProgramReportContentHtml(): string {
  const infoRow = (label: string, hint: string) =>
    `<tr>
      <td class="report-cell-label" data-gjs-editable="false" data-gjs-draggable="false" data-gjs-selectable="false">${label}</td>
      <td class="report-value" data-gjs-type="report-value" data-gjs-droppable="false" data-gjs-draggable="false">${hint}</td>
    </tr>`;

  const section = (label: string, body: string) =>
    `<tr><td data-gjs-draggable="false">
      <p class="report-cell-label" data-gjs-editable="false" data-gjs-draggable="false" data-gjs-selectable="false">${label}</p>
      ${body}
    </td></tr>`;

  const bodyText = (hint: string) =>
    `<p class="report-body" data-gjs-type="report-body" data-gjs-droppable="false">${hint}</p>`;

  return `
    <p class="report-doc-title" data-gjs-editable="false" data-gjs-draggable="false" data-gjs-selectable="false">Department of Computer Science &amp; Engineering</p>
    <p class="report-doc-title" data-gjs-editable="false" data-gjs-draggable="false" data-gjs-selectable="false">Program Description</p>

    <table class="report-table info-table" data-gjs-type="report-table" data-gjs-draggable="false" data-gjs-droppable="false"><tbody>
      ${infoRow('Program Title', '[Enter the program / event title]')}
      ${infoRow('Program Type', '[e.g. Technical Competition, Workshop, Seminar]')}
      ${infoRow('Theme', '[Enter the theme]')}
      ${infoRow('Date', '[e.g. 15th September, 2026]')}
      ${infoRow('Resource Person / Organising Body', '[Name &amp; designation, or the organising body]')}
      ${infoRow('Number of Students', '[e.g. 54]')}
      ${infoRow('Coordinator (Details) - Name, Designation', '[Name, designation]')}
    </tbody></table>

    <table class="report-table content-table" data-gjs-type="report-table" data-gjs-draggable="false" data-gjs-droppable="false"><tbody>
      ${section('Brief Introduction about the Program:', bodyText('[Write a brief introduction about the program.]'))}
      ${section('Pictures:', IMAGE_PLACEHOLDER_HTML)}
      ${section('Description about the Program:', bodyText('[Describe how the program was conducted.]'))}
      ${section('Key Outcomes:', bodyText('[List the key outcomes for the students.]'))}
    </tbody></table>

    <p class="report-section-heading" data-gjs-editable="false" data-gjs-draggable="false" data-gjs-selectable="false">Attendance Sheet:</p>
    ${IMAGE_PLACEHOLDER_HTML}

    <p class="report-section-heading" data-gjs-editable="false" data-gjs-draggable="false" data-gjs-selectable="false">Students Feedback:</p>
    ${IMAGE_PLACEHOLDER_HTML}
  `;
}

export function createReportPageDefinition(pageNumber: number = 1, withTemplate: boolean = pageNumber === 1) {
  return {
    type: 'report-page',
    classes: ['report-page'],
    attributes: { 'data-page-num': String(pageNumber) },
    components: [
      {
        type: 'college-header',
        content: getCollegeHeaderHtml(),
      },
      {
        type: 'page-content',
        classes: ['report-page-content'],
        // Page 1 opens with the official template; extra pages start blank.
        components: withTemplate ? getProgramReportContentHtml() : [],
      },
    ],
  };
}

/**
 * Appends a new A4 page with the locked header to the document.
 */
export function addNewReportPage(editor: Editor) {
  const pages = editor.getWrapper()?.find('.report-page') || [];
  const nextNumber = pages.length + 1;
  const newPageDef = createReportPageDefinition(nextNumber);

  const [created] = editor.addComponents(newPageDef);
  if (created) {
    editor.select(created);
    interface ComponentWithView {
      getView?: () => { el?: HTMLElement };
    }
    (created as unknown as ComponentWithView).getView?.()?.el?.scrollIntoView?.({ behavior: 'smooth' });
  }
  return created;
}

/**
 * Registers custom component types in GrapesJS.
 */
export function registerComponentTypes(editor: Editor) {
  const domComps = editor.Components;

  // 1. report-page container
  domComps.addType('report-page', {
    isComponent: (el) => el.classList?.contains('report-page') || el.getAttribute?.('data-gjs-type') === 'report-page',
    model: {
      defaults: {
        tagName: 'div',
        name: 'A4 Page',
        draggable: false,
        resizable: false,
        removable: false,
        copyable: false,
        classes: ['report-page'],
        droppable: false,
      },
    },
  });

  // 2. college-header
  domComps.addType('college-header', {
    isComponent: (el) => el.classList?.contains('college-header') || el.getAttribute?.('data-gjs-type') === 'college-header',
    model: {
      defaults: {
        tagName: 'div',
        name: 'College Header',
        draggable: false,
        resizable: false,
        removable: false,
        copyable: false,
        editable: false,
        highlightable: false,
        classes: ['college-header'],
      },
    },
  });

  // 3. page-content container
  domComps.addType('page-content', {
    isComponent: (el) => el.classList?.contains('report-page-content') || el.getAttribute?.('data-gjs-type') === 'page-content',
    model: {
      defaults: {
        tagName: 'div',
        name: 'Page Content',
        draggable: false,
        resizable: false,
        removable: false,
        copyable: false,
        droppable: true,
        classes: ['report-page-content'],
      },
    },
  });

  // 4. image-placeholder
  domComps.addType('image-placeholder', {
    isComponent: (el) => el.getAttribute?.('data-gjs-type') === 'image-placeholder' || el.classList?.contains('image-placeholder-box'),
    model: {
      defaults: {
        tagName: 'div',
        name: 'Image Placeholder',
        classes: ['image-placeholder-box'],
        attributes: {
          'data-state': 'empty',
          'data-gjs-type': 'image-placeholder',
        },
        resizable: {
          ratioDefault: true,
          tc: 0,
          cl: 0,
          cr: 1,
          bc: 1,
        },
        content: `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #64748b; padding: 24px 16px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            </svg>
            <div style="font-size: 13px; font-weight: 700; color: #334155;">Click to upload image</div>
            <div style="font-size: 11px; color: #94a3b8;">PNG, JPG, or WebP up to 4MB</div>
          </div>
        `,
      },
    },
  });

  // 5. text-placeholder
  domComps.addType('text-placeholder', {
    isComponent: (el) => el.getAttribute?.('data-gjs-type') === 'text-placeholder',
    model: {
      defaults: {
        tagName: 'p',
        name: 'Text Placeholder',
        attributes: {
          'data-gjs-type': 'text-placeholder',
          'data-state': 'empty',
        },
        content: '<span style="color: #94a3b8; font-style: italic;">[Click here to enter text...]</span>',
      },
    },
  });

  // 6. signature-block
  domComps.addType('signature-block', {
    isComponent: (el) => el.getAttribute?.('data-gjs-type') === 'signature-block' || el.classList?.contains('signature-block'),
    model: {
      defaults: {
        tagName: 'div',
        name: 'Signature Block',
        classes: ['signature-block'],
        attributes: {
          'data-gjs-type': 'signature-block',
        },
        content: `
          <div style="margin-top: 36px; margin-bottom: 12px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center; font-family: inherit;">
            <div style="display: flex; flex-direction: column; align-items: center;">
              <div style="width: 85%; border-bottom: 1.5px solid #334155; margin-bottom: 8px; height: 35px;"></div>
              <div style="font-size: 10pt; font-weight: 700; color: #0f172a;">Event Co-ordinator</div>
              <div style="font-size: 8pt; color: #64748b;">Signature & Date</div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center;">
              <div style="width: 85%; border-bottom: 1.5px solid #334155; margin-bottom: 8px; height: 35px;"></div>
              <div style="font-size: 10pt; font-weight: 700; color: #0f172a;">Head of Department</div>
              <div style="font-size: 8pt; color: #64748b;">Signature & Seal</div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center;">
              <div style="width: 85%; border-bottom: 1.5px solid #334155; margin-bottom: 8px; height: 35px;"></div>
              <div style="font-size: 10pt; font-weight: 700; color: #0f172a;">Principal</div>
              <div style="font-size: 8pt; color: #64748b;">Signature & Seal</div>
            </div>
          </div>
        `,
      },
    },
  });

  // 7. bullet-list (first-class editable text component)
  domComps.addType('bullet-list', {
    extend: 'text',
    isComponent: (el) => el.tagName === 'UL',
    model: {
      defaults: {
        tagName: 'ul',
        name: 'Bullet List',
        type: 'bullet-list',
        editable: true,
        droppable: false,
        classes: ['report-bullet-list'],
      },
    },
  });

  // 8. numbered-list (first-class editable text component)
  domComps.addType('numbered-list', {
    extend: 'text',
    isComponent: (el) => el.tagName === 'OL',
    model: {
      defaults: {
        tagName: 'ol',
        name: 'Numbered List',
        type: 'numbered-list',
        editable: true,
        droppable: false,
        classes: ['report-numbered-list'],
      },
    },
  });

  // 9. report-table — the fixed Program Description / content tables. The table
  // itself cannot be dragged apart or have blocks dropped into it; its labels
  // are locked and only the value cells / body text are editable.
  domComps.addType('report-table', {
    isComponent: (el) =>
      el.tagName === 'TABLE' && !!el.classList?.contains('report-table'),
    model: {
      defaults: { name: 'Report Table', draggable: false, droppable: false, removable: false, copyable: false },
    },
  });

  // 10. report-value — an editable value cell in the info table.
  domComps.addType('report-value', {
    extend: 'text',
    isComponent: (el) =>
      el.tagName === 'TD' && !!el.classList?.contains('report-value'),
    model: {
      defaults: { type: 'report-value', name: 'Field', editable: true, droppable: false, draggable: false, removable: false },
    },
  });

  // 11. report-body — an editable body paragraph inside a content section.
  domComps.addType('report-body', {
    extend: 'text',
    isComponent: (el) =>
      el.tagName === 'P' && !!el.classList?.contains('report-body'),
    model: {
      defaults: { type: 'report-body', name: 'Text', editable: true, droppable: false, removable: false },
    },
  });

  // 12. report-locked — the fixed labels and titles; visible but not editable.
  domComps.addType('report-locked', {
    isComponent: (el) =>
      !!el.classList?.contains('report-cell-label') ||
      !!el.classList?.contains('report-doc-title') ||
      !!el.classList?.contains('report-section-heading'),
    model: {
      defaults: { name: 'Label', editable: false, draggable: false, droppable: false, removable: false, copyable: false },
    },
  });
}

/**
 * Registers user-facing blocks in GrapesJS block manager.
 * Note: `college-header` is intentionally NOT registered here.
 */
export function registerBlocks(editor: Editor) {
  const bm = editor.Blocks;

  // ── STRUCTURE CATEGORY ──
  bm.add('new-page-block', {
    label: 'New A4 Page',
    category: 'Structure',
    attributes: { class: 'gjs-block-custom' },
    content: createReportPageDefinition(),
  });

  // ── CONTENT CATEGORY ──
  bm.add('heading-1-block', {
    label: 'Heading 1',
    category: 'Content',
    content: {
      type: 'text',
      tagName: 'h1',
      content: 'Event Title / Workshop Heading',
      style: {
        'font-size': '20pt',
        'font-weight': '800',
        'color': '#0f172a',
        'margin-bottom': '10px',
        'line-height': '1.2',
      },
    },
  });

  bm.add('heading-2-block', {
    label: 'Heading 2',
    category: 'Content',
    content: {
      type: 'text',
      tagName: 'h2',
      content: 'Section Heading / Objectives',
      style: {
        'font-size': '14pt',
        'font-weight': '700',
        'color': '#1e293b',
        'margin-top': '14px',
        'margin-bottom': '8px',
        'line-height': '1.3',
      },
    },
  });

  bm.add('heading-3-block', {
    label: 'Heading 3',
    category: 'Content',
    content: {
      type: 'text',
      tagName: 'h3',
      content: 'Subsection Heading / Details',
      style: {
        'font-size': '11pt',
        'font-weight': '600',
        'color': '#334155',
        'margin-top': '10px',
        'margin-bottom': '6px',
      },
    },
  });

  bm.add('paragraph-block', {
    label: 'Paragraph',
    category: 'Content',
    content: {
      type: 'text',
      tagName: 'p',
      content: 'Write the event description, student outcomes, or workshop summary here. Club Crumbs reports provide an official record for academic audits, college accreditation, and student recognition.',
      style: {
        'font-size': '10pt',
        'line-height': '1.5',
        'color': '#334155',
        'margin-bottom': '8px',
      },
    },
  });

  bm.add('bullet-list-block', {
    label: 'Bullet List',
    category: 'Content',
    content: {
      type: 'bullet-list',
      tagName: 'ul',
      classes: ['report-bullet-list'],
      content: `
        <li>Key takeaway or discussion point 1</li>
        <li>Hands-on session / lab exercise completed</li>
        <li>Outcome achieved / student participation count</li>
      `,
      style: {
        'font-size': '10pt',
        'line-height': '1.6',
        'color': '#334155',
        'margin-left': '24px',
        'margin-bottom': '8px',
      },
    },
  });

  bm.add('numbered-list-block', {
    label: 'Numbered List',
    category: 'Content',
    content: {
      type: 'numbered-list',
      tagName: 'ol',
      classes: ['report-numbered-list'],
      content: `
        <li>Phase 1: Registration and inauguration</li>
        <li>Phase 2: Technical workshop & problem solving</li>
        <li>Phase 3: Winner announcements & concluding remarks</li>
      `,
      style: {
        'font-size': '10pt',
        'line-height': '1.6',
        'color': '#334155',
        'margin-left': '24px',
        'margin-bottom': '8px',
      },
    },
  });

  bm.add('signature-block', {
    label: 'Signature Block',
    category: 'Content',
    content: {
      type: 'signature-block',
    },
  });

  bm.add('divider-block', {
    label: 'Divider Rule',
    category: 'Content',
    content: '<hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 16px 0;" />',
  });

  bm.add('spacer-block', {
    label: 'Spacer (20px)',
    category: 'Content',
    content: '<div style="height: 20px; width: 100%;"></div>',
  });

  // ── PLACEHOLDERS CATEGORY ──
  bm.add('image-placeholder-block', {
    label: 'Image Placeholder',
    category: 'Placeholders',
    content: {
      type: 'image-placeholder',
    },
  });

  bm.add('text-placeholder-block', {
    label: 'Text Placeholder',
    category: 'Placeholders',
    content: {
      type: 'text-placeholder',
    },
  });
}
