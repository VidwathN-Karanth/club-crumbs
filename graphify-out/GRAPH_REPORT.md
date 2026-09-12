# Graph Report - club-crumbs  (2026-09-12)

## Corpus Check
- 138 files · ~131,380 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 908 nodes · 2144 edges · 56 communities (47 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dfe2bac8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- syncLogic.ts
- cohorts.ts
- recurrence.ts
- extensionAuth.ts
- apiFetch
- pomodoro.ts
- popup.js
- notifications.ts
- compilerOptions
- AdminLog.ts
- manifest.json
- global/route.ts
- proxy.ts
- Zen Focus Mode Fullscreen Timer
- DateField.tsx
- dependencies
- devDependencies
- requireStudent
- useStore.ts
- roster.ts
- Bearer Token Pairing (extension auth)
- app/layout.tsx
- syncLogic.ts (activity aggregator & points calculator)
- schema.sql
- Server-Side Database Proxy (/api/user/state)
- leetcodeService.ts
- Layora: Autonomous AI Student Productivity Suite
- package.json
- Resource Vault
- Generative Timetable Compiler
- download/route.ts
- build-zip.py
- extension.ts
- icon.tsx
- Main Workspace Dashboard
- POST
- @clerk/nextjs
- eslint.config.mjs
- next.config.ts
- @supabase/supabase-js
- zustand
- tailwindcss
- postcss.config.mjs
- calendar/courses/route.ts
- supabaseAdmin.ts
- courses/page.tsx
- vercel.json
- authz.ts
- draw_mark
- useStore
- SyncProvider.tsx
- coders-club/page.tsx

## God Nodes (most connected - your core abstractions)
1. `apiFetch()` - 51 edges
2. `useStore` - 42 edges
3. `errorMessage()` - 31 edges
4. `readJson()` - 28 edges
5. `formatDate()` - 28 edges
6. `getRequester()` - 26 edges
7. `requireStudent()` - 21 edges
8. `requireAdminCohort()` - 20 edges
9. `useSectionData()` - 19 edges
10. `useAdmin()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Bearer Token Pairing (extension auth)` --semantically_similar_to--> `Server-Side Database Proxy (/api/user/state)`  [INFERRED] [semantically similar]
  extension/README.md → README.md
- `Known limit: a launcher added in the extension can be overwritten` --semantically_similar_to--> `State Synchronization Pipeline (cloud-wins)`  [INFERRED] [semantically similar]
  extension/README.md → structure.md
- `Next.js Agent Rules (breaking-change warning)` --conceptually_related_to--> `Layora Architecture & System Structure`  [AMBIGUOUS]
  AGENTS.md → structure.md
- `Google Drive webViewLink Fallback Construction` --semantically_similar_to--> `Known limit: a course without a link opens Layora instead`  [INFERRED] [semantically similar]
  README.md → extension/README.md
- `Known limit: a launcher added in the extension can be overwritten` --shares_data_with--> `user_states table (serialized Zustand state jsonb)`  [INFERRED]
  extension/README.md → structure.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Developer-activity ingestion and points ledger** — structure_cron_daily_sync, structure_sync_logic, structure_leetcode_graphql, structure_codechef_scraper, structure_github_events_api, structure_table_daily_activities, structure_gamification_points_ledger [EXTRACTED 1.00]
- **Extension pairing and authenticated-request flow** — extension_popup_connect_gate, extension_readme_connect_js, extension_readme_background_js, extension_readme_lib_js, extension_readme_bearer_token_pairing, extension_readme_token_hashing [EXTRACTED 1.00]
- **Zustand-to-Supabase state write path with race protection** — readme_sync_provider, readme_client_write_timestamp_queue, structure_api_user_state, structure_table_user_states, structure_supabase_admin_service_role, extension_readme_launcher_overwrite_limit [INFERRED 0.85]

## Communities (56 total, 9 thin omitted)

### Community 0 - "syncLogic.ts"
Cohesion: 0.09
Nodes (24): dynamic, GET(), maxDuration, dynamic, Range, VALID_RANGES, dynamic, GET() (+16 more)

### Community 1 - "cohorts.ts"
Cohesion: 0.06
Nodes (25): AdminProvider(), AdminLayout(), MENU, normalise(), YEARLESS, YearSelector(), GlobalResource, GlobalResourcesPage() (+17 more)

### Community 2 - "recurrence.ts"
Cohesion: 0.10
Nodes (32): StaffEvent, StaffEvent, DELETE(), dynamic, GET(), POST(), dynamic, POST() (+24 more)

### Community 3 - "extensionAuth.ts"
Cohesion: 0.08
Nodes (45): dynamic, GET(), OPTIONS(), dynamic, GET(), OPTIONS(), DELETE(), dynamic (+37 more)

### Community 4 - "apiFetch"
Cohesion: 0.06
Nodes (94): AdminContext, useAdmin(), AdminCertificatesPage(), Uploader, CertificatePreview(), PanelEmpty(), PanelError(), PanelLoading() (+86 more)

### Community 5 - "pomodoro.ts"
Cohesion: 0.26
Nodes (14): PHASE_ACCENT, ZenMode(), ZenModeProps, dayKey(), formatFocusDuration(), LOG_RETENTION_DAYS, nextPhase(), PHASE_LABEL (+6 more)

### Community 6 - "popup.js"
Cohesion: 0.14
Nodes (35): handleMessage(), refresh(), respond(), api(), ApiError, clearToken(), CONNECT_URL, COURSES_URL (+27 more)

### Community 7 - "notifications.ts"
Cohesion: 0.09
Nodes (44): AdminSettingsPage(), Connection, shortLabel(), SettingsPage(), InfoPopover(), Props, NotificationAgent(), ICONS (+36 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 9 - "AdminLog.ts"
Cohesion: 0.12
Nodes (22): dynamic, GET(), dynamic, GET(), POST(), maxDuration, POST(), DELETE() (+14 more)

### Community 10 - "manifest.json"
Cohesion: 0.09
Nodes (22): action, default_popup, default_title, background, service_worker, type, content_scripts, description (+14 more)

### Community 11 - "global/route.ts"
Cohesion: 0.40
Nodes (10): DELETE(), dynamic, GET(), POST(), readResourceList(), StoredResource, visibleTo(), writeResourceList() (+2 more)

### Community 12 - "proxy.ts"
Cohesion: 0.38
Nodes (5): redirectForRole(), config, emailFromClaims(), isProtectedRoute, resolveEmail()

### Community 13 - "Zen Focus Mode Fullscreen Timer"
Cohesion: 0.40
Nodes (6): Distraction-Free Chrome Removal, Space to Pause / Esc to Leave Hints, Pomodoro Session Cycle Indicator, Daily and 7-Day Focus Session Stats, Pause / Reset / Skip Timer Controls, Zen Focus Mode Fullscreen Timer

### Community 14 - "DateField.tsx"
Cohesion: 0.60
Nodes (4): DateField(), Props, toDisplay(), parseTypedDate()

### Community 16 - "dependencies"
Cohesion: 0.12
Nodes (17): axios, @clerk/themes, framer-motion, lucide-react, next, dependencies, axios, @clerk/themes (+9 more)

### Community 17 - "devDependencies"
Cohesion: 0.12
Nodes (17): clerk, eslint, eslint-config-next, devDependencies, clerk, eslint, eslint-config-next, @tailwindcss/postcss (+9 more)

### Community 19 - "requireStudent"
Cohesion: 0.26
Nodes (9): DELETE(), dynamic, GET(), POST(), requireStudent(), DatabaseUserRow, mapUserRow(), User (+1 more)

### Community 20 - "useStore.ts"
Cohesion: 0.13
Nodes (25): PlannerPage(), DEFAULT_POMODORO_SETTINGS, normalizeSettings(), PomodoroDay, Activity, Course, courseBlockFor(), DEFAULT_ROUTINE (+17 more)

### Community 21 - "roster.ts"
Cohesion: 0.13
Nodes (23): dynamic, emptyCounts(), GET(), dynamic, GET(), dynamic, GET(), Range (+15 more)

### Community 22 - "Bearer Token Pairing (extension auth)"
Cohesion: 0.21
Nodes (12): Connect gate state, Quicklaunch panel + add-link form, Quick Access popup UI (360x480, two tabs), background.js (service worker / event page), Bearer Token Pairing (extension auth), build-zip.py (dual-manifest packager), connect.js content script (token relay), Cross-browser parity (Chromium vs Gecko, three divergences) (+4 more)

### Community 23 - "app/layout.tsx"
Cohesion: 0.20
Nodes (8): geistMono, geistSans, hankenGrotesk, inter, jetbrainsMono, metadata, viewport, CookieConsent()

### Community 24 - "syncLogic.ts (activity aggregator & points calculator)"
Cohesion: 0.20
Nodes (11): /api/user/purge (data purge), CodeChef solve-count scraper, /api/cron/daily-sync (scheduled activity sync), Gamification & Points Ledger Pipeline, GitHub Events API source, LeetCode GraphQL stats source, syncLogic.ts (activity aggregator & points calculator), certificates table & Supabase Storage bucket (+3 more)

### Community 25 - "schema.sql"
Cohesion: 0.27
Nodes (9): public, public.admin_logs, public.certificates, public.daily_activities, public.events, public.extension_tokens, public.leaderboard_activity_totals(), public.user_states (+1 more)

### Community 26 - "Server-Side Database Proxy (/api/user/state)"
Cohesion: 0.27
Nodes (10): Clerk Authentication, Local Demo Mode (missing Supabase keys fallback), Supabase Row-Level Security Isolation, Server-Side Database Proxy (/api/user/state), /api/calendar/sync (Google Calendar push), /api/user/state (secure Supabase state proxy), Clerk Middleware (route protection & token check), isAdminEmail admin allowlist (+2 more)

### Community 27 - "leetcodeService.ts"
Cohesion: 0.13
Nodes (22): POST(), fetchProfileHtml(), fetchTotalSolves(), validateUsername(), AxiosErrorLike, ContributionDay, fetchActivityForDate(), GitHubUserResponse (+14 more)

### Community 28 - "Layora: Autonomous AI Student Productivity Suite"
Cohesion: 0.28
Nodes (9): Next.js Agent Rules (breaking-change warning), CLAUDE.md AGENTS.md include, Known limit: a launcher added in the extension can be overwritten, Admin Root Console, Client Write-Timestamp Queue (anti-race-condition), Layora: Autonomous AI Student Productivity Suite, SyncProvider (Zustand synchronizer & realtime listener), Layora Architecture & System Structure (+1 more)

### Community 29 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 31 - "Resource Vault"
Cohesion: 0.29
Nodes (8): Courses panel, Known limit: a course without a link opens Layora instead, Google Drive webViewLink Fallback Construction, No Study Materials on Supabase Storage (privacy stance), Online Course Tracker, Resource Vault, Vercel 4.5MB Upload Size Guard, /api/resources/upload-drive (Google Drive proxy upload)

### Community 32 - "Generative Timetable Compiler"
Cohesion: 0.29
Nodes (8): Google site-verification token file, Generative Timetable Compiler, Google Calendar Sync, Groq API (LLM inference), Study Copilot (LLM assistant), /api/ai/planner (weekly timetable generator), /api/ai/proactive (AI academic mentor), Duality Rule (task + timetable block bound together)

### Community 33 - "download/route.ts"
Cohesion: 0.16
Nodes (12): downloadUrl(), dynamic, EXTENSION_BY_TYPE, extensionFor(), GET(), entries(), driveFileId(), CRC_TABLE (+4 more)

### Community 34 - "build-zip.py"
Cohesion: 0.47
Nodes (5): build(), firefox_manifest(), main(), Package the extension for distribution. Writes two zips from the one source…, The Chromium manifest, with the three Gecko differences applied.

### Community 35 - "extension.ts"
Cohesion: 0.18
Nodes (16): Build, BUILDS, ExtensionInstall(), dismissedRecently(), ExtensionNudge(), ExtensionPrompt(), snoozed(), BrowserFamily (+8 more)

### Community 36 - "icon.tsx"
Cohesion: 0.40
Nodes (3): contentType, runtime, size

### Community 37 - "Main Workspace Dashboard"
Cohesion: 0.67
Nodes (3): Milestone Tracker & Global Stopwatch, Onboarding Portal (7-step routine wizard), Main Workspace Dashboard

### Community 48 - "calendar/courses/route.ts"
Cohesion: 0.39
Nodes (7): at(), CoursePayload, dynamic, POST(), toDateKey(), untilStamp(), wallClock()

### Community 50 - "supabaseAdmin.ts"
Cohesion: 0.25
Nodes (7): DELETE(), dynamic, GET(), isMissingTable(), POST(), isCertificateCategory(), supabaseAdmin

### Community 51 - "courses/page.tsx"
Cohesion: 0.33
Nodes (9): CoursesPage(), rearmReminder(), DashboardHome(), OnboardingPage(), OnboardingModal(), formatCourseLink(), getPlatformDisplay(), clearNotificationMark() (+1 more)

### Community 54 - "authz.ts"
Cohesion: 0.18
Nodes (14): AdminContextValue, dynamic, GET(), dynamic, GET(), POST(), POST(), ADMIN_EMAILS (+6 more)

### Community 55 - "draw_mark"
Cohesion: 0.40
Nodes (5): Image, draw_mark(), main(), Generate every Layora raster mark from one definition. The mark is a rounded…, One mark, drawn at `size` pixels square.

### Community 56 - "useStore"
Cohesion: 0.18
Nodes (12): AccessDeniedPage(), Reason, QuickLaunchers(), DashboardLayout(), LeaderboardPage(), RangeStats, UserStats, TasksPage() (+4 more)

### Community 59 - "SyncProvider.tsx"
Cohesion: 0.29
Nodes (4): ResourcesPage(), SyncProvider(), isSupabaseConfigured, supabase

### Community 60 - "coders-club/page.tsx"
Cohesion: 0.25
Nodes (5): Challenge, CHALLENGES, FACILITATOR_NOTES, MASTHEAD, metadata

## Ambiguous Edges - Review These
- `Layora Architecture & System Structure` → `Next.js Agent Rules (breaking-change warning)`  [AMBIGUOUS]
  AGENTS.md · relation: conceptually_related_to

## Knowledge Gaps
- **267 isolated node(s):** `eslintConfig`, `manifest_version`, `name`, `version`, `description` (+262 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Layora Architecture & System Structure` and `Next.js Agent Rules (breaking-change warning)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Cohort` connect `authz.ts` to `cohorts.ts`, `recurrence.ts`, `apiFetch`, `global/route.ts`, `useStore.ts`, `roster.ts`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `apiFetch()` connect `apiFetch` to `cohorts.ts`, `extension.ts`, `notifications.ts`, `courses/page.tsx`, `useStore.ts`, `useStore`, `SyncProvider.tsx`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `supabaseAdmin` connect `supabaseAdmin.ts` to `syncLogic.ts`, `recurrence.ts`, `extensionAuth.ts`, `AdminLog.ts`, `global/route.ts`, `requireStudent`, `roster.ts`, `authz.ts`, `SyncProvider.tsx`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `manifest_version`, `name` to the rest of the system?**
  _267 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `syncLogic.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0907563025210084 - nodes in this community are weakly interconnected._
- **Should `cohorts.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06382978723404255 - nodes in this community are weakly interconnected._