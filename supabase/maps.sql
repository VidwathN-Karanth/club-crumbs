-- Leader roadmap maps ("Mind Maps").
--
-- A leader's private mastery roadmaps: a graph of topic cards (each with an
-- optional course link) connected by curved edges. Owned by the Clerk account,
-- not a club roster — every read/write in src/lib/mapsData.ts is scoped by
-- owner_id, so a leader only ever touches their own maps. Members have no route
-- to this feature at all.
--
-- Unlike launchers/courses/tasks (arrays inside the shared user_states blob), a
-- map grows unbounded and is written on every drag, so it lives in its own
-- table. Enforced by the API layer (service-role client); RLS is on as a
-- backstop with no client policies.
create table if not exists public.leader_maps (
  id         uuid primary key default gen_random_uuid(),
  owner_id   text not null,                                        -- Clerk userId
  cohort     text not null,                                        -- a club the owner leads
  title      text not null,
  data       jsonb not null default '{"nodes":[],"edges":[]}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.leader_maps enable row level security;

create index if not exists idx_leader_maps_owner on public.leader_maps(owner_id);
