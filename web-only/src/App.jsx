import React, { useState } from 'react';
import ImportPanel from './components/ImportPanel';
import TemplatePicker from './components/TemplatePicker';
import DetailsForm from './components/DetailsForm';
import SubmitBar from './components/SubmitBar';
import StatusPanel from './components/StatusPanel';

function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function App() {
  const [recipients, setRecipients] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [title, setTitle] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [issuedDate, setIssuedDate] = useState(getTodayDateString());
  const [outputFormat, setOutputFormat] = useState('pdf');
  const [activeJobId, setActiveJobId] = useState(null);

  const isCustom = selectedTemplate?.kind === 'custom';

  const handleReset = () => {
    setActiveJobId(null);
    setRecipients([]);
    setTitle('');
  };

  return (
    <div className="app-container">
      {/* Skip Link for Keyboard Accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Page Header */}
      <header className="header-section">
        <div className="header-top-row">
          <h1>Bulk Certificate Generator</h1>
          <div className="header-badge">
            <span className="header-badge-dot" aria-hidden="true" />
            <span>Multi-Format Engine • PDF PNG JPG (Client-Only)</span>
          </div>
        </div>
        <p>
          High-performance in-browser bulk certificate rendering with custom artwork positioning, robust column mapping, and live batch progress tracking. Zero backend required.
        </p>
      </header>

      {/* Main Content Area */}
      <main id="main-content">
        {/* 01. Recipients Section */}
        <ImportPanel
          recipients={recipients}
          setRecipients={setRecipients}
        />

        {/* 02. Template Section */}
        <TemplatePicker
          selectedTemplateId={selectedTemplateId}
          setSelectedTemplateId={setSelectedTemplateId}
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
        />

        {/* 03. Details & Format Section */}
        <DetailsForm
          title={title}
          setTitle={setTitle}
          organizationName={organizationName}
          setOrganizationName={setOrganizationName}
          issuedDate={issuedDate}
          setIssuedDate={setIssuedDate}
          outputFormat={outputFormat}
          setOutputFormat={setOutputFormat}
          isCustom={isCustom}
        />

        {/* 04. Generate & Status Section */}
        {activeJobId ? (
          <StatusPanel jobId={activeJobId} onReset={handleReset} />
        ) : (
          <SubmitBar
            title={title}
            organizationName={organizationName}
            issuedDate={issuedDate}
            selectedTemplateId={selectedTemplateId}
            isCustom={isCustom}
            outputFormat={outputFormat}
            recipients={recipients}
            onJobStarted={(jobId) => setActiveJobId(jobId)}
          />
        )}
      </main>
    </div>
  );
}
