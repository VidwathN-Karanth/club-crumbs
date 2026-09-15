-- ==========================================
-- EVENT REPORTS SCHEMA (report generator / doc editor)
-- Run this in your Supabase SQL Editor (after schema.sql).
--
-- Backs src/lib/models/Report.ts and the /admin/reports & /leader/reports
-- pages. Same posture as the rest of the app: RLS enabled and LEFT LOCKED —
-- every read and write goes through the Next.js route handlers using the
-- service-role key, verified with Clerk + the access-grants guards.
-- ==========================================

-- 1. The report documents (grapesjs). Column names match Report.ts exactly.
create table if not exists public.event_reports (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  cohort        text not null,                 -- one of the three clubs
  event_id      text,                          -- optional link to an event
  status        text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  document_json jsonb not null default '{}'::jsonb,  -- grapesjs project data
  document_html text,                          -- rendered HTML snapshot
  document_css  text,                          -- rendered CSS snapshot
  created_by    text not null,                 -- Clerk user id
  creator_name  text,
  creator_email text,
  updated_by    text,
  created_at    timestamptz not null default timezone('utc'::text, now()),
  updated_at    timestamptz not null default timezone('utc'::text, now())
);

alter table public.event_reports enable row level security;
-- No public policies: backend-only via service role.

create index if not exists idx_event_reports_cohort_created
  on public.event_reports (cohort, created_at desc);

-- 2. Storage bucket for images dropped into a report.
-- Public-read so a report's <img> can load its URL directly; uploads happen
-- only through /api/reports/upload with the service-role key (a club manager,
-- size- and type-checked), so no public write policy is needed.
insert into storage.buckets (id, name, public)
values ('report-images', 'report-images', true)
on conflict (id) do nothing;
