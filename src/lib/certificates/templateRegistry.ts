import { getAllCustomTemplates, saveCustomTemplate, deleteCustomTemplate } from './db';
import type { BuiltinTemplateConfig, BuiltinTemplate, CertificateTemplate } from './types';

export const BUILTIN_STYLE_CONFIGS: Record<string, BuiltinTemplateConfig> = {
  classic: {
    key: 'classic',
    name: 'Classic Gold',
    header_title: 'CERTIFICATE OF ACHIEVEMENT',
    subtitle: 'THIS IS PROUDLY PRESENTED TO',
    for_course_label: 'FOR SUCCESSFUL COMPLETION OF',
    layout: { name_y: 45.0, course_y: 62.0, date_y: 78.0 },
    colors: {
      background: '#FFFDF7', // Cream
      primary: '#1A2530',    // Dark Slate
      secondary: '#5A6B7C',  // Muted Slate
      accent: '#C59B27',     // Classic Gold
      border: '#C59B27',     // Gold Border
      inner_border: '#1A2530',
    },
    border: {
      style: 'gold_double',
      outer_margin: 24,
      inner_margin: 32,
      width: 3,
    },
    fonts: {
      header: 'serif',
      subtitle: 'sans-serif',
      name: 'serif',
      course: 'serif',
      date: 'sans-serif',
    },
    decorations: {
      accent_line: true,
      corner_accents: true,
    },
  },
  modern: {
    key: 'modern',
    name: 'Modern Minimal',
    header_title: 'CERTIFICATE OF COMPLETION',
    subtitle: 'PROUDLY PRESENTED TO',
    for_course_label: 'HAS SUCCESSFULLY COMPLETED THE COURSE',
    layout: { name_y: 42.0, course_y: 60.0, date_y: 76.0 },
    colors: {
      background: '#F8FAFC', // Off-white / Cool Grey
      primary: '#0F172A',    // Slate 900
      secondary: '#475569',  // Slate 600
      accent: '#2563EB',     // Royal Blue
      border: '#E2E8F0',     // Slate 200
      inner_border: '#2563EB',
    },
    border: {
      style: 'single_with_accent_bar',
      outer_margin: 20,
      width: 2,
    },
    fonts: {
      header: 'sans-serif',
      subtitle: 'sans-serif',
      name: 'sans-serif',
      course: 'sans-serif',
      date: 'sans-serif',
    },
    decorations: {
      accent_line: true,
      top_accent_bar: true,
    },
  },
  minimal: {
    key: 'minimal',
    name: 'Minimal Clean',
    header_title: 'CERTIFICATE OF EXCELLENCE',
    subtitle: 'AWARDED TO',
    for_course_label: 'IN RECOGNITION OF COMPLETING',
    layout: { name_y: 45.0, course_y: 60.0, date_y: 78.0 },
    colors: {
      background: '#FFFFFF', // Pure White
      primary: '#111827',    // Gray 900
      secondary: '#6B7280',  // Gray 500
      accent: '#111827',     // Monochromatic Dark
      border: '#E5E7EB',     // Gray 200
      inner_border: null,
    },
    border: {
      style: 'minimal_thin',
      outer_margin: 30,
      width: 1,
    },
    fonts: {
      header: 'sans-serif',
      subtitle: 'sans-serif',
      name: 'sans-serif',
      course: 'sans-serif',
      date: 'sans-serif',
    },
    decorations: {
      accent_line: false,
    },
  },
  elegant: {
    key: 'elegant',
    name: 'Elegant Navy',
    header_title: 'CERTIFICATE OF APPRECIATION',
    subtitle: 'THIS CERTIFICATE IS GRANTED TO',
    for_course_label: 'FOR SUCCESSFUL PARTICIPATION IN',
    layout: { name_y: 38.0, course_y: 55.0, date_y: 72.0 },
    colors: {
      background: '#FAF9F6', // Warm Alabaster
      primary: '#0A192F',    // Deep Navy
      secondary: '#4A5568',  // Charcoal
      accent: '#D4AF37',     // Soft Metallic Gold
      border: '#0A192F',     // Navy Outer
      inner_border: '#D4AF37',// Gold Inner
    },
    border: {
      style: 'gold_double',
      outer_margin: 25,
      inner_margin: 32,
      width: 2,
    },
    fonts: {
      header: 'serif',
      subtitle: 'serif',
      name: 'serif',
      course: 'serif',
      date: 'serif',
    },
    decorations: {
      accent_line: true,
      ornament_star: true,
    },
  },
  bold: {
    key: 'bold',
    name: 'Bold Tech',
    header_title: 'CERTIFICATE OF ACHIEVEMENT',
    subtitle: 'PRESENTED TO',
    for_course_label: 'FOR MASTERING THE COURSE',
    layout: { name_y: 44.0, course_y: 62.0, date_y: 80.0 },
    colors: {
      background: '#0F172A', // Dark Mode Background
      primary: '#F8FAFC',    // Bright White
      secondary: '#94A3B8',  // Slate 400
      accent: '#06B6D4',     // Vibrant Cyan
      border: '#06B6D4',     // Cyan Frame
      inner_border: '#1E293B',
    },
    border: {
      style: 'tech_frame',
      outer_margin: 20,
      width: 3,
    },
    fonts: {
      header: 'sans-serif',
      subtitle: 'sans-serif',
      name: 'sans-serif',
      course: 'sans-serif',
      date: 'sans-serif',
    },
    decorations: {
      accent_line: true,
      cyan_accents: true,
    },
  },
};

export const BUILTIN_TEMPLATES: BuiltinTemplate[] = Object.values(BUILTIN_STYLE_CONFIGS).map((cfg) => ({
  id: cfg.key,
  key: cfg.key,
  name: cfg.name,
  kind: 'builtin' as const,
  layout: cfg.layout,
  required_fields: ['name', 'title', 'issued_date'],
}));

export async function getTemplates(): Promise<CertificateTemplate[]> {
  const customList = await getAllCustomTemplates();
  return [...customList, ...BUILTIN_TEMPLATES];
}

export function getTemplateConfig(key: string): BuiltinTemplateConfig {
  return BUILTIN_STYLE_CONFIGS[key] || BUILTIN_STYLE_CONFIGS.classic;
}

export { saveCustomTemplate, deleteCustomTemplate };
