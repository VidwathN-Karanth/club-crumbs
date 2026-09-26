# Graph Report - club-crumbs  (2026-09-26)

## Corpus Check
- 233 files · ~194,550 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1519 nodes · 3778 edges · 95 communities (74 shown, 21 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1d5b4521`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- supabaseAdmin.ts
- app/page.tsx
- requireAdmin
- attendance-selfcheck.mjs
- Club Chat — Implementation Plan (Club Crumbs)
- authz.ts
- popup.js
- delete-button.tsx
- compilerOptions
- students/page.tsx
- manifest.json
- SyncProvider.tsx
- Zen Focus Mode Fullscreen Timer
- errorMessage
- admin/attendance/page.tsx
- dependencies
- devDependencies
- ZenMode.tsx
- admin/events/page.tsx
- useStore.ts
- roster.ts
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
- isCohort
- build-zip.py
- attendance.ts
- icon.tsx
- Main Workspace Dashboard
- POST
- notifications.ts
- eslint.config.mjs
- next.config.ts
- dateFormat.ts
- cohorts.ts
- useLeader
- postcss.config.mjs
- Event.ts
- chat/upload/route.ts
- requireStudent
- readJson
- vercel.json
- calendar/courses/route.ts
- draw_mark
- docx
- [id]/page.tsx
- proxy.ts
- animated-counter.tsx
- coders-club/page.tsx
- @radix-ui/react-slot
- useClubChat.ts
- accessGrants.ts
- getRequester
- task-list.tsx
- apiFetch
- chat.sql
- limits.ts
- react-dom
- DateField.tsx
- components.json
- dashboard/courses/page.tsx
- Cohort
- dashboard/certificates/page.tsx
- extension.ts
- notification-bell.tsx
- reports.sql
- syncLogic.ts
- leetcodeService.ts
- retention.sql
- cn
- framer-motion
- grapesjs
- useStore
- @vercel/speed-insights
- maps.sql
- clsx
- lucide-react
- motion
- jszip

## God Nodes (most connected - your core abstractions)
1. `apiFetch()` - 85 edges
2. `errorMessage()` - 60 edges
3. `isCohort()` - 53 edges
4. `readJson()` - 52 edges
5. `useStore` - 50 edges
6. `Cohort` - 41 edges
7. `requireClubManager()` - 40 edges
8. `getRequester()` - 36 edges
9. `formatDate()` - 36 edges
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

### Community 0 - "supabaseAdmin.ts"
Cohesion: 0.14
Nodes (23): dynamic, GET(), dynamic, GET(), dynamic, PATCH(), conflict(), DELETE() (+15 more)

### Community 1 - "app/page.tsx"
Cohesion: 0.07
Nodes (12): cardFor(), ChooseAccessPage(), contextString(), Identity, CLUB_ICON, CLUB_LINK, STEPS, LayoraMark() (+4 more)

### Community 2 - "requireAdmin"
Cohesion: 0.10
Nodes (25): dynamic, GET(), dynamic, GET(), POST(), maxDuration, POST(), DELETE() (+17 more)

### Community 3 - "attendance-selfcheck.mjs"
Cohesion: 0.11
Nodes (13): att, csv, d1, d2, files, keep(), lines, out (+5 more)

### Community 4 - "Club Chat — Implementation Plan (Club Crumbs)"
Cohesion: 0.11
Nodes (18): 0. Reality check — what the original plan got wrong, 10. Testing, 11. Future work, 12. Concrete file checklist, 1. Scope (v1), 2. Data model (Supabase / Postgres), 3. Image storage, 4. API routes (Next.js route handlers) (+10 more)

### Community 5 - "authz.ts"
Cohesion: 0.20
Nodes (18): dynamic, POST(), dynamic, GET(), ActiveContext, areaForContext(), areaForContextString(), contextMatchesIdentity() (+10 more)

### Community 6 - "popup.js"
Cohesion: 0.11
Nodes (50): handleMessage(), refresh(), respond(), api(), ApiError, cacheKey(), clearToken(), connectedServices() (+42 more)

### Community 7 - "delete-button.tsx"
Cohesion: 0.10
Nodes (18): circleMotion, DeleteButtonProps, EASE, EASE_LID, HOLD, ICON, IN, INSTANT (+10 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 9 - "students/page.tsx"
Cohesion: 0.20
Nodes (13): CertificatePreview(), AdminStudentsPage(), DAYS, formatLastSync(), Tab, TABS, TelemetryUser, CertificatesPage() (+5 more)

### Community 10 - "manifest.json"
Cohesion: 0.09
Nodes (24): action, default_popup, default_title, background, service_worker, type, content_scripts, description (+16 more)

### Community 11 - "SyncProvider.tsx"
Cohesion: 0.17
Nodes (8): metadata, mulish, sora, viewport, CookieConsent(), SyncProvider(), isSupabaseConfigured, supabase

### Community 13 - "Zen Focus Mode Fullscreen Timer"
Cohesion: 0.40
Nodes (6): Distraction-Free Chrome Removal, Space to Pause / Esc to Leave Hints, Pomodoro Session Cycle Indicator, Daily and 7-Day Focus Session Stats, Pause / Reset / Skip Timer Controls, Zen Focus Mode Fullscreen Timer

### Community 14 - "errorMessage"
Cohesion: 0.17
Nodes (13): AddEmails(), AddResult, AdminAccessPage(), Role, AdminReportsPage(), LeaderMembersPage(), Member, LeaderReportEditPage() (+5 more)

### Community 15 - "admin/attendance/page.tsx"
Cohesion: 0.17
Nodes (19): AdminContext, PanelEmpty(), PanelError(), PanelLoading(), SectionHeader(), useSectionData(), AdminLeaderboardPage(), LeaderboardRow (+11 more)

### Community 16 - "dependencies"
Cohesion: 0.11
Nodes (19): axios, @clerk/nextjs, @clerk/themes, next, dependencies, axios, @clerk/nextjs, @clerk/themes (+11 more)

### Community 17 - "devDependencies"
Cohesion: 0.11
Nodes (19): clerk, eslint, eslint-config-next, devDependencies, clerk, eslint, eslint-config-next, tailwindcss (+11 more)

### Community 18 - "ZenMode.tsx"
Cohesion: 0.26
Nodes (14): PHASE_ACCENT, ZenMode(), ZenModeProps, dayKey(), formatFocusDuration(), LOG_RETENTION_DAYS, nextPhase(), PHASE_LABEL (+6 more)

### Community 19 - "admin/events/page.tsx"
Cohesion: 0.17
Nodes (21): AdminEventsPage(), buildGrid(), StaffEvent, WEEKDAYS, StaffEvent, buildGrid(), CalendarEvent, EventsPage() (+13 more)

### Community 20 - "useStore.ts"
Cohesion: 0.13
Nodes (25): PlannerPage(), DEFAULT_POMODORO_SETTINGS, normalizeSettings(), PomodoroDay, Activity, Course, courseBlockFor(), DEFAULT_ROUTINE (+17 more)

### Community 21 - "roster.ts"
Cohesion: 0.14
Nodes (20): dynamic, GET(), dynamic, GET(), Range, VALID_RANGES, GET(), dynamic (+12 more)

### Community 22 - "Bearer Token Pairing (extension auth)"
Cohesion: 0.21
Nodes (12): Connect gate state, Quicklaunch panel + add-link form, Quick Access popup UI (360x480, two tabs), background.js (service worker / event page), Bearer Token Pairing (extension auth), build-zip.py (dual-manifest packager), connect.js content script (token relay), Cross-browser parity (Chromium vs Gecko, three divergences) (+4 more)

### Community 23 - "DailyActivity.ts"
Cohesion: 0.16
Nodes (12): dynamic, Range, VALID_RANGES, dynamic, ActivityTotalsRow, DailyActivity, DailyActivityRow, DatabaseDailyActivityRow (+4 more)

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
Cohesion: 0.07
Nodes (50): dynamic, GET(), OPTIONS(), dynamic, GET(), OPTIONS(), DELETE(), dynamic (+42 more)

### Community 31 - "Resource Vault"
Cohesion: 0.29
Nodes (8): Courses panel, Known limit: a course without a link opens Layora instead, Google Drive webViewLink Fallback Construction, No Study Materials on Supabase Storage (privacy stance), Online Course Tracker, Resource Vault, Vercel 4.5MB Upload Size Guard, /api/resources/upload-drive (Google Drive proxy upload)

### Community 32 - "Generative Timetable Compiler"
Cohesion: 0.29
Nodes (8): Google site-verification token file, Generative Timetable Compiler, Google Calendar Sync, Groq API (LLM inference), Study Copilot (LLM assistant), /api/ai/planner (weekly timetable generator), /api/ai/proactive (AI academic mentor), Duality Rule (task + timetable block bound together)

### Community 33 - "isCohort"
Cohesion: 0.11
Nodes (28): DELETE(), dynamic, loadModifiable(), PATCH(), dynamic, GET(), POST(), DELETE() (+20 more)

### Community 34 - "build-zip.py"
Cohesion: 0.47
Nodes (5): build(), firefox_manifest(), main(), Package the extension for distribution. Writes two zips from the one source…, The Chromium manifest, with the three Gecko differences applied.

### Community 35 - "attendance.ts"
Cohesion: 0.12
Nodes (35): ClubDay, LeaderAttendancePage(), Mark, ConfirmDialog(), DrawerBody(), ExportButtons(), RegisterDrawer(), AttendanceRecord (+27 more)

### Community 36 - "icon.tsx"
Cohesion: 0.40
Nodes (3): contentType, runtime, size

### Community 37 - "Main Workspace Dashboard"
Cohesion: 0.67
Nodes (3): Milestone Tracker & Global Stopwatch, Onboarding Portal (7-step routine wizard), Main Workspace Dashboard

### Community 39 - "notifications.ts"
Cohesion: 0.08
Nodes (49): SettingsPage(), leaderCohortFromContext(), LeaderLayout(), MENU, normalise(), LeaderProvider(), LeaderSettingsPage(), LeaderChatLauncher() (+41 more)

### Community 42 - "dateFormat.ts"
Cohesion: 0.12
Nodes (23): AdminAttendancePage(), CodingEvent, MemberCodingPage(), TournamentConfig, Connection, ConnectState, ExtensionPage(), shortLabel() (+15 more)

### Community 43 - "cohorts.ts"
Cohesion: 0.17
Nodes (17): dynamic, GET(), POST(), dynamic, GET(), CLUB_TOURNAMENTS, ClubTournament, cohortCanSeeResource() (+9 more)

### Community 44 - "useLeader"
Cohesion: 0.23
Nodes (9): LeaderLeaderboardPage(), RANGES, Row, LeaderContext, useLeader(), LeaderMapListPage(), MapSummary, LeaderOverviewPage() (+1 more)

### Community 48 - "Event.ts"
Cohesion: 0.10
Nodes (33): DELETE(), dynamic, GET(), POST(), dynamic, POST(), DELETE(), DELETE() (+25 more)

### Community 49 - "chat/upload/route.ts"
Cohesion: 0.26
Nodes (8): ALLOWED, dynamic, EXT, POST(), POST(), DriveError, DriveFile, uploadToUserDrive()

### Community 50 - "requireStudent"
Cohesion: 0.24
Nodes (9): dynamic, GET(), dynamic, POST(), dynamic, GET(), DELETE(), requireStudent() (+1 more)

### Community 51 - "readJson"
Cohesion: 0.17
Nodes (16): AdminOverviewPage(), Counts, SyncPage, AdminSettingsPage(), Connection, shortLabel(), isPdf(), PickResult (+8 more)

### Community 54 - "calendar/courses/route.ts"
Cohesion: 0.36
Nodes (8): at(), CoursePayload, dynamic, POST(), toDateKey(), untilStamp(), wallClock(), requireUser()

### Community 55 - "draw_mark"
Cohesion: 0.40
Nodes (5): Image, draw_mark(), main(), Generate every Club Crumbs raster mark from one definition. The mark is a…, One mark, drawn at `size` pixels square.

### Community 57 - "[id]/page.tsx"
Cohesion: 0.09
Nodes (36): dynamic, POST(), DELETE(), dynamic, GET(), PATCH(), dynamic, GET() (+28 more)

### Community 59 - "animated-counter.tsx"
Cohesion: 0.11
Nodes (27): AnimatedCounter(), AnimatedCounterProps, Cell, clamp(), Digit, EASE, FACES, fades() (+19 more)

### Community 60 - "coders-club/page.tsx"
Cohesion: 0.25
Nodes (5): Challenge, CHALLENGES, FACILITATOR_NOTES, MASTHEAD, metadata

### Community 62 - "useClubChat.ts"
Cohesion: 0.17
Nodes (14): ChatComposer(), ChatLauncher(), ChatMessage(), ChatMessageActions, fullLabel(), initialOf(), linkify(), timeLabel() (+6 more)

### Community 63 - "accessGrants.ts"
Cohesion: 0.10
Nodes (40): DELETE(), dynamic, GET(), GrantView, parseRole(), PATCH(), POST(), DELETE() (+32 more)

### Community 64 - "getRequester"
Cohesion: 0.15
Nodes (19): DELETE(), dynamic, GET(), POST(), requireStaff(), DELETE(), dynamic, GET() (+11 more)

### Community 65 - "task-list.tsx"
Cohesion: 0.09
Nodes (27): EASE_IN_OUT, EASE_OUT, FILL, FILLED, FLICK, FLICK_TIMES, INSTANT, NUDGE (+19 more)

### Community 66 - "apiFetch"
Cohesion: 0.22
Nodes (14): AdminProvider(), useAdmin(), AdminCertificatesPage(), AdminLayout(), MENU, normalise(), YEARLESS, YearSelector() (+6 more)

### Community 68 - "limits.ts"
Cohesion: 0.15
Nodes (16): chatImageKey(), dynamic, GET(), isOld(), purgeChat(), StoredTask, TasksPage(), LeaderQuickLaunchPage() (+8 more)

### Community 70 - "DateField.tsx"
Cohesion: 0.60
Nodes (4): DateField(), Props, toDisplay(), parseTypedDate()

### Community 72 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 73 - "dashboard/courses/page.tsx"
Cohesion: 0.30
Nodes (9): CoursesPage(), rearmReminder(), DashboardHome(), OnboardingPage(), OnboardingModal(), formatCourseLink(), getPlatformDisplay(), clearNotificationMark() (+1 more)

### Community 74 - "Cohort"
Cohesion: 0.18
Nodes (9): Grant, PendingRemove, AdminContextValue, LeaderContextValue, UseClubChatOptions, ReportData, Cohort, ChatMessageRow (+1 more)

### Community 75 - "dashboard/certificates/page.tsx"
Cohesion: 0.06
Nodes (39): Uploader, CertificateUploader, dynamic, emptyCounts(), GET(), downloadUrl(), dynamic, EXTENSION_BY_TYPE (+31 more)

### Community 76 - "extension.ts"
Cohesion: 0.18
Nodes (16): Build, BUILDS, ExtensionInstall(), dismissedRecently(), ExtensionNudge(), ExtensionPrompt(), snoozed(), BrowserFamily (+8 more)

### Community 77 - "notification-bell.tsx"
Cohesion: 0.15
Nodes (14): badgeMetrics(), clamp(), CLAPPER_SPRING, COLORS, COLUMN_SPRING, CountBadge(), DigitColumn(), digitOf() (+6 more)

### Community 80 - "syncLogic.ts"
Cohesion: 0.12
Nodes (21): fetchProfileHtml(), fetchTotalSolves(), validateUsername(), AxiosErrorLike, ContributionDay, fetchActivityForDate(), GitHubUserResponse, GitHubValidationError (+13 more)

### Community 82 - "leetcodeService.ts"
Cohesion: 0.27
Nodes (10): difficultyCache, DifficultyCounts, fetchActivityForDate(), fetchTotalSolves(), getQuestionDifficulty(), LeetCodeQuestion, LeetCodeResponse, LeetCodeSubmission (+2 more)

### Community 90 - "useStore"
Cohesion: 0.24
Nodes (9): AccessDeniedPage(), Reason, QuickLaunchers(), DashboardLayout(), LeaderboardPage(), RangeStats, UserStats, resolveScheduleOverlaps() (+1 more)

## Ambiguous Edges - Review These
- `Layora Architecture & System Structure` → `Next.js Agent Rules (breaking-change warning)`  [AMBIGUOUS]
  AGENTS.md · relation: conceptually_related_to

## Knowledge Gaps
- **465 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+460 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Layora Architecture & System Structure` and `Next.js Agent Rules (breaking-change warning)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Cohort` connect `Cohort` to `supabaseAdmin.ts`, `app/page.tsx`, `isCohort`, `authz.ts`, `notifications.ts`, `SyncProvider.tsx`, `useLeader`, `cohorts.ts`, `errorMessage`, `admin/attendance/page.tsx`, `Event.ts`, `useStore.ts`, `roster.ts`, `ReportEditor.tsx`, `useClubChat.ts`, `accessGrants.ts`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `apiFetch()` connect `apiFetch` to `app/page.tsx`, `students/page.tsx`, `SyncProvider.tsx`, `errorMessage`, `admin/attendance/page.tsx`, `admin/events/page.tsx`, `useStore.ts`, `ReportEditor.tsx`, `attendance.ts`, `notifications.ts`, `dateFormat.ts`, `useLeader`, `readJson`, `[id]/page.tsx`, `useClubChat.ts`, `dashboard/courses/page.tsx`, `dashboard/certificates/page.tsx`, `extension.ts`, `useStore`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `isCohort()` connect `isCohort` to `supabaseAdmin.ts`, `apiFetch`, `authz.ts`, `notifications.ts`, `dashboard/courses/page.tsx`, `cohorts.ts`, `admin/attendance/page.tsx`, `Event.ts`, `chat/upload/route.ts`, `roster.ts`, `[id]/page.tsx`, `accessGrants.ts`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _465 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `supabaseAdmin.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14112903225806453 - nodes in this community are weakly interconnected._
- **Should `app/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07226890756302522 - nodes in this community are weakly interconnected._