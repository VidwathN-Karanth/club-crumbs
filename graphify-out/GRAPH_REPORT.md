# Graph Report - club-crumbs  (2026-09-15)

## Corpus Check
- 200 files · ~169,963 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1227 nodes · 3181 edges · 79 communities (66 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `618a98de`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- link-accounts/route.ts
- app/page.tsx
- Event.ts
- extensionAuth.ts
- Club Chat — Implementation Plan (Club Crumbs)
- requireStudent
- popup.js
- notifications.ts
- compilerOptions
- AdminLog.ts
- manifest.json
- accessContext.ts
- Zen Focus Mode Fullscreen Timer
- grants/route.ts
- apiClient.ts
- dependencies
- devDependencies
- authz.ts
- admin/events/page.tsx
- useStore.ts
- emailsForCohort
- Bearer Token Pairing (extension auth)
- User.ts
- syncLogic.ts (activity aggregator & points calculator)
- schema.sql
- Server-Side Database Proxy (/api/user/state)
- ReportEditor.tsx
- Layora: Autonomous AI Student Productivity Suite
- package.json
- dateFormat.ts
- Resource Vault
- Generative Timetable Compiler
- Cohort
- build-zip.py
- apiFetch
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
- SyncProvider.tsx
- isCohort
- useStore
- vercel.json
- ZenMode.tsx
- draw_mark
- docx
- DailyActivity.ts
- proxy.ts
- lucide-react
- coders-club/page.tsx
- requireAdmin
- useClubChat.ts
- supabaseAdmin.ts
- dashboard/certificates/page.tsx
- syncLogic.ts
- react
- chat.sql
- leetcodeService.ts
- leader/layout.tsx
- react-dom
- students/page.tsx
- dashboard/layout.tsx
- onboarding/page.tsx
- calendar/courses/route.ts
- NotificationCenter.tsx
- dashboard/settings/page.tsx
- resumes/route.ts
- reports.sql

## God Nodes (most connected - your core abstractions)
1. `apiFetch()` - 81 edges
2. `errorMessage()` - 56 edges
3. `isCohort()` - 52 edges
4. `readJson()` - 50 edges
5. `useStore` - 44 edges
6. `requireClubManager()` - 41 edges
7. `Cohort` - 39 edges
8. `formatDate()` - 32 edges
9. `getRequester()` - 31 edges
10. `supabaseAdmin` - 30 edges

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

## Communities (79 total, 13 thin omitted)

### Community 0 - "link-accounts/route.ts"
Cohesion: 0.21
Nodes (13): POST(), fetchProfileHtml(), fetchTotalSolves(), validateUsername(), AxiosErrorLike, ContributionDay, fetchActivityForDate(), GitHubUserResponse (+5 more)

### Community 1 - "app/page.tsx"
Cohesion: 0.10
Nodes (8): cardFor(), ChooseAccessPage(), contextString(), Identity, CLUB_ICON, CLUB_LINK, STEPS, CLUB_META

### Community 2 - "Event.ts"
Cohesion: 0.11
Nodes (26): DELETE(), dynamic, GET(), POST(), dynamic, POST(), DELETE(), dynamic (+18 more)

### Community 3 - "extensionAuth.ts"
Cohesion: 0.08
Nodes (45): dynamic, GET(), OPTIONS(), dynamic, GET(), OPTIONS(), DELETE(), dynamic (+37 more)

### Community 4 - "Club Chat — Implementation Plan (Club Crumbs)"
Cohesion: 0.11
Nodes (18): 0. Reality check — what the original plan got wrong, 10. Testing, 11. Future work, 12. Concrete file checklist, 1. Scope (v1), 2. Data model (Supabase / Postgres), 3. Image storage, 4. API routes (Next.js route handlers) (+10 more)

### Community 5 - "requireStudent"
Cohesion: 0.14
Nodes (16): dynamic, GET(), dynamic, POST(), dynamic, GET(), DELETE(), dynamic (+8 more)

### Community 6 - "popup.js"
Cohesion: 0.11
Nodes (50): handleMessage(), refresh(), respond(), api(), ApiError, cacheKey(), clearToken(), connectedServices() (+42 more)

### Community 7 - "notifications.ts"
Cohesion: 0.13
Nodes (26): NotificationAgent(), agendaAnnouncement(), AgendaEntry, Announcement, CourseReminderInput, DEFAULT_COURSE_REMINDER_TIME, dueCourseReminders(), DueReminder (+18 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 9 - "AdminLog.ts"
Cohesion: 0.12
Nodes (18): dynamic, GET(), POST(), maxDuration, POST(), dynamic, GET(), maxDuration (+10 more)

### Community 10 - "manifest.json"
Cohesion: 0.09
Nodes (23): action, default_popup, default_title, background, service_worker, type, content_scripts, description (+15 more)

### Community 11 - "accessContext.ts"
Cohesion: 0.23
Nodes (15): dynamic, POST(), dynamic, GET(), areaForContext(), contextMatchesIdentity(), CTX_COOKIE, identityToContext() (+7 more)

### Community 13 - "Zen Focus Mode Fullscreen Timer"
Cohesion: 0.40
Nodes (6): Distraction-Free Chrome Removal, Space to Pause / Esc to Leave Hints, Pomodoro Session Cycle Indicator, Daily and 7-Day Focus Session Stats, Pause / Reset / Skip Timer Controls, Zen Focus Mode Fullscreen Timer

### Community 14 - "grants/route.ts"
Cohesion: 0.19
Nodes (24): DELETE(), dynamic, GrantView, parseRole(), PATCH(), POST(), DELETE(), dynamic (+16 more)

### Community 15 - "apiClient.ts"
Cohesion: 0.11
Nodes (33): AdminContext, useAdmin(), AdminAttendancePage(), cell(), download(), Member, Record, AdminCertificatesPage() (+25 more)

### Community 16 - "dependencies"
Cohesion: 0.12
Nodes (17): axios, @clerk/nextjs, @clerk/themes, framer-motion, grapesjs, next, dependencies, axios (+9 more)

### Community 17 - "devDependencies"
Cohesion: 0.11
Nodes (19): clerk, eslint, eslint-config-next, devDependencies, clerk, eslint, eslint-config-next, tailwindcss (+11 more)

### Community 18 - "authz.ts"
Cohesion: 0.14
Nodes (24): dynamic, GET(), POST(), ActiveContext, cache, coerceCohort(), emailsForRole(), getGrantsForEmail() (+16 more)

### Community 19 - "admin/events/page.tsx"
Cohesion: 0.16
Nodes (25): AdminEventsPage(), buildGrid(), StaffEvent, WEEKDAYS, StaffEvent, buildGrid(), CalendarEvent, EventsPage() (+17 more)

### Community 20 - "useStore.ts"
Cohesion: 0.13
Nodes (23): DEFAULT_POMODORO_SETTINGS, normalizeSettings(), PomodoroDay, Activity, Course, courseBlockFor(), DEFAULT_ROUTINE, Routine (+15 more)

### Community 21 - "emailsForCohort"
Cohesion: 0.14
Nodes (15): dynamic, GET(), dynamic, GET(), Range, VALID_RANGES, dynamic, GET() (+7 more)

### Community 22 - "Bearer Token Pairing (extension auth)"
Cohesion: 0.21
Nodes (12): Connect gate state, Quicklaunch panel + add-link form, Quick Access popup UI (360x480, two tabs), background.js (service worker / event page), Bearer Token Pairing (extension auth), build-zip.py (dual-manifest packager), connect.js content script (token relay), Cross-browser parity (Chromium vs Gecko, three divergences) (+4 more)

### Community 23 - "User.ts"
Cohesion: 0.17
Nodes (14): DELETE(), dynamic, GET(), POST(), requireStaff(), DELETE(), dynamic, GET() (+6 more)

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
Cohesion: 0.14
Nodes (28): ReportEditor, CollegeHeaderConfig, DEFAULT_COLLEGE_HEADER, getCollegeHeaderHtml(), MITE_LOGO_BASE64, addNewReportPage(), CANVAS_CSS, createReportPageDefinition() (+20 more)

### Community 28 - "Layora: Autonomous AI Student Productivity Suite"
Cohesion: 0.28
Nodes (9): Next.js Agent Rules (breaking-change warning), CLAUDE.md AGENTS.md include, Known limit: a launcher added in the extension can be overwritten, Admin Root Console, Client Write-Timestamp Queue (anti-race-condition), Layora: Autonomous AI Student Productivity Suite, SyncProvider (Zustand synchronizer & realtime listener), Layora Architecture & System Structure (+1 more)

### Community 29 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 30 - "dateFormat.ts"
Cohesion: 0.15
Nodes (20): CodingEvent, MemberCodingPage(), TournamentConfig, CoursesPage(), rearmReminder(), CodingEvent, EMPTY, LeaderCodingPage() (+12 more)

### Community 31 - "Resource Vault"
Cohesion: 0.29
Nodes (8): Courses panel, Known limit: a course without a link opens Layora instead, Google Drive webViewLink Fallback Construction, No Study Materials on Supabase Storage (privacy stance), Online Course Tracker, Resource Vault, Vercel 4.5MB Upload Size Guard, /api/resources/upload-drive (Google Drive proxy upload)

### Community 32 - "Generative Timetable Compiler"
Cohesion: 0.29
Nodes (8): Google site-verification token file, Generative Timetable Compiler, Google Calendar Sync, Groq API (LLM inference), Study Copilot (LLM assistant), /api/ai/planner (weekly timetable generator), /api/ai/proactive (AI academic mentor), Duality Rule (task + timetable block bound together)

### Community 33 - "Cohort"
Cohesion: 0.10
Nodes (24): AddEmails(), AddResult, Grant, PendingRemove, Role, AdminContextValue, DELETE(), dynamic (+16 more)

### Community 34 - "build-zip.py"
Cohesion: 0.47
Nodes (5): build(), firefox_manifest(), main(), Package the extension for distribution. Writes two zips from the one source…, The Chromium manifest, with the three Gecko differences applied.

### Community 35 - "apiFetch"
Cohesion: 0.10
Nodes (37): AdminAccessPage(), AdminReportsPage(), AdminSettingsPage(), Connection, shortLabel(), Connection, ConnectState, ExtensionPage() (+29 more)

### Community 36 - "icon.tsx"
Cohesion: 0.40
Nodes (3): contentType, runtime, size

### Community 37 - "Main Workspace Dashboard"
Cohesion: 0.67
Nodes (3): Milestone Tracker & Global Stopwatch, Onboarding Portal (7-step routine wizard), Main Workspace Dashboard

### Community 39 - "admin/layout.tsx"
Cohesion: 0.19
Nodes (15): AdminProvider(), AdminLayout(), MENU, normalise(), YEARLESS, YearSelector(), AdminChatLauncher(), ChatLauncher() (+7 more)

### Community 43 - "cohorts.ts"
Cohesion: 0.15
Nodes (18): dynamic, GET(), POST(), dynamic, GET(), CLUB_TOURNAMENTS, ClubTournament, cohortCanSeeResource() (+10 more)

### Community 44 - "extension.ts"
Cohesion: 0.18
Nodes (16): Build, BUILDS, ExtensionInstall(), dismissedRecently(), ExtensionNudge(), ExtensionPrompt(), snoozed(), BrowserFamily (+8 more)

### Community 48 - "SyncProvider.tsx"
Cohesion: 0.14
Nodes (12): geistMono, geistSans, hankenGrotesk, inter, jetbrainsMono, metadata, viewport, CookieConsent() (+4 more)

### Community 50 - "isCohort"
Cohesion: 0.16
Nodes (21): DELETE(), dynamic, loadModifiable(), PATCH(), dynamic, GET(), POST(), ALLOWED (+13 more)

### Community 51 - "useStore"
Cohesion: 0.17
Nodes (12): AccessDeniedPage(), Reason, QuickLaunchers(), LeaderboardPage(), RangeStats, UserStats, PlannerPage(), TasksPage() (+4 more)

### Community 54 - "ZenMode.tsx"
Cohesion: 0.26
Nodes (14): PHASE_ACCENT, ZenMode(), ZenModeProps, dayKey(), formatFocusDuration(), LOG_RETENTION_DAYS, nextPhase(), PHASE_LABEL (+6 more)

### Community 55 - "draw_mark"
Cohesion: 0.40
Nodes (5): Image, draw_mark(), main(), Generate every Layora raster mark from one definition. The mark is a rounded…, One mark, drawn at `size` pixels square.

### Community 57 - "DailyActivity.ts"
Cohesion: 0.22
Nodes (9): dynamic, GET(), ActivityTotalsRow, DailyActivity, DailyActivityRow, DatabaseDailyActivityRow, LeaderboardUser, mapActivityRow() (+1 more)

### Community 60 - "coders-club/page.tsx"
Cohesion: 0.25
Nodes (5): Challenge, CHALLENGES, FACILITATOR_NOTES, MASTHEAD, metadata

### Community 61 - "requireAdmin"
Cohesion: 0.31
Nodes (8): GET(), dynamic, GET(), DELETE(), describeStudent(), dynamic, POST(), requireAdmin()

### Community 62 - "useClubChat.ts"
Cohesion: 0.23
Nodes (11): ChatComposer(), ChatMessage(), ChatMessageActions, fullLabel(), initialOf(), linkify(), timeLabel(), ChatMessageList() (+3 more)

### Community 63 - "supabaseAdmin.ts"
Cohesion: 0.16
Nodes (14): dynamic, GET(), dynamic, GET(), dynamic, GET(), ALLOWED, dynamic (+6 more)

### Community 64 - "dashboard/certificates/page.tsx"
Cohesion: 0.07
Nodes (36): Uploader, CertificateUploader, dynamic, emptyCounts(), GET(), downloadUrl(), dynamic, EXTENSION_BY_TYPE (+28 more)

### Community 65 - "syncLogic.ts"
Cohesion: 0.28
Nodes (8): DEFAULT_SLICE_BUDGET_MS, DEFAULT_SLICE_SIZE, runSyncForDate(), sleep(), SliceOptions, SliceResult, SyncDetail, SyncStats

### Community 68 - "leetcodeService.ts"
Cohesion: 0.29
Nodes (9): difficultyCache, DifficultyCounts, fetchActivityForDate(), getQuestionDifficulty(), LeetCodeQuestion, LeetCodeResponse, LeetCodeSubmission, queryLeetCode() (+1 more)

### Community 69 - "leader/layout.tsx"
Cohesion: 0.29
Nodes (7): leaderCohortFromContext(), LeaderLayout(), MENU, normalise(), LeaderProvider(), LeaderChatLauncher(), SwitchRoleButton()

### Community 71 - "students/page.tsx"
Cohesion: 0.20
Nodes (12): CertificatePreview(), AdminStudentsPage(), DAYS, formatLastSync(), Tab, TABS, TelemetryUser, ACCENTS (+4 more)

### Community 72 - "dashboard/layout.tsx"
Cohesion: 0.24
Nodes (6): DashboardLayout(), LayoraMark(), LayoraMarkProps, MARK_PURPLE, formatShortDate(), resolveScheduleOverlaps()

### Community 73 - "onboarding/page.tsx"
Cohesion: 0.45
Nodes (6): DashboardHome(), OnboardingPage(), OnboardingModal(), formatCourseLink(), getPlatformDisplay(), formatTimeStr()

### Community 74 - "calendar/courses/route.ts"
Cohesion: 0.39
Nodes (7): at(), CoursePayload, dynamic, POST(), toDateKey(), untilStamp(), wallClock()

### Community 75 - "NotificationCenter.tsx"
Cohesion: 0.33
Nodes (6): ICONS, NotificationCenter(), onToast(), OPEN_CHAT_EVENT, Toast, ToastKind

### Community 76 - "dashboard/settings/page.tsx"
Cohesion: 0.53
Nodes (5): SettingsPage(), alreadyNotified(), clearTodaysNotificationMarks(), diagnoseCourseReminders(), NotificationPermissionState

### Community 77 - "resumes/route.ts"
Cohesion: 0.67
Nodes (3): dynamic, GET(), leaderEmailsForCohort()

## Ambiguous Edges - Review These
- `Layora Architecture & System Structure` → `Next.js Agent Rules (breaking-change warning)`  [AMBIGUOUS]
  AGENTS.md · relation: conceptually_related_to

## Knowledge Gaps
- **349 isolated node(s):** `eslintConfig`, `DEFAULT_SERVICE`, `manifest_version`, `name`, `version` (+344 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Layora Architecture & System Structure` and `Next.js Agent Rules (breaking-change warning)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Cohort` connect `Cohort` to `app/page.tsx`, `Event.ts`, `apiFetch`, `leader/layout.tsx`, `requireStudent`, `admin/layout.tsx`, `accessContext.ts`, `cohorts.ts`, `grants/route.ts`, `apiClient.ts`, `SyncProvider.tsx`, `authz.ts`, `isCohort`, `useStore.ts`, `ReportEditor.tsx`, `useClubChat.ts`, `supabaseAdmin.ts`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `apiFetch()` connect `apiFetch` to `dashboard/certificates/page.tsx`, `Cohort`, `app/page.tsx`, `leader/layout.tsx`, `admin/layout.tsx`, `students/page.tsx`, `notifications.ts`, `dashboard/settings/page.tsx`, `extension.ts`, `apiClient.ts`, `SyncProvider.tsx`, `admin/events/page.tsx`, `useStore`, `useClubChat.ts`, `ReportEditor.tsx`, `dateFormat.ts`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `isCohort()` connect `isCohort` to `Cohort`, `Event.ts`, `leader/layout.tsx`, `admin/layout.tsx`, `onboarding/page.tsx`, `cohorts.ts`, `accessContext.ts`, `grants/route.ts`, `apiClient.ts`, `authz.ts`, `emailsForCohort`, `supabaseAdmin.ts`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `DEFAULT_SERVICE`, `manifest_version` to the rest of the system?**
  _349 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09956709956709957 - nodes in this community are weakly interconnected._
- **Should `Event.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11411411411411411 - nodes in this community are weakly interconnected._