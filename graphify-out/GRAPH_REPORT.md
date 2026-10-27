# Graph Report - FinanceWebApp-openbanking-wt  (2026-10-27)

## Corpus Check
- 793 files · ~442,564 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 5388 nodes · 17643 edges · 193 communities (168 shown, 20 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 2277 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `65bbbcb5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- GlobalExceptionHandlerTest
- triggerToast
- mcp_server.py
- domain.ts
- org.junit.jupiter.api.Test
- lombok.Data
- Budget
- PatServiceTest
- lombok.RequiredArgsConstructor
- TransactionServiceTest
- .generateToken
- WalletAccess
- Wallet
- StagedSubscriptionRow.tsx
- useWalletContext
- @fortawesome/free-solid-svg-icons
- vitest
- org.junit.jupiter.api.BeforeEach
- Registrations
- BackupServiceTest
- WidgetGrid.tsx
- User
- FinanceWebApp Project
- org.springframework.data.jpa.repository.JpaRepository
- Tag
- dependencies
- @fortawesome/fontawesome-svg-core
- BankSyncCronJobTest
- devDependencies
- WalletSecurityTest
- PersonalAccessTokenRepository
- compilerOptions
- react
- WalletController
- compilerOptions
- Frontend UI Redesign — TODO
- ResponsiveOverlay.tsx
- BankConnection
- SystemTab.tsx
- AdminUserInviteServiceTest
- Frontend Unit-Test Plan — `frontend/`
- LandingPage.tsx
- frontend/package.json
- BudgetFormOverlay.tsx
- OAuthControllerTest
- <p align="center">FinanceWebApp - Portfolio Showcase</p>
- DataTab.tsx
- scripts
- UserServiceTest
- PersonalAccessToken
- BankLinkServiceTest
- TagRequest
- org.springframework.context.annotation.Bean
- BankSyncServiceTest
- jakarta.transaction.Transactional
- package.json
- React + TypeScript + Vite
- tsconfig.json
- WalletProvider.test.tsx
- CreateWalletWizard.tsx
- SubscriptionServiceTest
- TagsStep.tsx
- org.springframework.http.ResponseEntity
- BankLinkService.java
- EnableBankingClient
- Phases D–I — String extraction by area
- MCP Server Python Dependencies
- BankAccountsSection.tsx
- CategoryManagerDrawer.tsx
- MFA (TOTP + Email code) — Implementation Plan / TODO
- csvImport.ts
- OverviewTable.tsx
- WalletRequest
- useTheme
- jakarta.servlet.http.HttpServletRequest
- Interactive Onboarding (guided tour) — Implementation Plan / TODO
- TransactionsStep.tsx
- NotificationsSection.tsx
- Periodic Summary Reports — Implementation Plan
- CategoryTrendChart.tsx
- ScheduledJobService
- Frontend Restructure — Analysis & Execution Plan / TODO
- .sendMonthlyReports
- BankLinkService
- useSyncStatus.ts
- walletOps.ts
- ScheduledJobDTO
- SubscriptionService
- EbTransaction
- NotificationDispatcherTest
- Transaction
- .processDueSubscriptions
- Landing Page Redesign — Design Spec
- TokenListItem.tsx
- Wallet Creation Wizard — Design Spec
- useNotifications.test.tsx
- ReportHtmlBuilder
- Offline Sync Rework — Implementation Plan / TODO
- Web Push Notifications — Implementation Plan / TODO
- Phase A — Backend
- AdminJobControllerTest
- .budget
- FrankfurterExchangeRateService
- axiosConfig.test.ts
- replay.ts
- .updateSubscription
- vite.config.ts
- EnableBankingClientTest
- Frequency
- Settings Refactor — TODO
- ReportHtmlBuilderTest
- Settings tab — redesign plan
- Appendix — full live call-site table
- OAuthController
- DemoCleanupCronJobTest
- ReportAggregatorTest
- Wallet End-to-End Encryption — Implementation TODO
- ColorSelector.tsx
- SyncCenterOverlay.tsx
- PWAProvider.test.tsx
- Phase map
- ThemeContext.tsx
- csvDedup.ts
- refactor.ts
- SendEmailService
- 5. Epic: eliminare `no-explicit-any` (90 → 0)
- Wallet data unifier + client cache — Design
- Invitations in the Wallet Sidebar — Design
- StagedTagTree.tsx
- replay.test.ts
- TagController
- .toDTO
- WebPushSenderTest
- File map
- Task 3 — GroupEditGrid mini-tiles + shared DnD (depends on 1 & 2)
- Wallet End-to-End Encryption — Architecture Plan
- Wallet Creation Wizard — Implementation Plan / TODO
- Wallet slug leggibile nell'URL
- ToDoList.tsx
- ImportReviewModal.tsx
- SubscriptionCronJob
- AssignableUuidV7Generator
- Responsive Overlay Pattern — Implementation TODO
- sw.ts
- BankAccountLink
- WebPushGateway
- exchangeRates.ts
- .sendYearlyReports
- Admin Section Redesign — TODO
- Category Management — Redesign (planning only)
- Wallet Data Unifier + Client Cache — Implementation Plan
- Global Constraints
- overlay.test.ts
- Kickoff prompt — SETTINGS redesign (copy into a new session)
- 5. Authentication protocol changes
- overlayHistory.ts
- .generateUuid
- JobFrequencyConverter
- 1. What I extracted from the codebase
- Status
- InvitationStatus
- Categories (Tags) tab — charts plan
- 8. Sync design (frontend `src/sync/`, extending the existing layer)
- Global Constraints
- BackendApplication
- AssignableUuidV7
- Verifying FinanceWebApp changes at runtime
- 9. Sharing, invitation, revocation
- CashFlowSankey.tsx
- TransactionPieChart.tsx
- gradlew
- Duration
- Status
- WalletRole
- EnableBankingException
- ReportPdfRendererTest
- 7. E2EE data plane (new API, coexisting with the legacy plane)
- .handleValidationException
- Type
- Type
- frontend-checks.sh
- runtime-env.d.ts
- rules/graphify.md
- workflows/graphify.md
- backend-mark.sh
- backend-tests.sh
- frontend-mark.sh
- 40-config.sh

## God Nodes (most connected - your core abstractions)
1. `User` - 250 edges
2. `react` - 241 edges
3. `vitest` - 145 edges
4. `WalletAccess` - 128 edges
5. `@fortawesome/free-solid-svg-icons` - 122 edges
6. `@fortawesome/react-fontawesome` - 118 edges
7. `Wallet` - 108 edges
8. `@testing-library/react` - 105 edges
9. `UserRepository` - 96 edges
10. `Tag` - 92 edges

## Surprising Connections (you probably didn't know these)
- `Docker Compose Production Environment` --semantically_similar_to--> `Docker Compose Dev Environment`  [INFERRED] [semantically similar]
  docker-compose.prod.yml → docker-compose.yml
- `Glassmorphism Design System` --conceptually_related_to--> `PWA Icon Set`  [INFERRED]
  README.md → frontend/public/pwa-512x512.png
- `Registration Invite Email Template` --conceptually_related_to--> `Real-Time Collaboration Layer (RBAC)`  [INFERRED]
  backend/src/main/resources/templates/email/registrationInviteEmail.html → README.md
- `Wallet Invite Email Template` --conceptually_related_to--> `Real-Time Collaboration Layer (RBAC)`  [INFERRED]
  backend/src/main/resources/templates/email/walletInviteEmail.html → README.md
- `Zero-Friction Demo Mode` --conceptually_related_to--> `Matrix Deploy (Prod + Demo)`  [INFERRED]
  README.md → .github/workflows/deploy.yml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Four-Service Docker Architecture** — docker_compose_postgres_service, docker_compose_backend_service, docker_compose_frontend_service, docker_compose_mcp_service [EXTRACTED 1.00]
- **Email Notification System** — docker_compose_mail_config, backend_src_main_resources_templates_email_forgotpasswordemail, backend_src_main_resources_templates_email_registrationinviteemail, backend_src_main_resources_templates_email_walletinviteemail [INFERRED 0.85]
- **CI/CD Deployment Pipeline** — github_workflows_deploy, github_workflows_deploy_matrix_deploy, github_workflows_deploy_git_post_deploy, github_workflows_deploy_weekly_cleanup, docker_compose_prod [EXTRACTED 1.00]

## Communities (193 total, 20 thin omitted)

### Community 0 - "GlobalExceptionHandlerTest"
Cohesion: 0.07
Nodes (9): StaleWriteException, TagHasChildrenException, TagInUseException, UnauthorizedAccessException, UserAlreadyExistsException, GlobalExceptionHandlerTest, org.springframework.http.HttpStatus, org.springframework.web.bind.MethodArgumentNotValidException (+1 more)

### Community 1 - "triggerToast"
Cohesion: 0.03
Nodes (115): AdminDashboard(), UsersPageProps, AdminPageHeader(), AdminPageHeaderProps, ageColorClass(), BackupEntry, Backups(), ConfirmState (+107 more)

### Community 2 - "mcp_server.py"
Cohesion: 0.08
Nodes (76): BaseHTTPMiddleware, Context, custom_route, description, FastMCP, Field, ge, gt (+68 more)

### Community 3 - "domain.ts"
Cohesion: 0.04
Nodes (96): CurrencySelector(), CurrencySelectorProps, MAIN_SET, FieldLabel(), FloatingActionButton(), FloatingActionButtonProps, SyncStateIcon(), SyncStateIconProps (+88 more)

### Community 4 - "org.junit.jupiter.api.Test"
Cohesion: 0.04
Nodes (27): WalletAccessId, AdminDatabaseControllerTest, org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration, AdminUserControllerTest, org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration, org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration, MembersControllerTest, org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration (+19 more)

### Community 5 - "lombok.Data"
Cohesion: 0.07
Nodes (49): PutMapping, AuthResponse, NotificationPreferencesRequest, NotificationPreferencesResponse, WalletMute, NotificationResponse, PushSubscriptionRequest, RegisterInviteResponse (+41 more)

### Community 6 - "Budget"
Cohesion: 0.05
Nodes (32): BudgetController, DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, BudgetResolution (+24 more)

### Community 7 - "PatServiceTest"
Cohesion: 0.05
Nodes (22): DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, PatController, PatBulkDeleteRequest (+14 more)

### Community 8 - "lombok.RequiredArgsConstructor"
Cohesion: 0.05
Nodes (43): AdminDatabaseController, RequestMapping, RestController, BackupCronJob, Override, BudgetAlertCronJob, Override, DemoCleanupCronJob (+35 more)

### Community 9 - "TransactionServiceTest"
Cohesion: 0.06
Nodes (18): DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, TransactionController, TransactionRequest (+10 more)

### Community 10 - ".generateToken"
Cohesion: 0.06
Nodes (18): AuthController, PostMapping, RequestMapping, RestController, PutMapping, ForgotPasswordRequest, LoginRequest, UpdateUsernameRequest (+10 more)

### Community 11 - "WalletAccess"
Cohesion: 0.06
Nodes (25): DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, MembersController, MemberRequest (+17 more)

### Community 12 - "Wallet"
Cohesion: 0.07
Nodes (39): WalletNotFoundException, Entity, Table, Wallet, BankSyncService, BankConnectionRepository, ImportedBankTransactionRepository, SubscriptionRepository (+31 more)

### Community 13 - "StagedSubscriptionRow.tsx"
Cohesion: 0.04
Nodes (47): CustomDatePicker(), CustomDatePickerProps, DatePickerValue, Icon(), WalletIconProps, TagDropdownPanel(), TagDropdownPanelProps, TagFilter() (+39 more)

### Community 14 - "useWalletContext"
Cohesion: 0.05
Nodes (47): CalendarContainer(), CalendarContainerProps, ViewState, DateRangeValue, PresetType, DayCell(), DayCellProps, MonthGrid() (+39 more)

### Community 15 - "@fortawesome/free-solid-svg-icons"
Cohesion: 0.06
Nodes (49): ColorSelectorPropsProps, IconColorSelector(), IconPickerButton(), IconPickerButtonProps, IconSelector(), IconSelectorProps, MockTransactionRowProps, TagSelectorAddFormProps (+41 more)

### Community 16 - "vitest"
Cohesion: 0.04
Nodes (41): WalletPermissionSelector(), WalletPermissionSelectorProps, Collapse(), CollapseProps, InputProps, AmountType, NumberInput, NumberInputProps (+33 more)

### Community 17 - "org.junit.jupiter.api.BeforeEach"
Cohesion: 0.05
Nodes (30): Override, NotificationCleanupCronJob, NotificationRepository, JobFrequency, DAILY, HOURLY, MONTHLY, WEEKLY (+22 more)

### Community 18 - "Registrations"
Cohesion: 0.06
Nodes (19): PostMapping, GetMapping, RegisterInviteResponse, AdminInviteRequest, RegisterInviteRequest, ResetPasswordRequest, InvitationStatus, ACCEPTED (+11 more)

### Community 19 - "BackupServiceTest"
Cohesion: 0.05
Nodes (9): BackupEntry, DeleteMapping, GetMapping, BackupEntry, BackupEntry, R2StorageService, BackupServiceTest, R2StorageServiceTest (+1 more)

### Community 20 - "WidgetGrid.tsx"
Cohesion: 0.07
Nodes (56): GroupEditGrid(), GroupEditGridProps, MemberTile(), MemberTileProps, HiddenTray(), HiddenTrayProps, TrayChipProps, groupBodyId() (+48 more)

### Community 21 - "User"
Cohesion: 0.06
Nodes (26): DeleteMapping, GetMapping, PostMapping, RequestMapping, RestController, UserController, DeleteAccountRequest, EmailChangeConfirmDto (+18 more)

### Community 22 - "FinanceWebApp Project"
Cohesion: 0.09
Nodes (29): Forgot Password Email Template, Registration Invite Email Template, Wallet Invite Email Template, Spring Boot Backend Service, Database Backup Configuration, Docker Compose Dev Environment, Vite + React Frontend Service, JWT Authentication Configuration (+21 more)

### Community 23 - "org.springframework.data.jpa.repository.JpaRepository"
Cohesion: 0.06
Nodes (23): UserNotFoundException, ImportedBankTransaction, AllArgsConstructor, Builder, Data, Entity, NoArgsConstructor, Table (+15 more)

### Community 24 - "Tag"
Cohesion: 0.09
Nodes (8): TagNotFoundException, Entity, Table, Tag, IndexedTagRow, TagService, Wallet, TagServiceTest

### Community 25 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, axios, date-fns, dexie, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, @emotion/react (+17 more)

### Community 26 - "@fortawesome/fontawesome-svg-core"
Cohesion: 0.06
Nodes (33): AdminTab, AdminTabs(), TABS, AdminRoute(), RootRedirect(), InviteComposer(), InviteComposerProps, RoleSelector() (+25 more)

### Community 27 - "BankSyncCronJobTest"
Cohesion: 0.09
Nodes (7): BankSyncCronJob, Override, Copy, NotificationCopy, BankSyncCronJobTest, Status, NotificationCopyTest

### Community 28 - "devDependencies"
Cohesion: 0.06
Nodes (34): devDependencies, autoprefixer, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh (+26 more)

### Community 29 - "WalletSecurityTest"
Cohesion: 0.10
Nodes (3): PermissionDeniedException, WalletSecurity, WalletSecurityTest

### Community 30 - "PersonalAccessTokenRepository"
Cohesion: 0.09
Nodes (23): DataInitializer, Override, PersonalAccessTokenRepository, CustomUserDetailsService, Override, JwtAuthenticationFilter, PatAuthenticationFilter, RegisterService (+15 more)

### Community 31 - "compilerOptions"
Cohesion: 0.09
Nodes (22): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+14 more)

### Community 32 - "react"
Cohesion: 0.08
Nodes (28): Sphere(), SphereProps, AnimateBackground(), AuthLayout(), BackgroundBlobs(), LandingPage(), useLandingCta(), ThemeSelector() (+20 more)

### Community 33 - "WalletController"
Cohesion: 0.08
Nodes (15): AccessDeniedException, GetMapping, PostMapping, RequestMapping, RestController, SubscriptionController, DeleteMapping, GetMapping (+7 more)

### Community 34 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+11 more)

### Community 35 - "Frontend UI Redesign — TODO"
Cohesion: 0.05
Nodes (37): Backend architecture, Common commands, Conventions & gotchas, Frontend architecture, Frontend code organization (structure guidelines), graphify, MCP server, Overview (+29 more)

### Community 36 - "ResponsiveOverlay.tsx"
Cohesion: 0.06
Nodes (32): Menu, MenuContent(), MenuContentProps, MenuContext, MenuContextValue, MenuItem(), MenuItemProps, MenuItemTone (+24 more)

### Community 37 - "BankConnection"
Cohesion: 0.06
Nodes (22): BankConnection, AllArgsConstructor, Builder, Data, Entity, NoArgsConstructor, Table, Status (+14 more)

### Community 38 - "SystemTab.tsx"
Cohesion: 0.06
Nodes (34): AdminStats(), AdminStatsProps, buildSchedulePayload(), ScheduleDraft, SchedulePayload, StatCard(), StatCardProps, DAYS (+26 more)

### Community 39 - "AdminUserInviteServiceTest"
Cohesion: 0.09
Nodes (15): AdminUserController, DeleteMapping, GetMapping, PutMapping, RequestMapping, RestController, AdminInviteResponse, UserResponse (+7 more)

### Community 40 - "Frontend Unit-Test Plan — `frontend/`"
Cohesion: 0.05
Nodes (42): 1.1 Cosa esiste già, 1.2 Convenzioni del repo da rispettare (da `CLAUDE.md` + `frontend/style.md`), 1.3 Convenzioni tecniche di mocking (pattern del repo, da riusare), 1.4 Dipendenze/decisioni da risolvere prima di S1/S3, 1.5 Politica di profondità di validazione (per tier), 1. Analisi dei requisiti, 2. Sezioni di test — ordinate per sicurezza (S1 → S4), 3. Ordine di esecuzione & tracking (+34 more)

### Community 41 - "LandingPage.tsx"
Cohesion: 0.09
Nodes (28): CTASection(), CTASectionProps, Features(), tagPreviewRows, Footer(), STACK, GithubMark(), Hero() (+20 more)

### Community 42 - "frontend/package.json"
Cohesion: 0.06
Nodes (36): @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, name, private, type, version, autoprefixer (+28 more)

### Community 43 - "BudgetFormOverlay.tsx"
Cohesion: 0.09
Nodes (26): CustomSelectOption, BudgetCard(), BudgetCardProps, BudgetFormOverlay(), BudgetFormOverlayProps, PERIOD_OPTIONS, barPercent(), periodLabel() (+18 more)

### Community 44 - "OAuthControllerTest"
Cohesion: 0.08
Nodes (9): OAuthAuthorizeRequest, AuthCodeEntry, OAuthAuthCodeStore, org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration, OAuthControllerTest, OAuthAuthCodeStoreTest, lombok.Getter, org.springframework.context.annotation.Import (+1 more)

### Community 45 - "<p align="center">FinanceWebApp - Portfolio Showcase</p>"
Cohesion: 0.15
Nodes (12): 🏗️ Architecture Overview, 🚀 Automated Deployment, 🧩 Core Stack, ⚡ Demo & Onboarding Mode, ⚙️ Development Setup, Enabling Demo Features, 🚀 Engineering Highlights, 🛠️ Infrastructure & CI/CD (+4 more)

### Community 46 - "DataTab.tsx"
Cohesion: 0.10
Nodes (30): CsvUploadField(), CsvUploadFieldProps, dataRows(), parseSubscriptionsCsv(), parseTagsCsv(), parseTransactionsCsv(), CsvResource, DURATIONS (+22 more)

### Community 47 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, test:watch

### Community 48 - "UserServiceTest"
Cohesion: 0.10
Nodes (3): ChangePasswordRequest, User, UserServiceTest

### Community 49 - "PersonalAccessToken"
Cohesion: 0.11
Nodes (8): InvalidTokenException, Entity, Table, PersonalAccessToken, Override, User, Wallet, PatAuthenticationFilterTest

### Community 50 - "BankLinkServiceTest"
Cohesion: 0.18
Nodes (8): CallbackRequest, EbAccount, EbSession, BankLinkServiceTest, Aspsp, User, WalletRole, jakarta.persistence.EntityManager

### Community 51 - "TagRequest"
Cohesion: 0.09
Nodes (28): SubscriptionRequest, TagRequest, WalletDraft, MissingTransactionTagsProps, RecommendedTag, TagSourceDto, RECOMMENDED_CONTEXT_TAGS, RecommendedSubscriptionPicker() (+20 more)

### Community 52 - "org.springframework.context.annotation.Bean"
Cohesion: 0.10
Nodes (20): ApplicationConfig, AsyncConfig, CacheConfig, ThreadPoolTaskScheduler, SchedulingConfig, SecurityConfig, FixedClock, FixedClock (+12 more)

### Community 53 - "BankSyncServiceTest"
Cohesion: 0.14
Nodes (9): Status, SyncResult, EbDtos, EbTransactionPage, PsuContext, Wallet, BankSyncServiceTest, User (+1 more)

### Community 54 - "jakarta.transaction.Transactional"
Cohesion: 0.17
Nodes (8): AccountDeletionService, WalletRole, AccountDeletionServiceTest, InvitationStatus, User, Wallet, WalletRole, jakarta.transaction.Transactional

### Community 55 - "package.json"
Cohesion: 0.25
Nodes (7): dependencies, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities

### Community 56 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + TypeScript + Vite

### Community 58 - "WalletProvider.test.tsx"
Cohesion: 0.08
Nodes (28): cache, Entry, fetchAndTrack(), fetchFromApi(), getWalletData(), inflight, peek(), NOTE: not pure — it lazily deletes an entry that has aged past the TTL as a… (+20 more)

### Community 59 - "CreateWalletWizard.tsx"
Cohesion: 0.08
Nodes (23): CreateWalletWizard, CreateWalletWizardHandle, DEFAULT_DRAFT, outcomeSummary(), Props, RES_LABEL, WalletCompletionScreen(), bulkOutcome() (+15 more)

### Community 61 - "TagsStep.tsx"
Cohesion: 0.14
Nodes (21): groupTagRequests(), groupToTagRequests(), keyOfName(), RECOMMENDED_TAG_GROUPS, RecommendedTagGroup, MOCK_SOURCE_WALLETS, SourceWallet, keyOf() (+13 more)

### Community 62 - "org.springframework.http.ResponseEntity"
Cohesion: 0.15
Nodes (14): PostMapping, DemoController, NotificationController, NotificationPreferencesController, PushController, org.springframework.boot.autoconfigure.condition.ConditionalOnProperty, org.springframework.http.ResponseEntity, org.springframework.web.bind.annotation.DeleteMapping (+6 more)

### Community 63 - "BankLinkService.java"
Cohesion: 0.10
Nodes (15): OpenBankingDisabledException, BankAccountResponse, BankConnectionResponse, BankDtos, ConnectRequest, Status, UrlResponse, WalletBankResponse (+7 more)

### Community 67 - "EnableBankingClient"
Cohesion: 0.13
Nodes (17): EnableBankingClient, Builder, RawAccount, RawAmount, RawAspsps, RawAuth, RawIban, RawParty (+9 more)

### Community 68 - "Phases D–I — String extraction by area"
Cohesion: 0.06
Nodes (30): Confirmed design decisions (from the interview — do not relitigate), Explicitly out of scope (do not build), Global Constraints (apply to every task), Localization (i18n) — Implementation Plan / TODO, Phase A — Infrastructure, Phase B — Central locale-aware formats, Phase C — Language UI + error mapping, Phase J — Final gates, docs, knowledge graph, manual QA (+22 more)

### Community 70 - "BankAccountsSection.tsx"
Cohesion: 0.11
Nodes (26): Aspsp, BankAccountLink, BankConnection, connectBank(), deleteConnection(), getWalletBank(), listAspsps(), renewConnection() (+18 more)

### Community 71 - "CategoryManagerDrawer.tsx"
Cohesion: 0.12
Nodes (24): TagSelectorAddForm(), CategoryManagerDrawer(), CategoryManagerDrawerProps, deleteObject, mockedCtx, mockedDelete, setCtx(), wallet() (+16 more)

### Community 72 - "MFA (TOTP + Email code) — Implementation Plan / TODO"
Cohesion: 0.07
Nodes (29): Explicitly out of scope (do not build), Global Constraints (apply to every task), MFA (TOTP + Email code) — Implementation Plan / TODO, Phase A — Backend foundation, Phase B — Backend settings flows (enroll / disable / recovery codes), Phase C — Backend login flow + admin reset, Phase D — Ops / env plumbing, Phase E — Frontend: login second step (+21 more)

### Community 73 - "csvImport.ts"
Cohesion: 0.15
Nodes (27): buildCsv(), CsvFormatModal(), CsvFormatModalProps, downloadSample(), Mode, renderCell(), SAMPLES, SampleSpec (+19 more)

### Community 74 - "OverviewTable.tsx"
Cohesion: 0.10
Nodes (18): CellType, OverviewCell(), OverviewCellProps, DataItem, OverviewRow(), OverviewRowProps, MonthlyOverviewProps, OverviewTable() (+10 more)

### Community 75 - "WalletRequest"
Cohesion: 0.15
Nodes (4): WalletRequest, WalletRole, WalletProvisioningService, WalletProvisioningServiceTest

### Community 76 - "useTheme"
Cohesion: 0.12
Nodes (21): buildMonthlyBuckets(), MonthlyBucket, CumulativeChart(), CumulativeChartProps, darkTheme, lightTheme, darkTheme, lightTheme (+13 more)

### Community 77 - "jakarta.servlet.http.HttpServletRequest"
Cohesion: 0.26
Nodes (7): GlobalExceptionHandler, jakarta.servlet.http.HttpServletRequest, org.springframework.http.converter.HttpMessageNotReadableException, org.springframework.http.ProblemDetail, org.springframework.security.access.AccessDeniedException, org.springframework.web.bind.annotation.ExceptionHandler, org.springframework.web.bind.annotation.RestControllerAdvice

### Community 78 - "Interactive Onboarding (guided tour) — Implementation Plan / TODO"
Cohesion: 0.07
Nodes (27): Decisions (locked 2026-07-11 — do not re-litigate during implementation), Explicitly out of scope (do not build), Global Constraints (apply to every task), Interactive Onboarding (guided tour) — Implementation Plan / TODO, Phase A — Backend: flag, exposure, seed removal, Phase B — Tour engine (no product-visible change yet), Phase C — Content: anchors, wizard choreography, sample CSV, registry, Phase D — Triggers, persistence client, replay (+19 more)

### Community 79 - "TransactionsStep.tsx"
Cohesion: 0.15
Nodes (15): TransactionRequest, MissingTransactionTags(), findRecommendedTagWithParent(), addTagToDraft(), DEFAULT_TAG_COLOR, DEFAULT_TAG_ICON, tagKey(), TransactionsStep() (+7 more)

### Community 80 - "NotificationsSection.tsx"
Cohesion: 0.13
Nodes (22): fetchPublicKey(), getEnrollment(), isPushSupported(), keyToBase64(), PushEnrollment, subscribeThisDevice(), unsubscribeThisDevice(), urlBase64ToUint8Array() (+14 more)

### Community 81 - "Periodic Summary Reports — Implementation Plan"
Cohesion: 0.07
Nodes (26): Final verification (after the last task), Global Constraints, Periodic Summary Reports — Implementation Plan, Phase 1 — Scheduler MONTHLY/YEARLY, Phase 2 — Report aggregation (pure logic), Phase 3 — PDF rendering + templates, Phase 4 — Preferences, email sending, orchestration, jobs, Phase 5 — Settings “Notifications” section (+18 more)

### Community 82 - "CategoryTrendChart.tsx"
Cohesion: 0.14
Nodes (20): CATEGORIES_TAB_ID, CATEGORIES_WIDGETS, buildMainCategoryMeta(), CategoryMeta, mainCategoryName(), OTHER_COLOR, buildHeatmap(), CategoryHeatmapChart() (+12 more)

### Community 83 - "ScheduledJobService"
Cohesion: 0.18
Nodes (10): Entity, Table, ScheduledJobConfig, JobRunRepository, ScheduledJobConfigRepository, ScheduledJobService, ScheduledJobServiceTest, java.util.concurrent.ScheduledFuture (+2 more)

### Community 84 - "Frontend Restructure — Analysis & Execution Plan / TODO"
Cohesion: 0.08
Nodes (25): 5A — dashboard/tag, 5B — dashboard/statistics, 5C — dashboard/layout, 5D — dashboard/settings (CSV), 5E — dashboard core (wallet / transaction / subscription / root), 5F — modals (non-wizard), 5G — components/ui hot spots, 5H — components (pickers/selectors/landing/pat) (+17 more)

### Community 85 - ".sendMonthlyReports"
Cohesion: 0.18
Nodes (4): MonthRow, PeriodTotals, WalletMonthlyReport, java.time.YearMonth

### Community 86 - "BankLinkService"
Cohesion: 0.16
Nodes (5): BankLinkService, Aspsp, FunctionalInterface, Sleeper, Wallet

### Community 87 - "useSyncStatus.ts"
Cohesion: 0.20
Nodes (19): invalidate(), EMPTY_COUNTS, useSyncStatus(), countByStatus(), enqueueOp(), listOps(), notify(), removeOp() (+11 more)

### Community 88 - "walletOps.ts"
Cohesion: 0.18
Nodes (22): createOp(), createSubscription(), createTag(), createTransaction(), deleteSubscription(), deleteTag(), deleteTransaction(), isNetworkError() (+14 more)

### Community 89 - "ScheduledJobDTO"
Cohesion: 0.15
Nodes (9): AdminJobController, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, ScheduledJobDTO, UpdateEnabledRequest (+1 more)

### Community 90 - "SubscriptionService"
Cohesion: 0.20
Nodes (4): Entity, Table, Subscription, SubscriptionService

### Community 91 - "EbTransaction"
Cohesion: 0.20
Nodes (5): BankTransactionMapper, Type, MappedTx, EbTransaction, BankTransactionMapperTest

### Community 92 - "NotificationDispatcherTest"
Cohesion: 0.23
Nodes (5): WalletActivityEvent, WalletInviteEvent, User, NotificationDispatcherTest, org.springframework.transaction.event.TransactionalEventListener

### Community 93 - "Transaction"
Cohesion: 0.23
Nodes (6): Entity, Table, Transaction, Type, ReportAggregator, TransactionMapperTest

### Community 94 - ".processDueSubscriptions"
Cohesion: 0.20
Nodes (3): Status, Subscription, Wallet

### Community 95 - "Landing Page Redesign — Design Spec"
Cohesion: 0.09
Nodes (21): 10. Testing & verification, 11. Out of scope, 1. Goal & framing, 2. Decisions (locked with the user), 3. Style-guide compliance (`frontend/style.md`), 4. Page architecture (section order — confirmed), 5.1 Navbar, 5.2 Hero (+13 more)

### Community 96 - "TokenListItem.tsx"
Cohesion: 0.16
Nodes (10): TokenActionButtons(), TokenActionButtonsProps, TokenLastUsedInfo(), TokenLastUsedInfoProps, TokenListItem(), TokenListItemProps, TokenWalletBadges(), TokenWalletBadgesProps (+2 more)

### Community 97 - "Wallet Creation Wizard — Design Spec"
Cohesion: 0.10
Nodes (20): 10. Testing, 11. Style & copy constraints (`style.md`), 12. Implementation process, 1. Goal, 2. Scope & non-goals, 3. Codebase facts this design is built on, 4. Generic `Wizard` primitive, 5. Full-screen shell (+12 more)

### Community 98 - "useNotifications.test.tsx"
Cohesion: 0.17
Nodes (12): NotificationBell(), NotificationCenterOverlay(), NotificationCenterOverlayProps, AppNotification, PURGE_DELAY_MS, useNotifications, { openCenterMock }, { navigateMock } (+4 more)

### Community 99 - "ReportHtmlBuilder"
Cohesion: 0.26
Nodes (4): Pattern, ReportHtmlBuilder, WalletYearlyReport, YearRecords

### Community 100 - "Offline Sync Rework — Implementation Plan / TODO"
Cohesion: 0.10
Nodes (19): Confirmed design decisions (from the interview — do not relitigate), Global Constraints (apply to every task), Offline Sync Rework — Implementation Plan / TODO, Phase A — Backend, Phase B — Frontend: queue + overlay foundations, Phase C — Frontend: wiring, replay, UI, Self-review checklist (run after implementation, before hand-back), Task 10: replay engine (`src/sync/replay.ts`, replaces `utils/syncService.ts`) (+11 more)

### Community 101 - "Web Push Notifications — Implementation Plan / TODO"
Cohesion: 0.10
Nodes (19): Confirmed design decisions (from the interview — do not relitigate), Global Constraints (apply to every task), Phase 1 — Backend push infrastructure, Phase 1 — Frontend, Phase 2 — Notification center (history), Self-review checklist (run after implementation), Task 10: backend — list / mark-read / purge-read + retention job, Task 11: frontend — bell + yellow dot + center overlay with read/purge lifecycle (+11 more)

### Community 102 - "Phase A — Backend"
Cohesion: 0.11
Nodes (18): Budgeting — Implementation Plan / TODO, Global Constraints (apply to every task), Phase A — Backend, Phase B — Frontend, Phase C — Wrap-up, Self-review notes (already applied), Task 10: `BudgetFormOverlay` + delete flow, Task 11 (OPTIONAL — confirm with the user first): MCP budget tools (+10 more)

### Community 103 - "AdminJobControllerTest"
Cohesion: 0.15
Nodes (4): AdminJobControllerTest, org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration, ScheduledJobDTO, ResponseStatusException

### Community 104 - ".budget"
Cohesion: 0.22
Nodes (3): BudgetPeriods, Period, BudgetPeriodsTest

### Community 105 - "FrankfurterExchangeRateService"
Cohesion: 0.17
Nodes (8): CachedRate, FrankfurterExchangeRateService, FrankfurterRate, Builder, Override, FrankfurterExchangeRateServiceTest, org.springframework.test.web.client.MockRestServiceServer, org.springframework.web.client.RestClient

### Community 106 - "axiosConfig.test.ts"
Cohesion: 0.18
Nodes (10): OfflineBanner(), useOnlineStatus(), base64url(), makeJwt(), setOnline(), stubLocation(), cacheGet, cachePut (+2 more)

### Community 107 - "replay.ts"
Cohesion: 0.16
Nodes (14): classifyReplayError(), collectionUrl(), initSync(), ReplayClassification, resourceUrl(), sendOp(), RFC-7807, getApiErrorStatus() (+6 more)

### Community 109 - "vite.config.ts"
Cohesion: 0.29
Nodes (4): @tailwindcss/vite, vite, vite-plugin-pwa, @vitejs/plugin-react

### Community 110 - "EnableBankingClientTest"
Cohesion: 0.21
Nodes (3): EnableBankingClientTest, java.security.KeyPair, org.junit.jupiter.api.BeforeAll

### Community 111 - "Frequency"
Cohesion: 0.20
Nodes (9): Frequency, DAILY, MONTHLY, WEEKLY, YEARLY, Tag, Transaction, Type (+1 more)

### Community 112 - "Settings Refactor — TODO"
Cohesion: 0.11
Nodes (17): 1. AppHeader — `frontend/src/header/AppHeader.tsx`  🔧 modifica, 2. Routing — `frontend/src/App.tsx`  🔧 modifica, 3. Shell pagina — `frontend/src/settings/SettingsPage.tsx`  ✨ nuovo, 4. Sezione **Account** — `frontend/src/settings/sections/AccountSection.tsx`  ✅ FATTA (2026-07-05, backend incluso), 5. Sezione **Security** — `frontend/src/settings/sections/SecuritySection.tsx`  ✨ nuovo, 6. Sezione **Tokens & Connections** — `frontend/src/settings/sections/TokensSection.tsx`  ✨ nuovo · ✅, 7. Sezione **About** — `frontend/src/settings/sections/AboutSection.tsx`  ✨ nuovo · ✅, 7b. Sezione **Delete account** — `frontend/src/settings/sections/DeleteAccountSection.tsx`  ✨ nuovo · BE ✅ / FE ✅ (2026-07-05) (+9 more)

### Community 113 - "ReportHtmlBuilderTest"
Cohesion: 0.19
Nodes (3): CategoryTotal, ReportPdfRenderer, ReportHtmlBuilderTest

### Community 114 - "Settings tab — redesign plan"
Cohesion: 0.12
Nodes (14): Increments (one element at a time, user OK between each; each ends green), Locked decisions (brainstorm 2026-07-03), Refinements (post-review), Resolved decisions, Settings tab — redesign plan, Status: ALL 7 increments done. Settings scope is 0 `theme-*`, no hand-rolled CTA/text, Structure & RBAC (behaviour to preserve), TODO — CSV import (deferred, needs backend) (+6 more)

### Community 115 - "Appendix — full live call-site table"
Cohesion: 0.13
Nodes (14): Admin, Appendix — full live call-site table, Auth & onboarding, Dashboard / wallet, Dead files (never imported — delete; not audited in depth), Modals (wallet / tag / subscription / transaction), OAuth consent, P0 — Correctness bug (+6 more)

### Community 116 - "OAuthController"
Cohesion: 0.23
Nodes (5): GetMapping, Pattern, PostMapping, RestController, OAuthController

### Community 117 - "DemoCleanupCronJobTest"
Cohesion: 0.21
Nodes (4): Override, DemoCleanupCronJobTest, User, Wallet

### Community 119 - "Wallet End-to-End Encryption — Implementation TODO"
Cohesion: 0.13
Nodes (13): Cross-cutting wrap-up (after each phase, verify), Phase 0 — Frontend crypto foundations, Phase 10 — Explanatory animated page, Phase 1 — Backend key infrastructure + auth V2, Phase 2 — Frontend auth integration, Phase 3 — Backend data model for encrypted content, Phase 4 — E2EE data plane API (backend), Phase 5 — Frontend sync rework + encrypted wallet UX (+5 more)

### Community 120 - "ColorSelector.tsx"
Cohesion: 0.24
Nodes (8): COLOR_PRESETS, ColorSelector(), ColorSelectorProps, PRESET_SET, toHex(), getRecentColors(), pushRecentColor(), @uiw/react-color

### Community 121 - "SyncCenterOverlay.tsx"
Cohesion: 0.17
Nodes (10): OP_KIND_LABEL, opLabel(), SyncCenterOverlay(), SyncCenterOverlayProps, SyncStatus, failedOp, missingOp, pendingOp (+2 more)

### Community 122 - "PWAProvider.test.tsx"
Cohesion: 0.24
Nodes (8): Consumer(), BeforeInstallPromptEvent, Window, WindowEventMap, PWAContext, PWAContextType, usePWA(), PWAProvider()

### Community 123 - "Phase map"
Cohesion: 0.14
Nodes (13): Design decisions (agreed in grilling, 2026-07-07), Global Constraints, Phase map, Reminder Subscriptions (Amount-less) Implementation Plan, Task 1: Entity flags + DTO/mapper plumbing (backend), Task 2: SubscriptionService — create/update reminder subscriptions, Task 3: Cron — generate pending transactions, Task 4: Fill endpoint + pending-clearing on update/bulk (backend) (+5 more)

### Community 124 - "ThemeContext.tsx"
Cohesion: 0.22
Nodes (8): BackgroundSpheres(), SphereConfig, SPHERES, Consumer(), Theme, ThemeContext, ThemeContextType, ThemeProvider()

### Community 125 - "csvDedup.ts"
Cohesion: 0.29
Nodes (12): DedupResult, detectSubscriptionOverwrites(), detectTagOverwrites(), detectTransactionOverwrites(), isoDate(), norm(), subscriptionKey(), tagKey() (+4 more)

### Community 126 - "refactor.ts"
Cohesion: 0.50
Nodes (3): fileMoves, project, ts-morph

### Community 127 - "SendEmailService"
Cohesion: 0.07
Nodes (21): EmailService, Pattern, SendEmailService, BackendApplicationTests, BaseWebMvcTest, Override, TestWebMvcConfig, ManageUserServiceTest (+13 more)

### Community 128 - "5. Epic: eliminare `no-explicit-any` (90 → 0)"
Cohesion: 0.09
Nodes (21): 1. Causa radice, 2. Strategia (Ibrido), 3. TODO, 4. Debito tecnico tracciato (warning, da smaltire in futuro), 5. Epic: eliminare `no-explicit-any` (90 → 0), 6. `react-refresh/only-export-components` (7 → 0), 7. `react-hooks/exhaustive-deps` (6 → 0), A. Config ESLint — sblocco (degrado regole rumorose) (+13 more)

### Community 129 - "Wallet data unifier + client cache — Design"
Cohesion: 0.15
Nodes (12): A. Backend — aggregate endpoint (new), Architecture, B. Frontend — unified fetch + TTL cache, Data flow, Design decisions (agreed), Expected result, Goals, Non-goals (+4 more)

### Community 130 - "Invitations in the Wallet Sidebar — Design"
Cohesion: 0.15
Nodes (12): Backend contract (already implemented — `MembersController` @ `/api/invitations`), Components (all new files under `src/dashboard/wallet/`), Count badge & empty state, Edge cases, Files, Goals, Invitations in the Wallet Sidebar — Design, Non-goals (YAGNI) (+4 more)

### Community 131 - "StagedTagTree.tsx"
Cohesion: 0.22
Nodes (8): buildTree(), keyOf(), StagedTagNode, StagedTagTree(), StagedTagTreeProps, TagOrigin, TreeGroup, WORK

### Community 132 - "replay.test.ts"
Cohesion: 0.15
Nodes (9): OFFLINE_SYNC_COMPLETE, mockedDelete, mockedInvalidate, mockedListOps, mockedPost, mockedPut, mockedRemoveOp, mockedToast (+1 more)

### Community 133 - "TagController"
Cohesion: 0.18
Nodes (7): DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, TagController

### Community 136 - "File map"
Cohesion: 0.17
Nodes (11): Categories Widget-Grid (Customizable Layout) Implementation Plan, Confirmed product spec (from grilling), File map, Global Constraints, Self-review notes (already applied), Task 1: Pure layout model (`tabLayout.ts`), Task 2: `bare` prop on the five chart widgets, Task 3: Widget registry types, `useTabLayout` hook, Categories registry (+3 more)

### Community 137 - "Task 3 — GroupEditGrid mini-tiles + shared DnD (depends on 1 & 2)"
Cohesion: 0.17
Nodes (11): Categories Widget-Grid v2 — Group mini-tiles, internal reorder, merge-hitbox bug, DnD id scheme (one shared DndContext), GroupEditGrid.tsx, Locked behaviour (from grilling), mergeAwareCollision.ts — branch on active id, Task 1 — Bug fix: suspend slot animation during drag, Task 2 — tabLayout mutations (TDD) + useTabLayout API, Task 3 — GroupEditGrid mini-tiles + shared DnD (depends on 1 & 2) (+3 more)

### Community 138 - "Wallet End-to-End Encryption — Architecture Plan"
Cohesion: 0.17
Nodes (12): 10. Subscriptions under encryption (cron never decrypts), 11. Migrating an existing plaintext wallet → encrypted (resumable), 12. MCP server — detect and refuse (decision + rationale), 13. Demo mode, admin, PATs, 14. Honest limitations (must ship in user-facing docs page + README section), 15. Explanatory animated page (spec only — final phase), 16. Phasing overview (details in walletEncryptionTODO.md), 2. Cryptographic foundations (decisions + rationale) (+4 more)

### Community 139 - "Wallet Creation Wizard — Implementation Plan / TODO"
Cohesion: 0.17
Nodes (11): Deferred decisions (captured, revisit at their phase), Global Constraints (apply to every task, verbatim from spec/CLAUDE.md), Phase 0 — Setup, Phase 1 — Generic `Wizard` primitive (logic/structure only), Phase 2 — Full-screen shell + minimal visual mock  →  **STOP for sign-off**, Phase 3 — Shared CSV validation module + DataTab retrofit, Phase 4 — Backend: subscription dedup key `name+tag+startDate`, Phase 5 — Wallet flow: `CreateWalletWizard` (steps 1, 3, 4, 5) + orchestration (+3 more)

### Community 140 - "Wallet slug leggibile nell'URL"
Cohesion: 0.17
Nodes (11): 1. Helper `src/utils/walletSlug.ts` (nuovo), 2. Risoluzione slug → wallet (in `UserDashboard.tsx`), 3. Costruzione dei link, 4. Canonicalizzazione, Design, File toccati, Fuori ambito, Obiettivo (+3 more)

### Community 141 - "ToDoList.tsx"
Cohesion: 0.26
Nodes (6): rawToDoData, todoData, ToDoItem, ToDoItemInput, ToDoStatus, ToDoList()

### Community 142 - "ImportReviewModal.tsx"
Cohesion: 0.23
Nodes (8): DedupOverwrite, ImportResource, ImportReviewModal(), ImportReviewModalProps, ImportReviewPhase, plural(), RESOURCE_LABEL, baseProps

### Community 143 - "SubscriptionCronJob"
Cohesion: 0.35
Nodes (3): Override, SubscriptionCronJob, SubscriptionCronJobTest

### Community 144 - "AssignableUuidV7Generator"
Cohesion: 0.29
Nodes (6): AssignableUuidV7Generator, Override, org.hibernate.engine.spi.SharedSessionContractImplementor, org.hibernate.generator.BeforeExecutionGenerator, org.hibernate.generator.EventType, org.hibernate.id.uuid.UuidValueGenerator

### Community 145 - "Responsive Overlay Pattern — Implementation TODO"
Cohesion: 0.18
Nodes (10): Decisions (from brainstorming), Definition of done, Open / defer, Responsive Overlay Pattern — Implementation TODO, S1 — The `ResponsiveOverlay` primitive (evolve `components/ui/Drawer.tsx`), S2 — Trigger model (keep call sites imperative), S3 — Per-surface migration, S4 — What stays `ModalDialog` (unchanged) (+2 more)

### Community 146 - "sw.ts"
Cohesion: 0.24
Nodes (7): notificationTargetUrl(), PushPayload, workbox-cacheable-response, workbox-expiration, workbox-precaching, workbox-routing, workbox-strategies

### Community 147 - "BankAccountLink"
Cohesion: 0.24
Nodes (8): BankAccountLink, AllArgsConstructor, Builder, Data, Entity, NoArgsConstructor, Table, BankAccountLinkRepository

### Community 148 - "WebPushGateway"
Cohesion: 0.29
Nodes (5): Override, WebPushGateway, jakarta.annotation.PostConstruct, nl.martijndwars.webpush.PushService, PushService

### Community 149 - "exchangeRates.ts"
Cohesion: 0.40
Nodes (7): CachedFxRate, cacheKey(), FxRate, getExchangeRate(), readCache(), todayKey(), writeCache()

### Community 152 - "Admin Section Redesign — TODO"
Cohesion: 0.22
Nodes (8): Admin Section Redesign — TODO, Backend endpoints (new), Decisions (locked via /grilling, 2026-07-03), Increment 1 — Admin shell + Users tab  ·  *frontend only, zero risk*  ·  ✅ built, awaiting sign-off, Increment 2 — Backups tab + delete backend  ·  *frontend + small backend*  ·  ✅ built, awaiting sign-off, Increment 3 — System tab + cron backend  ·  *big backend, last*  ·  ✅ built, awaiting sign-off, New / reusable pieces produced here, Target layouts (ASCII)

### Community 153 - "Category Management — Redesign (planning only)"
Cohesion: 0.22
Nodes (8): Category Management — Redesign (planning only), Definition of done (for when we DO start), Open questions to resolve in the brainstorming (do not ask yet), Options to explore in brainstorming (NOT decisions), Scope, What's wrong (why "hidden and not effective"), What to keep, Where it lives today

### Community 154 - "Wallet Data Unifier + Client Cache — Implementation Plan"
Cohesion: 0.22
Nodes (8): File Structure, Global Constraints, Self-Review, Task 1: Backend — aggregate DTO + service, Task 2: Backend — controller endpoint, Task 3: Frontend — cache module + type, Task 4: Frontend — wire WalletProvider to the cache, Wallet Data Unifier + Client Cache — Implementation Plan

### Community 155 - "Global Constraints"
Cohesion: 0.22
Nodes (8): Execution Handoff, Global Constraints, Invitations in the Wallet Sidebar — Implementation Plan, Self-Review, Task 1: `useInvitations` hook, Task 2: `InviteCard` presentational tile, Task 3: `WalletInvites` placed pieces (badge, mobile panel, desktop section), Task 4: Wire into `WalletsBar` + retire the old `InvitationsModal`

### Community 156 - "overlay.test.ts"
Cohesion: 0.22
Nodes (6): foodTag, snacksTag, sub1, tx1, tx2, wallet

### Community 157 - "Kickoff prompt — SETTINGS redesign (copy into a new session)"
Cohesion: 0.25
Nodes (7): Come procedere (IMPORTANTE — è il flusso richiesto), Contesto: lavori recenti già FATTI, File coinvolti (TUTTI da rifare) — `frontend/src/`, Kickoff prompt — SETTINGS redesign (copy into a new session), Obiettivo di questa sessione: la sezione SETTINGS (redesign quasi TOTALE), Verifica sempre verde (dopo ogni elemento), Vincoli fermi

### Community 158 - "5. Authentication protocol changes"
Cohesion: 0.25
Nodes (8): 5.1 Pre-auth salt endpoint, 5.2 Login (V2), 5.3 Registration via invite (V2 from birth), 5.4 Password change (re-wrap PriK only), 5.5 Remember-me and local key persistence, 5.6 Legacy users — lazy upgrade V1 → V2, 5.7 Forgot / reset password, 5. Authentication protocol changes

### Community 159 - "overlayHistory.ts"
Cohesion: 0.46
Nodes (7): CloseFn, ensureListening(), onPopState(), reconcile(), reconcileSoon(), registerOverlay(), stack

### Community 161 - "JobFrequencyConverter"
Cohesion: 0.43
Nodes (4): Override, JobFrequencyConverter, jakarta.persistence.AttributeConverter, jakarta.persistence.Converter

### Community 162 - "1. What I extracted from the codebase"
Cohesion: 0.29
Nodes (7): 1.1 Entities (backend `model/`, PostgreSQL via `ddl-auto=update`, no Flyway), 1.2 Current auth flow, 1.3 Current offline / sync layer (frontend), 1.4 Current MCP behavior, 1.5 Authorization & other cross-cutting facts, 1.6 Files that will be touched (complete map), 1. What I extracted from the codebase

### Community 163 - "Status"
Cohesion: 0.33
Nodes (6): Status, ACTIVE, ERROR, EXPIRED, PAUSED, PENDING

### Community 164 - "InvitationStatus"
Cohesion: 0.33
Nodes (6): InvitationStatus, ACCEPTED, LEFT, PENDING, REJECTED, REVOKED

### Community 165 - "Categories (Tags) tab — charts plan"
Cohesion: 0.33
Nodes (5): Categories (Tags) tab — charts plan, Follow-ups — DONE, Increments (propose design in chat → OK → implement → verify → next), Locked decisions (2026-07-03), Verify (after each)

### Community 166 - "8. Sync design (frontend `src/sync/`, extending the existing layer)"
Cohesion: 0.33
Nodes (6): 8.1 Local store (Dexie v2 upgrade of `FinanceAppOffline`), 8.2 Pull (delta apply), 8.3 Push (offline mutations), 8.4 Conflicts — two-way, whole-entity choice (mine or theirs), 8.5 Compaction (`CronJob/ChangeLogCompactionCronJob`, ManagedJob, default weekly), 8. Sync design (frontend `src/sync/`, extending the existing layer)

### Community 167 - "Global Constraints"
Cohesion: 0.33
Nodes (5): Global Constraints, Self-Review, Task 1: Helper `walletSlug` con test, Task 2: Usare lo slug in `UserDashboard.tsx`, Wallet Slug URL Implementation Plan

### Community 168 - "BackendApplication"
Cohesion: 0.60
Nodes (3): BackendApplication, org.springframework.boot.autoconfigure.SpringBootApplication, org.springframework.scheduling.annotation.EnableScheduling

### Community 169 - "AssignableUuidV7"
Cohesion: 0.70
Nodes (4): AssignableUuidV7, java.lang.annotation.Retention, java.lang.annotation.Target, org.hibernate.annotations.IdGeneratorType

### Community 170 - "Verifying FinanceWebApp changes at runtime"
Cohesion: 0.40
Nodes (4): Frontend, Recipe: isolated backend instance with your working-tree code, Verifying FinanceWebApp changes at runtime, What is usually already running (do NOT touch)

### Community 171 - "9. Sharing, invitation, revocation"
Cohesion: 0.40
Nodes (5): 9.1 Invite A → B (encrypted wallet), 9.2 Invitee without a keypair (V1 user) or without an account, 9.3 Revocation semantics (chosen behavior, stated plainly), 9.4 PENDING_REWRAP recovery (after §5.7 key reset), 9. Sharing, invitation, revocation

### Community 172 - "CashFlowSankey.tsx"
Cohesion: 0.40
Nodes (4): CashFlowSankey(), CashFlowSankeyProps, LinkDef, NodeDef

### Community 173 - "TransactionPieChart.tsx"
Cohesion: 0.50
Nodes (3): hexToRgba(), StyledText, TransactionPieChart()

### Community 174 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 175 - "Duration"
Cohesion: 0.50
Nodes (4): Duration, FOREVER, TIMES, UNTIL

### Community 176 - "Status"
Cohesion: 0.50
Nodes (4): Status, ACTIVE, COMPLETED, PAUSED

### Community 177 - "WalletRole"
Cohesion: 0.50
Nodes (4): WalletRole, EDITOR, OWNER, VIEWER

### Community 180 - "7. E2EE data plane (new API, coexisting with the legacy plane)"
Cohesion: 0.50
Nodes (4): 7.1 Why a separate plane, 7.2 Endpoints (`controller/E2eeController`, service `E2eeSyncService`), 7.3 Change-log append (correctness details), 7. E2EE data plane (new API, coexisting with the legacy plane)

### Community 182 - "Type"
Cohesion: 0.67
Nodes (3): Type, EXPENSE, INCOME

### Community 183 - "Type"
Cohesion: 0.67
Nodes (3): Type, EXPENSE, INCOME

## Knowledge Gaps
- **1055 isolated node(s):** `backend-mark.sh script`, `backend-tests.sh script`, `frontend-mark.sh script`, `PENDING`, `ACTIVE` (+1050 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1572 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `GlobalExceptionHandlerTest`, `org.junit.jupiter.api.Test`, `lombok.Data`, `Budget`, `PatServiceTest`, `TagController`, `TransactionServiceTest`, `.generateToken`, `WalletAccess`, `lombok.RequiredArgsConstructor`, `Wallet`, `org.junit.jupiter.api.BeforeEach`, `Registrations`, `.sendYearlyReports`, `org.springframework.data.jpa.repository.JpaRepository`, `BankSyncCronJobTest`, `WalletSecurityTest`, `PersonalAccessTokenRepository`, `WalletController`, `BankConnection`, `AdminUserInviteServiceTest`, `UserServiceTest`, `PersonalAccessToken`, `BankLinkServiceTest`, `BankSyncServiceTest`, `jakarta.transaction.Transactional`, `SubscriptionServiceTest`, `org.springframework.http.ResponseEntity`, `BankLinkService.java`, `BankLinkService`, `NotificationDispatcherTest`, `.updateSubscription`, `OAuthController`, `DemoCleanupCronJobTest`, `SendEmailService`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `triggerToast`, `domain.ts`, `StagedTagTree.tsx`, `StagedSubscriptionRow.tsx`, `useWalletContext`, `@fortawesome/free-solid-svg-icons`, `vitest`, `ToDoList.tsx`, `ImportReviewModal.tsx`, `WidgetGrid.tsx`, `@fortawesome/fontawesome-svg-core`, `ResponsiveOverlay.tsx`, `SystemTab.tsx`, `LandingPage.tsx`, `frontend/package.json`, `BudgetFormOverlay.tsx`, `CashFlowSankey.tsx`, `TransactionPieChart.tsx`, `DataTab.tsx`, `TagRequest`, `WalletProvider.test.tsx`, `CreateWalletWizard.tsx`, `TagsStep.tsx`, `BankAccountsSection.tsx`, `CategoryManagerDrawer.tsx`, `csvImport.ts`, `OverviewTable.tsx`, `useTheme`, `TransactionsStep.tsx`, `NotificationsSection.tsx`, `CategoryTrendChart.tsx`, `useSyncStatus.ts`, `TokenListItem.tsx`, `useNotifications.test.tsx`, `axiosConfig.test.ts`, `ColorSelector.tsx`, `SyncCenterOverlay.tsx`, `PWAProvider.test.tsx`, `ThemeContext.tsx`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `triggerToast`, `domain.ts`, `StagedTagTree.tsx`, `replay.test.ts`, `StagedSubscriptionRow.tsx`, `useWalletContext`, `ToDoList.tsx`, `@fortawesome/free-solid-svg-icons`, `ImportReviewModal.tsx`, `sw.ts`, `WidgetGrid.tsx`, `exchangeRates.ts`, `@fortawesome/fontawesome-svg-core`, `overlay.test.ts`, `react`, `ResponsiveOverlay.tsx`, `SystemTab.tsx`, `frontend/package.json`, `BudgetFormOverlay.tsx`, `DataTab.tsx`, `TagRequest`, `WalletProvider.test.tsx`, `CreateWalletWizard.tsx`, `TagsStep.tsx`, `BankAccountsSection.tsx`, `CategoryManagerDrawer.tsx`, `csvImport.ts`, `OverviewTable.tsx`, `useTheme`, `TransactionsStep.tsx`, `NotificationsSection.tsx`, `CategoryTrendChart.tsx`, `useSyncStatus.ts`, `walletOps.ts`, `TokenListItem.tsx`, `useNotifications.test.tsx`, `axiosConfig.test.ts`, `replay.ts`, `ColorSelector.tsx`, `SyncCenterOverlay.tsx`, `PWAProvider.test.tsx`, `ThemeContext.tsx`, `csvDedup.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Are the 34 inferred relationships involving `User` (e.g. with `.run()` and `.memberWithEmail()`) actually correct?**
  _`User` has 34 INFERRED edges - model-reasoned connections that need verification._
- **What connects `backend-mark.sh script`, `backend-tests.sh script`, `frontend-mark.sh script` to the rest of the system?**
  _1055 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `GlobalExceptionHandlerTest` be split into smaller, more focused modules?**
  _Cohesion score 0.06507936507936508 - nodes in this community are weakly interconnected._
- **Should `triggerToast` be split into smaller, more focused modules?**
  _Cohesion score 0.03237306652866425 - nodes in this community are weakly interconnected._