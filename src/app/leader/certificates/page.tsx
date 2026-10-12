'use client';

import React, { useState } from 'react';
import { Award, ShieldCheck, Download, Sparkles } from 'lucide-react';
import { SectionHeader } from '@/app/admin/_components/PanelState';
import { useLeader } from '../LeaderContext';
import ImportPanel from '@/components/certificates/ImportPanel';
import TemplatePicker from '@/components/certificates/TemplatePicker';
import DetailsForm from '@/components/certificates/DetailsForm';
import SubmitBar from '@/components/certificates/SubmitBar';
import StatusPanel from '@/components/certificates/StatusPanel';
import type { CertificateTemplate, OutputFormat, Recipient } from '@/lib/certificates/types';

function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function LeaderCertificatesPage() {
  const { cohort } = useLeader();

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('classic');
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);
  const [title, setTitle] = useState('');
  const [organizationName, setOrganizationName] = useState(() => (cohort ? `MITE ${cohort}` : 'MITE Technical Clubs'));
  const [issuedDate, setIssuedDate] = useState(getTodayDateString());
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('pdf');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const isCustom = selectedTemplate?.kind === 'custom';

  const handleReset = () => {
    setActiveJobId(null);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <SectionHeader
        icon={Award}
        title="Certificates"
        subtitle={`Generate, design, and export verified bulk certificates for ${cohort} members & event participants.`}
      >
        <span className="px-3 py-1.5 rounded-xl border border-outline-variant bg-surface-container/60 text-[11px] font-mono uppercase tracking-wider text-outline flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          Client-Only Engine (No Server Required)
        </span>
      </SectionHeader>

      {/* 01. Import Recipients */}
      <ImportPanel
        recipients={recipients}
        setRecipients={setRecipients}
      />

      {/* 02. Certificate Template Picker */}
      <TemplatePicker
        selectedTemplateId={selectedTemplateId}
        setSelectedTemplateId={setSelectedTemplateId}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
      />

      {/* 03. Details & Export Format */}
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

      {/* 04. Generate & Status */}
      {activeJobId ? (
        <StatusPanel jobId={activeJobId} onReset={handleReset} />
      ) : (
        <SubmitBar
          title={title}
          organizationName={organizationName}
          issuedDate={issuedDate}
          selectedTemplate={selectedTemplate}
          outputFormat={outputFormat}
          recipients={recipients}
          onJobStarted={(jobId) => setActiveJobId(jobId)}
        />
      )}
    </div>
  );
}
