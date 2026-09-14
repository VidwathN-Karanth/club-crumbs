/**
 * Institutional College Header configuration and generator for Club Crumbs Report Builder.
 * Standardizes the official MITE institutional header across all generated report pages.
 */

import { MITE_LOGO_BASE64 } from './logoBase64';

export interface CollegeHeaderConfig {
  institutionName: string;
  trustLine: string;
  affiliationLine: string;
  accreditationLine: string;
  logoSrc?: string;
}

export const DEFAULT_COLLEGE_HEADER: CollegeHeaderConfig = {
  institutionName: 'MANGALORE INSTITUTE OF TECHNOLOGY & ENGINEERING',
  trustLine: '(A Unit of Rajalaxmi Education Trust ®, Mangalore)',
  affiliationLine: 'Autonomous Institute Affiliated to V.T.U, Belagavi, Approved by AICTE, New Delhi',
  accreditationLine: 'Accredited by NAAC with A+ Grade & ISO 9001:2015 Certified Institution',
  logoSrc: MITE_LOGO_BASE64,
};

/**
 * Returns clean, self-contained HTML for the institutional college header.
 */
export function getCollegeHeaderHtml(config: CollegeHeaderConfig = DEFAULT_COLLEGE_HEADER): string {
  const logo = config.logoSrc || MITE_LOGO_BASE64;
  return `
    <div class="college-header" style="display: flex; align-items: center; justify-content: flex-start; gap: 14px; margin-bottom: 20px; font-family: 'Times New Roman', Times, serif; user-select: none; border: none; padding: 0;">
      <img src="${logo}" alt="MITE Logo" style="height: 74px; width: auto; max-width: 62px; object-fit: contain; flex-shrink: 0; display: block;" />
      <div style="flex: 1; text-align: center;">
        <div style="font-size: 13.5pt; font-weight: bold; color: #002db3; letter-spacing: 0.1px; line-height: 1.25; margin-bottom: 2px; font-family: 'Times New Roman', Times, serif; white-space: nowrap;">
          ${config.institutionName}
        </div>
        <div style="font-size: 9.5pt; color: #000000; line-height: 1.35; margin-bottom: 2px; font-family: 'Times New Roman', Times, serif;">
          ${config.trustLine}
        </div>
        <div style="font-size: 9pt; color: #000000; line-height: 1.35; margin-bottom: 2px; font-family: 'Times New Roman', Times, serif;">
          ${config.affiliationLine}
        </div>
        <div style="font-size: 9pt; color: #000000; line-height: 1.35; font-family: 'Times New Roman', Times, serif;">
          ${config.accreditationLine}
        </div>
      </div>
    </div>
  `.trim();
}
