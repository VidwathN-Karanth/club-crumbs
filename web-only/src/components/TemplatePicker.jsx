import React, { useState, useEffect } from 'react';
import { fetchTemplates, getTemplatePreviewUrl } from '../api';
import CustomTemplateModal from './CustomTemplateModal';

export default function TemplatePicker({
  selectedTemplateId,
  setSelectedTemplateId,
  selectedTemplate,
  setSelectedTemplate,
}) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadTemplates = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await fetchTemplates();
      setTemplates(data);
      if (data.length > 0) {
        if (!selectedTemplateId) {
          setSelectedTemplateId(data[0].id);
          if (setSelectedTemplate) setSelectedTemplate(data[0]);
        } else {
          const current = data.find((t) => t.id === selectedTemplateId);
          if (current && setSelectedTemplate) setSelectedTemplate(current);
        }
      }
    } catch (err) {
      setErrorMsg(`Failed to load templates: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleSelect = (tpl) => {
    setSelectedTemplateId(tpl.id);
    if (setSelectedTemplate) setSelectedTemplate(tpl);
  };

  const handleCustomCreated = (newTemplate) => {
    setTemplates((prev) => [newTemplate, ...prev]);
    setSelectedTemplateId(newTemplate.id);
    if (setSelectedTemplate) setSelectedTemplate(newTemplate);
  };

  const activeTemplateName = selectedTemplate?.name || (templates.find((t) => t.id === selectedTemplateId)?.name);

  return (
    <div className="section-card" id="section-template">
      <div className="section-header">
        <div className="section-heading-group">
          <span className="section-number">02</span>
          <h2 className="section-title">Certificate Template</h2>
          {activeTemplateName && (
            <span className="section-status-tag ready">
              {activeTemplateName}
            </span>
          )}
        </div>
        <p className="section-subtitle">
          Choose a built-in layout or upload your organization's custom certificate design.
        </p>
      </div>

      {errorMsg && (
        <div className="alert-box alert-danger" role="alert" aria-live="polite">
          <span aria-hidden="true">⚠</span>
          <div style={{ flex: 1 }}>{errorMsg}</div>
          <button
            type="button"
            className="btn-secondary-action"
            style={{ padding: '2px 8px', fontSize: 'var(--text-xs)', minHeight: '32px' }}
            onClick={loadTemplates}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="template-grid" aria-busy="true">
          {[1, 2, 3].map((n) => (
            <div key={n} className="template-card" style={{ opacity: 0.6 }}>
              <div className="template-preview-box" style={{ background: 'var(--color-canvas-muted)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted)' }}>
                  Loading preview…
                </span>
              </div>
              <div className="template-meta-name" style={{ height: '18px', background: 'var(--color-canvas-muted)', borderRadius: '4px' }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="template-grid" role="radiogroup" aria-label="Certificate templates">
          {templates.map((tpl) => {
            const isSelected = selectedTemplateId === tpl.id;
            const previewUrl = getTemplatePreviewUrl(tpl.id);
            const imgSrc = previewUrl?.startsWith('data:') || previewUrl?.startsWith('blob:')
              ? previewUrl
              : `${previewUrl}?name=Sample+Recipient`;

            return (
              <div
                key={tpl.id}
                className={`template-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(tpl)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(tpl);
                  }
                }}
                tabIndex={0}
                role="radio"
                aria-checked={isSelected}
                aria-label={`Select template ${tpl.name}`}
              >
                <div className="template-preview-box">
                  <img
                    src={imgSrc}
                    alt={`Preview of ${tpl.name}`}
                    className="template-preview-img"
                    width="400"
                    height="250"
                    loading="lazy"
                  />
                </div>
                <div className="template-footer">
                  <div>
                    <div className="template-meta-name">{tpl.name}</div>
                    <div className="template-meta-kind">
                      {tpl.kind === 'builtin' ? 'Built-in layout' : 'Custom artwork'}
                    </div>
                  </div>
                  {isSelected && (
                    <span className="template-select-pill">Selected</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Semantic Button Upload Card */}
          <button
            type="button"
            className="template-upload-card"
            onClick={() => setIsModalOpen(true)}
            aria-label="Upload custom certificate template"
          >
            <div className="template-upload-icon" aria-hidden="true">+</div>
            <div className="template-upload-title">Upload Custom Template</div>
            <div className="template-upload-desc">
              PNG or JPEG artwork with custom recipient name positioning
            </div>
          </button>
        </div>
      )}

      {!loading && templates.length === 0 && !errorMsg && (
        <div style={{ textAlign: 'center', color: 'var(--color-ink-muted)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-4)' }}>
          No templates found. Upload a custom certificate image to begin.
        </div>
      )}

      <CustomTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCustomCreated}
      />
    </div>
  );
}
