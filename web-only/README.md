# Bulk Certificate Generator (Client-Only Edition)

A high-performance, client-only browser application for bulk certificate generation. Everything runs 100% locally in the user's browser—**no backend server, database, or API required**.

---

## Key Features

1. **100% Client-Side Architecture**:
   - Zero server dependencies: runs completely in modern web browsers.
   - Private and secure: participant names, emails, and certificate files never leave the user's device.
   - Instant deployment to static hosting (GitHub Pages, Cloudflare Pages, Vercel, Netlify, or any static file server).

2. **Multi-Format Recipient Import (Section 01)**:
   - **CSV**: Automatic header detection (`name`, `email`, etc.) with customizable column mapping.
   - **XLSX**: Native spreadsheet parsing with `read-excel-file`.
   - **Plain TXT**: Line-by-line parsing supporting `Name <email>`, `Name, email`, and single-name lines.
   - **Paste Tab**: Quick copy-paste for small recipient batches.
   - Real-time row validation with detection of empty names and duplicate entries.

3. **Built-in & Custom Templates (Section 02)**:
   - **5 High-Resolution Built-in Styles** (A4 Landscape 3508×2480 @ 300 DPI):
     - **Classic Gold**: Formal serif typography with double gold borders and accent divider lines.
     - **Modern Minimal**: Clean sans-serif layout with top royal blue accent bar.
     - **Minimal Clean**: Ultra-clean monochrome design.
     - **Elegant Navy**: Deep navy and metallic gold borders with sophisticated serif type.
     - **Bold Tech**: Dark mode aesthetic with cyan cyber frames and high-contrast typography.
   - **Custom Template Studio**:
     - Upload your own organization's PNG or JPEG certificate design.
     - Interactive visual marker: drag with mouse or nudge with arrow keys (Shift for 2% steps).
     - Live client-side preview with custom sample recipient names.
     - Saved in browser IndexedDB (with fallback to localStorage).

4. **Multi-Format Export (Section 03)**:
   - **PDF**: High-resolution print-ready A4 landscape vector documents via `jsPDF`.
   - **PNG**: Lossless raster images with crisp edge definition.
   - **JPG**: Lightweight web-ready images at quality 92.

5. **In-Browser Batch Generation & ZIP Packaging (Section 04)**:
   - Asynchronous batch processor yields UI updates for a smooth 60 FPS experience.
   - Accessible live progress bar (`role="progressbar"`) and live status announcements.
   - Telemetry cards tracking **Succeeded**, **Failed**, and **Total** counts.
   - Error isolation: empty or malformed rows fail individually without stopping the batch.
   - Comprehensive **Failed Recipients Breakdown Table** detailing the exact reason for failures.
   - **Direct ZIP Download**: Bundles all generated certificates in browser memory using `JSZip` into a single `.zip` archive.

---

## Project Structure

```
web-only/
├── index.html                    # Root HTML document with Google Fonts
├── vite.config.js                # Vite development and build configuration
├── package.json                  # Dependencies (React, jsPDF, JSZip, PapaParse, read-excel-file)
├── verify_flow.cjs               # Automated end-to-end browser test suite (Playwright)
└── src/
    ├── main.jsx                  # React application entrypoint
    ├── App.jsx                   # Main application layout and state manager
    ├── index.css                 # Utilitarian design system styling (Vercel-inspired)
    ├── api.js                    # Client-side API adapter
    ├── components/
    │   ├── ImportPanel.jsx       # CSV, XLSX, TXT and Paste import panel
    │   ├── TemplatePicker.jsx    # Built-in and custom template selector
    │   ├── CustomTemplateModal.jsx # Visual custom template artwork studio
    │   ├── DetailsForm.jsx       # Course title, institution, date, and format selector
    │   ├── SubmitBar.jsx         # Batch generation trigger and queue summary
    │   └── StatusPanel.jsx       # Live batch progress, telemetry, and ZIP download
    └── services/
        ├── db.js                 # IndexedDB persistence for custom templates
        ├── templateRegistry.js   # Built-in layout rules, borders, and palettes
        ├── certificateRenderer.js# Canvas drawing engine (300 DPI A4 and multi-format encoder)
        └── jobWorker.js          # In-browser asynchronous batch generator and ZIP packager
```

---

## Development & Usage

### 1. Install Dependencies
```bash
cd web-only
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:5174](http://localhost:5174) in your browser.

### 3. Production Build
```bash
npm run build
```
The optimized production bundle will be created in `web-only/dist/`.

### 4. Run Automated End-to-End Verification
```bash
node verify_flow.cjs
```
This tests all import formats (CSV, TXT, XLSX), template selection, built-in batch generation (PNG), failed recipient tracking, ZIP download, custom template studio with sample preview, and custom template batch generation (PDF). Screenshots are saved to `web-only/screenshots/`.
