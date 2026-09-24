# Graph Report - club-crumbs  (2026-09-24)

## Corpus Check
- 227 files · ~189,041 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1456 nodes · 3597 edges · 93 communities (72 shown, 21 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 38 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d79d39e1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Cohort
- app/page.tsx
- grants/route.ts
- requireStudent
- Club Chat — Implementation Plan (Club Crumbs)
- accessContext.ts
- popup.js
- useStore
- compilerOptions
- dashboard/certificates/page.tsx
- manifest.json
- app/layout.tsx
- Zen Focus Mode Fullscreen Timer
- apiFetch
- students/page.tsx
- dependencies
- devDependencies
- ZenMode.tsx
- readJson
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
- useLeader
- icon.tsx
- Main Workspace Dashboard
- POST
- notifications.ts
- eslint.config.mjs
- next.config.ts
- @clerk/nextjs
- cohorts.ts
- @clerk/themes
- postcss.config.mjs
- Event.ts
- uploadToUserDrive
- manage/[id]/route.ts
- dateFormat.ts
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
- isCohort
- User.ts
- task-list.tsx
- react
- chat.sql
- delete-button.tsx
- react-dom
- @supabase/supabase-js
- cn
- components.json
- SyncProvider.tsx
- authz.ts
- download/route.ts
- extension.ts
- notification-bell.tsx
- reports.sql
- limits.ts
- syncLogic.ts
- dashboard/courses/page.tsx
- leetcodeService.ts
- getRequester
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
8. `getRequester()` - 36 edges
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

## Communities (93 total, 21 thin omitted)

### Community 0 - "Cohort"
Cohesion: 0.20
Nodes (12): AddEmails(), AddResult, Grant, PendingRemove, Role, AdminContextValue, LeaderContextValue, UseClubChatOptions (+4 more)

### Community 1 - "app/page.tsx"
Cohesion: 0.07
Nodes (13): cardFor(), ChooseAccessPage(), contextString(), Identity, CLUB_ICON, CLUB_LINK, STEPS, LayoraMark() (+5 more)

### Community 2 - "grants/route.ts"
Cohesion: 0.11
Nodes (27): DELETE(), dynamic, GET(), GrantView, parseRole(), POST(), dynamic, GET() (+19 more)

### Community 3 - "requireStudent"
Cohesion: 0.15
Nodes (13): dynamic, GET(), dynamic, POST(), dynamic, GET(), DELETE(), GET() (+5 more)

### Community 4 - "Club Chat — Implementation Plan (Club Crumbs)"
Cohesion: 0.11
Nodes (18): 0. Reality check — what the original plan got wrong, 10. Testing, 11. Future work, 12. Concrete file checklist, 1. Scope (v1), 2. Data model (Supabase / Postgres), 3. Image storage, 4. API routes (Next.js route handlers) (+10 more)

### Community 5 - "accessContext.ts"
Cohesion: 0.30
Nodes (12): dynamic, POST(), dynamic, GET(), areaForContext(), areaForContextString(), contextMatchesIdentity(), CTX_COOKIE (+4 more)

### Community 6 - "popup.js"
Cohesion: 0.11
Nodes (50): handleMessage(), refresh(), respond(), api(), ApiError, cacheKey(), clearToken(), connectedServices() (+42 more)

### Community 7 - "useStore"
Cohesion: 0.09
Nodes (43): AdminAccessPage(), AdminProvider(), AdminLayout(), MENU, normalise(), YEARLESS, YearSelector(), QuickLaunchers() (+35 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 9 - "dashboard/certificates/page.tsx"
Cohesion: 0.10
Nodes (30): Uploader, CertificatePreview(), CertificateUploader, dynamic, POST(), Certificate, CertificatesPage(), isPdf() (+22 more)

### Community 10 - "manifest.json"
Cohesion: 0.09
Nodes (24): action, default_popup, default_title, background, service_worker, type, content_scripts, description (+16 more)

### Community 11 - "app/layout.tsx"
Cohesion: 0.29
Nodes (5): metadata, mulish, sora, viewport, CookieConsent()

### Community 13 - "Zen Focus Mode Fullscreen Timer"
Cohesion: 0.40
Nodes (6): Distraction-Free Chrome Removal, Space to Pause / Esc to Leave Hints, Pomodoro Session Cycle Indicator, Daily and 7-Day Focus Session Stats, Pause / Reset / Skip Timer Controls, Zen Focus Mode Fullscreen Timer

### Community 14 - "apiFetch"
Cohesion: 0.11
Nodes (27): AccessDeniedPage(), Reason, AdminOverviewPage(), Counts, SyncPage, AdminReportsPage(), LeaderboardPage(), RangeStats (+19 more)

### Community 15 - "students/page.tsx"
Cohesion: 0.11
Nodes (33): AdminContext, useAdmin(), AdminAttendancePage(), cell(), download(), Member, Record, AdminCertificatesPage() (+25 more)

### Community 16 - "dependencies"
Cohesion: 0.12
Nodes (17): axios, clsx, lucide-react, motion, next, dependencies, axios, clsx (+9 more)

### Community 17 - "devDependencies"
Cohesion: 0.11
Nodes (19): clerk, eslint, eslint-config-next, devDependencies, clerk, eslint, eslint-config-next, tailwindcss (+11 more)

### Community 18 - "ZenMode.tsx"
Cohesion: 0.28
Nodes (13): PHASE_ACCENT, ZenMode(), ZenModeProps, dayKey(), formatFocusDuration(), LOG_RETENTION_DAYS, nextPhase(), PHASE_LABEL (+5 more)

### Community 19 - "readJson"
Cohesion: 0.23
Nodes (16): AdminEventsPage(), buildGrid(), WEEKDAYS, buildGrid(), EventsPage(), toKey(), WEEKDAYS, buildGrid() (+8 more)

### Community 20 - "useStore.ts"
Cohesion: 0.13
Nodes (24): DEFAULT_POMODORO_SETTINGS, normalizeSettings(), PomodoroDay, PomodoroSettings, Activity, Course, courseBlockFor(), DEFAULT_ROUTINE (+16 more)

### Community 21 - "requireAdminCohort"
Cohesion: 0.08
Nodes (32): dynamic, GET(), dynamic, emptyCounts(), GET(), dynamic, GET(), dynamic (+24 more)

### Community 22 - "Bearer Token Pairing (extension auth)"
Cohesion: 0.21
Nodes (12): Connect gate state, Quicklaunch panel + add-link form, Quick Access popup UI (360x480, two tabs), background.js (service worker / event page), Bearer Token Pairing (extension auth), build-zip.py (dual-manifest packager), connect.js content script (token relay), Cross-browser parity (Chromium vs Gecko, three divergences) (+4 more)

### Community 23 - "DailyActivity.ts"
Cohesion: 0.17
Nodes (10): dynamic, GET(), ActivityTotalsRow, addEventPoints(), DailyActivityRow, DatabaseDailyActivityRow, EventResult, LeaderboardUser (+2 more)

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
Nodes (69): dynamic, GET(), OPTIONS(), dynamic, GET(), OPTIONS(), DELETE(), dynamic (+61 more)

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

### Community 35 - "useLeader"
Cohesion: 0.17
Nodes (14): cell(), download(), LeaderAttendancePage(), Member, Record, todayLocal(), LeaderContext, useLeader() (+6 more)

### Community 36 - "icon.tsx"
Cohesion: 0.40
Nodes (3): contentType, runtime, size

### Community 37 - "Main Workspace Dashboard"
Cohesion: 0.67
Nodes (3): Milestone Tracker & Global Stopwatch, Onboarding Portal (7-step routine wizard), Main Workspace Dashboard

### Community 39 - "notifications.ts"
Cohesion: 0.11
Nodes (32): NotificationAgent(), ICONS, NotificationCenter(), agendaAnnouncement(), AgendaEntry, alreadyNotified(), Announcement, CourseReminderInput (+24 more)

### Community 43 - "cohorts.ts"
Cohesion: 0.17
Nodes (17): dynamic, GET(), POST(), dynamic, GET(), CLUB_TOURNAMENTS, ClubTournament, cohortCanSeeResource() (+9 more)

### Community 48 - "Event.ts"
Cohesion: 0.08
Nodes (41): StaffEvent, StaffEvent, DELETE(), dynamic, GET(), POST(), at(), CoursePayload (+33 more)

### Community 49 - "uploadToUserDrive"
Cohesion: 0.48
Nodes (4): POST(), DriveError, DriveFile, uploadToUserDrive()

### Community 50 - "manage/[id]/route.ts"
Cohesion: 0.29
Nodes (9): DELETE(), dynamic, loadModifiable(), PATCH(), dynamic, GET(), POST(), pingChatChannel() (+1 more)

### Community 51 - "dateFormat.ts"
Cohesion: 0.12
Nodes (24): AdminResumesPage(), CodingEvent, MemberCodingPage(), TournamentConfig, CodingEvent, EMPTY, LeaderCodingPage(), Member (+16 more)

### Community 54 - "supabaseAdmin.ts"
Cohesion: 0.21
Nodes (7): dynamic, GET(), ALLOWED, dynamic, EXT, POST(), supabaseAdmin

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
Cohesion: 0.20
Nodes (12): ChatComposer(), ChatMessage(), ChatMessageActions, fullLabel(), initialOf(), linkify(), timeLabel(), ChatMessageList() (+4 more)

### Community 63 - "isCohort"
Cohesion: 0.14
Nodes (32): PATCH(), DELETE(), dynamic, GET(), MemberRow, POST(), resolveCohort(), DELETE() (+24 more)

### Community 64 - "User.ts"
Cohesion: 0.19
Nodes (13): DELETE(), dynamic, GET(), POST(), requireStaff(), DELETE(), dynamic, GET() (+5 more)

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

### Community 73 - "SyncProvider.tsx"
Cohesion: 0.29
Nodes (8): DashboardHome(), OnboardingPage(), OnboardingModal(), formatCourseLink(), getPlatformDisplay(), isSupabaseConfigured, supabase, formatTimeStr()

### Community 74 - "authz.ts"
Cohesion: 0.14
Nodes (24): dynamic, POST(), rateLimited(), recent, ActiveContext, cache, coerceCohort(), getGrantsForEmail() (+16 more)

### Community 75 - "download/route.ts"
Cohesion: 0.16
Nodes (12): downloadUrl(), dynamic, EXTENSION_BY_TYPE, extensionFor(), GET(), entries(), driveFileId(), CRC_TABLE (+4 more)

### Community 76 - "extension.ts"
Cohesion: 0.21
Nodes (13): Build, BUILDS, ExtensionInstall(), ExtensionPrompt(), snoozed(), BrowserFamily, CHROME_STORE_URL, detectBrowser() (+5 more)

### Community 77 - "notification-bell.tsx"
Cohesion: 0.15
Nodes (14): badgeMetrics(), clamp(), CLAPPER_SPRING, COLORS, COLUMN_SPRING, CountBadge(), DigitColumn(), digitOf() (+6 more)

### Community 79 - "limits.ts"
Cohesion: 0.16
Nodes (14): chatImageKey(), dynamic, GET(), isOld(), purgeChat(), StoredTask, LeaderQuickLaunchPage(), DeleteButton() (+6 more)

### Community 80 - "syncLogic.ts"
Cohesion: 0.13
Nodes (21): POST(), fetchProfileHtml(), fetchTotalSolves(), validateUsername(), AxiosErrorLike, ContributionDay, fetchActivityForDate(), GitHubUserResponse (+13 more)

### Community 81 - "dashboard/courses/page.tsx"
Cohesion: 0.31
Nodes (7): CoursesPage(), rearmReminder(), DateField(), Props, toDisplay(), parseTypedDate(), clearNotificationMark()

### Community 82 - "leetcodeService.ts"
Cohesion: 0.29
Nodes (9): difficultyCache, DifficultyCounts, fetchActivityForDate(), getQuestionDifficulty(), LeetCodeQuestion, LeetCodeResponse, LeetCodeSubmission, queryLeetCode() (+1 more)

### Community 83 - "getRequester"
Cohesion: 0.43
Nodes (5): dynamic, GET(), POST(), POST(), getRequester()

## Ambiguous Edges - Review These
- `Layora Architecture & System Structure` → `Next.js Agent Rules (breaking-change warning)`  [AMBIGUOUS]
  AGENTS.md · relation: conceptually_related_to

## Knowledge Gaps
- **453 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+448 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Layora Architecture & System Structure` and `Next.js Agent Rules (breaking-change warning)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Cohort` connect `Cohort` to `app/page.tsx`, `grants/route.ts`, `useLeader`, `requireStudent`, `accessContext.ts`, `Report.ts`, `useStore`, `SyncProvider.tsx`, `authz.ts`, `cohorts.ts`, `students/page.tsx`, `Event.ts`, `manage/[id]/route.ts`, `useStore.ts`, `ReportEditor.tsx`, `useClubChat.ts`, `isCohort`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `apiFetch()` connect `apiFetch` to `Cohort`, `app/page.tsx`, `useLeader`, `useStore`, `notifications.ts`, `dashboard/certificates/page.tsx`, `SyncProvider.tsx`, `students/page.tsx`, `dashboard/courses/page.tsx`, `dateFormat.ts`, `readJson`, `[id]/page.tsx`, `ReportEditor.tsx`, `useClubChat.ts`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `isCohort()` connect `isCohort` to `Report.ts`, `grants/route.ts`, `accessContext.ts`, `useStore`, `SyncProvider.tsx`, `authz.ts`, `cohorts.ts`, `students/page.tsx`, `manage/[id]/route.ts`, `requireAdminCohort`, `supabaseAdmin.ts`, `extensionData.ts`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _453 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06984126984126984 - nodes in this community are weakly interconnected._
- **Should `grants/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10793650793650794 - nodes in this community are weakly interconnected._