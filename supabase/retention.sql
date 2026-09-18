-- Weekly task retention.
--
-- Tasks live inside the shared user_states.state blob (state.tasks[]), so the
-- weekly cron (src/app/api/cron/weekly-purge) trims that array per user. Before
-- deleting, each removed task is copied here, and every run writes one audit
-- row — pure deletion is unforgiving if someone asks for their history back.

create table if not exists public.tasks_archive (
  id          uuid primary key default gen_random_uuid(),
  owner_id    text not null,                 -- Clerk userId the task belonged to
  task        jsonb not null,                -- the task object, as stored in state.tasks
  archived_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.tasks_archive enable row level security;
create index if not exists idx_tasks_archive_owner on public.tasks_archive(owner_id);

-- One row per purge run, so a bad run can be debugged after the fact.
create table if not exists public.purge_runs (
  id             uuid primary key default gen_random_uuid(),
  ran_at         timestamp with time zone default timezone('utc'::text, now()) not null,
  users_touched  integer not null default 0,
  tasks_archived integer not null default 0,
  tasks_deleted  integer not null default 0,
  note           text
);
alter table public.purge_runs enable row level security;
