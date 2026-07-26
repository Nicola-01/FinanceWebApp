# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Full-stack personal-finance app. Core domain: **Wallets** contain **Transactions**;
**Subscriptions** are recurring-transaction templates a cron job materializes into
Transactions; **Tags** are per-wallet (hierarchical) categories. Wallets are shareable
with other users under per-wallet RBAC. Three deployable services share one PostgreSQL
DB and one root `.env`.

## Repository layout

- `backend/` — Spring Boot 3.5 API (Java 21, Gradle). Base package `dev.busato.FinanceWebApp.backend`.
- `frontend/` — React 19 + Vite + TypeScript, Tailwind CSS 4 (offline-first PWA).
- `mcp-server/` — Python FastMCP OAuth2 server exposing ~25 finance tools to LLM clients.
- `docker-compose.yml` (dev, builds locally) / `docker-compose.prod.yml` (pulls GHCR images).
- `.github/workflows/deploy.yml` — CI/CD to GHCR + self-hosted runners.
- `docs/superpowers/` — implementation plans and specs written by the superpowers workflow.
- `.claude/TODO/` — active implementation plans/TODOs (e.g. `frontend-restructure.md`); completed ones move to `DONE/`.
- `graphify-out/` — generated knowledge graph (see **graphify** below); not app code.
- `OpenBanking/` — standalone EnableBanking/PSD2 experiment (Python script + certs); not wired into the apps.

## Common commands

Backend (run from `backend/`):
```bash
./gradlew bootRun                                   # run API on :8080
./gradlew build                                     # compile + test
./gradlew test                                      # JUnit 5 (+ JaCoCo report)
./gradlew test --tests "dev.busato.FinanceWebApp.backend.service.WalletServiceTest"
./gradlew test --tests "*.WalletServiceTest.createWallet*"   # single method
./gradlew spotlessApply                             # auto-format (Google Java Format)
./gradlew check                                     # runs Spotless + 90% line-coverage gate
```

Frontend (run from `frontend/`):
```bash
npm install
npm run dev        # Vite dev server on :5173
npm run build      # tsc -b && vite build
npm run lint       # ESLint (Prettier config)
npm test           # Vitest (run once); npm run test:watch for watch mode
```
Note: **Vitest + Testing Library** are configured (`vitest.config.ts`, jsdom, setup in
`src/test/setup.ts`); `*.test.*` files live under **`src/__tests__/`** (mirroring the source
tree; shared helpers in `src/test/`) and are excluded from the production build
(`tsconfig.app.json`). **CI gates on lint → Vitest → build** (in that order, same as the
local Stop hook — see Conventions below).

Full stack (from repo root):
```bash
docker-compose up -d   # db(:5432) + backend(:8080) + mcp(:8000) + frontend(:5173), hot-reload
```

## Backend architecture

Layering: `controller/` → `service/` (business logic + authorization) → `repository/`
(Spring Data JPA) over `model/` entities; `dto/` request/response objects are translated
by **manual `@Component` mappers in `mappers/` (not MapStruct)**. Lombok is used on
entities/DTOs.

- **Auth (three mechanisms), configured in `config/SecurityConfig.java`**, stateless:
  - **JWT** — login issues a 15-min access token + 30-day refresh token (HTTP-only cookie).
    JWT carries `userId`/`role`/`tokenVersion`; incrementing `User.tokenVersion` invalidates
    all outstanding tokens (`security/JwtService.java`, `JwtAuthenticationFilter.java`).
  - **PAT** — `fin_pat_*` tokens, stored as SHA-256 hash, with per-wallet permissions as a
    JSON array on the token; validation is Caffeine-cached (`config/CacheConfig.java`).
    `PatAuthenticationFilter` runs **before** the JWT filter.
  - **OAuth2** — `/oauth/*` + `/.well-known/*` back the MCP server's PKCE flow.
- **Authorization model:** global roles `ADMIN`/`USER` **plus** per-wallet roles
  `OWNER`/`EDITOR`/`VIEWER` stored on the `WalletAccess` join entity (composite key
  `userId`+`walletId`, with an `InvitationStatus`). Service methods gate access with
  `@PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")` — see
  `security/WalletSecurity.java`.
- **Domain relationships:** `Wallet` 1—N `Transaction`/`Tag`/`Subscription`; a
  `Subscription` owns the `Transaction`s it generates; a `Transaction` optionally links a
  `Tag` and its originating `Subscription`; multi-currency fields (`originalAmount`,
  `originalCurrency`, `exchangeValue`) live on both Transaction and Subscription.
- **Cross-cutting:** `controller/GlobalExceptionHandler.java` (`@RestControllerAdvice`)
  maps custom exceptions in `exceptions/` to RFC-7807 `ProblemDetail` responses; DTOs use
  Jakarta `@Valid` annotations.
- **Scheduled jobs (`scheduling/` + `CronJob/`):** jobs implement the `ManagedJob` interface
  (`key()`, `displayName()`, `run()`, `available()`) instead of hardcoded `@Scheduled`;
  `scheduling/ScheduledJobService` stores each schedule in the DB (`ScheduledJobConfig`),
  records per-execution history (`JobRun`), reschedules live and supports run-on-demand from
  the admin System tab. Current jobs (`CronJob/`): subscription execution (materializes due
  subscriptions on `nextExecutionDate`), encrypted DB backup (→ Cloudflare R2), demo cleanup,
  notification cleanup (drops notifications older than 30 days).
- **Web Push (`push/` package):** VAPID push delivered with the app closed. Domain services
  publish Spring events (`WalletActivityEvent`/`WalletInviteEvent`) after their JPA writes; an
  `@Async @TransactionalEventListener(AFTER_COMMIT)` `NotificationDispatcher` (enabled by
  `config/AsyncConfig`) resolves recipients (ACCEPTED members minus the actor, filtered by the
  per-user global toggles on `User` + the per-wallet `WalletAccess.notificationsMuted`) and
  hands each to `NotificationService`, which persists a `Notification` row **and** sends the push
  via `WebPushSender` → the `PushGateway` seam over `nl.martijndwars:web-push` (dead 404/410
  subscriptions are pruned; copy strings live in `push/NotificationCopy`). Requires the
  `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT` env vars — **empty by default, which
  disables push** (tests and keyless dev boots keep working). Phase 2 adds a notification-center
  history (`GET/POST/DELETE /api/notifications*`).
- **Email:** SMTP via `MAIL_*` env vars. `mailing/EmailService` (plain messages) and
  `service/SendEmailService` (HTML/MIME with templates in `resources/templates/`) back
  registration, password reset, admin user invites, and wallet-member invites.
- **Persistence:** PostgreSQL 16, `spring.jpa.hibernate.ddl-auto=update` — **no Flyway/Liquibase;
  schema evolves from entity edits.** Entity PKs are time-ordered **UUIDv7**
  (`persistence/UuidV7Generator`, wired via `@UuidGenerator` on `@Id` fields) — keep this on
  new entities. Tests use in-memory H2 (`src/test/resources/application-test.properties`).
- On first boot `config/DataInitializer.java` creates the admin user from `ADMIN_*` env vars.

## Frontend architecture

- **UI style guide — read before building or restyling ANY frontend UI:**
  [`frontend/style.md`](frontend/style.md). Defines the design tokens (`theme-tokens.css`:
  brand gradient, radius scale, self-hosted fonts), and **mandates reusing the shared
  primitives in `src/components/ui/` (`Button`, `Input`, `CustomSelect`, …) instead of
  hand-rolling `<button>`/`<input>`.** Also codifies the per-wallet colour accent
  (`wallet.color`) vs global brand gradient, the "de-vibecode" do/don't (gradient CTAs +
  saturated palette OK; **no colored glow/halos, no animated wordmark**; sober squared radii),
  and the always-dark auth screens (`dark` class on the root container). Prefer the
  theme-aware `app-*` colour tokens; avoid the legacy `theme-*`/`--color-*` set (no `.dark`
  override → light-mode white-on-white).
- **State:** React Context, not Redux. `dashboard/wallet/WalletContext.tsx` is the hub
  (wallet, transactions, subscriptions, tags, filters); plus `ThemeContext`, `PWAContext`.
- **API client:** `src/api/axiosConfig.ts`, baseURL = `VITE_API_URL + "/api"`. Request
  interceptor attaches the JWT from `localStorage`/`sessionStorage`; response interceptor
  auto-refreshes on 401 via `/auth/refresh`.
- **Offline-first PWA:** Dexie/IndexedDB caches GET responses; domain mutations made
  offline are queued as a **typed domain-ops queue** (`sync/opsQueue.ts`, Dexie v2 `ops`
  table) restricted to **transaction/subscription/tag CRUD + wallet update** — everything
  else (auth, members, PATs, CSV import) fails fast offline. Creates carry a
  **client-generated UUID** the backend honors (`persistence/AssignableUuidV7`); reads are
  **overlaid** so pending items render flagged with `syncState` (`sync/overlay.ts`). On
  reconnect `sync/replay.ts` replays FIFO with an optimistic `baseUpdatedAt` precondition —
  the server answers **409 "Stale Write"** rather than clobbering newer data, surfaced in the
  header **Sync Center** with **Keep mine / Take theirs** (`utils/offlineDb.ts`,
  `api/walletOps.ts`). Mutations route through `api/walletOps.ts`, not raw `api.*`.
- **Web Push:** the service worker uses vite-plugin-pwa **`injectManifest`** with a custom
  **`src/sw.ts`** (it replicates the old `generateSW` precache + runtime caching and adds
  `push`/`notificationclick` handlers; `push/swPayload.ts` holds the testable helpers). The
  client lives in `src/push/` (`pushClient.ts` device enroll/subscribe, `usePushMessages.ts`
  foreground-toast bridge + `?notif=<id>` click-ack). Preferences are the **Notifications**
  section in `/settings`; the Phase-2 in-app center is the bell in `header/notifications/`
  (`useNotifications.ts` open→mark-read, close→10s-purge lifecycle; amber unread dot).
- **Routing (`src/App.tsx`):** `/dashboard/:walletId?` and `/settings` (protected;
  `src/settings/SettingsPage.tsx` with scroll-spied sections), `/admin/dashboard/*`
  (ADMIN only), `/oauth/authorize` (OAuth consent page the MCP flow redirects to);
  auth screens `/login`, `/register`, `/forgot-password`, `/reset-password` share `AuthLayout`.
- **UI:** Tailwind 4 + MUI X-Charts for analytics, Framer Motion, dnd-kit for reordering.

### Frontend code organization (structure guidelines)

An active restructuring plan lives at **`.claude/TODO/frontend-restructure.md`** — read it
before any structural frontend work (splits, moves, renames) and follow its phases; new
findings get *censused* there, not fixed opportunistically. The rules it encodes:

- **Component size:** a `.tsx` above **~250 lines** is a split candidate — but split only
  along **real responsibility boundaries**: a complex inline subcomponent → its own file,
  non-UI logic → a hook, pure logic / constants / data blocks → a `.ts` module. A
  large-but-cohesive file (e.g. `utils/icons.ts`, a single chart, a DnD state machine)
  stays whole. Don't fragment JSX just to hit a number.
- **Placement:** feature-specific subcomponents are **colocated** next to their parent
  (feature subfolder). Promote to `components/ui/` only what is (or should be) reused by
  ≥2 features — and then *never* re-implement it inline (style.md golden rule). Shared
  pure logic goes in `utils/`, shared hooks in `hooks/` — extend those instead of
  duplicating inline (formatting, clipboard, outside-click, selection, etc. have bred
  many copies; the plan consolidates them).
- **Extracted pure logic must ship with a Vitest unit test** — extraction is the cheap
  moment to gain coverage.
- **Folder naming:** lowercase for category folders (`ui/`, `selectors/`, `common/`),
  `PascalCase.tsx` for component files. No single-file PascalCase subfolders.
- **No path aliases** (`tsconfig` has none): all imports are relative. Moving a file
  means fixing imports in the file *and* all importers, and mirror-moving its test under
  `src/__tests__/<same path>`. Always verify with `npm run build`.
- **Modal shells:** exactly two exist — `modals/common/ModalDialog.tsx` (native
  `<dialog>`) and `components/ui/ResponsiveOverlay.tsx` (drawer / mobile full-screen),
  plus `WizardShell` for wizards. Never introduce another shell; pick one of these.
- **Behavior-invariant refactors:** structural work (splits/moves/dedup) must not change
  markup, classes, copy, or behavior — existing tests are the spec and must pass
  unchanged. Visual changes (adopting `Button`/`Input` primitives, token migrations)
  are a separate, user-approved initiative.

## MCP server

`mcp-server/mcp_server.py` (FastMCP) exposes ~25 tools mirroring the domain (wallets,
transactions, tags, subscriptions, members/invitations, analytics). It is itself an
**OAuth2 authorization server** (discovery, dynamic client registration, PKCE
authorize/token) so LLM clients obtain a PAT. It performs **no authorization of its own** —
every tool forwards the bearer token to the backend, which enforces per-wallet permissions
(a 403 means the token lacks access to that specific wallet). Runs on `:8000`.

## Conventions & gotchas

- **Language — English only:** all user-facing UI copy **and** all code comments are written
  in **English** (the app ships in English). Don't introduce Italian strings/comments in code.
- **Test discipline (enforced by hooks in `.claude/hooks/`):** `PostToolUse` hooks mark the
  turn when you edit a file under `backend/` or `frontend/`; matching `Stop` hooks then
  auto-run the checks at end of turn and wake you on failure:
  - **backend** → `./gradlew test`. You must also **add or update tests covering your
    change** and re-run until green — writing the *new* tests is on you, not the hook.
  - **frontend** → `prettier --write` on `src/`, then fail-fast `npm run lint` →
    `npm test` → `npm run build` (same order as CI). Add/update Vitest tests for what
    you changed here too.
- **All REST endpoints are under `/api/...`** (e.g. `/api/wallets`, `/api/auth`, `/api/transactions`).
- **CI gates you must satisfy locally:** backend `check` enforces Spotless formatting +
  **90% line coverage** (`jacocoTestCoverageVerification`); frontend CI runs ESLint +
  Prettier, Vitest, and the production build. Run `./gradlew spotlessApply` and keep
  coverage ≥ 90% before pushing.
- **Single shared root `.env`** feeds all services via Compose. `VITE_*` vars are baked into
  the frontend **at build time**. Demo mode is gated by `DEMO_ENABLED` (backend) +
  `VITE_DEMO_ENABLED` (frontend).
- **CI/CD** (`.github/workflows/deploy.yml`): path-filtered backend/frontend jobs build
  multi-stage Docker images pushed to GHCR (`app-backend`, `app-frontend`), then deploy on
  self-hosted runners via `docker-compose.prod.yml`. Triggers on push to `demo`, `main`, `release/*`.

## graphify

This repo carries a generated knowledge graph in `graphify-out/` and a project rule at
`.agents/rules/graphify.md`. For architecture/relationship questions, prefer querying the
graph (`graphify query "<q>"` / MCP `query_graph`, `graphify path`/`explain`) over broad
grepping. After changing code in a session, run `graphify update .` to keep it current.
