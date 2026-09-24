-- ==========================================
-- CLUB CHAT SCHEMA
-- Run this in your Supabase SQL Editor (after schema.sql).
--
-- Follows the same posture as schema.sql: RLS is enabled and LEFT LOCKED — the
-- browser never talks to Postgres directly. Every read and write goes through
-- the Next.js route handlers, which use the service-role key and verify the
-- caller with Clerk + the access-grants guards (src/lib/authz.ts).
-- ==========================================

-- 1. Club chat messages
-- One row per message. `cohort` is the club (see src/lib/cohorts.ts — the three
-- clubs). Only admins and club leaders ever post, so `sender_role` is 'admin' or
-- 'leader'. A moderated message is SOFT-deleted (deleted_at set) so the row
-- survives for audit; the read routes blank its content.
create table if not exists public.club_messages (
  id          uuid primary key default gen_random_uuid(),
  cohort      text not null,                 -- one of the three clubs
  sender_id   text not null,                 -- Clerk user id of the author
  sender_name text not null,                 -- display name, snapshotted at send time
  sender_role text not null,                 -- 'admin' | 'leader'
  body        text not null default '',      -- message text (may be '' for an image-only post)
  image_url   text,                          -- Supabase Storage URL, nullable
  edited_at   timestamptz,                   -- set when a poster edits the body
  deleted_at  timestamptz,                   -- soft delete; row retained
  created_at  timestamptz not null default timezone('utc'::text, now())
);

alter table public.club_messages enable row level security;
-- No public policies on purpose: all access is backend-only via service role.

-- The feed and the unread count both read "this club, newest first".
create index if not exists idx_club_messages_cohort_created
  on public.club_messages (cohort, created_at desc);

-- 2. Per-user read marker
-- One row per (user, club). The unread count is
--   count(*) from club_messages where created_at > last_read_at.
-- A tiny row instead of per-message read receipts, and cross-device (a
-- browser-local marker would not follow the student to their phone).
create table if not exists public.club_message_reads (
  user_id      text not null,                -- Clerk user id
  cohort       text not null,                -- the club this marker is for
  last_read_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_id, cohort)
);

alter table public.club_message_reads enable row level security;
-- No public policies: backend-only, same as above.

-- 3. Storage bucket for chat images
-- Public-read so a message's <img> can load its URL directly; uploads happen
-- only through the /api/chat/upload route with the service-role key (a club
-- manager, size- and type-checked), so no public write policy is needed.
insert into storage.buckets (id, name, public)
values ('chat-images', 'chat-images', true)
on conflict (id) do nothing;

-- 4. Pinned announcements
-- A club manager can pin a message; the feed returns pinned messages alongside
-- the tail so they stay visible however old they are. Pinned messages are also
-- exempt from the 90-day image/tombstone cleanup (/api/cron/weekly-purge).
alter table public.club_messages add column if not exists pinned_at timestamptz;

create index if not exists idx_club_messages_pinned
  on public.club_messages (cohort, pinned_at desc) where pinned_at is not null;
