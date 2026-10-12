'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  Sparkles,
  Move,
  Check,
  AlertCircle,
  Eye,
  Type,
  Palette,
  Sliders,
} from 'lucide-react';
import { saveCustomTemplate } from '@/lib/certificates/db';
import { drawCustomCanvas, loadImage } from '@/lib/certificates/certificateRenderer';
import type { CustomTemplate } from '@/lib/certificates/types';

const FONT_OPTIONS = [
  { key: 'dejavu_sans', label: 'DejaVu Sans (Modern / Clean)' },
  { key: 'dejavu_serif', label: 'DejaVu Serif (Formal / Serif)' },
  { key: 'liberation_sans', label: 'Liberation Sans (Crisp / Neutral)' },
  { key: 'liberation_serif', label: 'Liberation Serif (Classic / Traditional)' },
];

interface CustomTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (tpl: CustomTemplate) => void;
}

export default function CustomTemplateModal({ isOpen, onClose, onCreated }: CustomTemplateModalProps) {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [nameX, setNameX] = useState(50.0);
  const [nameY, setNameY] = useState(57.0);
  const [font, setFont] = useState('dejavu_sans');
  const [fontSizePct, setFontSizePct] = useState(5.0);
  const [color, setColor] = useState('#171717');
  const [maxWidthPct, setMaxWidthPct] = useState(70.0);

  const [sampleName, setSampleName] = useState('Tanisha C Kotian');
  const [sampleRenderUrl, setSampleRenderUrl] = useState('');
  const [renderingSample, setRenderingSample] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Mouse & Keyboard drag handling
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !imageContainerRef.current) return;
      const rect = imageContainerRef.current.getBoundingClientRect();
      const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      setNameX(parseFloat(xPct.toFixed(1)));
      setNameY(parseFloat(yPct.toFixed(1)));
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!['image/png', 'image/jpeg'].includes(selected.type)) {
      setErrorMsg('Only PNG and JPEG formats are supported.');
      return;
    }

    if (selected.size > 15 * 1024 * 1024) {
      setErrorMsg('Image size cannot exceed 15 MB.');
      return;
    }

    setFile(selected);
    setErrorMsg('');
    setSampleRenderUrl('');
    const objUrl = URL.createObjectURL(selected);
    setPreviewUrl(objUrl);
  };

  const handleMouseDownOnCanvas = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    isDraggingRef.current = true;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setNameX(parseFloat(xPct.toFixed(1)));
    setNameY(parseFloat(yPct.toFixed(1)));
  };

  const handleMarkerKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 2.0 : 0.5;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setNameX((prev) => parseFloat(Math.max(0, prev - step).toFixed(1)));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setNameX((prev) => parseFloat(Math.min(100, prev + step).toFixed(1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setNameY((prev) => parseFloat(Math.max(0, prev - step).toFixed(1)));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setNameY((prev) => parseFloat(Math.min(100, prev + step).toFixed(1)));
    }
  };

  const generateSamplePreview = useCallback(async () => {
    if (!previewUrl) return;
    setRenderingSample(true);
    try {
      const img = await loadImage(previewUrl);
      const W = img.naturalWidth || img.width;
      const H = img.naturalHeight || img.height;

      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 1400 / W);
      canvas.width = Math.round(W * scale);
      canvas.height = Math.round(H * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(scale, scale);

      drawCustomCanvas(ctx, W, H, img, sampleName || 'Tanisha C Kotian', {
        name_x: nameX,
        name_y: nameY,
        font,
        font_size_pct: fontSizePct,
        color,
        max_width_pct: maxWidthPct,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          setSampleRenderUrl(URL.createObjectURL(blob));
        }
      }, 'image/jpeg', 0.9);
    } catch (err: unknown) {
      console.warn('Draft preview error:', err);
    } finally {
      setRenderingSample(false);
    }
  }, [previewUrl, sampleName, nameX, nameY, font, fontSizePct, color, maxWidthPct]);

  const fileToDataUrl = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(f);
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !previewUrl) {
      setErrorMsg('Please select an artwork image file.');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Please enter a template name.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const backgroundDataUrl = file ? await fileToDataUrl(file) : previewUrl;
      const templateId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const newTemplate: CustomTemplate = {
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

      await saveCustomTemplate(newTemplate);
      onCreated(newTemplate);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save template';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-surface border border-outline-variant rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 font-mono"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container/50">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-on-surface">Custom Template Studio</h3>
                <p className="text-[11px] text-outline">Upload artwork & place the participant name position visually</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-outline hover:text-on-surface p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Form & Coordinates */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-outline mb-1">
                    Template Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. MITE Coders Club Hackathon Certificate"
                    className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant text-xs text-on-surface placeholder:text-outline focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-outline mb-1">
                    Certificate Artwork Image (PNG / JPG) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleFileChange}
                    className="w-full text-xs text-outline file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-outline-variant file:bg-surface-container file:text-on-surface file:font-mono file:text-xs file:cursor-pointer hover:file:border-primary transition"
                  />
                </div>

                <div className="p-4 rounded-xl bg-surface-container/60 border border-outline-variant space-y-3">
                  <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-primary" />
                    Position & Typography Controls
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] uppercase text-outline mb-1">X Position (%):</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={nameX}
                        onChange={(e) => setNameX(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-outline text-xs text-on-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-outline mb-1">Y Position (%):</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={nameY}
                        onChange={(e) => setNameY(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-outline text-xs text-on-surface"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-outline mb-1">Font Family:</label>
                    <select
                      value={font}
                      onChange={(e) => setFont(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-outline text-xs text-on-surface"
                    >
                      {FONT_OPTIONS.map((opt) => (
                        <option key={opt.key} value={opt.key}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] uppercase text-outline mb-1">Font Size (% H):</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        step={0.5}
                        value={fontSizePct}
                        onChange={(e) => setFontSizePct(parseFloat(e.target.value) || 5)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-outline text-xs text-on-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-outline mb-1">Text Color:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="w-7 h-7 rounded border border-outline cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="flex-1 px-2 py-1 rounded bg-surface border border-outline text-xs text-on-surface"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={sampleName}
                    onChange={(e) => setSampleName(e.target.value)}
                    placeholder="Sample recipient name"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant text-xs text-on-surface"
                  />
                  <button
                    type="button"
                    onClick={generateSamplePreview}
                    disabled={!previewUrl || renderingSample}
                    className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-primary" />
                    Preview
                  </button>
                </div>
              </div>

              {/* Right Column: Visual Canvas Positioner */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] uppercase font-bold text-outline">
                    Interactive Marker (Drag or Arrow Keys)
                  </span>
                  <span className="text-[10px] text-primary">
                    X: {nameX}% • Y: {nameY}%
                  </span>
                </div>

                <div
                  ref={imageContainerRef}
                  onMouseDown={handleMouseDownOnCanvas}
                  className="relative w-full aspect-[1.414/1] bg-black/30 border border-outline-variant rounded-xl overflow-hidden select-none flex items-center justify-center cursor-crosshair group"
                >
                  {previewUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sampleRenderUrl || previewUrl}
                        alt="Certificate Artwork"
                        className="w-full h-full object-contain pointer-events-none"
                      />

                      {/* Visual Marker (when not viewing rendered preview) */}
                      {!sampleRenderUrl && (
                        <div
                          tabIndex={0}
                          onKeyDown={handleMarkerKeyDown}
                          style={{
                            left: `${nameX}%`,
                            top: `${nameY}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                          className="absolute px-2.5 py-1 rounded-md bg-primary text-black font-bold text-[10px] shadow-lg border border-white flex items-center gap-1 cursor-grab active:cursor-grabbing focus:ring-2 focus:ring-white focus:outline-none"
                        >
                          <Move className="w-3 h-3" />
                          <span>{sampleName || 'Recipient Name'}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center p-6 space-y-2 text-outline">
                      <Upload className="w-8 h-8 mx-auto opacity-50" />
                      <p className="text-xs">Upload artwork to begin visual marker positioning</p>
                    </div>
                  )}
                </div>

                {sampleRenderUrl && (
                  <button
                    type="button"
                    onClick={() => setSampleRenderUrl('')}
                    className="w-full py-1 text-center text-[10px] text-primary hover:underline cursor-pointer"
                  >
                    ← Back to Marker Adjustment
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-outline-variant bg-surface-container/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant text-xs text-on-surface transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || !name.trim() || (!file && !previewUrl)}
              className="px-5 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs hover:brightness-110 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {loading ? 'Saving…' : 'Save Custom Template'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
