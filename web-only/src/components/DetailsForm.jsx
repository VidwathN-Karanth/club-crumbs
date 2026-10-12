import React from 'react';

const FORMAT_OPTIONS = [
  { id: 'pdf', label: 'PDF', sub: 'Print • 300 DPI', desc: 'Vector-grade multi-page document ideal for high-resolution printing.' },
  { id: 'png', label: 'PNG', sub: 'Lossless Raster', desc: 'High-fidelity lossless raster image with crisp edge definition.' },
  { id: 'jpg', label: 'JPG', sub: 'Compressed 92', desc: 'Lightweight web-optimized image format with quality 92 compression.' },
];

export default function DetailsForm({
  title,
  setTitle,
  organizationName,
  setOrganizationName,
  issuedDate,
  setIssuedDate,
  outputFormat = 'pdf',
  setOutputFormat,
  isCustom = false,
}) {
  const currentFormat = (outputFormat || 'pdf').toLowerCase();
  const selectedFormatObj = FORMAT_OPTIONS.find((f) => f.id === currentFormat) || FORMAT_OPTIONS[0];

  const handleFormatKeyDown = (e, index) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = (index + 1) % FORMAT_OPTIONS.length;
      setOutputFormat(FORMAT_OPTIONS[nextIdx].id);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = (index - 1 + FORMAT_OPTIONS.length) % FORMAT_OPTIONS.length;
      setOutputFormat(FORMAT_OPTIONS[prevIdx].id);
    }
  };

  return (
    <div className="section-card" id="section-details">
      <div className="section-header">
        <div className="section-heading-group">
          <span className="section-number">03</span>
          <h2 className="section-title">Details &amp; Export Format</h2>
          <span className="section-status-tag ready" style={{ textTransform: 'uppercase' }}>
            {currentFormat}
          </span>
        </div>
        <p className="section-subtitle">
          {isCustom
            ? 'Select output format. Template metadata is already present in your uploaded artwork.'
            : 'Enter course information and select your preferred certificate format.'}
        </p>
      </div>

      {isCustom ? (
        <div className="custom-template-notice">
          <strong>Custom Template Active:</strong> Course title, institution credentials, and issue date are already flattened in your background artwork. Only the recipient's name is dynamically rendered onto the image.
        </div>
      ) : (
        <>
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="details-title-input" className="form-label">
                Course or Certificate Title <span className="required-star">*</span>
              </label>
              <input
                id="details-title-input"
                name="certificateTitle"
                type="text"
                className="form-input"
                autoComplete="off"
                spellCheck={false}
                placeholder="e.g. Full-Stack Web Development Bootcamp…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="details-org-input" className="form-label">
                Issuing Organization (Optional)
              </label>
              <input
                id="details-org-input"
                name="organizationName"
                type="text"
                className="form-input"
                autoComplete="off"
                spellCheck={false}
                placeholder="e.g. Acme Tech Institute…"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
              />
            </div>
          </div>

          <div style={{ maxWidth: '320px', marginBottom: 'var(--space-5)' }}>
            <div className="form-group">
              <label htmlFor="details-date-input" className="form-label">
                Issue Date <span className="required-star">*</span>
              </label>
              <input
                id="details-date-input"
                name="issuedDate"
                type="date"
                className="form-input"
                value={issuedDate}
                onChange={(e) => setIssuedDate(e.target.value)}
                required
              />
            </div>
          </div>
        </>
      )}

      {/* Segmented Control for Export Format */}
      <div className="form-group">
        <label className="form-label" id="format-label">
          Export Output Format
        </label>
        <div
          className="segmented-control-container"
          role="radiogroup"
          aria-labelledby="format-label"
        >
          <div className="segmented-control">
            {FORMAT_OPTIONS.map((fmt, idx) => {
              const isChecked = currentFormat === fmt.id;
              return (
                <button
                  key={fmt.id}
                  type="button"
                  role="radio"
                  aria-checked={isChecked}
                  tabIndex={isChecked ? 0 : -1}
                  className={`segmented-btn ${isChecked ? 'active' : ''}`}
                  onClick={() => setOutputFormat(fmt.id)}
                  onKeyDown={(e) => handleFormatKeyDown(e, idx)}
                >
                  <span className="segmented-btn-title">{fmt.label}</span>
                  <span className="segmented-btn-sub">{fmt.sub}</span>
                </button>
              );
            })}
          </div>
          <div className="format-explainer">
            {selectedFormatObj.desc}
          </div>
        </div>
      </div>
    </div>
  );
}
