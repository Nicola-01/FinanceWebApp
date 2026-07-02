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
`src/test/setup.ts`); `*.test.*` files live next to sources and are excluded from the
production build (`tsconfig.app.json`). Coverage is sparse — **CI gates on lint/build only**,
tests are not yet wired into the pipeline.

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
- **Scheduled jobs (`CronJob/`, `@EnableScheduling`):** subscription execution (materializes
  due subscriptions on `nextExecutionDate`), encrypted DB backup (→ Cloudflare R2), demo cleanup.
- **Persistence:** PostgreSQL 16, `spring.jpa.hibernate.ddl-auto=update` — **no Flyway/Liquibase;
  schema evolves from entity edits.** Tests use in-memory H2 (`src/test/resources/application-test.properties`).
- On first boot `config/DataInitializer.java` creates the admin user from `ADMIN_*` env vars.

## Frontend architecture

- **State:** React Context, not Redux. `dashboard/wallet/WalletContext.tsx` is the hub
  (wallet, transactions, subscriptions, tags, filters); plus `ThemeContext`, `PWAContext`.
- **API client:** `src/api/axiosConfig.ts`, baseURL = `VITE_API_URL + "/api"`. Request
  interceptor attaches the JWT from `localStorage`/`sessionStorage`; response interceptor
  auto-refreshes on 401 via `/auth/refresh`.
- **Offline-first PWA:** Dexie/IndexedDB caches GET responses and **queues POST/PUT/DELETE
  while offline**, replaying on reconnect (`utils/offlineDb.ts`, `utils/syncService.ts`).
- **Routing (`src/App.tsx`):** `/dashboard/:walletId?` (protected), `/admin/dashboard/*`
  (ADMIN only), `/oauth/authorize` (OAuth consent page the MCP flow redirects to).
- **UI:** Tailwind 4 + MUI X-Charts for analytics, Framer Motion, dnd-kit for reordering.

## MCP server

`mcp-server/mcp_server.py` (FastMCP) exposes ~25 tools mirroring the domain (wallets,
transactions, tags, subscriptions, members/invitations, analytics). It is itself an
**OAuth2 authorization server** (discovery, dynamic client registration, PKCE
authorize/token) so LLM clients obtain a PAT. It performs **no authorization of its own** —
every tool forwards the bearer token to the backend, which enforces per-wallet permissions
(a 403 means the token lacks access to that specific wallet). Runs on `:8000`.

## Conventions & gotchas

- **All REST endpoints are under `/api/...`** (e.g. `/api/wallets`, `/api/auth`, `/api/transactions`).
- **CI gates you must satisfy locally:** backend `check` enforces Spotless formatting +
  **90% line coverage** (`jacocoTestCoverageVerification`); frontend runs ESLint + Prettier.
  Run `./gradlew spotlessApply` and keep coverage ≥ 90% before pushing.
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
