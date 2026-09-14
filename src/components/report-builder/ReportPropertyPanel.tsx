'use client';

import React, { useEffect, useState, useRef } from 'react';
import type { Component } from 'grapesjs';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Maximize2,
  Plus,
  Space,
  Trash2,
  Type,
  Upload,
  X,
} from 'lucide-react';
import {
  PageMargins,
  DEFAULT_PAGE_MARGINS,
  MARGIN_PRESETS,
} from './reportBlocks';

interface ReportPropertyPanelProps {
  selectedComponent: Component | null;
  onClose: () => void;
  onUploadImage: (file: File) => Promise<string | null>;
  pageMargins?: PageMargins;
  onPageMarginsChange?: (margins: PageMargins) => void;
}

export default function ReportPropertyPanel({
  selectedComponent,
  onClose,
  onUploadImage,
  pageMargins = DEFAULT_PAGE_MARGINS,
  onPageMarginsChange,
}: ReportPropertyPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Local state reflecting component attributes/styles
  const [textContent, setTextContent] = useState('');
  const [listItemsText, setListItemsText] = useState('');
  const [fontSize, setFontSize] = useState('');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [textAlign, setTextAlign] = useState('');
  const [imageWidth, setImageWidth] = useState('');
  const [imageSrc, setImageSrc] = useState('');
  const [marginTop, setMarginTop] = useState('');
  const [marginBottom, setMarginBottom] = useState('');

  // Normalize selected component: if an <li> was selected, target its parent list
  const activeComp =
    (selectedComponent?.get('tagName') || '').toLowerCase() === 'li' && selectedComponent?.parent()
      ? selectedComponent.parent()
      : selectedComponent;

  const compType = activeComp?.get('type') || activeComp?.get('tagName') || '';
  const tagNameLower = (activeComp?.get('tagName') || '').toLowerCase();
  const compClasses: string[] = Array.from(activeComp?.getClasses?.() || []).map((c: any) =>
    typeof c === 'string' ? c : c?.getName?.() || c?.name || ''
  );
  const isPage = compType === 'report-page' || compClasses.includes('report-page');
  const isLocked =
    compType === 'college-header' ||
    compType === 'page-content' ||
    (!isPage && !activeComp?.get('removable'));

  const isList =
    compType === 'bullet-list' ||
    compType === 'numbered-list' ||
    ['ul', 'ol'].includes(tagNameLower);

  const isTextLike =
    !isList &&
    (['text', 'h1', 'h2', 'h3', 'p', 'text-placeholder'].includes(compType) ||
      ['H1', 'H2', 'H3', 'P', 'SPAN', 'DIV'].includes(activeComp?.get('tagName') || ''));

  const isImageLike =
    compType === 'image' ||
    compType === 'image-placeholder' ||
    activeComp?.get('tagName') === 'IMG';

  useEffect(() => {
    if (!activeComp) return;

    try {
      // 1. Text / List extraction
      const content = activeComp.get('content') || '';
      if (isList) {
        let lines: string[] = [];
        if (typeof content === 'string' && content.includes('<li')) {
          if (typeof window !== 'undefined') {
            const parser = document.createElement('div');
            parser.innerHTML = content;
            const lis = Array.from(parser.querySelectorAll('li'));
            lines = lis.map((li) => li.textContent || '');
          }
        } else if (typeof content === 'string') {
          lines = content
            .split('\n')
            .map((l) => l.replace(/<[^>]*>/g, '').trim())
            .filter(Boolean);
        }
        setListItemsText(lines.join('\n'));
      } else {
        setTextContent(typeof content === 'string' ? content.replace(/<[^>]*>/g, '') : '');
      }

      // 2. Style extraction
      const style = (activeComp.getStyle() || {}) as Record<string, unknown>;
      setFontSize(String(style['font-size'] || ''));
      setIsBold(style['font-weight'] === 'bold' || style['font-weight'] === '700' || style['font-weight'] === '800');
      setIsItalic(style['font-style'] === 'italic');
      setTextAlign(String(style['text-align'] || 'left'));
      setImageWidth(String(style['width'] || '100%'));
      setMarginTop(String(style['margin-top'] || ''));
      setMarginBottom(String(style['margin-bottom'] || ''));

      // 3. Image attributes extraction
      const attrs = (activeComp.getAttributes() || {}) as Record<string, unknown>;
      const src = String(attrs['src'] || attrs['data-src'] || activeComp.get('src') || '');
      setImageSrc(src);
    } catch {
      // safely handle any extraction anomalies
    }
  }, [activeComp, isList]);

  if (!activeComp) return null;

  const handleMarginTopChange = (val: string) => {
    setMarginTop(val);
    activeComp.addStyle({ 'margin-top': val });
  };

  const handleMarginBottomChange = (val: string) => {
    setMarginBottom(val);
    activeComp.addStyle({ 'margin-bottom': val });
  };

  const handleTextChange = (newText: string) => {
    setTextContent(newText);
    activeComp.set('content', newText);
    if (activeComp.get('type') === 'text-placeholder') {
      activeComp.setAttributes({
        ...activeComp.getAttributes(),
        'data-state': newText.trim() ? 'filled' : 'empty',
      });
    }
  };

  const handleListItemsChange = (newText: string) => {
    setListItemsText(newText);
    const lines = newText.split('\n');
    const html = lines
      .map((line) => `<li>${line.replace(/</g, '&lt;').replace(/>/g, '&gt;') || '<br>'}</li>`)
      .join('');
    activeComp.set('content', html);
    const viewEl = (activeComp as any).getView?.()?.el;
    if (viewEl) {
      viewEl.innerHTML = html;
    }
  };

  const handleAddListItem = () => {
    const next = listItemsText ? `${listItemsText}\nNew item` : 'New item';
    handleListItemsChange(next);
  };

  const toggleListType = (targetType: 'bullet-list' | 'numbered-list') => {
    const isTargetBullet = targetType === 'bullet-list';
    activeComp.set({
      tagName: isTargetBullet ? 'ul' : 'ol',
      type: targetType,
    });
    activeComp.setClass([isTargetBullet ? 'report-bullet-list' : 'report-numbered-list']);
    const viewEl = (activeComp as any).getView?.()?.el;
    if (viewEl) {
      viewEl.className = isTargetBullet ? 'report-bullet-list' : 'report-numbered-list';
    }
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    activeComp.addStyle({ 'font-size': size });
  };

  const toggleBold = () => {
    const next = !isBold;
    setIsBold(next);
    activeComp.addStyle({ 'font-weight': next ? '700' : 'normal' });
  };

  const toggleItalic = () => {
    const next = !isItalic;
    setIsItalic(next);
    activeComp.addStyle({ 'font-style': next ? 'italic' : 'normal' });
  };

  const handleAlign = (align: string) => {
    setTextAlign(align);
    activeComp.addStyle({ 'text-align': align });
  };

  const handleWidthChange = (w: string) => {
    setImageWidth(w);
    activeComp.addStyle({ width: w });
  };

  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');

    try {
      const url = await onUploadImage(file);
      if (url) {
        setImageSrc(url);
        activeComp.setAttributes({
          ...activeComp.getAttributes(),
          'data-state': 'filled',
          'data-src': url,
          'data-gjs-type': 'image-placeholder',
        });
        activeComp.set(
          'content',
          `<img src="${url}" alt="Report Image" style="width: 100%; height: auto; max-height: 120mm; object-fit: contain; display: block; border-radius: 4px;" />`
        );
        activeComp.addStyle({
          border: 'none',
          padding: '4px',
          background: 'transparent',
        });
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = () => {
    if (isLocked) return;
    activeComp.remove();
    onClose();
  };

  return (
    <aside
      className="w-80 shrink-0 bg-surface border-l border-outline-variant shadow-2xl flex flex-col font-sans z-30"
      role="dialog"
      aria-label="Component Properties"
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 h-14 border-b border-outline-variant">
        <div>
          <h2 className="text-sm font-mono font-bold text-on-surface">Properties</h2>
          <p className="text-[10px] font-mono text-outline uppercase tracking-wider">
            {activeComp.getName?.() || compType || 'Component'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-white/5 transition"
          aria-label="Close properties"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {isLocked && !isPage && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs leading-relaxed">
            This structural element is part of the institutional template and is locked against modifications.
          </div>
        )}

        {/* ── A4 PAGE MARGIN CONTROLS (When clicking the A4 Page Container) ── */}
        {isPage && (
          <div className="space-y-5">
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs space-y-1 text-on-surface">
              <div className="font-mono font-bold text-primary flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5" /> A4 Page Margins
              </div>
              <p className="text-[11px] text-outline leading-relaxed">
                Configure page margins for this document. Applies dynamically to the Canvas editor, Print / PDF export, and Word DOCX export.
              </p>
            </div>

            {/* Presets */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-outline mb-2">
                Margin Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
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
                      onClick={() => onPageMarginsChange?.(preset.margins)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        isActive
                          ? 'bg-primary/15 border-primary text-primary'
                          : 'bg-surface-container border-outline-variant text-outline hover:text-on-surface hover:border-outline'
                      }`}
                    >
                      <div className="text-xs font-mono font-bold">{preset.label}</div>
                      <div className="text-[10px] text-outline mt-0.5">{preset.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Margins */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-outline mb-2">
                Custom Margins (mm)
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
                  <div key={side} className="bg-surface-container border border-outline-variant rounded-xl p-2">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-outline mb-1 capitalize">
                      {side}
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={pageMargins[side]}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(60, Number(e.target.value) || 0));
                          onPageMarginsChange?.({
                            ...pageMargins,
                            [side]: val,
                          });
                        }}
                        className="w-full bg-transparent text-xs font-mono font-bold text-on-surface focus:outline-none"
                      />
                      <span className="text-[10px] font-mono text-outline">mm</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── LIST CONTROLS ── */}
        {isList && !isLocked && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-outline flex items-center gap-1.5">
                  {compType === 'numbered-list' || activeComp.get('tagName')?.toLowerCase() === 'ol' ? (
                    <>
                      <ListOrdered className="w-3.5 h-3.5 text-primary" /> Numbered Items
                    </>
                  ) : (
                    <>
                      <List className="w-3.5 h-3.5 text-primary" /> Bullet Items
                    </>
                  )}
                </label>
                <button
                  type="button"
                  onClick={handleAddListItem}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition border border-primary/20 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Item
                </button>
              </div>
              <p className="text-[10px] text-outline mb-1.5 font-sans">
                Each line is a bullet/number. Press <kbd className="px-1 py-0.5 bg-surface-container-high rounded border border-outline-variant text-[9px] font-mono text-on-surface">Enter</kbd> to add the next item.
              </p>
              <textarea
                value={listItemsText}
                onChange={(e) => handleListItemsChange(e.target.value)}
                rows={5}
                className="w-full bg-surface-container border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary resize-y font-sans leading-relaxed"
                placeholder="Item 1&#10;Item 2&#10;Item 3"
              />
            </div>

            {/* Switch between Bullet and Numbered */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-outline mb-1.5">
                List Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => toggleListType('bullet-list')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                    compType === 'bullet-list' || activeComp.get('tagName')?.toLowerCase() === 'ul'
                      ? 'bg-primary/15 border-primary text-primary font-semibold'
                      : 'border-outline-variant text-outline hover:text-on-surface'
                  }`}
                >
                  <List className="w-3.5 h-3.5" /> Bullets
                </button>
                <button
                  type="button"
                  onClick={() => toggleListType('numbered-list')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                    compType === 'numbered-list' || activeComp.get('tagName')?.toLowerCase() === 'ol'
                      ? 'bg-primary/15 border-primary text-primary font-semibold'
                      : 'border-outline-variant text-outline hover:text-on-surface'
                  }`}
                >
                  <ListOrdered className="w-3.5 h-3.5" /> Numbered
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TEXT CONTENT CONTROL (for single texts/headings) ── */}
        {isTextLike && !isLocked && (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-outline mb-1.5 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-primary" /> Text Content
              </label>
              <textarea
                value={textContent}
                onChange={(e) => handleTextChange(e.target.value)}
                rows={3}
                className="w-full bg-surface-container border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary resize-none font-sans"
                placeholder="Enter text..."
              />
            </div>
          </div>
        )}

        {/* ── TYPOGRAPHY & FORMATTING CONTROLS (Common for Text and Lists) ── */}
        {(isTextLike || isList) && !isLocked && (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-outline mb-1.5">
                Font Size
              </label>
              <select
                value={fontSize}
                onChange={(e) => handleFontSizeChange(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant rounded-xl px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="">Default</option>
                <option value="8pt">8 pt (Fine print)</option>
                <option value="9pt">9 pt (Caption)</option>
                <option value="10pt">10 pt (Body text)</option>
                <option value="11pt">11 pt (Subhead)</option>
                <option value="12pt">12 pt (Heading small)</option>
                <option value="14pt">14 pt (Heading medium)</option>
                <option value="18pt">18 pt (Heading large)</option>
                <option value="22pt">22 pt (Title)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-outline mb-1.5">
                Format
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleBold}
                  className={`p-2 rounded-lg border transition cursor-pointer ${
                    isBold
                      ? 'bg-primary text-black border-primary font-bold'
                      : 'border-outline-variant bg-surface-container text-outline hover:text-on-surface'
                  }`}
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={toggleItalic}
                  className={`p-2 rounded-lg border transition cursor-pointer ${
                    isItalic
                      ? 'bg-primary text-black border-primary'
                      : 'border-outline-variant bg-surface-container text-outline hover:text-on-surface'
                  }`}
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-outline mb-1.5">
                Alignment
              </label>
              <div className="grid grid-cols-4 gap-1 bg-surface-container p-1 rounded-xl border border-outline-variant">
                {[
                  { key: 'left', icon: AlignLeft },
                  { key: 'center', icon: AlignCenter },
                  { key: 'right', icon: AlignRight },
                  { key: 'justify', icon: AlignJustify },
                ].map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleAlign(key)}
                    className={`p-1.5 rounded-lg flex items-center justify-center transition cursor-pointer ${
                      textAlign === key
                        ? 'bg-primary text-black font-bold'
                        : 'text-outline hover:text-on-surface'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── IMAGE / PLACEHOLDER CONTROLS ── */}
        {isImageLike && !isLocked && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-outline flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-primary" /> Image Source
              </label>

              {imageSrc ? (
                <div className="space-y-2">
                  <div className="w-full h-32 rounded-xl border border-outline-variant overflow-hidden bg-black/20 flex items-center justify-center p-1">
                    <img src={imageSrc} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full py-2 bg-primary/10 border border-primary/30 hover:bg-primary/20 text-primary text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Replace Image
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full py-8 border-2 border-dashed border-outline-variant hover:border-primary text-outline hover:text-primary rounded-xl flex flex-col items-center justify-center gap-2 transition cursor-pointer"
                >
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span className="text-xs font-mono font-bold">Upload Image</span>
                      <span className="text-[10px] text-outline">JPEG, PNG, WebP (max 4MB)</span>
                    </>
                  )}
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFilePicked}
              />

              {uploadError && (
                <div className="text-[11px] text-rose-400 bg-rose-500/10 p-2 rounded-lg">
                  {uploadError}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-outline mb-1.5">
                Width
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {['25%', '50%', '75%', '100%'].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleWidthChange(pct)}
                    className={`py-1 rounded-lg border text-xs font-mono transition cursor-pointer ${
                      imageWidth === pct
                        ? 'bg-primary text-black border-primary font-bold'
                        : 'border-outline-variant bg-surface-container text-outline hover:text-on-surface'
                    }`}
                  >
                    {pct}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-outline mb-1.5">
                Alignment
              </label>
              <div className="grid grid-cols-3 gap-1 bg-surface-container p-1 rounded-xl border border-outline-variant">
                {[
                  { key: 'left', icon: AlignLeft },
                  { key: 'center', icon: AlignCenter },
                  { key: 'right', icon: AlignRight },
                ].map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleAlign(key)}
                    className={`p-1.5 rounded-lg flex items-center justify-center transition cursor-pointer ${
                      textAlign === key
                        ? 'bg-primary text-black font-bold'
                        : 'text-outline hover:text-on-surface'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── GENERAL CONTROLS ── */}
        {!isTextLike && !isList && !isImageLike && !isLocked && !isPage && (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-outline mb-1.5">
                Alignment
              </label>
              <div className="grid grid-cols-3 gap-1 bg-surface-container p-1 rounded-xl border border-outline-variant">
                {[
                  { key: 'left', icon: AlignLeft },
                  { key: 'center', icon: AlignCenter },
                  { key: 'right', icon: AlignRight },
                ].map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleAlign(key)}
                    className={`p-1.5 rounded-lg flex items-center justify-center transition cursor-pointer ${
                      textAlign === key
                        ? 'bg-primary text-black font-bold'
                        : 'text-outline hover:text-on-surface'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── BLOCK SPACING / MARGIN CONTROLS (for non-page components) ── */}
        {!isPage && !isLocked && (
          <div className="space-y-3 pt-3 border-t border-outline-variant">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-outline flex items-center gap-1.5">
              <Space className="w-3.5 h-3.5 text-primary" /> Block Margins / Spacing
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-outline mb-1">
                  Margin Top
                </label>
                <select
                  value={marginTop}
                  onChange={(e) => handleMarginTopChange(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant rounded-xl px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="">Default</option>
                  <option value="0px">0px</option>
                  <option value="4px">4px</option>
                  <option value="8px">8px (Compact)</option>
                  <option value="12px">12px (Regular)</option>
                  <option value="16px">16px (Medium)</option>
                  <option value="24px">24px (Large)</option>
                  <option value="32px">32px (X-Large)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-outline mb-1">
                  Margin Bottom
                </label>
                <select
                  value={marginBottom}
                  onChange={(e) => handleMarginBottomChange(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant rounded-xl px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="">Default</option>
                  <option value="0px">0px</option>
                  <option value="4px">4px</option>
                  <option value="8px">8px (Compact)</option>
                  <option value="12px">12px (Regular)</option>
                  <option value="16px">16px (Medium)</option>
                  <option value="24px">24px (Large)</option>
                  <option value="32px">32px (X-Large)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── DELETE BUTTON ── */}
        {!isLocked && !isPage && (
          <div className="pt-4 border-t border-outline-variant">
            <button
              type="button"
              onClick={handleDelete}
              className="w-full py-2 px-3 border border-rose-500/20 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 text-xs font-mono rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Component
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
