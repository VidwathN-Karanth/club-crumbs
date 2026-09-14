import 'server-only';

import { supabaseAdmin } from '../supabaseAdmin';
import { type Cohort } from '../cohorts';

export type ReportStatus = 'draft' | 'published' | 'archived';

export interface ReportRow {
  id: string;
  title: string;
  cohort: Cohort;
  eventId: string | null;
  status: ReportStatus;
  documentJson: Record<string, unknown>;
  documentHtml: string | null;
  documentCss: string | null;
  createdBy: string;
  creatorName: string | null;
  creatorEmail: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DatabaseReportRow {
  id: string;
  title: string;
  cohort: string;
  event_id: string | null;
  status: string;
  document_json: Record<string, unknown> | string;
  document_html: string | null;
  document_css: string | null;
  created_by: string;
  creator_name: string | null;
  creator_email: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

function parseJson(val: unknown): Record<string, unknown> {
  if (!val) return {};
  if (typeof val === 'object' && val !== null) return val as Record<string, unknown>;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

function mapRow(row: DatabaseReportRow): ReportRow {
  return {
    id: row.id,
    title: row.title,
    cohort: row.cohort as Cohort,
    eventId: row.event_id ?? null,
    status: (row.status as ReportStatus) || 'draft',
    documentJson: parseJson(row.document_json),
    documentHtml: row.document_html ?? null,
    documentCss: row.document_css ?? null,
    createdBy: row.created_by,
    creatorName: row.creator_name ?? null,
    creatorEmail: row.creator_email ?? null,
    updatedBy: row.updated_by ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class Report {
  static async findForCohort(cohort: Cohort): Promise<ReportRow[]> {
    const { data, error } = await supabaseAdmin
      .from('event_reports')
      .select('*')
      .eq('cohort', cohort)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to load reports: ${error.message}`);
    return (data || []).map((r: unknown) => mapRow(r as DatabaseReportRow));
  }

  static async findById(id: string): Promise<ReportRow | null> {
    const { data, error } = await supabaseAdmin
      .from('event_reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to find report: ${error.message}`);
    }
    return mapRow(data as DatabaseReportRow);
  }

  static async create(input: {
    title: string;
    cohort: Cohort;
    eventId?: string | null;
    status?: ReportStatus;
    documentJson?: Record<string, unknown>;
    documentHtml?: string | null;
    documentCss?: string | null;
    createdBy: string;
    creatorName?: string | null;
    creatorEmail?: string | null;
  }): Promise<ReportRow> {
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from('event_reports')
      .insert({
        title: input.title,
        cohort: input.cohort,
        event_id: input.eventId ?? null,
        status: input.status ?? 'draft',
        document_json: input.documentJson ?? {},
        document_html: input.documentHtml ?? null,
        document_css: input.documentCss ?? null,
        created_by: input.createdBy,
        creator_name: input.creatorName ?? null,
        creator_email: input.creatorEmail ?? null,
        updated_by: input.createdBy,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create report: ${error.message}`);
    return mapRow(data as DatabaseReportRow);
  }

  static async update(
    id: string,
    input: {
      title?: string;
      status?: ReportStatus;
      documentJson?: Record<string, unknown>;
      documentHtml?: string | null;
      documentCss?: string | null;
      updatedBy?: string | null;
    }
  ): Promise<ReportRow> {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.title !== undefined) payload.title = input.title;
    if (input.status !== undefined) payload.status = input.status;
    if (input.documentJson !== undefined) payload.document_json = input.documentJson;
    if (input.documentHtml !== undefined) payload.document_html = input.documentHtml;
    if (input.documentCss !== undefined) payload.document_css = input.documentCss;
    if (input.updatedBy !== undefined) payload.updated_by = input.updatedBy;

    const { data, error } = await supabaseAdmin
      .from('event_reports')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update report: ${error.message}`);
    return mapRow(data as DatabaseReportRow);
  }

  static async remove(id: string): Promise<void> {
    const { error } = await supabaseAdmin.from('event_reports').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete report: ${error.message}`);
  }
}
