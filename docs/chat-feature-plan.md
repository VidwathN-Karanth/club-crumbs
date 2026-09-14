# Club Chat — Implementation Plan (Club Crumbs)

> Stack-accurate rewrite of the generic "Chat Feature Implementation Plan".
> The original was written for a generic React SPA (Express, Socket.io, Redux,
> Sonner, IndexedDB, react-window, `localStorage`-first sync). **None of that
> applies here.** This document rewrites the feature against how Club Crumbs is
> actually built, so it can be implemented without fighting the existing
> architecture.

---

## 0. Reality check — what the original plan got wrong

| Original plan assumed | Club Crumbs actually is | Consequence |
|---|---|---|
| Express + `Socket.io` real-time server | **Serverless** Next.js 16 App Router on Vercel; no long-lived process | No WebSocket server. Real-time = short polling (v1) or Supabase Realtime (v2). |
| Redux / Context for global state | **Zustand** (`src/store/useStore.ts`) + `SyncProvider` | Reuse Zustand. But chat is *shared* data, so it does **not** live in the per-user synced state blob. |
| `localStorage`/IndexedDB is the source of truth, reconciled with backend | **Zero client-side DB access**; all data flows through Next.js route handlers using the Supabase **service-role** key; RLS is locked | No client Supabase reads/writes. Chat reads/writes go through `/api/...` guarded by Clerk. `localStorage` is only a UI-convenience cache (last-read marker), never authoritative. |
| 3 clubs, every user tabs between all three | Clubs = **`Coders Club`, `Crypton Club`, `DevStudio`** (`src/lib/cohorts.ts`); a student belongs to **exactly one** | A **member** sees only *their* club's chat — no tabs. A **leader** sees the club(s) they lead (tabs only if they lead >1). An **admin** sees one club at a time in the console (via `?cohort=`). |
| Roles: `admin`/`leader`/`member` passed from the client | Roles come from `public.access_grants`, resolved **server-side** in `getRequester()`; one account can hold several; the active one is the validated `cc_ctx` cookie | The client is **never** trusted for role or club. Every chat route uses an existing guard (`requireStudent`, `requireClubManager`, `requireAdminCohort`). This is exactly the `coding_events` pattern. |
| `Sonner` / `react-hot-toast` for toasts, raw `new Notification()` for push | In-app toasts already exist (`NotificationCenter.tsx` + `src/lib/notifications.ts`), and browser/phone notifications go through a **service worker** (`/sw.js`) | Reuse both. Add a `chat` toast kind; do not add a toast library. |
| `react-window` virtual scrolling, custom bottom-sheet + swipe/drag hooks | Portals are already responsive: mobile topbar + framer-motion drawer in `dashboard/layout.tsx` (and `leader`, `admin`) | Most of "Phase 6/7 mobile" is already done. The chat panel just has to fit the existing responsive shell and cyber/glassmorphism theme. |
| Plain white Tailwind UI (`bg-white`, `text-blue-600`) | Cyber theme: `bg-cyber-dark`, `text-cyber-blue`, `font-mono`, glassmorphism, `store.themeMode` light/dark | Chat UI must match the house style, not the mockups in the original doc. |

**Naming note:** the codebase uses `cohort`/`Cohort` internally to mean *club*
(historical). New chat code should follow that convention (`cohort` columns,
`isCohort()` validation) to stay consistent.

---

## 1. Scope (v1)

A per-club message feed, embedded in all three portals:

- **Members** (dashboard) — read-only feed for their own club.
- **Leaders** — read + post for the club(s) they lead.
- **Admins** — read + post + moderate (edit/delete any message) for the club currently selected in the console.
- **Content:** plain text with auto-linkified URLs (blue, `target="_blank" rel="noopener noreferrer"`), and **one optional image per message**.
- **Unread badge** per club, driven by a per-user `last_read_at`.
- **Notifications:** reuse the existing in-app toast + service-worker path; add a `chat` kind.
- **Real-time:** short polling (see §6). Realtime upgrade is a later, optional phase.

Explicitly **out of v1:** reactions, threads/replies, mentions, typing
indicators, link *preview* cards (just linkify), voice/video, message search,
editing history. These are noted in §11 as future work.

---

## 2. Data model (Supabase / Postgres)

Follows the conventions already in `supabase/schema.sql`: `uuid` PKs with
`gen_random_uuid()`, `text` user ids (Clerk), tz-aware `created_at`, **RLS
enabled and locked** (all access via the service-role backend), explicit
indexes.

```sql
-- ── Club chat messages ───────────────────────────────────────────────
create table if not exists public.club_messages (
  id          uuid primary key default gen_random_uuid(),
  cohort      text not null,                 -- one of the three clubs
  sender_id   text not null,                 -- Clerk user id (author)
  sender_name text not null,                 -- snapshotted display name
  sender_role text not null,                 -- 'admin' | 'leader' (posters only)
  body        text not null default '',      -- message text (may be '' if image-only)
  image_url   text,                          -- Supabase Storage public URL, nullable
  edited_at   timestamptz,                   -- set when a poster edits
  deleted_at  timestamptz,                   -- soft delete; row kept for audit
  created_at  timestamptz not null default timezone('utc', now())
);

alter table public.club_messages enable row level security;
-- No public policies: browser never queries Postgres directly (matches the
-- rest of this app). All reads/writes go through the service-role backend.

create index if not exists idx_club_messages_cohort_created
  on public.club_messages (cohort, created_at desc);

-- ── Per-user read marker (one row per user per club) ──────────────────
create table if not exists public.club_message_reads (
  user_id      text not null,
  cohort       text not null,
  last_read_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, cohort)
);

alter table public.club_message_reads enable row level security;
```

**Why a table for read status, not `localStorage`?** The original plan stored
read status in the browser. That breaks across devices and can't drive a badge
the user sees on their phone. A tiny `(user_id, cohort) → last_read_at` row is
cheap, cross-device, and the unread count is a single `count(*) where
created_at > last_read_at` — no per-message read receipts needed for v1.
`localStorage` is still fine as an *optimistic* cache of the last-read marker so
the badge doesn't flash on load.

**Attachments:** the original's separate `message_attachments` table is
overkill for "one image per message". A nullable `image_url` column is enough.
Promote to a child table only if multi-image is added later.

**Migration file:** add these to a new `supabase/` migration (e.g.
`supabase/chat.sql`), consistent with `schema.sql` being run in the Supabase SQL
editor. Do **not** add RLS SELECT policies — keep the "backend-only" posture.

---

## 3. Image storage

The app already uses two patterns: Google Drive links (certificates, resources)
and a Supabase Storage `certificates` bucket. For chat, use **Supabase Storage**
with a dedicated bucket, uploaded server-side (the client never gets the
service key):

- Bucket: `chat-images` (public read, or signed URLs if privacy is needed).
- Upload route validates: `image/*` only, **≤ 4MB** (Vercel serverless body
  limit is ~4.5MB — the original's "5MB" would fail), and prefixes the object
  key with the cohort + author id, mirroring how `certificates` deletion is
  scoped to the caller's id.
- Store the returned public URL in `club_messages.image_url`.

---

## 4. API routes (Next.js route handlers)

All under `src/app/api/`, all `export const dynamic = 'force-dynamic'`, all
guarded by the existing `authz` helpers. **The cohort is derived from the guard,
never taken from a member's request.**

| Route | Method | Guard | Notes |
|---|---|---|---|
| `/api/chat/messages` | `GET` | `requireStudent` (member) | Returns the member's own club feed. Cohort = `guard.requester.cohort`. Query: `?after=<iso>` for polling, `?limit=50`. |
| `/api/chat/messages` | `POST` | `requireClubManager(cohort)` | Post a message. `cohort` from body, validated with `isCohort`, then `requireClubManager` proves the caller is admin or a leader **of that club**. Members get 403 (mirrors `coding_events` POST). |
| `/api/chat/messages/[id]` | `PATCH` | `requireClubManager(cohort)` + author-or-admin | Edit `body`; set `edited_at`. |
| `/api/chat/messages/[id]` | `DELETE` | `requireClubManager(cohort)` + author-or-admin | Soft delete (`deleted_at`). |
| `/api/chat/unread` | `GET` | `requireStudent` | `{ count }` for the member's club. |
| `/api/chat/read` | `POST` | `requireStudent` | Upsert `last_read_at = now()` for `(user, cohort)`. |
| `/api/chat/upload` | `POST` | `requireClubManager(cohort)` | Multipart image upload → Supabase Storage → returns `{ url }`. |

**Leader/admin console variants:** a leader leading two clubs, or an admin
viewing one club, needs to read/post to a *chosen* club, not their member club.
Two clean options:

1. Add cohort-scoped sibling routes under `/api/leader/chat/...` and
   `/api/admin/chat/...` that take `?cohort=` and use
   `requireClubManager(cohort)` / `requireAdminCohort(url)` — matches how
   `coding/events` (manager) and `coding/member/events` (member) are already
   split.
2. Or one `/api/chat/...` set where the guard picks: member context →
   `requireStudent` (cohort from session); staff → `requireClubManager(bodyCohort)`.

**Recommend option 1** — it mirrors the existing `leader/` vs `coding/member/`
split, keeps each route's guard unambiguous, and avoids branching on context
inside a handler.

**Validation & security (reuse existing habits):**
- Trim/limit `body` (e.g. ≤ 4000 chars); reject empty message with no image.
- React escapes text on render — do **not** dangerouslySetInnerHTML, so no
  DOMPurify needed. Linkify by splitting on a URL regex and rendering `<a>` for
  matches only (the original's `LinkDetector` is fine; drop the metadata fetch).
- Rate limiting: serverless has no shared memory, so enforce in the DB — e.g.
  reject if the caller posted > N messages in the last minute (`count(*) where
  sender_id = ? and created_at > now() - interval '1 minute'`). Keep it simple.

---

## 5. Client architecture

### 5.1 State — Zustand slice, not the synced blob

`user_states.state` is the **per-user personal** state (tasks, timetable,
settings) synced by `SyncProvider`. Club chat is **shared** data and must not be
written there. Add a **separate, non-persisted** Zustand slice (or a small
dedicated store) for chat UI state: open/closed, active cohort (for leaders with
>1 club), cached messages, unread counts. It is hydrated from the API, not from
`user_states`.

The client already learns its role/club from `/api/me` (`isAdmin`, `cohort`,
`ledCohorts`, `activeContext`). The chat panel reads that to decide:
- member context → single club, input hidden (view-only).
- leader context → `ledCohorts`, input shown; tabs only if `ledCohorts.length > 1`.
- admin context → follows the console's currently-selected cohort.

### 5.2 Components (`src/components/chat/`)

Match existing component style (`'use client'`, framer-motion, lucide-react,
`font-mono`, cyber palette). Far fewer files than the original's 40+:

```
src/components/chat/
├── ChatPanel.tsx      # one responsive component (see 5.3), mounts feed + input
├── ChatMessageList.tsx# scrollable list; plain overflow-y-auto (no react-window in v1)
├── ChatMessage.tsx    # avatar/initial, name + role badge, linkified body, image, edited/deleted state, edit/delete for managers
├── ChatComposer.tsx   # textarea + image picker + send; rendered only for managers
├── ChatLauncher.tsx   # floating button + unread badge that opens the panel
└── useClubChat.ts     # hook: fetch, poll, post, mark-read (wraps src/lib/apiClient.ts)
```

`ChatLauncher` + unread badge is the analogue of the original `UnreadBadge`, and
should sit in each portal layout next to `<NotificationCenter />`.

### 5.3 Responsive — reuse the existing shell, don't rebuild it

The original proposes three separate panel components + custom swipe/drag hooks
+ a hamburger for the "non-collapsible leader sidebar". **The leader/member
layouts already have a mobile topbar and a framer-motion drawer**, and Tailwind
breakpoints already gate them. So:

- **One** `ChatPanel` with Tailwind responsive classes: right-side slide-over on
  `md+` (framer-motion `x` transition, like the existing sidebars), full-height
  sheet on mobile. No bespoke drag-to-close physics needed for v1 — a backdrop
  tap + close button is consistent with the existing mobile drawer.
- Touch targets already follow the app's sizing; keep ≥ 44px on the launcher and
  send button.
- Honor `store.themeMode` (light/dark) exactly like the rest of the UI.

Drop from the original: `useSwipeGesture`, `useTouchDrag`, `DragHandle`,
`ChatPanelDesktop/Tablet/Mobile` trio, `MobileHamburgerMenu` (already exists),
`react-window`, `ResponsiveContext`/`breakpoints.ts` (Tailwind handles it).

### 5.4 Mount points

Render `<ChatLauncher />` (which lazy-mounts `<ChatPanel />`) in:
- `src/app/dashboard/layout.tsx` — member, view-only.
- `src/app/leader/layout.tsx` — leader, can post.
- `src/app/admin/layout.tsx` — admin, can post + moderate, follows selected cohort.

Place it beside the existing `<NotificationCenter />` / `<NotificationAgent />`.

---

## 6. Real-time strategy

No WebSocket server exists (serverless). Two viable paths:

- **v1 — short polling (recommended start).** `useClubChat` polls
  `GET /api/chat/messages?after=<lastSeenIso>` every ~10s while the panel is
  open (and once on open), and `GET /api/chat/unread` every ~30s while closed.
  Pause polling when `document.hidden` (the app already uses visibility-aware
  timers in `NotificationCenter`). Simple, matches the backend-only posture,
  costs a handful of tiny requests.
- **v2 — Supabase Realtime (optional upgrade).** Postgres change subscription on
  `club_messages`. This is the one place a *client-side* Supabase connection
  would be introduced, so it requires: a Clerk→Supabase JWT template, a **read-
  only** RLS SELECT policy scoped to the user's cohort, and careful thought
  because it partially reverses the "zero client DB" rule. Treat as a deliberate,
  separate decision — not part of v1.

---

## 7. Notifications

Reuse `src/lib/notifications.ts` + `NotificationCenter.tsx` + `/sw.js`:

- Add `'chat'` to `ToastKind` and an icon mapping (e.g. `MessageSquare`).
- When polling surfaces a new message from someone else while the panel is
  closed, raise an in-app toast (`onToast`) and, if permission is granted, a
  service-worker notification — the same dual path reminders already use.
- **Do not** add Sonner/react-hot-toast; do not call `new Notification()`
  directly (phones throw — the app already routes through the SW for this
  reason).

---

## 8. Theming & accessibility

- Cyber/glassmorphism to match: `bg-cyber-dark`, `border-white/10`,
  `backdrop-blur-md`, `text-cyber-blue`, `font-mono`; light/dark via
  `store.themeMode`.
- Links: `text-cyber-blue hover:underline`, open in new tab with
  `rel="noopener noreferrer"`.
- Keep the WCAG basics the app already respects: focus states, `aria-label` on
  icon buttons, ≥ 44px touch targets, no horizontal scroll on mobile.

---

## 9. Implementation phases (revised, realistic)

The original's 10-week, 8-phase plan double-counts work already done (mobile
shell) and work that doesn't apply (WebSocket server, IndexedDB). Revised:

- **Phase 1 — Data + read APIs.** Migration (`club_messages`,
  `club_message_reads`), `GET /api/chat/messages`, `GET /api/chat/unread`,
  `POST /api/chat/read`. Verify with the running dev server.
- **Phase 2 — Panel (read-only).** `ChatLauncher` + unread badge + `ChatPanel` +
  `ChatMessageList` + `ChatMessage`, mounted in the **member** dashboard.
  Linkify + polling. This is a shippable member-facing increment.
- **Phase 3 — Posting.** `POST`/`PATCH`/`DELETE` routes with
  `requireClubManager` + author/admin checks; `ChatComposer`; mount in leader &
  admin layouts; leader multi-club tabs; admin follows selected cohort.
- **Phase 4 — Images.** `chat-images` bucket + `/api/chat/upload` + composer
  picker + image rendering (lazy-loaded).
- **Phase 5 — Notifications.** `chat` toast kind + SW notification on new
  messages while closed.
- **Phase 6 — Polish.** Rate limiting, empty/edited/deleted states, dark-mode
  pass, moderation UX, `graphify update .`.
- **Phase 7 (optional) — Realtime.** Only if polling proves insufficient; see §6.

---

## 10. Testing

- **Guards (most important):** a member `POST` → 403; a leader posting to a club
  they don't lead → 403; cohort from body ignored for member reads. These mirror
  the `coding_events` guard tests and are the security core.
- **Rendering:** URLs render as blue external links; text is escaped (paste
  `<script>` → shown literally); image renders and lazy-loads.
- **Unread:** posting increments another user's badge; opening the panel + mark-
  read zeroes it; badge survives reload (server-backed).
- **Responsive/theme:** panel usable on the mobile shell; light and dark.

---

## 11. Future work

Reactions, replies/threads, mentions, typing indicators, link preview cards,
message search, pinning, multi-image, Supabase Realtime, PWA offline queue.
All optional and none required for a useful v1.

---

## 12. Concrete file checklist

```
supabase/chat.sql                         # new tables (run in SQL editor)
src/lib/models/ChatMessage.ts             # optional typed helper, matching src/lib/models/*
src/app/api/chat/messages/route.ts        # GET (member) + POST (manager)
src/app/api/chat/messages/[id]/route.ts   # PATCH + DELETE
src/app/api/chat/unread/route.ts          # GET
src/app/api/chat/read/route.ts            # POST
src/app/api/chat/upload/route.ts          # POST image
# (or /api/leader/chat/* and /api/admin/chat/* cohort-scoped variants — see §4)
src/components/chat/ChatLauncher.tsx
src/components/chat/ChatPanel.tsx
src/components/chat/ChatMessageList.tsx
src/components/chat/ChatMessage.tsx
src/components/chat/ChatComposer.tsx
src/components/chat/useClubChat.ts
src/lib/notifications.ts                  # add 'chat' ToastKind
src/components/NotificationCenter.tsx     # add 'chat' icon
src/app/dashboard/layout.tsx              # mount launcher (member)
src/app/leader/layout.tsx                 # mount launcher (leader)
src/app/admin/layout.tsx                  # mount launcher (admin)
```
