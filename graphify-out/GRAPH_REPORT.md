# Graph Report - FinanceWebApp  (2026-10-30)

## Corpus Check
- 990 files · ~474,143 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 5980 nodes · 19875 edges · 200 communities (174 shown, 19 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 2353 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `839de2a2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- jakarta.servlet.http.HttpServletRequest
- org.junit.jupiter.api.Test
- mcp_server.py
- triggerToast
- Transaction
- lombok.RequiredArgsConstructor
- PersonalAccessToken
- MemberServiceTest
- UserControllerTest.java
- lombok.extern.slf4j.Slf4j
- WalletAccess
- Subscription
- vitest
- useTabLayout.ts
- LandingPage.tsx
- org.junit.jupiter.api.extension.ExtendWith
- lombok.Data
- SubscriptionModal.tsx
- BankLinkService
- useSyncStatus.ts
- tagOrder.ts
- exchangeRates.ts
- FinanceWebApp Project
- WalletServiceTest.java
- RegisterServiceTest
- dependencies
- WalletServiceTest
- Budget
- devDependencies
- Tag
- CustomDatePicker.tsx
- compilerOptions
- WalletSecurityTest
- TagRequest
- compilerOptions
- Frontend UI Redesign — TODO
- CategoryHeatmapChart.tsx
- TagsStep.tsx
- TransactionServiceTest
- SubscriptionServiceTest.java
- .generateToken
- SubscriptionServiceTest
- frontend/package.json
- domain.ts
- WalletsBar.tsx
- <p align="center">FinanceWebApp - Portfolio Showcase</p>
- OAuthController
- scripts
- UserServiceTest
- Frontend Unit-Test Plan — `frontend/`
- EnableBankingClientTest
- NotificationCopy
- AuthControllerTest
- User
- Wallet
- package.json
- React + TypeScript + Vite
- tsconfig.json
- csvImport.ts
- JobCard.tsx
- ScheduledJobService
- FrankfurterExchangeRateService
- SubscriptionService
- Button.tsx
- TransactionsStep.tsx
- useCsvImport.ts
- MCP Server Python Dependencies
- BankLinkService.java
- OverviewTable.tsx
- Phases D–I — String extraction by area
- MonthlyChart.tsx
- .computeStatus
- MFA (TOTP + Email code) — Implementation Plan / TODO
- BankAccountLink
- react
- EnableBankingClient
- PatAuthenticationFilterTest
- Interactive Onboarding (guided tour) — Implementation Plan / TODO
- NotificationsSection.tsx
- NotificationDispatcherTest
- Periodic Summary Reports — Implementation Plan
- Frontend Restructure — Analysis & Execution Plan / TODO
- .processDueSubscriptions
- AccountDeletionServiceTest
- walletOps.ts
- @fortawesome/free-solid-svg-icons
- offlineDb.ts
- org.springframework.context.annotation.Bean
- BankLinkServiceTest
- WalletAccessId
- Landing Page Redesign — Design Spec
- ReportServiceTest
- Wallet Creation Wizard — Design Spec
- BankSyncServiceTest
- csvValidation.ts
- Offline Sync Rework — Implementation Plan / TODO
- Web Push Notifications — Implementation Plan / TODO
- walletCreation.ts
- .budget
- Phase A — Backend
- ColorSelector.tsx
- TransactionService
- formatAmount
- DemoCleanupCronJobTest
- categoryChartData.ts
- vite.config.ts
- Settings tab — redesign plan
- Wallet End-to-End Encryption — Implementation TODO
- Settings Refactor — TODO
- BudgetFormOverlay.tsx
- .sendYearlyReports
- Appendix — full live call-site table
- StatisticsTab.tsx
- useAmountInput.ts
- BankConnection
- PWAProvider.test.tsx
- .createInvite
- .map
- ReportHtmlBuilder
- Phase map
- axiosConfig.test.ts
- BankLinkControllerTest
- refactor.ts
- WalletProvisioningIntegrationTest
- 5. Epic: eliminare `no-explicit-any` (90 → 0)
- Wallet data unifier + client cache — Design
- Invitations in the Wallet Sidebar — Design
- replay.test.ts
- WebPushGateway
- File map
- Task 3 — GroupEditGrid mini-tiles + shared DnD (depends on 1 & 2)
- Wallet End-to-End Encryption — Architecture Plan
- Wallet Creation Wizard — Implementation Plan / TODO
- Wallet slug leggibile nell'URL
- MonthlyReportCronJob
- org.springframework.stereotype.Component
- Navbar.tsx
- NotificationTypeConstraintCleanup
- Responsive Overlay Pattern — Implementation TODO
- SubscriptionCronJob
- WalletRole
- sw.ts
- Decisioni per te (non le ho prese io)
- JwtService
- BackupCronJob
- Admin Section Redesign — TODO
- Category Management — Redesign (planning only)
- Wallet Data Unifier + Client Cache — Implementation Plan
- Global Constraints
- replay.ts
- Kickoff prompt — SETTINGS redesign (copy into a new session)
- 5. Authentication protocol changes
- overlayHistory.ts
- AssignableUuidV7Generator
- EbAccount
- 1. What I extracted from the codebase
- ForgotPasswordSent.tsx
- jakarta.transaction.Transactional
- Categories (Tags) tab — charts plan
- 8. Sync design (frontend `src/sync/`, extending the existing layer)
- Global Constraints
- Transaction
- Frequency
- BackendApplication
- YearSelector.tsx
- Verifying FinanceWebApp changes at runtime
- 9. Sharing, invitation, revocation
- CsvUploadField
- Open Banking: note notturne per la revisione
- gradlew
- ToDoList.tsx
- 7. E2EE data plane (new API, coexisting with the legacy plane)
- frontend-checks.sh
- runtime-env.d.ts
- rules/graphify.md
- workflows/graphify.md
- backend-mark.sh
- backend-tests.sh
- frontend-mark.sh
- open-banking-followups.md
- 40-config.sh
- EnableBankingException
- useTheme
- DemoService
- BackupRow.tsx
- NotificationType
- MonthSelector.tsx
- .generateUuid
- Status
- BaseWebMvcTest
- Duration
- Status
- Sleeper

## God Nodes (most connected - your core abstractions)
1. `react` - 331 edges
2. `User` - 251 edges
3. `vitest` - 212 edges
4. `@fortawesome/free-solid-svg-icons` - 153 edges
5. `@fortawesome/react-fontawesome` - 147 edges
6. `@testing-library/react` - 146 edges
7. `WalletAccess` - 132 edges
8. `Wallet` - 108 edges
9. `triggerToast()` - 108 edges
10. `UserRepository` - 96 edges

## Surprising Connections (you probably didn't know these)
- `Docker Compose Production Environment` --semantically_similar_to--> `Docker Compose Dev Environment`  [INFERRED] [semantically similar]
  docker-compose.prod.yml → docker-compose.yml
- `Glassmorphism Design System` --conceptually_related_to--> `PWA Icon Set`  [INFERRED]
  README.md → frontend/public/pwa-512x512.png
- `JWT Authentication Configuration` --conceptually_related_to--> `OAuth 2.0 Authentication Flow`  [INFERRED]
  docker-compose.yml → README.md
- `SMTP Mail Configuration` --conceptually_related_to--> `Forgot Password Email Template`  [INFERRED]
  docker-compose.yml → backend/src/main/resources/templates/email/forgotPasswordEmail.html
- `SMTP Mail Configuration` --conceptually_related_to--> `Registration Invite Email Template`  [INFERRED]
  docker-compose.yml → backend/src/main/resources/templates/email/registrationInviteEmail.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **CI/CD Deployment Pipeline** — github_workflows_deploy, github_workflows_deploy_matrix_deploy, github_workflows_deploy_git_post_deploy, github_workflows_deploy_weekly_cleanup, docker_compose_prod [EXTRACTED 1.00]
- **Four-Service Docker Architecture** — docker_compose_postgres_service, docker_compose_backend_service, docker_compose_frontend_service, docker_compose_mcp_service [EXTRACTED 1.00]
- **Email Notification System** — docker_compose_mail_config, backend_src_main_resources_templates_email_forgotpasswordemail, backend_src_main_resources_templates_email_registrationinviteemail, backend_src_main_resources_templates_email_walletinviteemail [INFERRED 0.85]

## Communities (200 total, 19 thin omitted)

### Community 0 - "jakarta.servlet.http.HttpServletRequest"
Cohesion: 0.09
Nodes (15): GlobalExceptionHandler, TagHasChildrenException, TagInUseException, UnauthorizedAccessException, UserAlreadyExistsException, GlobalExceptionHandlerTest, jakarta.servlet.http.HttpServletRequest, MethodArgumentNotValidException (+7 more)

### Community 1 - "org.junit.jupiter.api.Test"
Cohesion: 0.04
Nodes (28): OAuthAuthorizeRequest, PatBulkDeleteRequest, PatBulkPauseRequest, AdminDatabaseControllerTest, org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration, AdminUserControllerTest, org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration, org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration (+20 more)

### Community 2 - "mcp_server.py"
Cohesion: 0.08
Nodes (76): BaseHTTPMiddleware, Context, custom_route, description, FastMCP, Field, ge, gt (+68 more)

### Community 3 - "triggerToast"
Cohesion: 0.04
Nodes (108): AdminDashboard(), useBackups(), CreateInviteForm(), CreateInviteFormProps, api, failedQueue, processQueue(), completeBankCallback() (+100 more)

### Community 4 - "Transaction"
Cohesion: 0.02
Nodes (138): syncWalletIfStale(), cache, Entry, fetchAndTrack(), fetchFromApi(), getWalletData(), inflight, peek() (+130 more)

### Community 5 - "lombok.RequiredArgsConstructor"
Cohesion: 0.06
Nodes (20): DemoController, NotificationController, NotificationPreferencesController, PushController, Entity, Table, PushSubscription, WebPushSender (+12 more)

### Community 6 - "PersonalAccessToken"
Cohesion: 0.06
Nodes (12): PatCreateRequest, PatCreateResponse, PatUpdateRequest, WalletPermission, Entity, Table, PersonalAccessToken, User (+4 more)

### Community 7 - "MemberServiceTest"
Cohesion: 0.15
Nodes (7): MemberRequest, InvitationStatus, InvitationStatus, ApplicationEventPublisher, User, Wallet, MemberServiceTest

### Community 8 - "UserControllerTest.java"
Cohesion: 0.08
Nodes (16): DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, UserController, AuthResponse (+8 more)

### Community 9 - "lombok.extern.slf4j.Slf4j"
Cohesion: 0.04
Nodes (19): AdminDatabaseController, BackupEntry, DeleteMapping, GetMapping, PostMapping, RequestMapping, RestController, BackupService (+11 more)

### Community 10 - "WalletAccess"
Cohesion: 0.06
Nodes (53): DataInitializer, InvitationStatus, ACCEPTED, FORGOTPASSWORD, PENDING, REVOKED, InvitationStatus, ACCEPTED (+45 more)

### Community 11 - "Subscription"
Cohesion: 0.08
Nodes (40): BASE_DAYS, buildCalendarGrid(), CalendarDayCell(), CalendarDayCellProps, PastSubscriptionsSection(), PastSubscriptionsSectionProps, SubscriptionCalendar(), SubscriptionCalendarProps (+32 more)

### Community 12 - "vitest"
Cohesion: 0.03
Nodes (46): OAuthParams, useOAuthParams(), Collapse(), CollapseProps, InviteSection(), ShareSettingsSection(), InviteCard(), InviteCardProps (+38 more)

### Community 13 - "useTabLayout.ts"
Cohesion: 0.06
Nodes (62): AccentHoverButton(), AccentHoverButtonProps, GroupEditGrid(), GroupEditGridProps, MemberTile(), MemberTileProps, HiddenTray(), HiddenTrayProps (+54 more)

### Community 14 - "LandingPage.tsx"
Cohesion: 0.09
Nodes (26): CTASection(), CTASectionProps, Features(), tagPreviewRows, Footer(), STACK, GithubMark(), Hero() (+18 more)

### Community 15 - "org.junit.jupiter.api.extension.ExtendWith"
Cohesion: 0.08
Nodes (18): AdminInviteResponse, RegisterInviteResponse, UserResponse, UserNotFoundException, AdminInviteMapper, Override, AdminInviteMapperTest, MemberMapperTest (+10 more)

### Community 16 - "lombok.Data"
Cohesion: 0.08
Nodes (37): NotificationPreferencesRequest, NotificationPreferencesResponse, WalletPrefs, NotificationResponse, PushSubscriptionRequest, SubscriptionBulkResponse, SubscriptionRequest, SubscriptionResponse (+29 more)

### Community 17 - "SubscriptionModal.tsx"
Cohesion: 0.03
Nodes (95): Aspsp, BankAccountLink, BankConnection, connectBank(), deleteConnection(), getWalletBank(), listAspsps(), renewConnection() (+87 more)

### Community 18 - "BankLinkService"
Cohesion: 0.14
Nodes (5): OpenBankingDisabledException, PermissionDeniedException, BankLinkService, BankAccountLinkRepository, Aspsp

### Community 19 - "useSyncStatus.ts"
Cohesion: 0.18
Nodes (18): invalidate(), SyncStatusBadge(), EMPTY_COUNTS, useSyncStatus(), countByStatus(), enqueueOp(), listOps(), notify() (+10 more)

### Community 20 - "tagOrder.ts"
Cohesion: 0.10
Nodes (31): buildChildParent(), CONTAINER_PREFIX, moveChildToParent(), nestedCollisionDetection(), resolveTargetParent(), ChildDropZone(), useCategoryTree(), useCategoryTreeDnd() (+23 more)

### Community 21 - "exchangeRates.ts"
Cohesion: 0.40
Nodes (7): CachedFxRate, cacheKey(), FxRate, getExchangeRate(), readCache(), todayKey(), writeCache()

### Community 22 - "FinanceWebApp Project"
Cohesion: 0.09
Nodes (29): Forgot Password Email Template, Registration Invite Email Template, Wallet Invite Email Template, Spring Boot Backend Service, Database Backup Configuration, Docker Compose Dev Environment, Vite + React Frontend Service, JWT Authentication Configuration (+21 more)

### Community 23 - "WalletServiceTest.java"
Cohesion: 0.08
Nodes (14): AccessDeniedException, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, WalletController, WalletRequest (+6 more)

### Community 24 - "RegisterServiceTest"
Cohesion: 0.13
Nodes (5): GetMapping, RegisterInviteRequest, ResetPasswordRequest, RegisterService, RegisterServiceTest

### Community 25 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, axios, date-fns, dexie, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, @emotion/react (+17 more)

### Community 26 - "WalletServiceTest"
Cohesion: 0.08
Nodes (10): MemberMapper, WalletRole, PatWalletPermission, WalletMapper, WalletRole, WalletMapperTest, Tag, User (+2 more)

### Community 27 - "Budget"
Cohesion: 0.06
Nodes (28): BudgetController, DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, BudgetRequest (+20 more)

### Community 28 - "devDependencies"
Cohesion: 0.06
Nodes (34): devDependencies, autoprefixer, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh (+26 more)

### Community 29 - "Tag"
Cohesion: 0.07
Nodes (16): DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, TagController, TagBulkResponse (+8 more)

### Community 30 - "CustomDatePicker.tsx"
Cohesion: 0.12
Nodes (22): CalendarContainer(), CalendarContainerProps, ViewState, CustomDatePickerProps, DatePickerSidebar(), DatePickerSidebarProps, DatePickerSurface(), DatePickerSurfaceProps (+14 more)

### Community 31 - "compilerOptions"
Cohesion: 0.09
Nodes (22): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+14 more)

### Community 32 - "WalletSecurityTest"
Cohesion: 0.10
Nodes (3): PatWalletPermission, WalletSecurity, WalletSecurityTest

### Community 33 - "TagRequest"
Cohesion: 0.08
Nodes (32): SubscriptionRequest, TagRequest, WalletDraft, MissingTagActionsProps, RecommendedTag, TagSourceDto, RecommendedSubscriptionPicker(), RecommendedSubscriptionPickerProps (+24 more)

### Community 34 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+11 more)

### Community 35 - "Frontend UI Redesign — TODO"
Cohesion: 0.05
Nodes (37): Backend architecture, Common commands, Conventions & gotchas, Frontend architecture, Frontend code organization (structure guidelines), graphify, MCP server, Overview (+29 more)

### Community 36 - "CategoryHeatmapChart.tsx"
Cohesion: 0.17
Nodes (13): FlowType, CategoryHeatmapChartProps, COLOR_SCALE, CategoryTrendChart(), CategoryTrendChartProps, ChartCard(), ChartCardProps, EXPENSE (+5 more)

### Community 37 - "TagsStep.tsx"
Cohesion: 0.10
Nodes (34): groupTagRequests(), groupToTagRequests(), keyOfName(), RECOMMENDED_TAG_GROUPS, RecommendedTagGroup, fetchTagSources(), MOCK_SOURCE_WALLETS, SourceWallet (+26 more)

### Community 38 - "TransactionServiceTest"
Cohesion: 0.11
Nodes (4): ApplicationEventPublisher, Transaction, Wallet, TransactionServiceTest

### Community 39 - "SubscriptionServiceTest.java"
Cohesion: 0.09
Nodes (20): GetMapping, PostMapping, PutMapping, RequestMapping, RestController, TransactionController, Type, TransactionFillRequest (+12 more)

### Community 40 - ".generateToken"
Cohesion: 0.12
Nodes (4): Override, JwtAuthenticationFilterTest, User, JwtServiceTest

### Community 42 - "frontend/package.json"
Cohesion: 0.06
Nodes (36): @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, name, private, type, version, autoprefixer (+28 more)

### Community 43 - "domain.ts"
Cohesion: 0.06
Nodes (37): TokenActionButtons(), TokenActionButtonsProps, TokenLastUsedInfo(), TokenLastUsedInfoProps, TokenListItem(), TokenListItemProps, TokenWalletBadges(), TokenWalletBadgesProps (+29 more)

### Community 44 - "WalletsBar.tsx"
Cohesion: 0.09
Nodes (29): RippleItem, useRipple(), UserDashboard(), handleChangeWallet(), useWalletDeletion(), resolveWalletParam(), useWalletRouting(), useInvitations() (+21 more)

### Community 45 - "<p align="center">FinanceWebApp - Portfolio Showcase</p>"
Cohesion: 0.15
Nodes (12): 🏗️ Architecture Overview, 🚀 Automated Deployment, 🧩 Core Stack, ⚡ Demo & Onboarding Mode, ⚙️ Development Setup, Enabling Demo Features, 🚀 Engineering Highlights, 🛠️ Infrastructure & CI/CD (+4 more)

### Community 46 - "OAuthController"
Cohesion: 0.10
Nodes (10): GetMapping, Pattern, PostMapping, RestController, OAuthController, AuthCodeEntry, OAuthAuthCodeStore, OAuthAuthCodeStoreTest (+2 more)

### Community 47 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, test:watch

### Community 48 - "UserServiceTest"
Cohesion: 0.10
Nodes (3): ChangePasswordRequest, User, UserServiceTest

### Community 49 - "Frontend Unit-Test Plan — `frontend/`"
Cohesion: 0.05
Nodes (42): 1.1 Cosa esiste già, 1.2 Convenzioni del repo da rispettare (da `CLAUDE.md` + `frontend/style.md`), 1.3 Convenzioni tecniche di mocking (pattern del repo, da riusare), 1.4 Dipendenze/decisioni da risolvere prima di S1/S3, 1.5 Politica di profondità di validazione (per tier), 1. Analisi dei requisiti, 2. Sezioni di test — ordinate per sicurezza (S1 → S4), 3. Ordine di esecuzione & tracking (+34 more)

### Community 50 - "EnableBankingClientTest"
Cohesion: 0.11
Nodes (7): Aspsp, EbTransactionPage, EnableBankingProperties, Wallet, Wallet, EnableBankingClientTest, org.springframework.boot.context.properties.ConfigurationProperties

### Community 51 - "NotificationCopy"
Cohesion: 0.13
Nodes (4): Transition, Copy, NotificationCopy, NotificationCopyTest

### Community 52 - "AuthControllerTest"
Cohesion: 0.11
Nodes (10): AuthController, PostMapping, RequestMapping, RestController, ForgotPasswordRequest, LoginRequest, AuthControllerTest, User (+2 more)

### Community 53 - "User"
Cohesion: 0.04
Nodes (45): AdminUserController, DeleteMapping, GetMapping, PutMapping, RequestMapping, RestController, DeleteMapping, GetMapping (+37 more)

### Community 54 - "Wallet"
Cohesion: 0.10
Nodes (9): EmailService, Entity, Table, Wallet, Pattern, SendEmailService, SendEmailServiceTest, jakarta.mail.internet.MimeMessage (+1 more)

### Community 55 - "package.json"
Cohesion: 0.25
Nodes (7): dependencies, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities

### Community 56 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + TypeScript + Vite

### Community 58 - "csvImport.ts"
Cohesion: 0.13
Nodes (29): RFC-4180, CsvFormatModalProps, CsvColumn, dataRows(), DurationType, FrequencyType, optionalNumber(), optionalRaw() (+21 more)

### Community 59 - "JobCard.tsx"
Cohesion: 0.12
Nodes (26): buildSchedulePayload(), ScheduleDraft, SchedulePayload, JobCard(), JobRunHistory(), DAYS, DOM_OPTIONS, formatCountdown() (+18 more)

### Community 60 - "ScheduledJobService"
Cohesion: 0.05
Nodes (33): AdminJobController, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, JobRunDTO, ScheduledJobDTO (+25 more)

### Community 61 - "FrankfurterExchangeRateService"
Cohesion: 0.17
Nodes (8): CachedRate, FrankfurterExchangeRateService, FrankfurterRate, Builder, Override, FrankfurterExchangeRateServiceTest, org.springframework.test.web.client.MockRestServiceServer, org.springframework.web.client.RestClient

### Community 62 - "SubscriptionService"
Cohesion: 0.19
Nodes (5): Entity, Table, Subscription, Status, SubscriptionService

### Community 63 - "Button.tsx"
Cohesion: 0.04
Nodes (55): ButtonProps, ButtonSize, ButtonVariant, SIZES, VARIANTS, PANEL_VARIANTS, Wizard(), WizardCompletionState (+47 more)

### Community 67 - "TransactionsStep.tsx"
Cohesion: 0.14
Nodes (17): TransactionRequest, MissingTransactionTags(), MissingTransactionTagsProps, findRecommendedTagWithParent(), addTagToDraft(), DEFAULT_TAG_COLOR, DEFAULT_TAG_ICON, tagKey() (+9 more)

### Community 68 - "useCsvImport.ts"
Cohesion: 0.13
Nodes (25): DedupOverwrite, DedupResult, detectSubscriptionOverwrites(), detectTagOverwrites(), detectTransactionOverwrites(), isoDate(), norm(), subscriptionKey() (+17 more)

### Community 70 - "BankLinkService.java"
Cohesion: 0.11
Nodes (17): BankAccountResponse, BankConnectionResponse, BankDtos, ConnectRequest, Status, UrlResponse, WalletBankResponse, BankLinkController (+9 more)

### Community 71 - "OverviewTable.tsx"
Cohesion: 0.23
Nodes (8): MonthlyOverviewProps, OverviewTable(), TABS, useOverviewData(), ViewMode, setup(), transactions, MONTH_LABELS

### Community 72 - "Phases D–I — String extraction by area"
Cohesion: 0.06
Nodes (30): Confirmed design decisions (from the interview — do not relitigate), Explicitly out of scope (do not build), Global Constraints (apply to every task), Localization (i18n) — Implementation Plan / TODO, Phase A — Infrastructure, Phase B — Central locale-aware formats, Phase C — Language UI + error mapping, Phase J — Final gates, docs, knowledge graph, manual QA (+22 more)

### Community 73 - "MonthlyChart.tsx"
Cohesion: 0.17
Nodes (23): bucketLabel(), MonthlyBucket, MonthlyChartRow, toCumulativeRows(), toSnapshotRows(), BALANCE_COLOR, darkTheme, EXPENSE_COLOR (+15 more)

### Community 74 - ".computeStatus"
Cohesion: 0.12
Nodes (8): BudgetAlertCronJob, BudgetResolution, Override, BudgetAlertCronJobTest, InvitationStatus, Wallet, BudgetMapperTest, BudgetStatusResponseBuilder

### Community 75 - "MFA (TOTP + Email code) — Implementation Plan / TODO"
Cohesion: 0.07
Nodes (29): Explicitly out of scope (do not build), Global Constraints (apply to every task), MFA (TOTP + Email code) — Implementation Plan / TODO, Phase A — Backend foundation, Phase B — Backend settings flows (enroll / disable / recovery codes), Phase C — Backend login flow + admin reset, Phase D — Ops / env plumbing, Phase E — Frontend: login second step (+21 more)

### Community 76 - "BankAccountLink"
Cohesion: 0.10
Nodes (17): BankAccountLink, AllArgsConstructor, Builder, Data, Entity, NoArgsConstructor, Table, ImportedBankTransaction (+9 more)

### Community 77 - "react"
Cohesion: 0.03
Nodes (87): UsersPageProps, AdminPageHeader(), AdminPageHeaderProps, AdminStats(), AdminStatsProps, AdminTab, AdminTabs(), TABS (+79 more)

### Community 78 - "EnableBankingClient"
Cohesion: 0.16
Nodes (15): EnableBankingClient, Builder, RawAccount, RawAmount, RawAspsps, RawAuth, RawIban, RawParty (+7 more)

### Community 79 - "PatAuthenticationFilterTest"
Cohesion: 0.21
Nodes (5): InvalidTokenException, Override, PatAuthenticationFilterTest, jakarta.servlet.FilterChain, org.springframework.security.core.Authentication

### Community 80 - "Interactive Onboarding (guided tour) — Implementation Plan / TODO"
Cohesion: 0.07
Nodes (27): Decisions (locked 2026-07-11 — do not re-litigate during implementation), Explicitly out of scope (do not build), Global Constraints (apply to every task), Interactive Onboarding (guided tour) — Implementation Plan / TODO, Phase A — Backend: flag, exposure, seed removal, Phase B — Tour engine (no product-visible change yet), Phase C — Content: anchors, wizard choreography, sample CSV, registry, Phase D — Triggers, persistence client, replay (+19 more)

### Community 81 - "NotificationsSection.tsx"
Cohesion: 0.10
Nodes (33): ToggleProps, ToggleSize, ToggleVariant, WalletNotificationsCard(), fetchPublicKey(), getEnrollment(), isPushSupported(), keyToBase64() (+25 more)

### Community 82 - "NotificationDispatcherTest"
Cohesion: 0.23
Nodes (6): WalletActivityEvent, WalletInviteEvent, User, NotificationDispatcherTest, org.springframework.scheduling.annotation.Async, org.springframework.transaction.event.TransactionalEventListener

### Community 83 - "Periodic Summary Reports — Implementation Plan"
Cohesion: 0.07
Nodes (26): Final verification (after the last task), Global Constraints, Periodic Summary Reports — Implementation Plan, Phase 1 — Scheduler MONTHLY/YEARLY, Phase 2 — Report aggregation (pure logic), Phase 3 — PDF rendering + templates, Phase 4 — Preferences, email sending, orchestration, jobs, Phase 5 — Settings “Notifications” section (+18 more)

### Community 84 - "Frontend Restructure — Analysis & Execution Plan / TODO"
Cohesion: 0.08
Nodes (25): 5A — dashboard/tag, 5B — dashboard/statistics, 5C — dashboard/layout, 5D — dashboard/settings (CSV), 5E — dashboard core (wallet / transaction / subscription / root), 5F — modals (non-wizard), 5G — components/ui hot spots, 5H — components (pickers/selectors/landing/pat) (+17 more)

### Community 86 - "AccountDeletionServiceTest"
Cohesion: 0.29
Nodes (5): AccountDeletionServiceTest, InvitationStatus, User, Wallet, WalletRole

### Community 87 - "walletOps.ts"
Cohesion: 0.17
Nodes (23): createOp(), createSubscription(), createTag(), createTransaction(), deleteSubscription(), deleteTag(), deleteTransaction(), isNetworkError() (+15 more)

### Community 88 - "@fortawesome/free-solid-svg-icons"
Cohesion: 0.03
Nodes (84): BackupsTable(), Icon(), WalletIconProps, ColorSelectorPropsProps, IconColorSelector(), IconPickerButton(), IconPickerButtonProps, IconSelector() (+76 more)

### Community 89 - "offlineDb.ts"
Cohesion: 0.12
Nodes (17): OP_KIND_LABEL, opLabel(), SyncCenterOverlay(), SyncCenterOverlayProps, SyncStatus, failedOp, missingOp, pendingOp (+9 more)

### Community 90 - "org.springframework.context.annotation.Bean"
Cohesion: 0.11
Nodes (22): ApplicationConfig, AsyncConfig, CacheConfig, ThreadPoolTaskScheduler, SchedulingConfig, SecurityConfig, JwtAuthenticationFilter, PatAuthenticationFilter (+14 more)

### Community 91 - "BankLinkServiceTest"
Cohesion: 0.26
Nodes (6): CallbackRequest, EbSession, BankLinkServiceTest, User, WalletRole, jakarta.persistence.EntityManager

### Community 92 - "WalletAccessId"
Cohesion: 0.14
Nodes (7): WalletAccessId, IdorIntegrationTest, User, Wallet, User, Wallet, Embeddable

### Community 93 - "Landing Page Redesign — Design Spec"
Cohesion: 0.09
Nodes (21): 10. Testing & verification, 11. Out of scope, 1. Goal & framing, 2. Decisions (locked with the user), 3. Style-guide compliance (`frontend/style.md`), 4. Page architecture (section order — confirmed), 5.1 Navbar, 5.2 Hero (+13 more)

### Community 94 - "ReportServiceTest"
Cohesion: 0.16
Nodes (5): ReportPdfRenderer, WalletMonthlyReport, ReportPdfRendererTest, ReportServiceTest, java.time.YearMonth

### Community 95 - "Wallet Creation Wizard — Design Spec"
Cohesion: 0.10
Nodes (20): 10. Testing, 11. Style & copy constraints (`style.md`), 12. Implementation process, 1. Goal, 2. Scope & non-goals, 3. Codebase facts this design is built on, 4. Generic `Wizard` primitive, 5. Full-screen shell (+12 more)

### Community 96 - "BankSyncServiceTest"
Cohesion: 0.16
Nodes (5): BankSyncServiceTest, User, Wallet, org.springframework.test.context.event.ApplicationEvents, org.springframework.test.context.event.RecordApplicationEvents

### Community 97 - "csvValidation.ts"
Cohesion: 0.15
Nodes (13): CsvUploadFieldProps, CsvResource, DURATIONS, FREQ_TYPES, isBlank(), isValidIsoDate(), norm(), ParsedCsv (+5 more)

### Community 98 - "Offline Sync Rework — Implementation Plan / TODO"
Cohesion: 0.10
Nodes (19): Confirmed design decisions (from the interview — do not relitigate), Global Constraints (apply to every task), Offline Sync Rework — Implementation Plan / TODO, Phase A — Backend, Phase B — Frontend: queue + overlay foundations, Phase C — Frontend: wiring, replay, UI, Self-review checklist (run after implementation, before hand-back), Task 10: replay engine (`src/sync/replay.ts`, replaces `utils/syncService.ts`) (+11 more)

### Community 99 - "Web Push Notifications — Implementation Plan / TODO"
Cohesion: 0.10
Nodes (19): Confirmed design decisions (from the interview — do not relitigate), Global Constraints (apply to every task), Phase 1 — Backend push infrastructure, Phase 1 — Frontend, Phase 2 — Notification center (history), Self-review checklist (run after implementation), Task 10: backend — list / mark-read / purge-read + retention job, Task 11: frontend — bell + yellow dot + center overlay with read/purge lifecycle (+11 more)

### Community 100 - "walletCreation.ts"
Cohesion: 0.14
Nodes (13): CreateWalletWizard, bulkOutcome(), BulkResponse, createWalletFromDraft(), invitesTask(), ResourceKey, ResourceOutcome, WalletBasics (+5 more)

### Community 101 - ".budget"
Cohesion: 0.22
Nodes (3): BudgetPeriods, Period, BudgetPeriodsTest

### Community 102 - "Phase A — Backend"
Cohesion: 0.11
Nodes (18): Budgeting — Implementation Plan / TODO, Global Constraints (apply to every task), Phase A — Backend, Phase B — Frontend, Phase C — Wrap-up, Self-review notes (already applied), Task 10: `BudgetFormOverlay` + delete flow, Task 11 (OPTIONAL — confirm with the user first): MCP budget tools (+10 more)

### Community 103 - "ColorSelector.tsx"
Cohesion: 0.15
Nodes (12): COLOR_PRESETS, ColorSelector(), ColorSelectorProps, PRESET_SET, StyledText, TransactionPieChart(), FALLBACK_HEX, hexToRgba() (+4 more)

### Community 104 - "TransactionService"
Cohesion: 0.24
Nodes (6): Subscription, Tag, Transaction, Type, Wallet, TransactionService

### Community 105 - "formatAmount"
Cohesion: 0.17
Nodes (10): CellType, OverviewCell(), OverviewCellContent(), OverviewCellContentProps, OverviewCellProps, DataItem, OverviewRow(), OverviewRowProps (+2 more)

### Community 106 - "DemoCleanupCronJobTest"
Cohesion: 0.23
Nodes (5): DemoCleanupCronJob, Override, DemoCleanupCronJobTest, User, Wallet

### Community 107 - "categoryChartData.ts"
Cohesion: 0.23
Nodes (11): buildMainCategoryMeta(), CategoryMeta, mainCategoryName(), OTHER_COLOR, buildHeatmap(), buildRanking(), buildTrend(), HeatmapData (+3 more)

### Community 109 - "vite.config.ts"
Cohesion: 0.29
Nodes (4): @tailwindcss/vite, vite, vite-plugin-pwa, @vitejs/plugin-react

### Community 110 - "Settings tab — redesign plan"
Cohesion: 0.12
Nodes (14): Increments (one element at a time, user OK between each; each ends green), Locked decisions (brainstorm 2026-07-03), Refinements (post-review), Resolved decisions, Settings tab — redesign plan, Status: ALL 7 increments done. Settings scope is 0 `theme-*`, no hand-rolled CTA/text, Structure & RBAC (behaviour to preserve), TODO — CSV import (deferred, needs backend) (+6 more)

### Community 111 - "Wallet End-to-End Encryption — Implementation TODO"
Cohesion: 0.12
Nodes (14): Cross-cutting wrap-up (after each phase, verify), Open Banking interaction (open question), Phase 0 — Frontend crypto foundations, Phase 10 — Explanatory animated page, Phase 1 — Backend key infrastructure + auth V2, Phase 2 — Frontend auth integration, Phase 3 — Backend data model for encrypted content, Phase 4 — E2EE data plane API (backend) (+6 more)

### Community 112 - "Settings Refactor — TODO"
Cohesion: 0.11
Nodes (17): 1. AppHeader — `frontend/src/header/AppHeader.tsx`  🔧 modifica, 2. Routing — `frontend/src/App.tsx`  🔧 modifica, 3. Shell pagina — `frontend/src/settings/SettingsPage.tsx`  ✨ nuovo, 4. Sezione **Account** — `frontend/src/settings/sections/AccountSection.tsx`  ✅ FATTA (2026-07-05, backend incluso), 5. Sezione **Security** — `frontend/src/settings/sections/SecuritySection.tsx`  ✨ nuovo, 6. Sezione **Tokens & Connections** — `frontend/src/settings/sections/TokensSection.tsx`  ✨ nuovo · ✅, 7. Sezione **About** — `frontend/src/settings/sections/AboutSection.tsx`  ✨ nuovo · ✅, 7b. Sezione **Delete account** — `frontend/src/settings/sections/DeleteAccountSection.tsx`  ✨ nuovo · BE ✅ / FE ✅ (2026-07-05) (+9 more)

### Community 113 - "BudgetFormOverlay.tsx"
Cohesion: 0.04
Nodes (64): InputProps, Menu, MenuContent(), MenuContentProps, MenuContext, MenuContextValue, MenuItem(), MenuItemProps (+56 more)

### Community 114 - ".sendYearlyReports"
Cohesion: 0.20
Nodes (5): Override, YearlyReportCronJob, FunctionalInterface, SendForUser, YearlyReportCronJobTest

### Community 115 - "Appendix — full live call-site table"
Cohesion: 0.13
Nodes (14): Admin, Appendix — full live call-site table, Auth & onboarding, Dashboard / wallet, Dead files (never imported — delete; not audited in depth), Modals (wallet / tag / subscription / transaction), OAuth consent, P0 — Correctness bug (+6 more)

### Community 116 - "StatisticsTab.tsx"
Cohesion: 0.14
Nodes (12): buildMonthlyBuckets(), CumulativeChart(), MonthlySnapshotChart(), StatisticsSummary(), StatisticsSummaryProps, SummaryCardProps, CHART_TABS, ChartMode (+4 more)

### Community 117 - "useAmountInput.ts"
Cohesion: 0.23
Nodes (9): AmountType, evaluateSignedAmount(), useAmountInput(), UseAmountInputArgs, AmountType, Harness(), formatAmountString(), hasOperators() (+1 more)

### Community 118 - "BankConnection"
Cohesion: 0.10
Nodes (13): BankSyncCronJob, Override, BankConnection, AllArgsConstructor, Builder, Data, Entity, NoArgsConstructor (+5 more)

### Community 119 - "PWAProvider.test.tsx"
Cohesion: 0.24
Nodes (8): Consumer(), BeforeInstallPromptEvent, Window, WindowEventMap, PWAContext, PWAContextType, usePWA(), PWAProvider()

### Community 120 - ".createInvite"
Cohesion: 0.25
Nodes (3): PostMapping, AdminInviteRequest, org.springframework.security.test.context.support.WithMockUser

### Community 121 - ".map"
Cohesion: 0.21
Nodes (5): BankTransactionMapper, Type, MappedTx, EbTransaction, BankTransactionMapperTest

### Community 122 - "ReportHtmlBuilder"
Cohesion: 0.14
Nodes (7): CategoryTotal, PeriodTotals, Pattern, ReportHtmlBuilder, WalletYearlyReport, YearRecords, ReportHtmlBuilderTest

### Community 123 - "Phase map"
Cohesion: 0.14
Nodes (13): Design decisions (agreed in grilling, 2026-07-07), Global Constraints, Phase map, Reminder Subscriptions (Amount-less) Implementation Plan, Task 1: Entity flags + DTO/mapper plumbing (backend), Task 2: SubscriptionService — create/update reminder subscriptions, Task 3: Cron — generate pending transactions, Task 4: Fill endpoint + pending-clearing on update/bulk (backend) (+5 more)

### Community 124 - "axiosConfig.test.ts"
Cohesion: 0.18
Nodes (10): OfflineBanner(), useOnlineStatus(), base64url(), makeJwt(), setOnline(), stubLocation(), cacheGet, cachePut (+2 more)

### Community 125 - "BankLinkControllerTest"
Cohesion: 0.24
Nodes (5): Role, ADMIN, USER, BankLinkControllerTest, User

### Community 126 - "refactor.ts"
Cohesion: 0.50
Nodes (3): fileMoves, project, ts-morph

### Community 127 - "WalletProvisioningIntegrationTest"
Cohesion: 0.21
Nodes (3): User, WalletProvisioningIntegrationTest, org.springframework.transaction.PlatformTransactionManager

### Community 128 - "5. Epic: eliminare `no-explicit-any` (90 → 0)"
Cohesion: 0.09
Nodes (21): 1. Causa radice, 2. Strategia (Ibrido), 3. TODO, 4. Debito tecnico tracciato (warning, da smaltire in futuro), 5. Epic: eliminare `no-explicit-any` (90 → 0), 6. `react-refresh/only-export-components` (7 → 0), 7. `react-hooks/exhaustive-deps` (6 → 0), A. Config ESLint — sblocco (degrado regole rumorose) (+13 more)

### Community 130 - "Wallet data unifier + client cache — Design"
Cohesion: 0.15
Nodes (12): A. Backend — aggregate endpoint (new), Architecture, B. Frontend — unified fetch + TTL cache, Data flow, Design decisions (agreed), Expected result, Goals, Non-goals (+4 more)

### Community 131 - "Invitations in the Wallet Sidebar — Design"
Cohesion: 0.15
Nodes (12): Backend contract (already implemented — `MembersController` @ `/api/invitations`), Components (all new files under `src/dashboard/wallet/`), Count badge & empty state, Edge cases, Files, Goals, Invitations in the Wallet Sidebar — Design, Non-goals (YAGNI) (+4 more)

### Community 132 - "replay.test.ts"
Cohesion: 0.15
Nodes (9): OFFLINE_SYNC_COMPLETE, mockedDelete, mockedInvalidate, mockedListOps, mockedPost, mockedPut, mockedRemoveOp, mockedToast (+1 more)

### Community 133 - "WebPushGateway"
Cohesion: 0.22
Nodes (6): PushGateway, Override, WebPushGateway, WebPushSenderTest, nl.martijndwars.webpush.PushService, PushService

### Community 134 - "File map"
Cohesion: 0.17
Nodes (11): Categories Widget-Grid (Customizable Layout) Implementation Plan, Confirmed product spec (from grilling), File map, Global Constraints, Self-review notes (already applied), Task 1: Pure layout model (`tabLayout.ts`), Task 2: `bare` prop on the five chart widgets, Task 3: Widget registry types, `useTabLayout` hook, Categories registry (+3 more)

### Community 135 - "Task 3 — GroupEditGrid mini-tiles + shared DnD (depends on 1 & 2)"
Cohesion: 0.17
Nodes (11): Categories Widget-Grid v2 — Group mini-tiles, internal reorder, merge-hitbox bug, DnD id scheme (one shared DndContext), GroupEditGrid.tsx, Locked behaviour (from grilling), mergeAwareCollision.ts — branch on active id, Task 1 — Bug fix: suspend slot animation during drag, Task 2 — tabLayout mutations (TDD) + useTabLayout API, Task 3 — GroupEditGrid mini-tiles + shared DnD (depends on 1 & 2) (+3 more)

### Community 136 - "Wallet End-to-End Encryption — Architecture Plan"
Cohesion: 0.17
Nodes (12): 10. Subscriptions under encryption (cron never decrypts), 11. Migrating an existing plaintext wallet → encrypted (resumable), 12. MCP server — detect and refuse (decision + rationale), 13. Demo mode, admin, PATs, 14. Honest limitations (must ship in user-facing docs page + README section), 15. Explanatory animated page (spec only — final phase), 16. Phasing overview (details in walletEncryptionTODO.md), 2. Cryptographic foundations (decisions + rationale) (+4 more)

### Community 137 - "Wallet Creation Wizard — Implementation Plan / TODO"
Cohesion: 0.17
Nodes (11): Deferred decisions (captured, revisit at their phase), Global Constraints (apply to every task, verbatim from spec/CLAUDE.md), Phase 0 — Setup, Phase 1 — Generic `Wizard` primitive (logic/structure only), Phase 2 — Full-screen shell + minimal visual mock  →  **STOP for sign-off**, Phase 3 — Shared CSV validation module + DataTab retrofit, Phase 4 — Backend: subscription dedup key `name+tag+startDate`, Phase 5 — Wallet flow: `CreateWalletWizard` (steps 1, 3, 4, 5) + orchestration (+3 more)

### Community 138 - "Wallet slug leggibile nell'URL"
Cohesion: 0.17
Nodes (11): 1. Helper `src/utils/walletSlug.ts` (nuovo), 2. Risoluzione slug → wallet (in `UserDashboard.tsx`), 3. Costruzione dei link, 4. Canonicalizzazione, Design, File toccati, Fuori ambito, Obiettivo (+3 more)

### Community 139 - "MonthlyReportCronJob"
Cohesion: 0.42
Nodes (3): Override, MonthlyReportCronJob, MonthlyReportCronJobTest

### Community 140 - "org.springframework.stereotype.Component"
Cohesion: 0.11
Nodes (12): Override, NotificationCleanupCronJob, PatMapper, ReportService, JobFrequency, DAILY, HOURLY, MONTHLY (+4 more)

### Community 141 - "Navbar.tsx"
Cohesion: 0.21
Nodes (8): Navbar(), NavbarProps, SECTION_IDS, useActiveSection(), Cb, disconnect, IDS, observe

### Community 142 - "NotificationTypeConstraintCleanup"
Cohesion: 0.31
Nodes (6): Override, NotificationTypeConstraintCleanup, NotificationTypeConstraintCleanupTest, org.springframework.boot.ApplicationArguments, org.springframework.boot.ApplicationRunner, org.springframework.jdbc.core.JdbcTemplate

### Community 143 - "Responsive Overlay Pattern — Implementation TODO"
Cohesion: 0.18
Nodes (10): Decisions (from brainstorming), Definition of done, Open / defer, Responsive Overlay Pattern — Implementation TODO, S1 — The `ResponsiveOverlay` primitive (evolve `components/ui/Drawer.tsx`), S2 — Trigger model (keep call sites imperative), S3 — Per-surface migration, S4 — What stays `ModalDialog` (unchanged) (+2 more)

### Community 144 - "SubscriptionCronJob"
Cohesion: 0.35
Nodes (3): Override, SubscriptionCronJob, SubscriptionCronJobTest

### Community 145 - "WalletRole"
Cohesion: 0.50
Nodes (4): WalletRole, EDITOR, OWNER, VIEWER

### Community 146 - "sw.ts"
Cohesion: 0.29
Nodes (5): workbox-cacheable-response, workbox-expiration, workbox-precaching, workbox-routing, workbox-strategies

### Community 147 - "Decisioni per te (non le ho prese io)"
Cohesion: 0.14
Nodes (13): Convenzioni, Cosa NON ho fatto, Cosa è stato fatto, Decisioni per te (non le ho prese io), Dipendenze npm inutilizzate (F22) — non rimosse, File più grossi prima → dopo, Frontend restructure — notte del 2026-10-27, Le tue modifiche non committate (+5 more)

### Community 148 - "JwtService"
Cohesion: 0.35
Nodes (4): JwtService, io.jsonwebtoken.Claims, java.security.Key, org.springframework.security.core.userdetails.UserDetails

### Community 149 - "BackupCronJob"
Cohesion: 0.38
Nodes (3): BackupCronJob, Override, BackupCronJobTest

### Community 150 - "Admin Section Redesign — TODO"
Cohesion: 0.22
Nodes (8): Admin Section Redesign — TODO, Backend endpoints (new), Decisions (locked via /grilling, 2026-07-03), Increment 1 — Admin shell + Users tab  ·  *frontend only, zero risk*  ·  ✅ built, awaiting sign-off, Increment 2 — Backups tab + delete backend  ·  *frontend + small backend*  ·  ✅ built, awaiting sign-off, Increment 3 — System tab + cron backend  ·  *big backend, last*  ·  ✅ built, awaiting sign-off, New / reusable pieces produced here, Target layouts (ASCII)

### Community 151 - "Category Management — Redesign (planning only)"
Cohesion: 0.22
Nodes (8): Category Management — Redesign (planning only), Definition of done (for when we DO start), Open questions to resolve in the brainstorming (do not ask yet), Options to explore in brainstorming (NOT decisions), Scope, What's wrong (why "hidden and not effective"), What to keep, Where it lives today

### Community 152 - "Wallet Data Unifier + Client Cache — Implementation Plan"
Cohesion: 0.22
Nodes (8): File Structure, Global Constraints, Self-Review, Task 1: Backend — aggregate DTO + service, Task 2: Backend — controller endpoint, Task 3: Frontend — cache module + type, Task 4: Frontend — wire WalletProvider to the cache, Wallet Data Unifier + Client Cache — Implementation Plan

### Community 153 - "Global Constraints"
Cohesion: 0.22
Nodes (8): Execution Handoff, Global Constraints, Invitations in the Wallet Sidebar — Implementation Plan, Self-Review, Task 1: `useInvitations` hook, Task 2: `InviteCard` presentational tile, Task 3: `WalletInvites` placed pieces (badge, mobile panel, desktop section), Task 4: Wire into `WalletsBar` + retire the old `InvitationsModal`

### Community 154 - "replay.ts"
Cohesion: 0.38
Nodes (9): classifyReplayError(), collectionUrl(), initSync(), ReplayClassification, replaySync(), resourceUrl(), sendOp(), RFC-7807 (+1 more)

### Community 155 - "Kickoff prompt — SETTINGS redesign (copy into a new session)"
Cohesion: 0.25
Nodes (7): Come procedere (IMPORTANTE — è il flusso richiesto), Contesto: lavori recenti già FATTI, File coinvolti (TUTTI da rifare) — `frontend/src/`, Kickoff prompt — SETTINGS redesign (copy into a new session), Obiettivo di questa sessione: la sezione SETTINGS (redesign quasi TOTALE), Verifica sempre verde (dopo ogni elemento), Vincoli fermi

### Community 156 - "5. Authentication protocol changes"
Cohesion: 0.25
Nodes (8): 5.1 Pre-auth salt endpoint, 5.2 Login (V2), 5.3 Registration via invite (V2 from birth), 5.4 Password change (re-wrap PriK only), 5.5 Remember-me and local key persistence, 5.6 Legacy users — lazy upgrade V1 → V2, 5.7 Forgot / reset password, 5. Authentication protocol changes

### Community 157 - "overlayHistory.ts"
Cohesion: 0.46
Nodes (7): CloseFn, ensureListening(), onPopState(), reconcile(), reconcileSoon(), registerOverlay(), stack

### Community 158 - "AssignableUuidV7Generator"
Cohesion: 0.39
Nodes (5): AssignableUuidV7Generator, Override, org.hibernate.engine.spi.SharedSessionContractImplementor, org.hibernate.generator.BeforeExecutionGenerator, org.hibernate.generator.EventType

### Community 159 - "EbAccount"
Cohesion: 0.22
Nodes (4): EbAccount, EbDtos, java.security.KeyPair, org.junit.jupiter.api.BeforeAll

### Community 160 - "1. What I extracted from the codebase"
Cohesion: 0.29
Nodes (7): 1.1 Entities (backend `model/`, PostgreSQL via `ddl-auto=update`, no Flyway), 1.2 Current auth flow, 1.3 Current offline / sync layer (frontend), 1.4 Current MCP behavior, 1.5 Authorization & other cross-cutting facts, 1.6 Files that will be touched (complete map), 1. What I extracted from the codebase

### Community 161 - "ForgotPasswordSent.tsx"
Cohesion: 0.48
Nodes (4): ForgotPasswordSent(), Props, formatCooldown(), useCooldown()

### Community 162 - "jakarta.transaction.Transactional"
Cohesion: 0.06
Nodes (19): Override, EmailChangeRequestRepository, ManageUserRepository, NotificationRepository, InvitationStatus, RegistrationsRepository, SubscriptionRepository, AccountDeletionService (+11 more)

### Community 163 - "Categories (Tags) tab — charts plan"
Cohesion: 0.33
Nodes (5): Categories (Tags) tab — charts plan, Follow-ups — DONE, Increments (propose design in chat → OK → implement → verify → next), Locked decisions (2026-07-03), Verify (after each)

### Community 164 - "8. Sync design (frontend `src/sync/`, extending the existing layer)"
Cohesion: 0.33
Nodes (6): 8.1 Local store (Dexie v2 upgrade of `FinanceAppOffline`), 8.2 Pull (delta apply), 8.3 Push (offline mutations), 8.4 Conflicts — two-way, whole-entity choice (mine or theirs), 8.5 Compaction (`CronJob/ChangeLogCompactionCronJob`, ManagedJob, default weekly), 8. Sync design (frontend `src/sync/`, extending the existing layer)

### Community 165 - "Global Constraints"
Cohesion: 0.33
Nodes (5): Global Constraints, Self-Review, Task 1: Helper `walletSlug` con test, Task 2: Usare lo slug in `UserDashboard.tsx`, Wallet Slug URL Implementation Plan

### Community 166 - "Transaction"
Cohesion: 0.12
Nodes (14): Type, EXPENSE, INCOME, Entity, Table, Transaction, Type, EXPENSE (+6 more)

### Community 167 - "Frequency"
Cohesion: 0.40
Nodes (5): Frequency, DAILY, MONTHLY, WEEKLY, YEARLY

### Community 168 - "BackendApplication"
Cohesion: 0.60
Nodes (3): BackendApplication, org.springframework.boot.autoconfigure.SpringBootApplication, org.springframework.scheduling.annotation.EnableScheduling

### Community 170 - "Verifying FinanceWebApp changes at runtime"
Cohesion: 0.40
Nodes (4): Frontend, Recipe: isolated backend instance with your working-tree code, Verifying FinanceWebApp changes at runtime, What is usually already running (do NOT touch)

### Community 171 - "9. Sharing, invitation, revocation"
Cohesion: 0.40
Nodes (5): 9.1 Invite A → B (encrypted wallet), 9.2 Invitee without a keypair (V1 user) or without an account, 9.3 Revocation semantics (chosen behavior, stated plainly), 9.4 PENDING_REWRAP recovery (after §5.7 key reset), 9. Sharing, invitation, revocation

### Community 174 - "Open Banking: note notturne per la revisione"
Cohesion: 0.25
Nodes (7): Da provare tu, con banca e chiave reali, Decisioni prese da me (da rivedere), Open Banking: note notturne per la revisione, ✅ Sistemati (commit `fdec269`, `./gradlew check` verde), Spegnimento, Stato in breve, (storico) Problemi trovati prima del merge

### Community 175 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 176 - "ToDoList.tsx"
Cohesion: 0.15
Nodes (10): Sphere(), SphereProps, BackgroundBlobs(), rawToDoData, todoData, ToDoItem, ToDoItemInput, ToDoStatus (+2 more)

### Community 177 - "7. E2EE data plane (new API, coexisting with the legacy plane)"
Cohesion: 0.50
Nodes (4): 7.1 Why a separate plane, 7.2 Endpoints (`controller/E2eeController`, service `E2eeSyncService`), 7.3 Change-log append (correctness details), 7. E2EE data plane (new API, coexisting with the legacy plane)

### Community 202 - "useTheme"
Cohesion: 0.16
Nodes (12): BackgroundSpheres(), SphereConfig, SPHERES, ThemeSelector(), JAN_15, themeValue, Consumer(), Theme (+4 more)

### Community 204 - "DemoService"
Cohesion: 0.16
Nodes (10): DemoService, Tag, Transaction, Type, Wallet, DemoControllerTest, org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration, DemoServiceTest (+2 more)

### Community 207 - "BackupRow.tsx"
Cohesion: 0.25
Nodes (14): BackupConfirmModal(), Props, ageColorClass(), formatLabel(), formatSize(), parseKeyDate(), relativeAge(), BackupRow() (+6 more)

### Community 212 - "NotificationType"
Cohesion: 0.09
Nodes (21): NotificationType, BANK_CONNECTION, BANK_TRANSACTION_IMPORTED, BUDGET_ALERT, MONTHLY_REPORT, RECURRING_EXECUTED, SUBSCRIPTION_CREATED, SUBSCRIPTION_DELETED (+13 more)

### Community 285 - "Status"
Cohesion: 0.33
Nodes (6): Status, ACTIVE, ERROR, EXPIRED, PAUSED, PENDING

### Community 286 - "BaseWebMvcTest"
Cohesion: 0.06
Nodes (34): BackendApplicationTests, BaseWebMvcTest, Override, TestWebMvcConfig, ManageUserServiceTest, BaseIntegrationTest, FixedClock, FixedClock (+26 more)

### Community 291 - "Duration"
Cohesion: 0.50
Nodes (4): Duration, FOREVER, TIMES, UNTIL

### Community 292 - "Status"
Cohesion: 0.50
Nodes (4): Status, ACTIVE, COMPLETED, PAUSED

## Knowledge Gaps
- **1132 isolated node(s):** `backend-mark.sh script`, `backend-tests.sh script`, `frontend-mark.sh script`, `PENDING`, `ACTIVE` (+1127 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1689 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `triggerToast`, `Transaction`, `Subscription`, `vitest`, `Navbar.tsx`, `LandingPage.tsx`, `useTabLayout.ts`, `SubscriptionModal.tsx`, `useSyncStatus.ts`, `tagOrder.ts`, `CustomDatePicker.tsx`, `ForgotPasswordSent.tsx`, `TagRequest`, `CategoryHeatmapChart.tsx`, `TagsStep.tsx`, `frontend/package.json`, `domain.ts`, `WalletsBar.tsx`, `TagsStep.test.tsx`, `ToDoList.tsx`, `JobCard.tsx`, `Button.tsx`, `TransactionsStep.tsx`, `useCsvImport.ts`, `OverviewTable.tsx`, `MonthlyChart.tsx`, `useTheme`, `BackupRow.tsx`, `NotificationsSection.tsx`, `@fortawesome/free-solid-svg-icons`, `offlineDb.ts`, `ColorSelector.tsx`, `formatAmount`, `BudgetFormOverlay.tsx`, `StatisticsTab.tsx`, `useAmountInput.ts`, `PWAProvider.test.tsx`, `axiosConfig.test.ts`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `triggerToast`, `Transaction`, `replay.test.ts`, `Subscription`, `Navbar.tsx`, `LandingPage.tsx`, `useTabLayout.ts`, `SubscriptionModal.tsx`, `useSyncStatus.ts`, `tagOrder.ts`, `exchangeRates.ts`, `CustomDatePicker.tsx`, `ForgotPasswordSent.tsx`, `TagRequest`, `CategoryHeatmapChart.tsx`, `TagsStep.tsx`, `YearSelector.tsx`, `frontend/package.json`, `domain.ts`, `WalletsBar.tsx`, `CsvUploadField`, `TagsStep.test.tsx`, `ToDoList.tsx`, `csvImport.ts`, `JobCard.tsx`, `Button.tsx`, `TransactionsStep.tsx`, `useCsvImport.ts`, `OverviewTable.tsx`, `MonthlyChart.tsx`, `useTheme`, `react`, `BackupRow.tsx`, `NotificationsSection.tsx`, `walletOps.ts`, `@fortawesome/free-solid-svg-icons`, `offlineDb.ts`, `csvValidation.ts`, `walletCreation.ts`, `ColorSelector.tsx`, `formatAmount`, `categoryChartData.ts`, `BudgetFormOverlay.tsx`, `StatisticsTab.tsx`, `useAmountInput.ts`, `PWAProvider.test.tsx`, `MonthSelector.tsx`, `axiosConfig.test.ts`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `User` connect `User` to `org.junit.jupiter.api.Test`, `lombok.RequiredArgsConstructor`, `PersonalAccessToken`, `MemberServiceTest`, `UserControllerTest.java`, `WalletAccess`, `org.junit.jupiter.api.extension.ExtendWith`, `lombok.Data`, `JwtService`, `WalletServiceTest.java`, `RegisterServiceTest`, `WalletServiceTest`, `Budget`, `Tag`, `BaseWebMvcTest`, `WalletSecurityTest`, `jakarta.transaction.Transactional`, `TransactionServiceTest`, `SubscriptionServiceTest.java`, `.generateToken`, `SubscriptionServiceTest`, `OAuthController`, `UserServiceTest`, `EnableBankingClientTest`, `NotificationCopy`, `AuthControllerTest`, `BankLinkService.java`, `.computeStatus`, `DemoService`, `PatAuthenticationFilterTest`, `NotificationDispatcherTest`, `NotificationType`, `AccountDeletionServiceTest`, `org.springframework.context.annotation.Bean`, `BankLinkServiceTest`, `WalletAccessId`, `ReportServiceTest`, `BankSyncServiceTest`, `DemoCleanupCronJobTest`, `.sendYearlyReports`, `BankConnection`, `BankLinkControllerTest`, `WalletProvisioningIntegrationTest`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 34 inferred relationships involving `User` (e.g. with `.run()` and `.memberWithEmail()`) actually correct?**
  _`User` has 34 INFERRED edges - model-reasoned connections that need verification._
- **What connects `backend-mark.sh script`, `backend-tests.sh script`, `frontend-mark.sh script` to the rest of the system?**
  _1132 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `jakarta.servlet.http.HttpServletRequest` be split into smaller, more focused modules?**
  _Cohesion score 0.0890937019969278 - nodes in this community are weakly interconnected._
- **Should `org.junit.jupiter.api.Test` be split into smaller, more focused modules?**
  _Cohesion score 0.03649254509435929 - nodes in this community are weakly interconnected._