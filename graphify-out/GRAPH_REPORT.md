# Graph Report - club-crumbs  (2026-09-12)

## Corpus Check
- 172 files · ~153,569 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1140 nodes · 2814 edges · 61 communities (49 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 34 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d41b0b9b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DailyActivity.ts
- cohorts.ts
- recurrence.ts
- extensionAuth.ts
- apiFetch
- requireStudent
- popup.js
- notifications.ts
- compilerOptions
- daily-sync/route.ts
- manifest.json
- calendar/courses/route.ts
- Zen Focus Mode Fullscreen Timer
- accessContext.ts
- judge.ts
- dependencies
- devDependencies
- solve/page.tsx
- syncLogic.ts
- useStore.ts
- requireAdminCohort
- Bearer Token Pairing (extension auth)
- app/layout.tsx
- syncLogic.ts (activity aggregator & points calculator)
- schema.sql
- Server-Side Database Proxy (/api/user/state)
- leetcodeService.ts
- Layora: Autonomous AI Student Productivity Suite
- package.json
- codingAuth.ts
- Resource Vault
- Generative Timetable Compiler
- dashboard/certificates/page.tsx
- build-zip.py
- Free self-hosted judge (Oracle Cloud + Judge0)
- icon.tsx
- Main Workspace Dashboard
- POST
- @clerk/nextjs
- eslint.config.mjs
- next.config.ts
- guardContest
- zustand
- coding/problems/[pid]/route.ts
- postcss.config.mjs
- githubService.ts
- @monaco-editor/react
- next
- vercel.json
- authz.ts
- draw_mark
- react
- react-markdown
- remark-gfm
- coders-club/page.tsx

## God Nodes (most connected - your core abstractions)
1. `apiFetch()` - 75 edges
2. `errorMessage()` - 48 edges
3. `useStore` - 43 edges
4. `readJson()` - 42 edges
5. `getRequester()` - 32 edges
6. `supabaseAdmin` - 32 edges
7. `isCohort()` - 30 edges
8. `Cohort` - 28 edges
9. `formatDate()` - 28 edges
10. `requireStudent()` - 25 edges

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

## Communities (61 total, 12 thin omitted)

### Community 0 - "DailyActivity.ts"
Cohesion: 0.16
Nodes (12): dynamic, Range, VALID_RANGES, dynamic, GET(), ActivityTotalsRow, DailyActivity, DailyActivityRow (+4 more)

### Community 1 - "cohorts.ts"
Cohesion: 0.05
Nodes (34): AdminProvider(), AdminLayout(), MENU, normalise(), YEARLESS, YearSelector(), cardFor(), ChooseAccessPage() (+26 more)

### Community 2 - "recurrence.ts"
Cohesion: 0.10
Nodes (33): StaffEvent, StaffEvent, DELETE(), dynamic, GET(), POST(), dynamic, POST() (+25 more)

### Community 3 - "extensionAuth.ts"
Cohesion: 0.08
Nodes (45): dynamic, GET(), OPTIONS(), dynamic, GET(), OPTIONS(), DELETE(), dynamic (+37 more)

### Community 4 - "apiFetch"
Cohesion: 0.05
Nodes (96): AdminAccessPage(), AdminContext, useAdmin(), AdminCertificatesPage(), PanelEmpty(), PanelError(), PanelLoading(), SectionHeader() (+88 more)

### Community 5 - "requireStudent"
Cohesion: 0.20
Nodes (12): GET(), DELETE(), DELETE(), dynamic, GET(), POST(), POST(), requireStudent() (+4 more)

### Community 6 - "popup.js"
Cohesion: 0.11
Nodes (50): handleMessage(), refresh(), respond(), api(), ApiError, cacheKey(), clearToken(), connectedServices() (+42 more)

### Community 7 - "notifications.ts"
Cohesion: 0.07
Nodes (55): PlannerPage(), SettingsPage(), Build, BUILDS, ExtensionInstall(), ExtensionPrompt(), snoozed(), NotificationAgent() (+47 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 9 - "daily-sync/route.ts"
Cohesion: 0.25
Nodes (5): dynamic, GET(), maxDuration, cutoffIso(), RETENTION_DAYS

### Community 10 - "manifest.json"
Cohesion: 0.09
Nodes (23): action, default_popup, default_title, background, service_worker, type, content_scripts, description (+15 more)

### Community 11 - "calendar/courses/route.ts"
Cohesion: 0.39
Nodes (7): at(), CoursePayload, dynamic, POST(), toDateKey(), untilStamp(), wallClock()

### Community 13 - "Zen Focus Mode Fullscreen Timer"
Cohesion: 0.40
Nodes (6): Distraction-Free Chrome Removal, Space to Pause / Esc to Leave Hints, Pomodoro Session Cycle Indicator, Daily and 7-Day Focus Session Stats, Pause / Reset / Skip Timer Controls, Zen Focus Mode Fullscreen Timer

### Community 14 - "accessContext.ts"
Cohesion: 0.17
Nodes (20): dynamic, POST(), dynamic, GET(), ActiveContext, areaForContext(), contextMatchesIdentity(), CTX_COOKIE (+12 more)

### Community 15 - "judge.ts"
Cohesion: 0.16
Nodes (16): dynamic, POST(), b64(), CaseInput, CaseResult, config(), fromB64(), JUDGE0_LANGUAGE_ID (+8 more)

### Community 16 - "dependencies"
Cohesion: 0.12
Nodes (17): axios, @clerk/themes, framer-motion, lucide-react, monaco-editor, dependencies, axios, @clerk/themes (+9 more)

### Community 17 - "devDependencies"
Cohesion: 0.11
Nodes (19): clerk, eslint, eslint-config-next, devDependencies, clerk, eslint, eslint-config-next, tailwindcss (+11 more)

### Community 18 - "solve/page.tsx"
Cohesion: 0.16
Nodes (17): codeKey(), fmtRemaining(), loadCode(), MonacoEditor, ProblemDetail, ProblemSummary, RunCase, Sample (+9 more)

### Community 19 - "syncLogic.ts"
Cohesion: 0.15
Nodes (17): maxDuration, POST(), POST(), fetchProfileHtml(), fetchTotalSolves(), validateUsername(), fetchTotalSolves(), DEFAULT_SLICE_BUDGET_MS (+9 more)

### Community 20 - "useStore.ts"
Cohesion: 0.05
Nodes (67): AccessDeniedPage(), Reason, QuickLaunchers(), CoursesPage(), rearmReminder(), DashboardLayout(), LeaderboardPage(), RangeStats (+59 more)

### Community 21 - "requireAdminCohort"
Cohesion: 0.19
Nodes (13): dynamic, GET(), dynamic, GET(), Range, VALID_RANGES, dynamic, GET() (+5 more)

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
Cohesion: 0.20
Nodes (15): public, public.access_grants, public.admin_logs, public.certificates, public.coding_contests, public.coding_problems, public.coding_sessions, public.coding_submissions (+7 more)

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

### Community 30 - "codingAuth.ts"
Cohesion: 0.17
Nodes (14): dynamic, GET(), dynamic, POST(), dynamic, GET(), ContestRow, Err (+6 more)

### Community 31 - "Resource Vault"
Cohesion: 0.29
Nodes (8): Courses panel, Known limit: a course without a link opens Layora instead, Google Drive webViewLink Fallback Construction, No Study Materials on Supabase Storage (privacy stance), Online Course Tracker, Resource Vault, Vercel 4.5MB Upload Size Guard, /api/resources/upload-drive (Google Drive proxy upload)

### Community 32 - "Generative Timetable Compiler"
Cohesion: 0.29
Nodes (8): Google site-verification token file, Generative Timetable Compiler, Google Calendar Sync, Groq API (LLM inference), Study Copilot (LLM assistant), /api/ai/planner (weekly timetable generator), /api/ai/proactive (AI academic mentor), Duality Rule (task + timetable block bound together)

### Community 33 - "dashboard/certificates/page.tsx"
Cohesion: 0.06
Nodes (47): Uploader, CertificatePreview(), CertificateUploader, dynamic, emptyCounts(), GET(), downloadUrl(), dynamic (+39 more)

### Community 34 - "build-zip.py"
Cohesion: 0.47
Nodes (5): build(), firefox_manifest(), main(), Package the extension for distribution. Writes two zips from the one source…, The Chromium manifest, with the three Gecko differences applied.

### Community 35 - "Free self-hosted judge (Oracle Cloud + Judge0)"
Cohesion: 0.17
Nodes (11): 0. The one gotcha to know first, 1. Create the Oracle Cloud account, 2. Create the VM, 3. Open the judge port, 4. SSH in, 5. Prepare the host, 6. Run Judge0, 7. Give the values to Club Crumbs (+3 more)

### Community 36 - "icon.tsx"
Cohesion: 0.40
Nodes (3): contentType, runtime, size

### Community 37 - "Main Workspace Dashboard"
Cohesion: 0.67
Nodes (3): Milestone Tracker & Global Stopwatch, Onboarding Portal (7-step routine wizard), Main Workspace Dashboard

### Community 42 - "guardContest"
Cohesion: 0.31
Nodes (8): dynamic, POST(), assertPublishable(), DELETE(), dynamic, GET(), PATCH(), guardContest()

### Community 44 - "coding/problems/[pid]/route.ts"
Cohesion: 0.33
Nodes (7): DELETE(), dynamic, GET(), PATCH(), dynamic, PUT(), guardProblem()

### Community 48 - "githubService.ts"
Cohesion: 0.32
Nodes (7): AxiosErrorLike, ContributionDay, fetchActivityForDate(), GitHubUserResponse, GitHubValidationError, queryGitHub(), validateUsername()

### Community 54 - "authz.ts"
Cohesion: 0.05
Nodes (91): AddEmails(), AddResult, Grant, PendingRemove, Role, AdminContextValue, DELETE(), dynamic (+83 more)

### Community 55 - "draw_mark"
Cohesion: 0.40
Nodes (5): Image, draw_mark(), main(), Generate every Layora raster mark from one definition. The mark is a rounded…, One mark, drawn at `size` pixels square.

### Community 60 - "coders-club/page.tsx"
Cohesion: 0.25
Nodes (5): Challenge, CHALLENGES, FACILITATOR_NOTES, MASTHEAD, metadata

## Ambiguous Edges - Review These
- `Layora Architecture & System Structure` → `Next.js Agent Rules (breaking-change warning)`  [AMBIGUOUS]
  AGENTS.md · relation: conceptually_related_to

## Knowledge Gaps
- **337 isolated node(s):** `eslintConfig`, `DEFAULT_SERVICE`, `manifest_version`, `name`, `version` (+332 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Layora Architecture & System Structure` and `Next.js Agent Rules (breaking-change warning)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Cohort` connect `authz.ts` to `cohorts.ts`, `recurrence.ts`, `apiFetch`, `accessContext.ts`, `useStore.ts`, `codingAuth.ts`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `apiFetch()` connect `apiFetch` to `cohorts.ts`, `dashboard/certificates/page.tsx`, `notifications.ts`, `solve/page.tsx`, `useStore.ts`, `authz.ts`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `supabaseAdmin` connect `authz.ts` to `DailyActivity.ts`, `dashboard/certificates/page.tsx`, `recurrence.ts`, `extensionAuth.ts`, `requireStudent`, `guardContest`, `coding/problems/[pid]/route.ts`, `judge.ts`, `syncLogic.ts`, `useStore.ts`, `requireAdminCohort`, `codingAuth.ts`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `DEFAULT_SERVICE`, `manifest_version` to the rest of the system?**
  _337 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cohorts.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05367231638418079 - nodes in this community are weakly interconnected._
- **Should `recurrence.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09513742071881606 - nodes in this community are weakly interconnected._