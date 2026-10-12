'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Plus,
  Check,
  Trash2,
  Layers,
  Palette,
  Loader2,
} from 'lucide-react';
import { getTemplates, deleteCustomTemplate } from '@/lib/certificates/templateRegistry';
import { renderPreviewDataUrl } from '@/lib/certificates/certificateRenderer';
import CustomTemplateModal from './CustomTemplateModal';
import type { CertificateTemplate, CustomTemplate } from '@/lib/certificates/types';

interface TemplatePickerProps {
  selectedTemplateId: string;
  setSelectedTemplateId: (id: string) => void;
  selectedTemplate: CertificateTemplate | null;
  setSelectedTemplate: (tpl: CertificateTemplate) => void;
}

export default function TemplatePicker({
  selectedTemplateId,
  setSelectedTemplateId,
  selectedTemplate,
  setSelectedTemplate,
}: TemplatePickerProps) {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTemplates();
      setTemplates(data);

      if (data.length > 0) {
        if (!selectedTemplateId) {
          setSelectedTemplateId(data[0].id);
          setSelectedTemplate(data[0]);
        } else {
          const matched = data.find((t) => t.id === selectedTemplateId);
          if (matched) setSelectedTemplate(matched);
        }
      }

      // Generate previews
      const urlMap: Record<string, string> = {};
      for (const tpl of data) {
        try {
          const preview = await renderPreviewDataUrl(tpl, 'Sample Recipient');
          urlMap[tpl.id] = preview;
        } catch (err) {
          console.warn(`Failed preview for template ${tpl.id}:`, err);
        }
      }
      setPreviewUrls(urlMap);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedTemplateId, setSelectedTemplateId, setSelectedTemplate]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleSelect = (tpl: CertificateTemplate) => {
    setSelectedTemplateId(tpl.id);
    setSelectedTemplate(tpl);
  };

  const handleCustomCreated = (newTemplate: CustomTemplate) => {
    setTemplates((prev) => [newTemplate, ...prev]);
    setSelectedTemplateId(newTemplate.id);
    setSelectedTemplate(newTemplate);
    loadTemplates();
  };

  const handleDeleteCustom = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this custom template?')) return;
    await deleteCustomTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    if (selectedTemplateId === id) {
      const remaining = templates.filter((t) => t.id !== id);
      if (remaining.length > 0) {
        setSelectedTemplateId(remaining[0].id);
        setSelectedTemplate(remaining[0]);
      }
    }
  };

  const activeTemplateName = selectedTemplate?.name || templates.find((t) => t.id === selectedTemplateId)?.name;

  return (
    <div className="bg-surface border border-outline-variant rounded-2xl p-6 space-y-6 shadow-sm">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-mono text-xs font-bold">
              02
            </span>
            <h2 className="text-lg font-bold font-mono tracking-tight text-on-surface flex items-center gap-2">
              Certificate Template
            </h2>
            {activeTemplateName && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                {activeTemplateName}
              </span>
            )}
          </div>
          <p className="text-xs text-outline font-mono mt-1">
            Choose from 5 high-DPI built-in styles (A4 300 DPI) or upload your club&apos;s custom design artwork.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-mono font-bold hover:brightness-110 transition cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Custom Template Studio
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="border border-outline-variant rounded-xl p-4 bg-surface-container animate-pulse flex flex-col gap-3"
            >
              <div className="aspect-[1.414/1] bg-surface rounded-lg flex items-center justify-center text-outline text-xs">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div className="h-4 bg-surface rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => {
            const isSelected = tpl.id === selectedTemplateId;
            const previewUrl = previewUrls[tpl.id];
            const isCustom = tpl.kind === 'custom';

            return (
              <div
                key={tpl.id}
                onClick={() => handleSelect(tpl)}
                className={`group relative border rounded-2xl p-3 bg-surface hover:bg-surface-container/40 transition cursor-pointer flex flex-col gap-2.5 overflow-hidden ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 shadow-md'
                    : 'border-outline-variant hover:border-primary/40'
                }`}
              >
                {/* Thumbnail Preview Area */}
                <div className="relative aspect-[1.414/1] bg-black/20 rounded-xl overflow-hidden border border-outline-variant flex items-center justify-center">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt={tpl.name}
                      className="w-full h-full object-cover transition group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="text-[10px] text-outline font-mono flex items-center gap-1.5">
                      <Layers className="w-4 h-4" /> Rendering…
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider backdrop-blur-md ${
                        isCustom
                          ? 'bg-purple-500/80 text-white'
                          : 'bg-black/60 text-white/90 border border-white/20'
                      }`}
                    >
                      {isCustom ? 'Custom Artwork' : 'Built-In'}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Footer Title & Action */}
                <div className="flex items-center justify-between pt-1">
                  <div className="min-w-0">
                    <h3 className="text-xs font-mono font-bold text-on-surface truncate">
                      {tpl.name}
                    </h3>
                    <p className="text-[10px] text-outline font-mono truncate">
                      {isCustom ? 'Visual name coordinate' : 'A4 Landscape • 3508×2480'}
                    </p>
                  </div>

                  {isCustom && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCustom(e, tpl.id)}
                      className="text-outline hover:text-rose-400 p-1 transition cursor-pointer"
                      title="Delete template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Template Modal */}
      <CustomTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCustomCreated}
      />
    </div>
  );
}
