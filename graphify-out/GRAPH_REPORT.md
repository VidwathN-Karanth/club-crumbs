# Graph Report - club-crumbs  (2026-09-24)

## Corpus Check
- 224 files · ~188,081 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1447 nodes · 3582 edges · 88 communities (67 shown, 21 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 38 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `907decdf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Cohort
- app/page.tsx
- requireAdmin
- requireStudent
- Club Chat — Implementation Plan (Club Crumbs)
- accessContext.ts
- popup.js
- notifications.ts
- compilerOptions
- students/page.tsx
- manifest.json
- SyncProvider.tsx
- Zen Focus Mode Fullscreen Timer
- apiFetch
- apiClient.ts
- dependencies
- devDependencies
- ZenMode.tsx
- dateFormat.ts
- useStore.ts
- requireAdminCohort
- Bearer Token Pairing (extension auth)
- DailyActivity.ts
- syncLogic.ts (activity aggregator & points calculator)
- schema.sql
- Server-Side Database Proxy (/api/user/state)
- ReportEditor.tsx
- Layora: Autonomous AI Student Productivity Suite
- package.json
- extensionData.ts
- Resource Vault
- Generative Timetable Compiler
- Report.ts
- build-zip.py
- readJson
- icon.tsx
- Main Workspace Dashboard
- POST
- calendar/courses/route.ts
- eslint.config.mjs
- next.config.ts
- @clerk/nextjs
- cohorts.ts
- @clerk/themes
- postcss.config.mjs
- Event.ts
- uploadToUserDrive
- isCohort
- dashboard/leaderboard/page.tsx
- vercel.json
- supabaseAdmin.ts
- draw_mark
- docx
- [id]/page.tsx
- proxy.ts
- animated-counter.tsx
- coders-club/page.tsx
- @radix-ui/react-slot
- useClubChat.ts
- grants/route.ts
- User.ts
- task-list.tsx
- react
- chat.sql
- delete-button.tsx
- react-dom
- @supabase/supabase-js
- cn
- components.json
- useStore
- authz.ts
- notification-bell.tsx
- reports.sql
- limits.ts
- syncLogic.ts
- DateField.tsx
- retention.sql
- cn
- framer-motion
- grapesjs
- @vercel/speed-insights
- maps.sql

## God Nodes (most connected - your core abstractions)
1. `apiFetch()` - 85 edges
2. `errorMessage()` - 60 edges
3. `isCohort()` - 55 edges
4. `readJson()` - 52 edges
5. `useStore` - 50 edges
6. `requireClubManager()` - 42 edges
7. `Cohort` - 39 edges
8. `getRequester()` - 34 edges
9. `formatDate()` - 34 edges
10. `supabaseAdmin` - 32 edges

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

## Communities (88 total, 21 thin omitted)

### Community 0 - "Cohort"
Cohesion: 0.14
Nodes (13): AddEmails(), AddResult, Grant, PendingRemove, Role, AdminContextValue, LeaderContextValue, ReportData (+5 more)

### Community 1 - "app/page.tsx"
Cohesion: 0.07
Nodes (14): AccessDeniedPage(), Reason, cardFor(), ChooseAccessPage(), contextString(), Identity, CLUB_ICON, CLUB_LINK (+6 more)

### Community 2 - "requireAdmin"
Cohesion: 0.06
Nodes (37): GET(), dynamic, GET(), dynamic, GET(), POST(), downloadUrl(), dynamic (+29 more)

### Community 3 - "requireStudent"
Cohesion: 0.18
Nodes (14): dynamic, GET(), dynamic, POST(), dynamic, GET(), DELETE(), dynamic (+6 more)

### Community 4 - "Club Chat — Implementation Plan (Club Crumbs)"
Cohesion: 0.11
Nodes (18): 0. Reality check — what the original plan got wrong, 10. Testing, 11. Future work, 12. Concrete file checklist, 1. Scope (v1), 2. Data model (Supabase / Postgres), 3. Image storage, 4. API routes (Next.js route handlers) (+10 more)

### Community 5 - "accessContext.ts"
Cohesion: 0.30
Nodes (12): dynamic, POST(), dynamic, GET(), areaForContext(), areaForContextString(), contextMatchesIdentity(), CTX_COOKIE (+4 more)

### Community 6 - "popup.js"
Cohesion: 0.11
Nodes (50): handleMessage(), refresh(), respond(), api(), ApiError, cacheKey(), clearToken(), connectedServices() (+42 more)

### Community 7 - "notifications.ts"
Cohesion: 0.05
Nodes (76): AdminProvider(), AdminLayout(), MENU, normalise(), YEARLESS, YearSelector(), SettingsPage(), leaderCohortFromContext() (+68 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 9 - "students/page.tsx"
Cohesion: 0.10
Nodes (31): Uploader, CertificatePreview(), AdminStudentsPage(), DAYS, formatLastSync(), Tab, TABS, TelemetryUser (+23 more)

### Community 10 - "manifest.json"
Cohesion: 0.09
Nodes (24): action, default_popup, default_title, background, service_worker, type, content_scripts, description (+16 more)

### Community 11 - "SyncProvider.tsx"
Cohesion: 0.19
Nodes (8): metadata, mulish, sora, viewport, CookieConsent(), SyncProvider(), isSupabaseConfigured, supabase

### Community 13 - "Zen Focus Mode Fullscreen Timer"
Cohesion: 0.40
Nodes (6): Distraction-Free Chrome Removal, Space to Pause / Esc to Leave Hints, Pomodoro Session Cycle Indicator, Daily and 7-Day Focus Session Stats, Pause / Reset / Skip Timer Controls, Zen Focus Mode Fullscreen Timer

### Community 14 - "apiFetch"
Cohesion: 0.14
Nodes (19): AdminReportsPage(), CodingEvent, MemberCodingPage(), TournamentConfig, Connection, ConnectState, ExtensionPage(), shortLabel() (+11 more)

### Community 15 - "apiClient.ts"
Cohesion: 0.12
Nodes (36): AdminContext, useAdmin(), AdminAttendancePage(), cell(), download(), Member, Record, AdminCertificatesPage() (+28 more)

### Community 16 - "dependencies"
Cohesion: 0.12
Nodes (17): axios, clsx, lucide-react, motion, next, dependencies, axios, clsx (+9 more)

### Community 17 - "devDependencies"
Cohesion: 0.11
Nodes (19): clerk, eslint, eslint-config-next, devDependencies, clerk, eslint, eslint-config-next, tailwindcss (+11 more)

### Community 18 - "ZenMode.tsx"
Cohesion: 0.25
Nodes (14): PHASE_ACCENT, ZenMode(), ZenModeProps, dayKey(), formatFocusDuration(), LOG_RETENTION_DAYS, nextPhase(), normalizeSettings() (+6 more)

### Community 19 - "dateFormat.ts"
Cohesion: 0.19
Nodes (19): AdminEventsPage(), buildGrid(), WEEKDAYS, buildGrid(), EventsPage(), toKey(), WEEKDAYS, buildGrid() (+11 more)

### Community 20 - "useStore.ts"
Cohesion: 0.14
Nodes (23): DEFAULT_POMODORO_SETTINGS, PomodoroDay, PomodoroSettings, Activity, Course, courseBlockFor(), DEFAULT_ROUTINE, Routine (+15 more)

### Community 21 - "requireAdminCohort"
Cohesion: 0.16
Nodes (18): GET(), dynamic, emptyCounts(), GET(), dynamic, GET(), dynamic, GET() (+10 more)

### Community 22 - "Bearer Token Pairing (extension auth)"
Cohesion: 0.21
Nodes (12): Connect gate state, Quicklaunch panel + add-link form, Quick Access popup UI (360x480, two tabs), background.js (service worker / event page), Bearer Token Pairing (extension auth), build-zip.py (dual-manifest packager), connect.js content script (token relay), Cross-browser parity (Chromium vs Gecko, three divergences) (+4 more)

### Community 23 - "DailyActivity.ts"
Cohesion: 0.13
Nodes (15): dynamic, GET(), Range, VALID_RANGES, dynamic, GET(), ActivityTotalsRow, addEventPoints() (+7 more)

### Community 24 - "syncLogic.ts (activity aggregator & points calculator)"
Cohesion: 0.20
Nodes (11): /api/user/purge (data purge), CodeChef solve-count scraper, /api/cron/daily-sync (scheduled activity sync), Gamification & Points Ledger Pipeline, GitHub Events API source, LeetCode GraphQL stats source, syncLogic.ts (activity aggregator & points calculator), certificates table & Supabase Storage bucket (+3 more)

### Community 25 - "schema.sql"
Cohesion: 0.19
Nodes (12): public, public.access_grants, public.admin_logs, public.attendance, public.certificates, public.coding_events, public.daily_activities, public.events (+4 more)

### Community 26 - "Server-Side Database Proxy (/api/user/state)"
Cohesion: 0.27
Nodes (10): Clerk Authentication, Local Demo Mode (missing Supabase keys fallback), Supabase Row-Level Security Isolation, Server-Side Database Proxy (/api/user/state), /api/calendar/sync (Google Calendar push), /api/user/state (secure Supabase state proxy), Clerk Middleware (route protection & token check), isAdminEmail admin allowlist (+2 more)

### Community 27 - "ReportEditor.tsx"
Cohesion: 0.12
Nodes (34): ReportEditor, CollegeHeaderConfig, DEFAULT_COLLEGE_HEADER, getCollegeHeaderHtml(), MITE_LOGO_BASE64, addNewReportPage(), CANVAS_CSS, createReportPageDefinition() (+26 more)

### Community 28 - "Layora: Autonomous AI Student Productivity Suite"
Cohesion: 0.28
Nodes (9): Next.js Agent Rules (breaking-change warning), CLAUDE.md AGENTS.md include, Known limit: a launcher added in the extension can be overwritten, Admin Root Console, Client Write-Timestamp Queue (anti-race-condition), Layora: Autonomous AI Student Productivity Suite, SyncProvider (Zustand synchronizer & realtime listener), Layora Architecture & System Structure (+1 more)

### Community 29 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 30 - "extensionData.ts"
Cohesion: 0.05
Nodes (68): dynamic, GET(), OPTIONS(), dynamic, GET(), OPTIONS(), DELETE(), dynamic (+60 more)

### Community 31 - "Resource Vault"
Cohesion: 0.29
Nodes (8): Courses panel, Known limit: a course without a link opens Layora instead, Google Drive webViewLink Fallback Construction, No Study Materials on Supabase Storage (privacy stance), Online Course Tracker, Resource Vault, Vercel 4.5MB Upload Size Guard, /api/resources/upload-drive (Google Drive proxy upload)

### Community 32 - "Generative Timetable Compiler"
Cohesion: 0.29
Nodes (8): Google site-verification token file, Generative Timetable Compiler, Google Calendar Sync, Groq API (LLM inference), Study Copilot (LLM assistant), /api/ai/planner (weekly timetable generator), /api/ai/proactive (AI academic mentor), Duality Rule (task + timetable block bound together)

### Community 33 - "Report.ts"
Cohesion: 0.13
Nodes (16): DELETE(), dynamic, GET(), PATCH(), dynamic, GET(), POST(), ALLOWED (+8 more)

### Community 34 - "build-zip.py"
Cohesion: 0.47
Nodes (5): build(), firefox_manifest(), main(), Package the extension for distribution. Writes two zips from the one source…, The Chromium manifest, with the three Gecko differences applied.

### Community 35 - "readJson"
Cohesion: 0.09
Nodes (33): AdminAccessPage(), cell(), download(), LeaderAttendancePage(), Member, Record, todayLocal(), CodingEvent (+25 more)

### Community 36 - "icon.tsx"
Cohesion: 0.40
Nodes (3): contentType, runtime, size

### Community 37 - "Main Workspace Dashboard"
Cohesion: 0.67
Nodes (3): Milestone Tracker & Global Stopwatch, Onboarding Portal (7-step routine wizard), Main Workspace Dashboard

### Community 39 - "calendar/courses/route.ts"
Cohesion: 0.39
Nodes (7): at(), CoursePayload, dynamic, POST(), toDateKey(), untilStamp(), wallClock()

### Community 43 - "cohorts.ts"
Cohesion: 0.25
Nodes (10): CLUB_TOURNAMENTS, ClubTournament, cohortCanSeeResource(), findResourceNameClash(), normalizeResourceName(), resolveResourceTag(), RESOURCE_TAGS, ResourceTag (+2 more)

### Community 48 - "Event.ts"
Cohesion: 0.09
Nodes (37): StaffEvent, StaffEvent, DELETE(), dynamic, GET(), POST(), dynamic, POST() (+29 more)

### Community 49 - "uploadToUserDrive"
Cohesion: 0.48
Nodes (4): POST(), DriveError, DriveFile, uploadToUserDrive()

### Community 50 - "isCohort"
Cohesion: 0.13
Nodes (26): DELETE(), dynamic, loadModifiable(), PATCH(), dynamic, GET(), POST(), ALLOWED (+18 more)

### Community 51 - "dashboard/leaderboard/page.tsx"
Cohesion: 0.50
Nodes (3): LeaderboardPage(), RangeStats, UserStats

### Community 54 - "supabaseAdmin.ts"
Cohesion: 0.18
Nodes (15): dynamic, dynamic, GET(), POST(), dynamic, GET(), dynamic, GET() (+7 more)

### Community 55 - "draw_mark"
Cohesion: 0.40
Nodes (5): Image, draw_mark(), main(), Generate every Club Crumbs raster mark from one definition. The mark is a…, One mark, drawn at `size` pixels square.

### Community 57 - "[id]/page.tsx"
Cohesion: 0.18
Nodes (15): FlowNode, MapEditor(), serialize(), uid(), DeletableEdge(), HANDLE_STYLE, LearningStatus, MapNodeActionsContext (+7 more)

### Community 59 - "animated-counter.tsx"
Cohesion: 0.11
Nodes (27): AnimatedCounter(), AnimatedCounterProps, Cell, clamp(), Digit, EASE, FACES, fades() (+19 more)

### Community 60 - "coders-club/page.tsx"
Cohesion: 0.25
Nodes (5): Challenge, CHALLENGES, FACILITATOR_NOTES, MASTHEAD, metadata

### Community 62 - "useClubChat.ts"
Cohesion: 0.18
Nodes (14): ChatComposer(), ChatMessage(), ChatMessageActions, fullLabel(), initialOf(), linkify(), timeLabel(), ChatMessageList() (+6 more)

### Community 63 - "grants/route.ts"
Cohesion: 0.19
Nodes (24): DELETE(), dynamic, GrantView, parseRole(), PATCH(), POST(), DELETE(), dynamic (+16 more)

### Community 64 - "User.ts"
Cohesion: 0.18
Nodes (14): DELETE(), dynamic, GET(), POST(), requireStaff(), DELETE(), dynamic, GET() (+6 more)

### Community 65 - "task-list.tsx"
Cohesion: 0.09
Nodes (21): EASE_IN_OUT, EASE_OUT, FILL, FILLED, FLICK, FLICK_TIMES, INSTANT, NUDGE (+13 more)

### Community 68 - "delete-button.tsx"
Cohesion: 0.10
Nodes (18): circleMotion, DeleteButtonProps, EASE, EASE_LID, HOLD, ICON, IN, INSTANT (+10 more)

### Community 71 - "cn"
Cohesion: 0.53
Nodes (6): TaskCheck(), TaskItem(), TaskLabel(), TaskList(), useTiming(), cn()

### Community 72 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 73 - "useStore"
Cohesion: 0.22
Nodes (15): QuickLaunchers(), CoursesPage(), rearmReminder(), DashboardLayout(), DashboardHome(), PlannerPage(), OnboardingPage(), OnboardingModal() (+7 more)

### Community 74 - "authz.ts"
Cohesion: 0.13
Nodes (25): dynamic, GET(), POST(), ActiveContext, cache, coerceCohort(), getGrantsForEmail(), Grant (+17 more)

### Community 77 - "notification-bell.tsx"
Cohesion: 0.15
Nodes (14): badgeMetrics(), clamp(), CLAPPER_SPRING, COLORS, COLUMN_SPRING, CountBadge(), DigitColumn(), digitOf() (+6 more)

### Community 79 - "limits.ts"
Cohesion: 0.15
Nodes (16): chatImageKey(), dynamic, GET(), isOld(), purgeChat(), StoredTask, TasksPage(), LeaderQuickLaunchPage() (+8 more)

### Community 80 - "syncLogic.ts"
Cohesion: 0.10
Nodes (30): POST(), fetchProfileHtml(), fetchTotalSolves(), validateUsername(), AxiosErrorLike, ContributionDay, fetchActivityForDate(), GitHubUserResponse (+22 more)

### Community 81 - "DateField.tsx"
Cohesion: 0.60
Nodes (4): DateField(), Props, toDisplay(), parseTypedDate()

## Ambiguous Edges - Review These
- `Layora Architecture & System Structure` → `Next.js Agent Rules (breaking-change warning)`  [AMBIGUOUS]
  AGENTS.md · relation: conceptually_related_to

## Knowledge Gaps
- **451 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+446 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Layora Architecture & System Structure` and `Next.js Agent Rules (breaking-change warning)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Cohort` connect `Cohort` to `app/page.tsx`, `Report.ts`, `readJson`, `accessContext.ts`, `notifications.ts`, `authz.ts`, `SyncProvider.tsx`, `cohorts.ts`, `apiClient.ts`, `Event.ts`, `isCohort`, `useStore.ts`, `supabaseAdmin.ts`, `ReportEditor.tsx`, `useClubChat.ts`, `grants/route.ts`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `isCohort()` connect `isCohort` to `Report.ts`, `accessContext.ts`, `notifications.ts`, `useStore`, `authz.ts`, `cohorts.ts`, `apiClient.ts`, `Event.ts`, `requireAdminCohort`, `supabaseAdmin.ts`, `extensionData.ts`, `grants/route.ts`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `apiFetch()` connect `apiFetch` to `Cohort`, `app/page.tsx`, `readJson`, `notifications.ts`, `students/page.tsx`, `useStore`, `SyncProvider.tsx`, `apiClient.ts`, `dateFormat.ts`, `dashboard/leaderboard/page.tsx`, `[id]/page.tsx`, `ReportEditor.tsx`, `useClubChat.ts`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _451 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Cohort` be split into smaller, more focused modules?**
  _Cohesion score 0.1437908496732026 - nodes in this community are weakly interconnected._
- **Should `app/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06825396825396825 - nodes in this community are weakly interconnected._