export type OutputFormat = 'pdf' | 'png' | 'jpg';

export interface Recipient {
  name: string;
  email?: string | null;
}

export interface CustomTemplateLayout {
  name_x: number; // percentage 0 - 100
  name_y: number; // percentage 0 - 100
  font: string; // font family key
  font_size_pct: number; // percentage of canvas height
  color: string; // hex color
  max_width_pct: number; // percentage of canvas width
}

export interface CustomTemplate {
  id: string;
  name: string;
  kind: 'custom';
  background_data: string; // Data URL
  layout: CustomTemplateLayout;
  required_fields: string[];
}

export interface BuiltinTemplateConfig {
  key: string;
  name: string;
  header_title: string;
  subtitle: string;
  for_course_label: string;
  layout: {
    name_y: number;
    course_y: number;
    date_y: number;
  };
  colors: {
    background: string;
    primary: string;
    secondary: string;
    accent: string;
    border: string;
    inner_border?: string | null;
  };
  border: {
    style: 'gold_double' | 'single_with_accent_bar' | 'minimal_thin' | 'tech_frame' | 'single';
    outer_margin?: number;
    inner_margin?: number;
    width?: number;
  };
  fonts: {
    header: string;
    subtitle: string;
    name: string;
    course: string;
    date: string;
  };
  decorations?: {
    accent_line?: boolean;
    corner_accents?: boolean;
    top_accent_bar?: boolean;
    ornament_star?: boolean;
    cyan_accents?: boolean;
  };
}

export interface BuiltinTemplate {
  id: string;
  key: string;
  name: string;
  kind: 'builtin';
  layout: {
    name_y: number;
    course_y: number;
    date_y: number;
  };
  required_fields: string[];
}

export type CertificateTemplate = BuiltinTemplate | CustomTemplate;

export interface JobFields {
  title?: string | null;
  organization_name?: string | null;
  issued_date?: string | null;
}

export interface FailedCertificateItem {
  id: string;
  recipient_name: string;
  recipient_email?: string | null;
  error_message: string;
}

export interface GeneratedCertificateItem {
  id: string;
  recipient_name: string;
  recipient_email?: string | null;
  blob: Blob;
  filename: string;
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'completed_with_errors' | 'failed';

export interface BatchJobProgress {
  id: string;
  status: JobStatus;
  total: number;
  succeeded: number;
  failed: number;
  pending: number;
  percent: number;
}

export interface ActiveJobState extends BatchJobProgress {
  certificates: GeneratedCertificateItem[];
  failed_certificates: FailedCertificateItem[];
  zipBlob: Blob | null;
}
