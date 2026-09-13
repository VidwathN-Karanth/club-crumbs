# Graph Report - club-crumbs  (2026-09-13)

## Corpus Check
- 162 files · ~140,665 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1050 nodes · 2652 edges · 63 communities (53 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 35 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c3799598`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DailyActivity.ts
- app/page.tsx
- recurrence.ts
- extensionAuth.ts
- extension.ts
- requireStudent
- popup.js
- notifications.ts
- compilerOptions
- requireAdmin
- manifest.json
- accessContext.ts
- Zen Focus Mode Fullscreen Timer
- grants/route.ts
- dashboard/settings/page.tsx
- dependencies
- devDependencies
- authz.ts
- syncLogic.ts
- useStore.ts
- requireAdminCohort
- Bearer Token Pairing (extension auth)
- useStore
- syncLogic.ts (activity aggregator & points calculator)
- schema.sql
- Server-Side Database Proxy (/api/user/state)
- leetcodeService.ts
- Layora: Autonomous AI Student Productivity Suite
- package.json
- dateFormat.ts
- Resource Vault
- Generative Timetable Compiler
- dashboard/certificates/page.tsx
- build-zip.py
- students/page.tsx
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
- cohorts.ts
- isCohort
- calendar/courses/route.ts
- vercel.json
- accessGrants.ts
- draw_mark
- pomodoro.ts
- leader/layout.tsx
- proxy.ts
- admin/events/page.tsx
- coders-club/page.tsx
- apiFetch
- errorMessage

## God Nodes (most connected - your core abstractions)
1. `apiFetch()` - 67 edges
2. `errorMessage()` - 44 edges
3. `readJson()` - 40 edges
4. `isCohort()` - 39 edges
5. `useStore` - 39 edges
6. `getRequester()` - 31 edges
7. `formatDate()` - 30 edges
8. `Cohort` - 27 edges
9. `supabaseAdmin` - 25 edges
10. `requireClubManager()` - 24 edges

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

## Communities (63 total, 10 thin omitted)

### Community 0 - "DailyActivity.ts"
Cohesion: 0.16
Nodes (12): dynamic, Range, VALID_RANGES, dynamic, GET(), ActivityTotalsRow, DailyActivity, DailyActivityRow (+4 more)

### Community 1 - "app/page.tsx"
Cohesion: 0.05
Nodes (28): cardFor(), ChooseAccessPage(), contextString(), Identity, DashboardHome(), geistMono, geistSans, hankenGrotesk (+20 more)

### Community 2 - "recurrence.ts"
Cohesion: 0.10
Nodes (35): StaffEvent, StaffEvent, DELETE(), dynamic, GET(), POST(), dynamic, POST() (+27 more)

### Community 3 - "extensionAuth.ts"
Cohesion: 0.08
Nodes (45): dynamic, GET(), OPTIONS(), dynamic, GET(), OPTIONS(), DELETE(), dynamic (+37 more)

### Community 4 - "extension.ts"
Cohesion: 0.18
Nodes (16): Build, BUILDS, ExtensionInstall(), dismissedRecently(), ExtensionNudge(), ExtensionPrompt(), snoozed(), BrowserFamily (+8 more)

### Community 5 - "requireStudent"
Cohesion: 0.16
Nodes (17): GET(), DELETE(), dynamic, GET(), POST(), requireStaff(), DELETE(), dynamic (+9 more)

### Community 6 - "popup.js"
Cohesion: 0.11
Nodes (50): handleMessage(), refresh(), respond(), api(), ApiError, cacheKey(), clearToken(), connectedServices() (+42 more)

### Community 7 - "notifications.ts"
Cohesion: 0.15
Nodes (23): NotificationAgent(), agendaAnnouncement(), AgendaEntry, Announcement, CourseReminderInput, DEFAULT_COURSE_REMINDER_TIME, dueCourseReminders(), DueReminder (+15 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 9 - "requireAdmin"
Cohesion: 0.10
Nodes (25): GET(), dynamic, GET(), dynamic, GET(), POST(), maxDuration, POST() (+17 more)

### Community 10 - "manifest.json"
Cohesion: 0.09
Nodes (23): action, default_popup, default_title, background, service_worker, type, content_scripts, description (+15 more)

### Community 11 - "accessContext.ts"
Cohesion: 0.23
Nodes (16): dynamic, POST(), dynamic, GET(), areaForContext(), areaForContextString(), contextMatchesIdentity(), CTX_COOKIE (+8 more)

### Community 13 - "Zen Focus Mode Fullscreen Timer"
Cohesion: 0.40
Nodes (6): Distraction-Free Chrome Removal, Space to Pause / Esc to Leave Hints, Pomodoro Session Cycle Indicator, Daily and 7-Day Focus Session Stats, Pause / Reset / Skip Timer Controls, Zen Focus Mode Fullscreen Timer

### Community 14 - "grants/route.ts"
Cohesion: 0.18
Nodes (25): DELETE(), dynamic, GrantView, parseRole(), PATCH(), POST(), DELETE(), dynamic (+17 more)

### Community 15 - "dashboard/settings/page.tsx"
Cohesion: 0.24
Nodes (15): AdminSettingsPage(), Connection, shortLabel(), PlannerPage(), SettingsPage(), alreadyNotified(), announce(), clearTodaysNotificationMarks() (+7 more)

### Community 16 - "dependencies"
Cohesion: 0.12
Nodes (17): axios, @clerk/themes, framer-motion, lucide-react, next, dependencies, axios, @clerk/themes (+9 more)

### Community 17 - "devDependencies"
Cohesion: 0.12
Nodes (17): clerk, eslint, eslint-config-next, devDependencies, clerk, eslint, eslint-config-next, @tailwindcss/postcss (+9 more)

### Community 18 - "authz.ts"
Cohesion: 0.16
Nodes (16): AddEmails(), AddResult, Grant, PendingRemove, Role, AdminContextValue, LeaderContextValue, ActiveContext (+8 more)

### Community 19 - "syncLogic.ts"
Cohesion: 0.13
Nodes (22): POST(), fetchProfileHtml(), fetchTotalSolves(), validateUsername(), AxiosErrorLike, ContributionDay, fetchActivityForDate(), GitHubUserResponse (+14 more)

### Community 20 - "useStore.ts"
Cohesion: 0.13
Nodes (24): DEFAULT_POMODORO_SETTINGS, normalizeSettings(), PomodoroDay, PomodoroSettings, Activity, Course, courseBlockFor(), DEFAULT_ROUTINE (+16 more)

### Community 21 - "requireAdminCohort"
Cohesion: 0.19
Nodes (14): dynamic, GET(), dynamic, GET(), Range, VALID_RANGES, dynamic, GET() (+6 more)

### Community 22 - "Bearer Token Pairing (extension auth)"
Cohesion: 0.21
Nodes (12): Connect gate state, Quicklaunch panel + add-link form, Quick Access popup UI (360x480, two tabs), background.js (service worker / event page), Bearer Token Pairing (extension auth), build-zip.py (dual-manifest packager), connect.js content script (token relay), Cross-browser parity (Chromium vs Gecko, three divergences) (+4 more)

### Community 23 - "useStore"
Cohesion: 0.19
Nodes (11): AccessDeniedPage(), Reason, QuickLaunchers(), DashboardLayout(), LeaderboardPage(), RangeStats, UserStats, TasksPage() (+3 more)

### Community 24 - "syncLogic.ts (activity aggregator & points calculator)"
Cohesion: 0.20
Nodes (11): /api/user/purge (data purge), CodeChef solve-count scraper, /api/cron/daily-sync (scheduled activity sync), Gamification & Points Ledger Pipeline, GitHub Events API source, LeetCode GraphQL stats source, syncLogic.ts (activity aggregator & points calculator), certificates table & Supabase Storage bucket (+3 more)

### Community 25 - "schema.sql"
Cohesion: 0.19
Nodes (12): public, public.access_grants, public.admin_logs, public.attendance, public.certificates, public.coding_events, public.daily_activities, public.events (+4 more)

### Community 26 - "Server-Side Database Proxy (/api/user/state)"
Cohesion: 0.27
Nodes (10): Clerk Authentication, Local Demo Mode (missing Supabase keys fallback), Supabase Row-Level Security Isolation, Server-Side Database Proxy (/api/user/state), /api/calendar/sync (Google Calendar push), /api/user/state (secure Supabase state proxy), Clerk Middleware (route protection & token check), isAdminEmail admin allowlist (+2 more)

### Community 27 - "leetcodeService.ts"
Cohesion: 0.29
Nodes (9): difficultyCache, DifficultyCounts, fetchActivityForDate(), getQuestionDifficulty(), LeetCodeQuestion, LeetCodeResponse, LeetCodeSubmission, queryLeetCode() (+1 more)

### Community 28 - "Layora: Autonomous AI Student Productivity Suite"
Cohesion: 0.28
Nodes (9): Next.js Agent Rules (breaking-change warning), CLAUDE.md AGENTS.md include, Known limit: a launcher added in the extension can be overwritten, Admin Root Console, Client Write-Timestamp Queue (anti-race-condition), Layora: Autonomous AI Student Productivity Suite, SyncProvider (Zustand synchronizer & realtime listener), Layora Architecture & System Structure (+1 more)

### Community 29 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 30 - "dateFormat.ts"
Cohesion: 0.13
Nodes (24): AdminOverviewPage(), Counts, SyncPage, CodingEvent, MemberCodingPage(), CoursesPage(), rearmReminder(), ACCENTS (+16 more)

### Community 31 - "Resource Vault"
Cohesion: 0.29
Nodes (8): Courses panel, Known limit: a course without a link opens Layora instead, Google Drive webViewLink Fallback Construction, No Study Materials on Supabase Storage (privacy stance), Online Course Tracker, Resource Vault, Vercel 4.5MB Upload Size Guard, /api/resources/upload-drive (Google Drive proxy upload)

### Community 32 - "Generative Timetable Compiler"
Cohesion: 0.29
Nodes (8): Google site-verification token file, Generative Timetable Compiler, Google Calendar Sync, Groq API (LLM inference), Study Copilot (LLM assistant), /api/ai/planner (weekly timetable generator), /api/ai/proactive (AI academic mentor), Duality Rule (task + timetable block bound together)

### Community 33 - "dashboard/certificates/page.tsx"
Cohesion: 0.06
Nodes (41): Uploader, CertificateUploader, dynamic, emptyCounts(), GET(), downloadUrl(), dynamic, EXTENSION_BY_TYPE (+33 more)

### Community 34 - "build-zip.py"
Cohesion: 0.47
Nodes (5): build(), firefox_manifest(), main(), Package the extension for distribution. Writes two zips from the one source…, The Chromium manifest, with the three Gecko differences applied.

### Community 35 - "students/page.tsx"
Cohesion: 0.13
Nodes (32): AdminContext, AdminProvider(), useAdmin(), AdminCertificatesPage(), CertificatePreview(), PanelEmpty(), PanelError(), PanelLoading() (+24 more)

### Community 36 - "icon.tsx"
Cohesion: 0.40
Nodes (3): contentType, runtime, size

### Community 37 - "Main Workspace Dashboard"
Cohesion: 0.67
Nodes (3): Milestone Tracker & Global Stopwatch, Onboarding Portal (7-step routine wizard), Main Workspace Dashboard

### Community 48 - "cohorts.ts"
Cohesion: 0.19
Nodes (11): dynamic, CODING_COHORT, cohortCanSeeResource(), COLLEGE_EMAIL_DOMAIN, findResourceNameClash(), normalizeResourceName(), resolveResourceTag(), RESOURCE_TAGS (+3 more)

### Community 50 - "isCohort"
Cohesion: 0.17
Nodes (19): DELETE(), dynamic, dynamic, GET(), POST(), dynamic, GET(), DELETE() (+11 more)

### Community 51 - "calendar/courses/route.ts"
Cohesion: 0.39
Nodes (7): at(), CoursePayload, dynamic, POST(), toDateKey(), untilStamp(), wallClock()

### Community 54 - "accessGrants.ts"
Cohesion: 0.18
Nodes (18): dynamic, GET(), POST(), cache, coerceCohort(), fail(), getGrantsForEmail(), GrantError (+10 more)

### Community 55 - "draw_mark"
Cohesion: 0.40
Nodes (5): Image, draw_mark(), main(), Generate every Layora raster mark from one definition. The mark is a rounded…, One mark, drawn at `size` pixels square.

### Community 56 - "pomodoro.ts"
Cohesion: 0.28
Nodes (13): PHASE_ACCENT, ZenMode(), ZenModeProps, dayKey(), formatFocusDuration(), LOG_RETENTION_DAYS, nextPhase(), PHASE_LABEL (+5 more)

### Community 57 - "leader/layout.tsx"
Cohesion: 0.22
Nodes (11): leaderCohortFromContext(), LeaderLayout(), MENU, normalise(), LeaderProvider(), ICONS, NotificationCenter(), isExternalUrl() (+3 more)

### Community 59 - "admin/events/page.tsx"
Cohesion: 0.27
Nodes (11): AdminEventsPage(), buildGrid(), WEEKDAYS, buildGrid(), CalendarEvent, EventsPage(), toKey(), WEEKDAYS (+3 more)

### Community 60 - "coders-club/page.tsx"
Cohesion: 0.25
Nodes (5): Challenge, CHALLENGES, FACILITATOR_NOTES, MASTHEAD, metadata

### Community 62 - "apiFetch"
Cohesion: 0.19
Nodes (14): AdminAccessPage(), AdminLayout(), MENU, normalise(), YEARLESS, YearSelector(), Connection, ConnectState (+6 more)

### Community 63 - "errorMessage"
Cohesion: 0.12
Nodes (29): RFC-4180, cell(), download(), LeaderAttendancePage(), Member, todayLocal(), CodingEvent, EMPTY (+21 more)

## Ambiguous Edges - Review These
- `Layora Architecture & System Structure` → `Next.js Agent Rules (breaking-change warning)`  [AMBIGUOUS]
  AGENTS.md · relation: conceptually_related_to

## Knowledge Gaps
- **300 isolated node(s):** `eslintConfig`, `DEFAULT_SERVICE`, `manifest_version`, `name`, `version` (+295 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Layora Architecture & System Structure` and `Next.js Agent Rules (breaking-change warning)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Cohort` connect `authz.ts` to `app/page.tsx`, `recurrence.ts`, `students/page.tsx`, `accessContext.ts`, `grants/route.ts`, `cohorts.ts`, `useStore.ts`, `accessGrants.ts`, `leader/layout.tsx`, `errorMessage`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `apiFetch()` connect `apiFetch` to `app/page.tsx`, `dashboard/certificates/page.tsx`, `students/page.tsx`, `extension.ts`, `notifications.ts`, `dashboard/settings/page.tsx`, `authz.ts`, `useStore`, `leader/layout.tsx`, `admin/events/page.tsx`, `dateFormat.ts`, `errorMessage`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `isCohort()` connect `isCohort` to `app/page.tsx`, `recurrence.ts`, `students/page.tsx`, `accessContext.ts`, `grants/route.ts`, `cohorts.ts`, `authz.ts`, `requireAdminCohort`, `accessGrants.ts`, `leader/layout.tsx`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `DEFAULT_SERVICE`, `manifest_version` to the rest of the system?**
  _300 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05141242937853107 - nodes in this community are weakly interconnected._
- **Should `recurrence.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09528214616096208 - nodes in this community are weakly interconnected._