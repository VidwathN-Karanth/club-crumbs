'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import grapesjs, { type Editor, type Component } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';

import {
  ArrowLeft,
  ChevronDown,
  Download,
  Eye,
  FileDown,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Layers,
  List,
  ListOrdered,
  Loader2,
  Maximize2,
  Minus,
  PenTool,
  Plus,
  Save,
  Sliders,
  Type,
} from 'lucide-react';

import { type Cohort, CLUB_META } from '@/lib/cohorts';
import { apiFetch, apiUrl, readJson } from '@/lib/apiClient';
import { downloadReportDocx } from '@/lib/docxExport';
import {
  CANVAS_CSS,
  addNewReportPage,
  createReportPageDefinition,
  registerBlocks,
  registerComponentTypes,
  type PageMargins,
  DEFAULT_PAGE_MARGINS,
  MARGIN_PRESETS,
  getPageMarginsCss,
} from './reportBlocks';
import { getCollegeHeaderHtml } from './collegeHeader';
import ReportPropertyPanel from './ReportPropertyPanel';

interface ReportData {
  id: string;
  title: string;
  cohort: Cohort;
  status: string;
  documentJson: Record<string, any>;
  documentHtml?: string | null;
  documentCss?: string | null;
}

interface ReportEditorProps {
  report: ReportData;
  backUrl?: string;
}

/**
 * Configures the canvas iframe document with styles and Word-like list behavior:
 * - Pressing Enter on a bullet/number creates the next bullet/number (splits if mid-text)
 * - Pressing Enter on an empty bullet/number exits the list into a new paragraph
 * - Pressing Backspace on an empty bullet/number removes it and moves cursor to the previous item
 * - Pressing Tab/Shift+Tab indents/outdents the item without losing canvas focus
 */
export interface CanvasCursorState {
  domElement: HTMLElement | null;
  splitInfo?: {
    beforeHtml: string;
    afterHtml: string;
  } | null;
}

function setupCanvasDoc(
  frameDoc: Document,
  editorInstance: Editor,
  markDirty: () => void,
  onCursorUpdate?: (state: CanvasCursorState) => void
) {
  if (!frameDoc.getElementById('cc-report-styles')) {
    const styleEl = frameDoc.createElement('style');
    styleEl.id = 'cc-report-styles';
    styleEl.innerHTML = CANVAS_CSS;
    frameDoc.head.appendChild(styleEl);
  }

  // ── Track cursor / selection location inside report-page-content ──
  const handleSelectionOrCursor = () => {
    const sel = frameDoc.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);

    let node: Node | null = range.startContainer;
    let blockEl: HTMLElement | null = null;

    while (node && node !== frameDoc.body) {
      const parentNode: HTMLElement | null = node.parentElement;
      if (parentNode && parentNode.classList?.contains('report-page-content')) {
        blockEl = (node.nodeType === Node.ELEMENT_NODE ? node : parentNode) as HTMLElement;
        break;
      }
      node = parentNode;
    }

    if (blockEl) {
      let splitInfo: { beforeHtml: string; afterHtml: string } | null = null;
      const tagName = blockEl.tagName.toLowerCase();
      if (['p', 'h1', 'h2', 'h3', 'div'].includes(tagName) && range.collapsed) {
        try {
          const preRange = frameDoc.createRange();
          preRange.selectNodeContents(blockEl);
          preRange.setEnd(range.startContainer, range.startOffset);
          const beforeFragment = preRange.cloneContents();
          const tempBefore = frameDoc.createElement('div');
          tempBefore.appendChild(beforeFragment);

          const postRange = frameDoc.createRange();
          postRange.selectNodeContents(blockEl);
          postRange.setStart(range.endContainer, range.endOffset);
          const afterFragment = postRange.cloneContents();
          const tempAfter = frameDoc.createElement('div');
          tempAfter.appendChild(afterFragment);

          splitInfo = {
            beforeHtml: tempBefore.innerHTML,
            afterHtml: tempAfter.innerHTML,
          };
        } catch {
          // ignore range bounds error
        }
      }

      onCursorUpdate?.({
        domElement: blockEl,
        splitInfo,
      });
    }
  };

  if (!(frameDoc as any).__ccCursorListenersAttached) {
    (frameDoc as any).__ccCursorListenersAttached = true;
    frameDoc.addEventListener('selectionchange', handleSelectionOrCursor);
    frameDoc.addEventListener('pointerup', handleSelectionOrCursor);
    frameDoc.addEventListener('keyup', handleSelectionOrCursor);
    frameDoc.addEventListener('input', handleSelectionOrCursor);
  }

  // Avoid attaching duplicate keydown listeners to the iframe document
  if ((frameDoc as any).__ccListKeydownAttached) return;
  (frameDoc as any).__ccListKeydownAttached = true;

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== 'Backspace' && e.key !== 'Tab') return;

    const sel = frameDoc.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);

    let node: Node | null = range.startContainer;
    let currentLi: HTMLLIElement | null = null;
    while (node && node !== frameDoc.body) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'LI') {
        currentLi = node as HTMLLIElement;
        break;
      }
      node = node.parentNode;
    }

    if (!currentLi) {
      if (e.key === 'Enter') {
        const selected = editorInstance.getSelected();
        const selType = selected?.get('type') || selected?.get('tagName')?.toLowerCase();
        if (
          selected &&
          (selType === 'bullet-list' ||
            selType === 'numbered-list' ||
            selType === 'ul' ||
            selType === 'ol')
        ) {
          e.preventDefault();
          const view = (selected as any).getView?.();
          const el = view?.el as HTMLElement;
          if (el) {
            (editorInstance as any).RichTextEditor?.start?.(el);
            const lastLi = el.querySelector('li:last-child') || el;
            const newRange = frameDoc.createRange();
            newRange.selectNodeContents(lastLi);
            newRange.collapse(false);
            sel.removeAllRanges();
            sel.addRange(newRange);
          }
        }
      }
      return;
    }

    const parentList = currentLi.parentElement as HTMLUListElement | HTMLOListElement | null;
    if (!parentList || (parentList.tagName !== 'UL' && parentList.tagName !== 'OL')) return;

    // ── TAB / SHIFT+TAB: Indentation ──
    if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      const currentMargin = parseInt(currentLi.style.marginLeft || '0', 10);
      if (!e.shiftKey) {
        currentLi.style.marginLeft = `${Math.min(currentMargin + 20, 60)}px`;
      } else {
        currentLi.style.marginLeft = `${Math.max(currentMargin - 20, 0)}px`;
      }
      parentList.dispatchEvent(new Event('input', { bubbles: true }));
      editorInstance.trigger('update');
      markDirty();
      return;
    }

    // ── ENTER: Add next bullet / number or exit list ──
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        const br = frameDoc.createElement('br');
        range.deleteContents();
        range.insertNode(br);
        range.setStartAfter(br);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        parentList.dispatchEvent(new Event('input', { bubbles: true }));
        editorInstance.trigger('update');
        markDirty();
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const text = currentLi.textContent?.trim() || '';
      const hasMedia = !!currentLi.querySelector('img, svg');
      const isLiEmpty = !text && !hasMedia;

      // Case A: Empty bullet/number -> Exit list (similar to Word / Google Docs)
      if (isLiEmpty) {
        const nextLi = currentLi.nextElementSibling as HTMLLIElement | null;
        currentLi.remove();

        // Create new paragraph below list
        const p = frameDoc.createElement('p');
        p.style.fontSize = '10pt';
        p.style.lineHeight = '1.5';
        p.style.color = '#334155';
        p.style.marginBottom = '8px';
        p.innerHTML = '<br>';

        if (nextLi) {
          const remainingLis: HTMLLIElement[] = [];
          let cur: HTMLLIElement | null = nextLi;
          while (cur) {
            const nxt = cur.nextElementSibling as HTMLLIElement | null;
            remainingLis.push(cur);
            cur = nxt;
          }

          const secondList = frameDoc.createElement(
            parentList.tagName.toLowerCase()
          ) as HTMLUListElement | HTMLOListElement;
          secondList.className = parentList.className;
          secondList.style.cssText = parentList.style.cssText;
          if (parentList.tagName === 'OL') {
            (secondList as HTMLOListElement).start = (parentList.querySelectorAll('li').length || 0) + 2;
          }
          remainingLis.forEach((item) => secondList.appendChild(item));

          parentList.after(secondList);
          parentList.after(p);
        } else {
          parentList.after(p);
        }

        if (parentList.querySelectorAll('li').length === 0) {
          parentList.remove();
        }

        const newRange = frameDoc.createRange();
        newRange.setStart(p, 0);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);

        parentList.dispatchEvent(new Event('input', { bubbles: true }));
        editorInstance.trigger('update');
        markDirty();
        return;
      }

      // Case B: Non-empty bullet/number -> Add next bullet/number
      const endRange = frameDoc.createRange();
      endRange.setStart(range.endContainer, range.endOffset);
      endRange.setEndAfter(currentLi.lastChild || currentLi);
      const extractedFragment = endRange.extractContents();

      const newLi = frameDoc.createElement('li');
      const hasExtractedContent =
        extractedFragment.textContent?.trim() ||
        extractedFragment.querySelector('img, span, strong, em, b, i, u');

      if (hasExtractedContent) {
        newLi.appendChild(extractedFragment);
      } else {
        newLi.innerHTML = '<br>';
      }

      if (currentLi.style.marginLeft) {
        newLi.style.marginLeft = currentLi.style.marginLeft;
      }

      currentLi.after(newLi);

      if (
        !currentLi.childNodes.length ||
        (currentLi.childNodes.length === 1 &&
          currentLi.firstChild?.nodeType === Node.TEXT_NODE &&
          !currentLi.firstChild.textContent)
      ) {
        currentLi.innerHTML = '<br>';
      }

      const newRange = frameDoc.createRange();
      newRange.setStart(newLi, 0);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);

      newLi.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });

      parentList.dispatchEvent(new Event('input', { bubbles: true }));
      editorInstance.trigger('update');
      markDirty();
      return;
    }

    // ── BACKSPACE: Remove empty bullet or merge ──
    if (e.key === 'Backspace') {
      const text = currentLi.textContent?.trim() || '';
      const hasMedia = !!currentLi.querySelector('img, svg');
      const isLiEmpty = !text && !hasMedia;

      if (isLiEmpty) {
        e.preventDefault();
        e.stopPropagation();

        const prevLi = currentLi.previousElementSibling as HTMLLIElement | null;
        const nextLi = currentLi.nextElementSibling as HTMLLIElement | null;
        currentLi.remove();

        if (prevLi) {
          const newRange = frameDoc.createRange();
          newRange.selectNodeContents(prevLi);
          newRange.collapse(false);
          sel.removeAllRanges();
          sel.addRange(newRange);
        } else if (nextLi) {
          const newRange = frameDoc.createRange();
          newRange.setStart(nextLi, 0);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        } else {
          const p = frameDoc.createElement('p');
          p.innerHTML = '<br>';
          parentList.replaceWith(p);
          const newRange = frameDoc.createRange();
          newRange.setStart(p, 0);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }

        parentList.dispatchEvent(new Event('input', { bubbles: true }));
        editorInstance.trigger('update');
        markDirty();
        return;
      }
    }
  };

  frameDoc.addEventListener('keydown', handleKeydown, true);
}

export default function ReportEditor({ report, backUrl }: ReportEditorProps) {
  const router = useRouter();

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const blocksContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const lastSelectedCompRef = useRef<Component | null>(null);
  const lastCursorStateRef = useRef<CanvasCursorState | null>(null);

  const [title, setTitle] = useState(report.title || 'Untitled Event Report');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'dirty'>('idle');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [propertyPanelOpen, setPropertyPanelOpen] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);
  const [pageMargins, setPageMargins] = useState<PageMargins>(
    report.documentJson?.pageMargins || DEFAULT_PAGE_MARGINS
  );
  const [marginsMenuOpen, setMarginsMenuOpen] = useState(false);

  const accent = CLUB_META[report.cohort]?.accent || '#2E95FF';

  // ── Margins Applicator ──
  const applyPageMargins = useCallback((newMargins: PageMargins) => {
    setPageMargins(newMargins);
    const css = getPageMarginsCss(newMargins);

    const frame = editorRef.current?.Canvas.getFrameEl();
    const doc = frame?.contentDocument;
    if (doc) {
      let styleEl = doc.getElementById('cc-page-margins-style');
      if (!styleEl) {
        styleEl = doc.createElement('style');
        styleEl.id = 'cc-page-margins-style';
        doc.head.appendChild(styleEl);
      }
      styleEl.innerHTML = css;
    }

    editorRef.current?.addStyle(css);
    setSaveStatus('dirty');
  }, []);

  // ── Image Upload Handler ──
  const handleUploadImage = useCallback(
    async (file: File): Promise<string | null> => {
      const formData = new FormData();
      formData.append('cohort', report.cohort);
      formData.append('reportId', report.id);
      formData.append('file', file);

      const res = await apiFetch('/api/reports/upload/', {
        method: 'POST',
        body: formData,
      });

      const data = await readJson<{ url: string }>(res);
      return data.url;
    },
    [report.cohort, report.id]
  );

  // ── Initialize GrapesJS ──
  useEffect(() => {
    if (!editorContainerRef.current || editorRef.current) return;

    const editor = grapesjs.init({
      container: editorContainerRef.current,
      fromElement: false,
      height: '100%',
      width: '100%',
      storageManager: false, // we handle persistence manually
      panels: { defaults: [] }, // disable default GrapesJS chrome
      blockManager: {
        appendTo: blocksContainerRef.current || undefined,
      },
      canvas: {
        styles: [],
      },
    });

    editorRef.current = editor;

    // Register custom components and blocks
    registerComponentTypes(editor);
    registerBlocks(editor);

    // Inject canvas styles once canvas is loaded
    editor.on('load', () => {
      editor.addStyle(CANVAS_CSS);

      const frame = editor.Canvas.getFrameEl();
      const doc = frame?.contentDocument;
      if (doc && !doc.getElementById('cc-report-styles')) {
        const styleEl = doc.createElement('style');
        styleEl.id = 'cc-report-styles';
        styleEl.innerHTML = CANVAS_CSS;
        doc.head.appendChild(styleEl);
      }

      // Rehydrate document from canonical documentJson, or initialize Page 1
      const docJson = report.documentJson;
      const hasPages =
        docJson &&
        (docJson.pages?.length > 0 ||
          docJson.components?.length > 0 ||
          (Array.isArray(docJson) && docJson.length > 0));

      if (hasPages) {
        try {
          editor.loadProjectData(docJson);
          // Refresh institutional college headers to reflect the latest official template
          const headers = editor.getWrapper()?.find('.college-header') || [];
          headers.forEach((h: any) => {
            h.set('content', getCollegeHeaderHtml());
            const el = h.getView?.()?.el;
            if (el) el.innerHTML = getCollegeHeaderHtml();
          });
        } catch (err) {
          console.error('[ReportEditor] Error loading project data:', err);
          editor.setComponents([createReportPageDefinition(1)]);
        }
      } else {
        editor.setComponents([createReportPageDefinition(1)]);
      }

      // Ensure canvas CSS persists in head
      editor.addStyle(CANVAS_CSS);
      const initialMargins = report.documentJson?.pageMargins || DEFAULT_PAGE_MARGINS;
      editor.addStyle(getPageMarginsCss(initialMargins));

      const frameDoc = editor.Canvas.getFrameEl()?.contentDocument;
      if (frameDoc) {
        setupCanvasDoc(
          frameDoc,
          editor,
          () => setSaveStatus('dirty'),
          (cState) => {
            lastCursorStateRef.current = cState;
          }
        );
        let styleEl = frameDoc.getElementById('cc-page-margins-style');
        if (!styleEl) {
          styleEl = frameDoc.createElement('style');
          styleEl.id = 'cc-page-margins-style';
          frameDoc.head.appendChild(styleEl);
        }
        styleEl.innerHTML = getPageMarginsCss(initialMargins);
      }
    });

    editor.on('canvas:frame:load', () => {
      const frameDoc = editor.Canvas.getFrameEl()?.contentDocument;
      if (frameDoc) {
        setupCanvasDoc(
          frameDoc,
          editor,
          () => setSaveStatus('dirty'),
          (cState) => {
            lastCursorStateRef.current = cState;
          }
        );
        let styleEl = frameDoc.getElementById('cc-page-margins-style');
        if (!styleEl) {
          styleEl = frameDoc.createElement('style');
          styleEl.id = 'cc-page-margins-style';
          frameDoc.head.appendChild(styleEl);
        }
        styleEl.innerHTML = getPageMarginsCss(pageMargins);
      }
    });

    // Listen to selection changes for Property Panel and cursor tracking
    editor.on('component:selected', (comp) => {
      lastSelectedCompRef.current = comp;
      setSelectedComponent(comp);
      setPropertyPanelOpen(true);
    });

    editor.on('component:deselected', () => {
      setSelectedComponent(null);
    });

    // Mark dirty on edits
    editor.on('update', () => {
      setSaveStatus('dirty');
    });

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
  }, [report.documentJson]);

  // ── Save Draft Action ──
  const handleSaveDraft = async () => {
    if (!editorRef.current) return;
    setSaving(true);

    try {
      const editor = editorRef.current;
      if ((editor as any).RichTextEditor?.isActive?.()) {
        (editor as any).RichTextEditor?.end?.();
      }
      const projectData = editor.getProjectData();
      (projectData as any).pageMargins = pageMargins;
      const html = editor.getHtml();
      const css = editor.getCss();

      await readJson(
        await apiFetch(`/api/reports/${report.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            documentJson: projectData,
            documentHtml: html,
            documentCss: css,
          }),
        })
      );

      setSaveStatus('saved');
    } catch (err) {
      console.error('[ReportEditor] Save failed:', err);
      alert('Could not save report draft. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Add New Page Action ──
  const handleAddNewPage = () => {
    if (!editorRef.current) return;
    addNewReportPage(editorRef.current);
    setSaveStatus('dirty');
  };

  // ── Insert Block Helper (Inserts right at the cursor / active block position) ──
  const handleInsertBlock = (blockId: string) => {
    if (!editorRef.current) return;
    const editor = editorRef.current;

    if (blockId === 'new-page-block') {
      handleAddNewPage();
      return;
    }

    const block = editor.Blocks.get(blockId);
    if (!block) return;

    const content = block.getContent();
    if (!content) return;

    // 1. Identify active component (from GrapesJS selection or last known cursor DOM element)
    let activeComp = editor.getSelected() || lastSelectedCompRef.current;

    if ((!activeComp || activeComp === editor.getWrapper()) && lastCursorStateRef.current?.domElement) {
      const el = lastCursorStateRef.current.domElement;
      activeComp = (el as any).__gjs_component || (editor as any).Components?.getComponent?.(el) || null;
      if (!activeComp) {
        const allComps = editor.getWrapper()?.find('*') || [];
        for (const c of allComps) {
          if ((c as any).getView?.()?.el === el) {
            activeComp = c;
            break;
          }
        }
      }
    }

    // 2. Resolve target zone (report-page-content) and target block
    let targetZone: Component | null = null;
    let targetIndex = -1;
    let blockCompToTarget: Component | null = null;

    if (activeComp) {
      let curr: Component | null = activeComp;
      let topBlock: Component | null = null;

      while (curr && curr !== editor.getWrapper()) {
        const type = curr.get('type') || '';
        const classes: string[] = Array.from(curr.getClasses?.() || []).map((c: any) =>
          typeof c === 'string' ? c : c?.getName?.() || c?.name || ''
        );

        if (type === 'page-content' || classes.includes('report-page-content')) {
          targetZone = curr;
          break;
        }

        if (type === 'report-page' || classes.includes('report-page')) {
          const found = curr.find('.report-page-content')?.[0];
          targetZone = found || null;
          break;
        }

        topBlock = curr;
        curr = curr.parent() || null;
      }

      if (targetZone && topBlock) {
        targetIndex = topBlock.index();
        blockCompToTarget = topBlock;
      } else if (targetZone) {
        targetIndex = targetZone.components().length;
      }
    }

    // Fallback if no targetZone could be determined from selection: use the last page's content zone
    if (!targetZone) {
      const contentZones = editor.getWrapper()?.find('.report-page-content') || [];
      targetZone = contentZones[contentZones.length - 1] || editor.getWrapper() || null;
      targetIndex = targetZone ? targetZone.components().length : 0;
    }

    if (!targetZone) return;

    // 3. Determine if text splitting or placeholder replacement applies
    const splitInfo = lastCursorStateRef.current?.splitInfo;
    const canSplit =
      blockCompToTarget &&
      splitInfo &&
      Boolean(splitInfo.beforeHtml?.trim() && splitInfo.afterHtml?.trim());

    const isPlaceholderEmpty =
      blockCompToTarget?.get('type') === 'text-placeholder' &&
      blockCompToTarget?.getAttributes()?.['data-state'] === 'empty';
    const isImagePlaceholderEmpty =
      blockCompToTarget?.get('type') === 'image-placeholder' &&
      blockCompToTarget?.getAttributes()?.['data-state'] === 'empty';

    let insertedComp: Component | null = null;

    if (canSplit && splitInfo && blockCompToTarget) {
      // ── Cursor is in the middle of text: split the paragraph and insert block between ──
      const beforeHtml = splitInfo.beforeHtml;
      const afterHtml = splitInfo.afterHtml;

      blockCompToTarget.set('content', beforeHtml);
      const viewEl = (blockCompToTarget as any).getView?.()?.el;
      if (viewEl) viewEl.innerHTML = beforeHtml;

      // Insert new block at targetIndex + 1
      const addedBlock = (targetZone as any).append(content, { at: targetIndex + 1 });
      insertedComp = Array.isArray(addedBlock) ? addedBlock[0] : addedBlock;

      // Insert remaining text in a new paragraph at targetIndex + 2
      const trailingDef = {
        type: 'text',
        tagName: blockCompToTarget.get('tagName') || 'p',
        content: afterHtml,
        style: blockCompToTarget.getStyle() || {},
      };
      (targetZone as any).append(trailingDef, { at: targetIndex + 2 });
    } else if ((isPlaceholderEmpty || isImagePlaceholderEmpty) && blockCompToTarget) {
      // ── Replace the empty placeholder ──
      const replaceIdx = blockCompToTarget.index();
      blockCompToTarget.remove();
      const added = (targetZone as any).append(content, { at: replaceIdx });
      insertedComp = Array.isArray(added) ? added[0] : added;
    } else if (blockCompToTarget) {
      // ── Insert right AFTER the active block ──
      const added = (targetZone as any).append(content, { at: targetIndex + 1 });
      insertedComp = Array.isArray(added) ? added[0] : added;
    } else {
      // ── Append to the target zone (at specific index) ──
      const atIdx = targetIndex >= 0 ? targetIndex : targetZone.components().length;
      const added = (targetZone as any).append(content, { at: atIdx });
      insertedComp = Array.isArray(added) ? added[0] : added;
    }

    if (insertedComp) {
      editor.select(insertedComp);
      lastSelectedCompRef.current = insertedComp;
      (insertedComp as any).getView?.()?.el?.scrollIntoView?.({
        behavior: 'smooth',
        block: 'nearest',
      });
    }

    // Reset splitInfo so subsequent clicks without typing insert sequentially
    if (lastCursorStateRef.current) {
      lastCursorStateRef.current.splitInfo = null;
    }

    editor.trigger('update');
    setSaveStatus('dirty');
  };

  // ── DOCX Export Action ──
  const handleExportDocx = async () => {
    if (!editorRef.current) return;
    setExportingDocx(true);
    setExportMenuOpen(false);

    try {
      const projectData = editorRef.current.getProjectData();
      (projectData as any).pageMargins = pageMargins;
      await downloadReportDocx(title, projectData);
    } catch (err) {
      console.error('[ReportEditor] DOCX export error:', err);
      alert('Could not export DOCX. Please try again.');
    } finally {
      setExportingDocx(false);
    }
  };

  const previewUrl = `/leader/reports/${report.id}/preview/`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#16181C] text-white font-sans overflow-hidden">
      {/* ── TOP TOOLBAR ── */}
      <header className="h-14 shrink-0 bg-surface border-b border-outline-variant px-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push(backUrl || '/leader/reports')}
            className="p-1.5 rounded-lg text-outline hover:text-white hover:bg-white/5 transition"
            title="Back to Reports"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSaveStatus('dirty');
            }}
            placeholder="Report Title..."
            className="bg-transparent text-sm font-mono font-bold text-on-surface border-b border-transparent hover:border-outline-variant focus:border-primary focus:outline-none px-1 py-0.5 max-w-xs sm:max-w-md truncate"
          />

          <span
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider"
            style={{
              borderColor: `${accent}40`,
              backgroundColor: `${accent}15`,
              color: accent,
            }}
          >
            {report.cohort}
          </span>

          {saveStatus === 'saved' && (
            <span className="hidden md:inline text-[11px] font-mono text-emerald-400">
              Saved
            </span>
          )}
          {saveStatus === 'dirty' && (
            <span className="hidden md:inline text-[11px] font-mono text-amber-400">
              Unsaved changes
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Margins Dropdown */}
          <div className="relative">
            <button
              onClick={() => setMarginsMenuOpen(!marginsMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant bg-surface-container hover:border-primary text-xs font-mono transition cursor-pointer"
              title="Adjust Page Margins"
            >
              <Maximize2 className="w-3.5 h-3.5 text-primary" />
              <span>Margins</span>
              <ChevronDown className="w-3 h-3 text-outline" />
            </button>

            {marginsMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMarginsMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-surface border border-outline-variant rounded-xl shadow-2xl p-2.5 z-50 font-sans">
                  <div className="px-2 py-1 mb-1.5 border-b border-outline-variant/60 flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-on-surface">Page Margins</span>
                    <span className="text-[10px] font-mono text-outline">A4 Document</span>
                  </div>

                  <div className="space-y-1 py-1">
                    {Object.entries(MARGIN_PRESETS).map(([key, preset]) => {
                      const isActive =
                        pageMargins.top === preset.margins.top &&
                        pageMargins.right === preset.margins.right &&
                        pageMargins.bottom === preset.margins.bottom &&
                        pageMargins.left === preset.margins.left;

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            applyPageMargins(preset.margins);
                            setMarginsMenuOpen(false);
                          }}
                          className={`w-full px-2.5 py-1.5 text-left rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                            isActive
                              ? 'bg-primary/15 text-primary font-semibold'
                              : 'text-on-surface hover:bg-white/5'
                          }`}
                        >
                          <div>
                            <div className="font-mono text-xs">{preset.label}</div>
                            <div className="text-[10px] text-outline font-sans">{preset.desc}</div>
                          </div>
                          {isActive && <span className="w-2 h-2 rounded-full bg-primary" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2 pt-2 border-t border-outline-variant/60">
                    <div className="text-[10px] font-mono text-outline uppercase px-2 mb-1.5">Custom (mm)</div>
                    <div className="grid grid-cols-2 gap-1.5 px-1">
                      {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
                        <div key={side} className="flex items-center gap-1 bg-surface-container px-2 py-1 rounded-lg border border-outline-variant">
                          <span className="text-[10px] font-mono text-outline uppercase">{side[0]}:</span>
                          <input
                            type="number"
                            min={0}
                            max={60}
                            value={pageMargins[side]}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(60, Number(e.target.value) || 0));
                              applyPageMargins({
                                ...pageMargins,
                                [side]: val,
                              });
                            }}
                            className="w-full bg-transparent text-xs font-mono font-bold text-on-surface focus:outline-none"
                          />
                          <span className="text-[9px] font-mono text-outline">mm</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleAddNewPage}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant bg-surface-container hover:border-primary text-xs font-mono transition"
            title="Add a new A4 page with institutional header"
          >
            <Plus className="w-3.5 h-3.5 text-primary" /> Add Page
          </button>

          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-black text-xs font-mono font-bold transition disabled:opacity-50 cursor-pointer shadow-lg shadow-primary/20"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Draft</span>
          </button>

          <button
            onClick={() => router.push(previewUrl)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant hover:border-white/30 text-xs font-mono text-outline hover:text-white transition"
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant bg-surface-container hover:border-primary text-xs font-mono transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 text-outline" />
            </button>

            {exportMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setExportMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-surface border border-outline-variant rounded-xl shadow-2xl py-1 z-50 font-sans">
                  <button
                    onClick={() => {
                      setExportMenuOpen(false);
                      router.push(previewUrl);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-on-surface hover:bg-white/5 flex items-center gap-2 transition"
                  >
                    <FileDown className="w-4 h-4 text-primary" />
                    <span>Print / Save as PDF</span>
                  </button>
                  <button
                    onClick={handleExportDocx}
                    disabled={exportingDocx}
                    className="w-full px-3 py-2 text-left text-xs text-on-surface hover:bg-white/5 flex items-center gap-2 transition disabled:opacity-50"
                  >
                    {exportingDocx ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                      <FileText className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>Export as DOCX (.docx)</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setPropertyPanelOpen(!propertyPanelOpen)}
            className={`p-2 rounded-xl border transition ${
              propertyPanelOpen
                ? 'border-primary text-primary bg-primary/10'
                : 'border-outline-variant text-outline hover:text-white'
            }`}
            title="Toggle Properties Panel"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ── LEFT: CUSTOM BLOCK PALETTE ── */}
        <aside className="w-64 shrink-0 bg-surface border-r border-outline-variant flex flex-col z-20">
          <div className="p-3 border-b border-outline-variant flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-on-surface flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-primary" /> Blocks Palette
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-5">
            {/* Structure */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-outline mb-2">
                Structure
              </div>
              <button
                onClick={() => handleInsertBlock('new-page-block')}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-mono font-bold transition text-left cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New A4 Page</span>
              </button>
            </div>

            {/* Placeholders */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-outline mb-2">
                Placeholders
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={() => handleInsertBlock('image-placeholder-block')}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl border border-dashed border-outline-variant bg-surface-container hover:border-primary hover:text-primary text-xs font-mono text-outline transition text-left cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Image Placeholder</span>
                </button>
                <button
                  onClick={() => handleInsertBlock('text-placeholder-block')}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl border border-dashed border-outline-variant bg-surface-container hover:border-primary hover:text-primary text-xs font-mono text-outline transition text-left cursor-pointer"
                >
                  <Type className="w-4 h-4" />
                  <span>Text Placeholder</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-outline mb-2">
                Content
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleInsertBlock('heading-1-block')}
                  className="flex items-center gap-2 p-2 rounded-xl border border-outline-variant bg-surface-container hover:border-primary hover:text-on-surface text-xs font-mono text-outline transition cursor-pointer"
                >
                  <Heading1 className="w-3.5 h-3.5" /> Heading 1
                </button>
                <button
                  onClick={() => handleInsertBlock('heading-2-block')}
                  className="flex items-center gap-2 p-2 rounded-xl border border-outline-variant bg-surface-container hover:border-primary hover:text-on-surface text-xs font-mono text-outline transition cursor-pointer"
                >
                  <Heading2 className="w-3.5 h-3.5" /> Heading 2
                </button>
                <button
                  onClick={() => handleInsertBlock('heading-3-block')}
                  className="flex items-center gap-2 p-2 rounded-xl border border-outline-variant bg-surface-container hover:border-primary hover:text-on-surface text-xs font-mono text-outline transition cursor-pointer"
                >
                  <Heading3 className="w-3.5 h-3.5" /> Heading 3
                </button>
                <button
                  onClick={() => handleInsertBlock('paragraph-block')}
                  className="flex items-center gap-2 p-2 rounded-xl border border-outline-variant bg-surface-container hover:border-primary hover:text-on-surface text-xs font-mono text-outline transition cursor-pointer"
                >
                  <Type className="w-3.5 h-3.5" /> Text
                </button>
                <button
                  onClick={() => handleInsertBlock('bullet-list-block')}
                  className="flex items-center gap-2 p-2 rounded-xl border border-outline-variant bg-surface-container hover:border-primary hover:text-on-surface text-xs font-mono text-outline transition cursor-pointer"
                >
                  <List className="w-3.5 h-3.5" /> Bullets
                </button>
                <button
                  onClick={() => handleInsertBlock('numbered-list-block')}
                  className="flex items-center gap-2 p-2 rounded-xl border border-outline-variant bg-surface-container hover:border-primary hover:text-on-surface text-xs font-mono text-outline transition cursor-pointer"
                >
                  <ListOrdered className="w-3.5 h-3.5" /> Numbers
                </button>
                <button
                  onClick={() => handleInsertBlock('signature-block')}
                  className="col-span-2 flex items-center gap-2 p-2 rounded-xl border border-outline-variant bg-surface-container hover:border-primary hover:text-on-surface text-xs font-mono text-outline transition cursor-pointer"
                >
                  <PenTool className="w-3.5 h-3.5" /> Signature Block
                </button>
                <button
                  onClick={() => handleInsertBlock('divider-block')}
                  className="flex items-center gap-2 p-2 rounded-xl border border-outline-variant bg-surface-container hover:border-primary hover:text-on-surface text-xs font-mono text-outline transition cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" /> Divider
                </button>
                <button
                  onClick={() => handleInsertBlock('spacer-block')}
                  className="flex items-center gap-2 p-2 rounded-xl border border-outline-variant bg-surface-container hover:border-primary hover:text-on-surface text-xs font-mono text-outline transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Spacer
                </button>
              </div>
            </div>

            {/* Hidden native block manager container for drag-and-drop support */}
            <div ref={blocksContainerRef} className="hidden" />
          </div>
        </aside>

        {/* ── CENTER: A4 CANVAS ── */}
        <main className="flex-1 bg-[#525659] overflow-hidden relative">
          <div ref={editorContainerRef} className="w-full h-full" />
        </main>

        {/* ── RIGHT: PROPERTIES INSPECTOR ── */}
        {propertyPanelOpen && selectedComponent && (
          <ReportPropertyPanel
            selectedComponent={selectedComponent}
            onClose={() => setPropertyPanelOpen(false)}
            onUploadImage={handleUploadImage}
            pageMargins={pageMargins}
            onPageMarginsChange={applyPageMargins}
          />
        )}
      </div>
    </div>
  );
}
