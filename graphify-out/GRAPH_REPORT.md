# Graph Report - club-crumbs  (2026-09-22)

## Corpus Check
- 221 files · ~184,412 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1426 nodes · 3536 edges · 95 communities (74 shown, 21 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 38 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5f9d3478`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- apiFetch
- app/page.tsx
- grants/route.ts
- extensionData.ts
- Club Chat — Implementation Plan (Club Crumbs)
- requireStudent
- popup.js
- notifications.ts
- compilerOptions
- dashboard/certificates/page.tsx
- manifest.json
- authz.ts
- Zen Focus Mode Fullscreen Timer
- Cohort
- admin/certificates/page.tsx
- dependencies
- devDependencies
- SyncProvider.tsx
- admin/events/page.tsx
- useStore.ts
- accessGrants.ts
- Bearer Token Pairing (extension auth)
- syncLogic.ts
- syncLogic.ts (activity aggregator & points calculator)
- schema.sql
- Server-Side Database Proxy (/api/user/state)
- ReportEditor.tsx
- Layora: Autonomous AI Student Productivity Suite
- package.json
- dateFormat.ts
- Resource Vault
- Generative Timetable Compiler
- Report.ts
- build-zip.py
- formatDateTime
- icon.tsx
- Main Workspace Dashboard
- POST
- admin/layout.tsx
- eslint.config.mjs
- next.config.ts
- @supabase/supabase-js
- cohorts.ts
- extension.ts
- postcss.config.mjs
- Event.ts
- isCohort
- useStore
- vercel.json
- ZenMode.tsx
- draw_mark
- docx
- dashboard/courses/page.tsx
- proxy.ts
- animated-counter.tsx
- coders-club/page.tsx
- extensionAuth.ts
- useClubChat.ts
- supabaseAdmin.ts
- download/route.ts
- task-list.tsx
- react
- chat.sql
- delete-button.tsx
- leader/layout.tsx
- react-dom
- formatDate
- components.json
- onboarding/page.tsx
- calendar/courses/route.ts
- NotificationCenter.tsx
- dashboard/settings/page.tsx
- notification-bell.tsx
- reports.sql
- tasks/page.tsx
- link-accounts/route.ts
- LayoraMark.tsx
- leetcodeService.ts
- cn
- retention.sql
- @clerk/nextjs
- @clerk/themes
- cn
- framer-motion
- grapesjs
- @radix-ui/react-slot
- @vercel/speed-insights
- maps.sql

## God Nodes (most connected - your core abstractions)
1. `apiFetch()` - 85 edges
2. `errorMessage()` - 60 edges
3. `isCohort()` - 54 edges
4. `readJson()` - 52 edges
5. `useStore` - 50 edges
6. `requireClubManager()` - 41 edges
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

## Communities (95 total, 21 thin omitted)

### Community 0 - "apiFetch"
Cohesion: 0.12
Nodes (32): AdminAccessPage(), AdminReportsPage(), AdminSettingsPage(), Connection, shortLabel(), CodingEvent, MemberCodingPage(), TournamentConfig (+24 more)

### Community 1 - "app/page.tsx"
Cohesion: 0.12
Nodes (4): CLUB_ICON, CLUB_LINK, STEPS, CLUB_META

### Community 2 - "grants/route.ts"
Cohesion: 0.07
Nodes (48): DELETE(), dynamic, GET(), GrantView, parseRole(), PATCH(), POST(), dynamic (+40 more)

### Community 3 - "extensionData.ts"
Cohesion: 0.05
Nodes (68): dynamic, GET(), OPTIONS(), dynamic, GET(), OPTIONS(), DELETE(), dynamic (+60 more)

### Community 4 - "Club Chat — Implementation Plan (Club Crumbs)"
Cohesion: 0.11
Nodes (18): 0. Reality check — what the original plan got wrong, 10. Testing, 11. Future work, 12. Concrete file checklist, 1. Scope (v1), 2. Data model (Supabase / Postgres), 3. Image storage, 4. API routes (Next.js route handlers) (+10 more)

### Community 5 - "requireStudent"
Cohesion: 0.12
Nodes (19): dynamic, GET(), dynamic, POST(), dynamic, GET(), DELETE(), dynamic (+11 more)

### Community 6 - "popup.js"
Cohesion: 0.11
Nodes (50): handleMessage(), refresh(), respond(), api(), ApiError, cacheKey(), clearToken(), connectedServices() (+42 more)

### Community 7 - "notifications.ts"
Cohesion: 0.15
Nodes (23): NotificationAgent(), agendaAnnouncement(), AgendaEntry, Announcement, CourseReminderInput, DEFAULT_COURSE_REMINDER_TIME, dueCourseReminders(), DueReminder (+15 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 9 - "dashboard/certificates/page.tsx"
Cohesion: 0.09
Nodes (31): Uploader, CertificateUploader, dynamic, emptyCounts(), GET(), DELETE(), dynamic, GET() (+23 more)

### Community 10 - "manifest.json"
Cohesion: 0.09
Nodes (23): action, default_popup, default_title, background, service_worker, type, content_scripts, description (+15 more)

### Community 11 - "authz.ts"
Cohesion: 0.13
Nodes (28): dynamic, POST(), dynamic, GET(), dynamic, GET(), dynamic, GET() (+20 more)

### Community 13 - "Zen Focus Mode Fullscreen Timer"
Cohesion: 0.40
Nodes (6): Distraction-Free Chrome Removal, Space to Pause / Esc to Leave Hints, Pomodoro Session Cycle Indicator, Daily and 7-Day Focus Session Stats, Pause / Reset / Skip Timer Controls, Zen Focus Mode Fullscreen Timer

### Community 14 - "Cohort"
Cohesion: 0.15
Nodes (13): AddEmails(), AddResult, Grant, PendingRemove, Role, AdminContextValue, LeaderContextValue, ReportData (+5 more)

### Community 15 - "admin/certificates/page.tsx"
Cohesion: 0.14
Nodes (27): AdminContext, useAdmin(), AdminAttendancePage(), cell(), download(), Member, Record, AdminCertificatesPage() (+19 more)

### Community 16 - "dependencies"
Cohesion: 0.12
Nodes (17): axios, clsx, lucide-react, motion, next, dependencies, axios, clsx (+9 more)

### Community 17 - "devDependencies"
Cohesion: 0.11
Nodes (19): clerk, eslint, eslint-config-next, devDependencies, clerk, eslint, eslint-config-next, tailwindcss (+11 more)

### Community 18 - "SyncProvider.tsx"
Cohesion: 0.19
Nodes (8): metadata, mulish, sora, viewport, CookieConsent(), SyncProvider(), isSupabaseConfigured, supabase

### Community 19 - "admin/events/page.tsx"
Cohesion: 0.13
Nodes (30): AdminEventsPage(), buildGrid(), StaffEvent, WEEKDAYS, StaffEvent, dynamic, POST(), buildGrid() (+22 more)

### Community 20 - "useStore.ts"
Cohesion: 0.13
Nodes (25): PlannerPage(), DEFAULT_POMODORO_SETTINGS, normalizeSettings(), PomodoroDay, Activity, Course, courseBlockFor(), DEFAULT_ROUTINE (+17 more)

### Community 21 - "accessGrants.ts"
Cohesion: 0.11
Nodes (28): GET(), dynamic, GET(), Range, VALID_RANGES, dynamic, GET(), dynamic (+20 more)

### Community 22 - "Bearer Token Pairing (extension auth)"
Cohesion: 0.21
Nodes (12): Connect gate state, Quicklaunch panel + add-link form, Quick Access popup UI (360x480, two tabs), background.js (service worker / event page), Bearer Token Pairing (extension auth), build-zip.py (dual-manifest packager), connect.js content script (token relay), Cross-browser parity (Chromium vs Gecko, three divergences) (+4 more)

### Community 23 - "syncLogic.ts"
Cohesion: 0.11
Nodes (22): dynamic, dynamic, GET(), ActivityTotalsRow, DailyActivity, DailyActivityRow, DatabaseDailyActivityRow, LeaderboardUser (+14 more)

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

### Community 30 - "dateFormat.ts"
Cohesion: 0.25
Nodes (9): AdminOverviewPage(), Counts, SyncPage, apiJson(), DateInput, MONTHS, toDateKey(), WEEKDAYS (+1 more)

### Community 31 - "Resource Vault"
Cohesion: 0.29
Nodes (8): Courses panel, Known limit: a course without a link opens Layora instead, Google Drive webViewLink Fallback Construction, No Study Materials on Supabase Storage (privacy stance), Online Course Tracker, Resource Vault, Vercel 4.5MB Upload Size Guard, /api/resources/upload-drive (Google Drive proxy upload)

### Community 32 - "Generative Timetable Compiler"
Cohesion: 0.29
Nodes (8): Google site-verification token file, Generative Timetable Compiler, Google Calendar Sync, Groq API (LLM inference), Study Copilot (LLM assistant), /api/ai/planner (weekly timetable generator), /api/ai/proactive (AI academic mentor), Duality Rule (task + timetable block bound together)

### Community 33 - "Report.ts"
Cohesion: 0.13
Nodes (17): DELETE(), dynamic, GET(), PATCH(), dynamic, GET(), POST(), ALLOWED (+9 more)

### Community 34 - "build-zip.py"
Cohesion: 0.47
Nodes (5): build(), firefox_manifest(), main(), Package the extension for distribution. Writes two zips from the one source…, The Chromium manifest, with the three Gecko differences applied.

### Community 35 - "formatDateTime"
Cohesion: 0.14
Nodes (18): cell(), download(), LeaderAttendancePage(), Member, Record, todayLocal(), CodingEvent, EMPTY (+10 more)

### Community 36 - "icon.tsx"
Cohesion: 0.40
Nodes (3): contentType, runtime, size

### Community 37 - "Main Workspace Dashboard"
Cohesion: 0.67
Nodes (3): Milestone Tracker & Global Stopwatch, Onboarding Portal (7-step routine wizard), Main Workspace Dashboard

### Community 39 - "admin/layout.tsx"
Cohesion: 0.22
Nodes (11): AdminProvider(), AdminLayout(), MENU, normalise(), YEARLESS, YearSelector(), AdminChatLauncher(), ChatLauncher() (+3 more)

### Community 43 - "cohorts.ts"
Cohesion: 0.17
Nodes (17): dynamic, GET(), POST(), dynamic, GET(), CLUB_TOURNAMENTS, ClubTournament, cohortCanSeeResource() (+9 more)

### Community 44 - "extension.ts"
Cohesion: 0.18
Nodes (16): Build, BUILDS, ExtensionInstall(), dismissedRecently(), ExtensionNudge(), ExtensionPrompt(), snoozed(), BrowserFamily (+8 more)

### Community 48 - "Event.ts"
Cohesion: 0.14
Nodes (19): dynamic, GET(), POST(), DELETE(), POST(), DELETE(), dynamic, GET() (+11 more)

### Community 50 - "isCohort"
Cohesion: 0.16
Nodes (21): DELETE(), dynamic, loadModifiable(), PATCH(), dynamic, GET(), POST(), DELETE() (+13 more)

### Community 51 - "useStore"
Cohesion: 0.24
Nodes (9): AccessDeniedPage(), Reason, QuickLaunchers(), DashboardLayout(), LeaderboardPage(), RangeStats, UserStats, resolveScheduleOverlaps() (+1 more)

### Community 54 - "ZenMode.tsx"
Cohesion: 0.26
Nodes (14): PHASE_ACCENT, ZenMode(), ZenModeProps, dayKey(), formatFocusDuration(), LOG_RETENTION_DAYS, nextPhase(), PHASE_LABEL (+6 more)

### Community 55 - "draw_mark"
Cohesion: 0.40
Nodes (5): Image, draw_mark(), main(), Generate every Club Crumbs raster mark from one definition. The mark is a…, One mark, drawn at `size` pixels square.

### Community 57 - "dashboard/courses/page.tsx"
Cohesion: 0.31
Nodes (7): CoursesPage(), rearmReminder(), DateField(), Props, toDisplay(), parseTypedDate(), clearNotificationMark()

### Community 59 - "animated-counter.tsx"
Cohesion: 0.11
Nodes (27): AnimatedCounter(), AnimatedCounterProps, Cell, clamp(), Digit, EASE, FACES, fades() (+19 more)

### Community 60 - "coders-club/page.tsx"
Cohesion: 0.25
Nodes (5): Challenge, CHALLENGES, FACILITATOR_NOTES, MASTHEAD, metadata

### Community 61 - "extensionAuth.ts"
Cohesion: 0.14
Nodes (17): DELETE(), dynamic, GET(), POST(), identitiesFor(), isAdminGrant(), bearerFrom(), CORS_HEADERS (+9 more)

### Community 62 - "useClubChat.ts"
Cohesion: 0.23
Nodes (11): ChatComposer(), ChatMessage(), ChatMessageActions, fullLabel(), initialOf(), linkify(), timeLabel(), ChatMessageList() (+3 more)

### Community 63 - "supabaseAdmin.ts"
Cohesion: 0.18
Nodes (11): dynamic, GET(), ALLOWED, dynamic, EXT, POST(), dynamic, GET() (+3 more)

### Community 64 - "download/route.ts"
Cohesion: 0.17
Nodes (11): downloadUrl(), dynamic, EXTENSION_BY_TYPE, extensionFor(), GET(), entries(), CRC_TABLE, DirectoryRecord (+3 more)

### Community 65 - "task-list.tsx"
Cohesion: 0.09
Nodes (21): EASE_IN_OUT, EASE_OUT, FILL, FILLED, FLICK, FLICK_TIMES, INSTANT, NUDGE (+13 more)

### Community 68 - "delete-button.tsx"
Cohesion: 0.10
Nodes (18): circleMotion, DeleteButtonProps, EASE, EASE_LID, HOLD, ICON, IN, INSTANT (+10 more)

### Community 69 - "leader/layout.tsx"
Cohesion: 0.29
Nodes (7): leaderCohortFromContext(), LeaderLayout(), MENU, normalise(), LeaderProvider(), LeaderChatLauncher(), SwitchRoleButton()

### Community 71 - "formatDate"
Cohesion: 0.21
Nodes (13): CertificatePreview(), AdminStudentsPage(), DAYS, formatLastSync(), Tab, TABS, TelemetryUser, ACCENTS (+5 more)

### Community 72 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 73 - "onboarding/page.tsx"
Cohesion: 0.45
Nodes (6): DashboardHome(), OnboardingPage(), OnboardingModal(), formatCourseLink(), getPlatformDisplay(), formatTimeStr()

### Community 74 - "calendar/courses/route.ts"
Cohesion: 0.39
Nodes (7): at(), CoursePayload, dynamic, POST(), toDateKey(), untilStamp(), wallClock()

### Community 75 - "NotificationCenter.tsx"
Cohesion: 0.32
Nodes (7): ICONS, NotificationCenter(), isExternalUrl(), notify(), onToast(), Toast, ToastKind

### Community 76 - "dashboard/settings/page.tsx"
Cohesion: 0.28
Nodes (13): SettingsPage(), LeaderSettingsPage(), InterfacePanel(), RemindersControl(), NotificationNudge(), alreadyNotified(), announce(), clearTodaysNotificationMarks() (+5 more)

### Community 77 - "notification-bell.tsx"
Cohesion: 0.15
Nodes (14): badgeMetrics(), clamp(), CLAPPER_SPRING, COLORS, COLUMN_SPRING, CountBadge(), DigitColumn(), digitOf() (+6 more)

### Community 79 - "tasks/page.tsx"
Cohesion: 0.17
Nodes (12): dynamic, GET(), isOld(), StoredTask, TasksPage(), LeaderQuickLaunchPage(), MAX_LAUNCHER_COURSE_ITEMS, MAX_TASKS_PER_DAY (+4 more)

### Community 80 - "link-accounts/route.ts"
Cohesion: 0.21
Nodes (12): POST(), fetchProfileHtml(), fetchTotalSolves(), validateUsername(), AxiosErrorLike, ContributionDay, fetchActivityForDate(), GitHubUserResponse (+4 more)

### Community 81 - "LayoraMark.tsx"
Cohesion: 0.17
Nodes (8): cardFor(), ChooseAccessPage(), contextString(), Identity, LayoraMark(), LayoraMarkProps, MARK_PURPLE, COLLEGE_EMAIL_DOMAIN

### Community 82 - "leetcodeService.ts"
Cohesion: 0.27
Nodes (10): difficultyCache, DifficultyCounts, fetchActivityForDate(), fetchTotalSolves(), getQuestionDifficulty(), LeetCodeQuestion, LeetCodeResponse, LeetCodeSubmission (+2 more)

### Community 83 - "cn"
Cohesion: 0.43
Nodes (7): DeleteButton(), TaskCheck(), TaskItem(), TaskLabel(), TaskList(), useTiming(), cn()

## Ambiguous Edges - Review These
- `Layora Architecture & System Structure` → `Next.js Agent Rules (breaking-change warning)`  [AMBIGUOUS]
  AGENTS.md · relation: conceptually_related_to

## Knowledge Gaps
- **445 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+440 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Layora Architecture & System Structure` and `Next.js Agent Rules (breaking-change warning)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Cohort` connect `Cohort` to `app/page.tsx`, `grants/route.ts`, `formatDateTime`, `Report.ts`, `leader/layout.tsx`, `admin/layout.tsx`, `authz.ts`, `cohorts.ts`, `admin/certificates/page.tsx`, `Event.ts`, `LayoraMark.tsx`, `SyncProvider.tsx`, `isCohort`, `useStore.ts`, `accessGrants.ts`, `ReportEditor.tsx`, `useClubChat.ts`, `supabaseAdmin.ts`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `apiFetch()` connect `apiFetch` to `extensionData.ts`, `notifications.ts`, `dashboard/certificates/page.tsx`, `Cohort`, `admin/certificates/page.tsx`, `SyncProvider.tsx`, `admin/events/page.tsx`, `useStore.ts`, `ReportEditor.tsx`, `dateFormat.ts`, `formatDateTime`, `admin/layout.tsx`, `extension.ts`, `useStore`, `dashboard/courses/page.tsx`, `useClubChat.ts`, `leader/layout.tsx`, `formatDate`, `dashboard/settings/page.tsx`, `LayoraMark.tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `isCohort()` connect `isCohort` to `Report.ts`, `grants/route.ts`, `extensionData.ts`, `leader/layout.tsx`, `admin/layout.tsx`, `onboarding/page.tsx`, `cohorts.ts`, `authz.ts`, `admin/certificates/page.tsx`, `Event.ts`, `accessGrants.ts`, `supabaseAdmin.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _445 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `apiFetch` be split into smaller, more focused modules?**
  _Cohesion score 0.11738648947951273 - nodes in this community are weakly interconnected._
- **Should `app/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._