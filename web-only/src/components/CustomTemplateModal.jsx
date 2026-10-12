import React, { useState, useRef, useEffect } from 'react';
import { uploadCustomTemplate, fetchDraftPreview } from '../api';

const FONT_OPTIONS = [
  { key: 'dejavu_sans', label: 'DejaVu Sans (Clean / Sans)' },
  { key: 'dejavu_serif', label: 'DejaVu Serif (Formal / Serif)' },
  { key: 'liberation_sans', label: 'Liberation Sans (Crisp / Neutral)' },
  { key: 'liberation_serif', label: 'Liberation Serif (Classic / Traditional)' },
];

export default function CustomTemplateModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
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

  const imageContainerRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Keyboard navigation & drag handling
  useEffect(() => {
    const handleMouseMove = (e) => {
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

    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
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

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!['image/png', 'image/jpeg'].includes(selected.type)) {
      setErrorMsg('Only PNG and JPEG image formats are supported.');
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setErrorMsg('Image size cannot exceed 10 MB.');
      return;
    }

    setFile(selected);
    setErrorMsg('');
    setSampleRenderUrl('');
    const objUrl = URL.createObjectURL(selected);
    setPreviewUrl(objUrl);
  };

  const handleMouseDownOnCanvas = (e) => {
    if (!imageContainerRef.current) return;
    isDraggingRef.current = true;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setNameX(parseFloat(xPct.toFixed(1)));
    setNameY(parseFloat(yPct.toFixed(1)));
  };

  const handleMarkerKeyDown = (e) => {
    const step = e.shiftKey ? 2.0 : 0.5;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setNameX((prev) => Math.max(0, parseFloat((prev - step).toFixed(1))));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setNameX((prev) => Math.min(100, parseFloat((prev + step).toFixed(1))));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setNameY((prev) => Math.max(0, parseFloat((prev - step).toFixed(1))));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setNameY((prev) => Math.min(100, parseFloat((prev + step).toFixed(1))));
    }
  };

  const handleTestSample = async () => {
    if (!file) {
      setErrorMsg('Please upload a certificate background image first.');
      return;
    }

    setRenderingSample(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('name_x', nameX);
      formData.append('name_y', nameY);
      formData.append('font', font);
      formData.append('font_size_pct', fontSizePct);
      formData.append('color', color);
      formData.append('max_width_pct', maxWidthPct);
      formData.append('sample_name', sampleName || 'Tanisha C Kotian');

      const renderedBlobUrl = await fetchDraftPreview(formData);
      setSampleRenderUrl(renderedBlobUrl);
    } catch (err) {
      setErrorMsg(`Preview rendering failed: ${err.message}`);
    } finally {
      setRenderingSample(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a template name.');
      return;
    }
    if (!file) {
      setErrorMsg('Please select a certificate background image.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('image', file);
      formData.append('name_x', nameX);
      formData.append('name_y', nameY);
      formData.append('font', font);
      formData.append('font_size_pct', fontSizePct);
      formData.append('color', color);
      formData.append('max_width_pct', maxWidthPct);

      const createdTemplate = await uploadCustomTemplate(formData);
      onCreated(createdTemplate);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload template.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="custom-template-title">
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h2 id="custom-template-title" className="modal-title">Custom Template Studio</h2>
            <p className="modal-subtitle">
              Upload certificate artwork and drag the recipient name marker into place.
            </p>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label="Close custom template modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {errorMsg && (
            <div className="alert-box alert-danger" role="alert" aria-live="polite">
              <span aria-hidden="true">⚠</span>
              <div>{errorMsg}</div>
            </div>
          )}

          <form id="custom-template-form" onSubmit={handleSubmit}>
            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="custom-tpl-name" className="form-label">
                  Template Name <span className="required-star">*</span>
                </label>
                <input
                  id="custom-tpl-name"
                  name="templateName"
                  type="text"
                  className="form-input"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="e.g. Annual Summit Award…"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="custom-tpl-file" className="form-label">
                  Certificate Artwork (PNG / JPG) <span className="required-star">*</span>
                </label>
                <input
                  id="custom-tpl-file"
                  name="templateImage"
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleFileChange}
                  className="form-input"
                  required={!file}
                />
              </div>
            </div>

            {/* Roomy Editor: Image Canvas on Left, Controls Beside or Below */}
            <div className="studio-grid" style={{ marginTop: 'var(--space-4)' }}>
              {/* Left / Center: Roomy Canvas Display */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Recipient Name Position:
                  </label>
                  <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-ink-secondary)' }}>
                    X: {nameX}% • Y: {nameY}%
                  </span>
                </div>

                {previewUrl ? (
                  <div
                    ref={imageContainerRef}
                    className="studio-canvas-container"
                    onMouseDown={handleMouseDownOnCanvas}
                  >
                    <img
                      src={previewUrl}
                      alt="Template background artwork"
                      className="studio-canvas-img"
                      width="800"
                      height="500"
                      draggable={false}
                    />

                    {/* Draggable & Keyboard-Nudgeable Name Marker */}
                    <div
                      className="draggable-name-badge"
                      style={{
                        left: `${nameX}%`,
                        top: `${nameY}%`,
                        backgroundColor: color || '#171717',
                        color: '#ffffff',
                      }}
                      tabIndex={0}
                      role="slider"
                      aria-valuenow={nameX}
                      aria-valuetext={`X: ${nameX}%, Y: ${nameY}%`}
                      aria-label="Recipient name position marker. Drag with mouse or use arrow keys to nudge."
                      onKeyDown={handleMarkerKeyDown}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        isDraggingRef.current = true;
                      }}
                    >
                      <span aria-hidden="true">📍</span>
                      <span>Recipient Name</span>
                    </div>
                  </div>
                ) : (
                  <div
                    className="dropzone"
                    style={{ minHeight: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <div style={{ fontSize: '28px', marginBottom: 'var(--space-2)' }} aria-hidden="true">🖼</div>
                    <div style={{ fontWeight: 600, color: 'var(--color-ink)' }}>No background image selected</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted)', marginTop: '4px' }}>
                      Select a PNG or JPEG file above to position the name overlay.
                    </div>
                  </div>
                )}
              </div>

              {/* Right / Controls Column: Typography & Layout Settings */}
              <div className="studio-controls-column">
                <div className="form-group">
                  <label htmlFor="custom-tpl-font" className="form-label">Font Family</label>
                  <select
                    id="custom-tpl-font"
                    name="templateFont"
                    className="form-input"
                    value={font}
                    onChange={(e) => setFont(e.target.value)}
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="custom-tpl-color" className="form-label">Font Color</label>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <input
                      type="color"
                      id="custom-tpl-color-picker"
                      name="templateColorPicker"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      style={{ width: '38px', height: '38px', padding: 0, border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                      aria-label="Color picker"
                    />
                    <input
                      type="text"
                      id="custom-tpl-color"
                      name="templateColorHex"
                      className="form-input tabular-nums"
                      autoComplete="off"
                      spellCheck={false}
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="#171717"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="slider-readout-row">
                    <label htmlFor="custom-tpl-font-size" className="form-label" style={{ margin: 0 }}>Font Size</label>
                    <span className="slider-readout-val tabular-nums">{fontSizePct}% height</span>
                  </div>
                  <input
                    id="custom-tpl-font-size"
                    name="templateFontSize"
                    type="range"
                    min="1.0"
                    max="15.0"
                    step="0.1"
                    value={fontSizePct}
                    onChange={(e) => setFontSizePct(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                  />
                </div>

                <div className="form-group">
                  <div className="slider-readout-row">
                    <label htmlFor="custom-tpl-max-width" className="form-label" style={{ margin: 0 }}>Max Width Bound</label>
                    <span className="slider-readout-val tabular-nums">{maxWidthPct}% width</span>
                  </div>
                  <input
                    id="custom-tpl-max-width"
                    name="templateMaxWidth"
                    type="range"
                    min="20.0"
                    max="95.0"
                    step="1.0"
                    value={maxWidthPct}
                    onChange={(e) => setMaxWidthPct(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                  />
                </div>

                {/* Server Render Test */}
                {file && (
                  <div style={{ background: 'var(--color-canvas-subtle)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-hairline)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                      Server Render Test
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <input
                        type="text"
                        name="sampleRecipientName"
                        className="form-input"
                        placeholder="Sample Name…"
                        autoComplete="off"
                        spellCheck={false}
                        aria-label="Sample recipient name for server render preview"
                        value={sampleName}
                        onChange={(e) => setSampleName(e.target.value)}
                        style={{ fontSize: 'var(--text-xs)', padding: '6px 8px' }}
                      />
                      <button
                        type="button"
                        className="btn-secondary-action"
                        style={{ padding: '6px 10px', fontSize: 'var(--text-xs)', whiteSpace: 'nowrap', minHeight: '32px' }}
                        onClick={handleTestSample}
                        disabled={renderingSample}
                      >
                        {renderingSample ? 'Rendering…' : 'Test'}
                      </button>
                    </div>

                    {sampleRenderUrl && (
                      <div style={{ marginTop: 'var(--space-2)', textAlign: 'center' }}>
                        <img
                          src={sampleRenderUrl}
                          alt="Server render test preview"
                          width="320"
                          height="180"
                          style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-hairline)' }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn-secondary-action"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="custom-template-form"
            className="btn-primary-generate"
            disabled={loading || !file}
            style={{ padding: '8px 18px', fontSize: 'var(--text-sm)', minHeight: '40px' }}
          >
            {loading ? 'Saving…' : 'Save & Select Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
