# Graph Report - club-crumbs  (2026-09-14)

## Corpus Check
- 185 files · ~155,090 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1149 nodes · 2947 edges · 72 communities (61 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b4d7fb20`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- link-accounts/route.ts
- cohorts.ts
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
- students/page.tsx
- dependencies
- devDependencies
- accessGrants.ts
- readJson
- useStore.ts
- roster.ts
- Bearer Token Pairing (extension auth)
- User
- syncLogic.ts (activity aggregator & points calculator)
- schema.sql
- Server-Side Database Proxy (/api/user/state)
- onboarding/page.tsx
- Layora: Autonomous AI Student Productivity Suite
- package.json
- errorMessage
- Resource Vault
- Generative Timetable Compiler
- dashboard/certificates/page.tsx
- build-zip.py
- apiFetch
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
- SyncProvider.tsx
- isCohort
- getRequester
- vercel.json
- Cohort
- draw_mark
- useStore
- DailyActivity.ts
- proxy.ts
- ZenMode.tsx
- coders-club/page.tsx
- authz.ts
- useClubChat.ts
- clubMembers.ts
- download/route.ts
- syncLogic.ts
- dashboard/courses/page.tsx
- chat.sql
- leetcodeService.ts
- apiClient.ts
- ResumePanel.tsx
- extension/page.tsx

## God Nodes (most connected - your core abstractions)
1. `apiFetch()` - 71 edges
2. `errorMessage()` - 48 edges
3. `isCohort()` - 47 edges
4. `useStore` - 44 edges
5. `readJson()` - 42 edges
6. `Cohort` - 33 edges
7. `requireClubManager()` - 32 edges
8. `formatDate()` - 32 edges
9. `getRequester()` - 31 edges
10. `requireStudent()` - 29 edges

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

## Communities (72 total, 11 thin omitted)

### Community 0 - "link-accounts/route.ts"
Cohesion: 0.21
Nodes (13): POST(), fetchProfileHtml(), fetchTotalSolves(), validateUsername(), AxiosErrorLike, ContributionDay, fetchActivityForDate(), GitHubUserResponse (+5 more)

### Community 1 - "cohorts.ts"
Cohesion: 0.05
Nodes (32): AccessDeniedPage(), Reason, dynamic, GET(), POST(), dynamic, GET(), cardFor() (+24 more)

### Community 2 - "Event.ts"
Cohesion: 0.08
Nodes (39): StaffEvent, StaffEvent, DELETE(), dynamic, GET(), POST(), dynamic, POST() (+31 more)

### Community 3 - "extensionAuth.ts"
Cohesion: 0.07
Nodes (47): dynamic, GET(), OPTIONS(), dynamic, GET(), OPTIONS(), DELETE(), dynamic (+39 more)

### Community 4 - "Club Chat — Implementation Plan (Club Crumbs)"
Cohesion: 0.11
Nodes (18): 0. Reality check — what the original plan got wrong, 10. Testing, 11. Future work, 12. Concrete file checklist, 1. Scope (v1), 2. Data model (Supabase / Postgres), 3. Image storage, 4. API routes (Next.js route handlers) (+10 more)

### Community 5 - "requireStudent"
Cohesion: 0.07
Nodes (36): Uploader, CertificateUploader, dynamic, emptyCounts(), GET(), at(), CoursePayload, dynamic (+28 more)

### Community 6 - "popup.js"
Cohesion: 0.11
Nodes (50): handleMessage(), refresh(), respond(), api(), ApiError, cacheKey(), clearToken(), connectedServices() (+42 more)

### Community 7 - "notifications.ts"
Cohesion: 0.05
Nodes (78): AdminProvider(), AdminLayout(), MENU, normalise(), YEARLESS, YearSelector(), DashboardLayout(), SettingsPage() (+70 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 9 - "AdminLog.ts"
Cohesion: 0.15
Nodes (10): dynamic, GET(), maxDuration, ADMIN_ACTIONS, AdminAction, AdminActor, AdminLogRow, cutoffIso() (+2 more)

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
Cohesion: 0.22
Nodes (21): DELETE(), dynamic, parseRole(), PATCH(), POST(), DELETE(), dynamic, GET() (+13 more)

### Community 15 - "students/page.tsx"
Cohesion: 0.14
Nodes (21): AdminContext, cell(), download(), Member, Record, PanelEmpty(), PanelError(), PanelLoading() (+13 more)

### Community 16 - "dependencies"
Cohesion: 0.12
Nodes (17): axios, @clerk/themes, framer-motion, lucide-react, next, dependencies, axios, @clerk/themes (+9 more)

### Community 17 - "devDependencies"
Cohesion: 0.12
Nodes (17): clerk, eslint, eslint-config-next, devDependencies, clerk, eslint, eslint-config-next, @tailwindcss/postcss (+9 more)

### Community 18 - "accessGrants.ts"
Cohesion: 0.24
Nodes (9): cache, coerceCohort(), emailsForRole(), getGrantsForEmail(), GrantError, GrantResult, isAdminNow(), leaderEmailsForCohort() (+1 more)

### Community 19 - "readJson"
Cohesion: 0.21
Nodes (19): AdminEventsPage(), buildGrid(), WEEKDAYS, buildGrid(), EventsPage(), toKey(), WEEKDAYS, buildGrid() (+11 more)

### Community 20 - "useStore.ts"
Cohesion: 0.13
Nodes (24): DEFAULT_POMODORO_SETTINGS, normalizeSettings(), PomodoroDay, PomodoroSettings, Activity, Course, courseBlockFor(), DEFAULT_ROUTINE (+16 more)

### Community 21 - "roster.ts"
Cohesion: 0.12
Nodes (22): GET(), dynamic, GET(), Range, VALID_RANGES, dynamic, GET(), dynamic (+14 more)

### Community 22 - "Bearer Token Pairing (extension auth)"
Cohesion: 0.21
Nodes (12): Connect gate state, Quicklaunch panel + add-link form, Quick Access popup UI (360x480, two tabs), background.js (service worker / event page), Bearer Token Pairing (extension auth), build-zip.py (dual-manifest packager), connect.js content script (token relay), Cross-browser parity (Chromium vs Gecko, three divergences) (+4 more)

### Community 23 - "User"
Cohesion: 0.24
Nodes (11): DELETE(), dynamic, GET(), POST(), requireStaff(), DELETE(), dynamic, GET() (+3 more)

### Community 24 - "syncLogic.ts (activity aggregator & points calculator)"
Cohesion: 0.20
Nodes (11): /api/user/purge (data purge), CodeChef solve-count scraper, /api/cron/daily-sync (scheduled activity sync), Gamification & Points Ledger Pipeline, GitHub Events API source, LeetCode GraphQL stats source, syncLogic.ts (activity aggregator & points calculator), certificates table & Supabase Storage bucket (+3 more)

### Community 25 - "schema.sql"
Cohesion: 0.19
Nodes (12): public, public.access_grants, public.admin_logs, public.attendance, public.certificates, public.coding_events, public.daily_activities, public.events (+4 more)

### Community 26 - "Server-Side Database Proxy (/api/user/state)"
Cohesion: 0.27
Nodes (10): Clerk Authentication, Local Demo Mode (missing Supabase keys fallback), Supabase Row-Level Security Isolation, Server-Side Database Proxy (/api/user/state), /api/calendar/sync (Google Calendar push), /api/user/state (secure Supabase state proxy), Clerk Middleware (route protection & token check), isAdminEmail admin allowlist (+2 more)

### Community 27 - "onboarding/page.tsx"
Cohesion: 0.30
Nodes (9): DashboardHome(), PlannerPage(), OnboardingPage(), OnboardingModal(), formatCourseLink(), getPlatformDisplay(), NotificationPermissionState, isBlockForCourse() (+1 more)

### Community 28 - "Layora: Autonomous AI Student Productivity Suite"
Cohesion: 0.28
Nodes (9): Next.js Agent Rules (breaking-change warning), CLAUDE.md AGENTS.md include, Known limit: a launcher added in the extension can be overwritten, Admin Root Console, Client Write-Timestamp Queue (anti-race-condition), Layora: Autonomous AI Student Productivity Suite, SyncProvider (Zustand synchronizer & realtime listener), Layora Architecture & System Structure (+1 more)

### Community 29 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 30 - "errorMessage"
Cohesion: 0.21
Nodes (21): useAdmin(), AdminAttendancePage(), AdminCertificatesPage(), useSectionData(), AdminLeaderboardPage(), AdminLogsPage(), AdminResumesPage(), ResumeEntry (+13 more)

### Community 31 - "Resource Vault"
Cohesion: 0.29
Nodes (8): Courses panel, Known limit: a course without a link opens Layora instead, Google Drive webViewLink Fallback Construction, No Study Materials on Supabase Storage (privacy stance), Online Course Tracker, Resource Vault, Vercel 4.5MB Upload Size Guard, /api/resources/upload-drive (Google Drive proxy upload)

### Community 32 - "Generative Timetable Compiler"
Cohesion: 0.29
Nodes (8): Google site-verification token file, Generative Timetable Compiler, Google Calendar Sync, Groq API (LLM inference), Study Copilot (LLM assistant), /api/ai/planner (weekly timetable generator), /api/ai/proactive (AI academic mentor), Duality Rule (task + timetable block bound together)

### Community 33 - "dashboard/certificates/page.tsx"
Cohesion: 0.17
Nodes (16): CertificatePreview(), Certificate, CertificatesPage(), isPdf(), PickResult, validateCertificateFile(), ACCENTS, CertificateGroups() (+8 more)

### Community 34 - "build-zip.py"
Cohesion: 0.47
Nodes (5): build(), firefox_manifest(), main(), Package the extension for distribution. Writes two zips from the one source…, The Chromium manifest, with the three Gecko differences applied.

### Community 35 - "apiFetch"
Cohesion: 0.13
Nodes (21): AdminAccessPage(), cell(), download(), LeaderAttendancePage(), Member, Record, todayLocal(), CodingEvent (+13 more)

### Community 36 - "icon.tsx"
Cohesion: 0.40
Nodes (3): contentType, runtime, size

### Community 37 - "Main Workspace Dashboard"
Cohesion: 0.67
Nodes (3): Milestone Tracker & Global Stopwatch, Onboarding Portal (7-step routine wizard), Main Workspace Dashboard

### Community 48 - "SyncProvider.tsx"
Cohesion: 0.13
Nodes (11): geistMono, geistSans, hankenGrotesk, inter, jetbrainsMono, metadata, viewport, CookieConsent() (+3 more)

### Community 50 - "isCohort"
Cohesion: 0.18
Nodes (19): DELETE(), dynamic, loadModifiable(), PATCH(), dynamic, GET(), POST(), ALLOWED (+11 more)

### Community 51 - "getRequester"
Cohesion: 0.18
Nodes (13): DELETE(), describeStudent(), dynamic, POST(), dynamic, GET(), POST(), POST() (+5 more)

### Community 54 - "Cohort"
Cohesion: 0.21
Nodes (11): AddEmails(), AddResult, Grant, PendingRemove, Role, AdminContextValue, GrantView, LeaderContextValue (+3 more)

### Community 55 - "draw_mark"
Cohesion: 0.40
Nodes (5): Image, draw_mark(), main(), Generate every Layora raster mark from one definition. The mark is a rounded…, One mark, drawn at `size` pixels square.

### Community 56 - "useStore"
Cohesion: 0.24
Nodes (8): QuickLaunchers(), LeaderboardPage(), RangeStats, UserStats, TasksPage(), LeaderQuickLaunchPage(), Task, useStore

### Community 57 - "DailyActivity.ts"
Cohesion: 0.19
Nodes (10): dynamic, dynamic, GET(), ActivityTotalsRow, DailyActivity, DailyActivityRow, DatabaseDailyActivityRow, LeaderboardUser (+2 more)

### Community 59 - "ZenMode.tsx"
Cohesion: 0.28
Nodes (13): PHASE_ACCENT, ZenMode(), ZenModeProps, dayKey(), formatFocusDuration(), LOG_RETENTION_DAYS, nextPhase(), PHASE_LABEL (+5 more)

### Community 60 - "coders-club/page.tsx"
Cohesion: 0.25
Nodes (5): Challenge, CHALLENGES, FACILITATOR_NOTES, MASTHEAD, metadata

### Community 61 - "authz.ts"
Cohesion: 0.17
Nodes (15): GET(), dynamic, GET(), dynamic, GET(), POST(), ActiveContext, Grant (+7 more)

### Community 62 - "useClubChat.ts"
Cohesion: 0.23
Nodes (11): ChatComposer(), ChatMessage(), ChatMessageActions, fullLabel(), initialOf(), linkify(), timeLabel(), ChatMessageList() (+3 more)

### Community 63 - "clubMembers.ts"
Cohesion: 0.31
Nodes (7): dynamic, GET(), dynamic, GET(), memberEmailsForCohort(), ClubMember, memberListForCohort()

### Community 64 - "download/route.ts"
Cohesion: 0.16
Nodes (11): downloadUrl(), dynamic, EXTENSION_BY_TYPE, extensionFor(), GET(), entries(), CRC_TABLE, DirectoryRecord (+3 more)

### Community 65 - "syncLogic.ts"
Cohesion: 0.22
Nodes (11): maxDuration, POST(), DEFAULT_SLICE_BUDGET_MS, DEFAULT_SLICE_SIZE, runSyncForDate(), runSyncSlice(), sleep(), SliceOptions (+3 more)

### Community 66 - "dashboard/courses/page.tsx"
Cohesion: 0.31
Nodes (7): CoursesPage(), rearmReminder(), DateField(), Props, toDisplay(), parseTypedDate(), clearNotificationMark()

### Community 68 - "leetcodeService.ts"
Cohesion: 0.29
Nodes (9): difficultyCache, DifficultyCounts, fetchActivityForDate(), getQuestionDifficulty(), LeetCodeQuestion, LeetCodeResponse, LeetCodeSubmission, queryLeetCode() (+1 more)

### Community 69 - "apiClient.ts"
Cohesion: 0.31
Nodes (6): AdminOverviewPage(), Counts, SyncPage, ApiError, apiJson(), toDateKey()

### Community 70 - "ResumePanel.tsx"
Cohesion: 0.47
Nodes (5): isPdf(), PickResult, Resume, ResumePanel(), validateResumeFile()

### Community 71 - "extension/page.tsx"
Cohesion: 0.50
Nodes (4): Connection, ConnectState, ExtensionPage(), shortLabel()

## Ambiguous Edges - Review These
- `Layora Architecture & System Structure` → `Next.js Agent Rules (breaking-change warning)`  [AMBIGUOUS]
  AGENTS.md · relation: conceptually_related_to

## Knowledge Gaps
- **333 isolated node(s):** `eslintConfig`, `DEFAULT_SERVICE`, `manifest_version`, `name`, `version` (+328 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Layora Architecture & System Structure` and `Next.js Agent Rules (breaking-change warning)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Cohort` connect `Cohort` to `cohorts.ts`, `Event.ts`, `apiFetch`, `requireStudent`, `notifications.ts`, `accessContext.ts`, `grants/route.ts`, `students/page.tsx`, `SyncProvider.tsx`, `accessGrants.ts`, `isCohort`, `useStore.ts`, `roster.ts`, `authz.ts`, `useClubChat.ts`, `clubMembers.ts`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `isCohort()` connect `isCohort` to `cohorts.ts`, `Event.ts`, `notifications.ts`, `accessContext.ts`, `grants/route.ts`, `students/page.tsx`, `accessGrants.ts`, `roster.ts`, `onboarding/page.tsx`, `authz.ts`, `clubMembers.ts`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `apiFetch()` connect `apiFetch` to `cohorts.ts`, `dashboard/certificates/page.tsx`, `dashboard/courses/page.tsx`, `apiClient.ts`, `ResumePanel.tsx`, `notifications.ts`, `extension/page.tsx`, `students/page.tsx`, `SyncProvider.tsx`, `readJson`, `Cohort`, `useStore`, `useClubChat.ts`, `onboarding/page.tsx`, `errorMessage`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `DEFAULT_SERVICE`, `manifest_version` to the rest of the system?**
  _333 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cohorts.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05325814536340852 - nodes in this community are weakly interconnected._
- **Should `Event.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08295625942684766 - nodes in this community are weakly interconnected._