# Graph Report - FinanceWebApp  (2026-10-27)

## Corpus Check
- 937 files · ~452,182 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 5490 nodes · 17798 edges · 193 communities (164 shown, 24 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 2035 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3fe75332`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- org.springframework.http.ResponseEntity
- org.junit.jupiter.api.Test
- mcp_server.py
- lombok.RequiredArgsConstructor
- react
- triggerToast
- PatServiceTest
- WalletAccess
- User
- BackupServiceTest
- WalletAccessRepository
- domain.ts
- vitest
- useTabLayout.ts
- Button.tsx
- App.tsx
- lombok.Data
- index.ts
- org.junit.jupiter.api.BeforeEach
- useWalletContext
- Tag
- SubscriptionModal.tsx
- FinanceWebApp Project
- jakarta.transaction.Transactional
- Registrations
- dependencies
- AdminDashboard.tsx
- Wallet
- devDependencies
- Tag
- CustomDatePicker.tsx
- compilerOptions
- PersonalAccessToken
- .getAllByWalletId
- compilerOptions
- Frontend UI Redesign — TODO
- TagsTab.tsx
- TagsStep.tsx
- TransactionServiceTest
- CreateWalletWizard.tsx
- .generateToken
- SubscriptionServiceTest
- frontend/package.json
- TokensSection.tsx
- WalletsBar.tsx
- <p align="center">FinanceWebApp - Portfolio Showcase</p>
- Register.tsx
- scripts
- UserServiceTest
- Frontend Unit-Test Plan — `frontend/`
- Wallet
- NotificationDispatcherTest
- AuthControllerTest
- OAuthController
- ResponsiveOverlay.tsx
- package.json
- React + TypeScript + Vite
- tsconfig.json
- TagRequest
- JobCard.tsx
- ScheduledJobDTO
- FrankfurterExchangeRateService
- Transaction
- useCsvImport.ts
- PatAuthenticationFilterTest.java
- SubscriptionService
- MCP Server Python Dependencies
- BudgetServiceTest
- OverviewTable.tsx
- Phases D–I — String extraction by area
- MonthlyChart.tsx
- Budget
- MFA (TOTP + Email code) — Implementation Plan / TODO
- walletDataCache.ts
- @fortawesome/fontawesome-svg-core
- BudgetFormOverlay.tsx
- PatAuthenticationFilterTest
- Interactive Onboarding (guided tour) — Implementation Plan / TODO
- csvImport.ts
- NotificationsSection.tsx
- Periodic Summary Reports — Implementation Plan
- Frontend Restructure — Analysis & Execution Plan / TODO
- useTheme
- AccountDeletionServiceTest
- walletOps.ts
- BackupRow.tsx
- useSyncStatus.ts
- org.springframework.context.annotation.Bean
- BudgetAlertCronJobTest
- WalletYearlyReport
- Landing Page Redesign — Design Spec
- ReportServiceTest
- Wallet Creation Wizard — Design Spec
- .processDueSubscriptions
- TransactionService
- Offline Sync Rework — Implementation Plan / TODO
- Web Push Notifications — Implementation Plan / TODO
- offlineDb.ts
- BudgetAlertCronJob.java
- Phase A — Backend
- ColorSelector.tsx
- ManagedJob
- ScheduledJobServiceTest
- transactionTags.ts
- DemoCleanupCronJobTest
- Frequency
- vite.config.ts
- Settings tab — redesign plan
- Wallet End-to-End Encryption — Implementation TODO
- Settings Refactor — TODO
- Menu.tsx
- .sendYearlyReports
- Appendix — full live call-site table
- JobFrequency
- useAmountInput.ts
- SubscriptionRequest
- PWAProvider.test.tsx
- ScheduledJobService
- BudgetMapper
- ReportHtmlBuilder
- Phase map
- axiosConfig.test.ts
- csvDedup.ts
- refactor.ts
- BaseWebMvcTest
- 5. Epic: eliminare `no-explicit-any` (90 → 0)
- ImportReviewModal.tsx
- Wallet data unifier + client cache — Design
- Invitations in the Wallet Sidebar — Design
- replay.test.ts
- WebPushSenderTest
- File map
- Task 3 — GroupEditGrid mini-tiles + shared DnD (depends on 1 & 2)
- Wallet End-to-End Encryption — Architecture Plan
- Wallet Creation Wizard — Implementation Plan / TODO
- Wallet slug leggibile nell'URL
- BudgetService
- NotificationCleanupCronJob
- SubscriptionCronJob
- JobRun
- Responsive Overlay Pattern — Implementation TODO
- replay.ts
- csvExport.ts
- sw.ts
- Decisioni per te (non le ho prese io)
- AdminUserController
- MonthlyReportCronJob
- Admin Section Redesign — TODO
- Category Management — Redesign (planning only)
- Wallet Data Unifier + Client Cache — Implementation Plan
- Global Constraints
- WebPushGateway
- Kickoff prompt — SETTINGS redesign (copy into a new session)
- 5. Authentication protocol changes
- overlayHistory.ts
- .generateUuid
- .render
- 1. What I extracted from the codebase
- useLongPressSelect.test.tsx
- BudgetAlertLogRepository
- Categories (Tags) tab — charts plan
- 8. Sync design (frontend `src/sync/`, extending the existing layer)
- Global Constraints
- SubscriptionDetailsModal.test.tsx
- TagCreateMode.test.tsx
- BackendApplication
- .tx
- Verifying FinanceWebApp changes at runtime
- 9. Sharing, invitation, revocation
- recommendedSubscriptions.ts
- Open Banking — note notturne per la revisione
- gradlew
- WalletRole
- 7. E2EE data plane (new API, coexisting with the legacy plane)
- Type
- Type
- .setUp
- frontend-checks.sh
- runtime-env.d.ts
- rules/graphify.md
- workflows/graphify.md
- .deleteSubscription
- .deleteWalletById
- backend-mark.sh
- backend-tests.sh
- frontend-mark.sh
- open-banking-followups.md
- 40-config.sh

## God Nodes (most connected - your core abstractions)
1. `react` - 323 edges
2. `User` - 227 edges
3. `vitest` - 200 edges
4. `@fortawesome/free-solid-svg-icons` - 148 edges
5. `@fortawesome/react-fontawesome` - 144 edges
6. `@testing-library/react` - 136 edges
7. `WalletAccess` - 116 edges
8. `Wallet` - 94 edges
9. `triggerToast()` - 93 edges
10. `Tag` - 88 edges

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

## Communities (193 total, 24 thin omitted)

### Community 0 - "org.springframework.http.ResponseEntity"
Cohesion: 0.10
Nodes (17): GlobalExceptionHandler, TagHasChildrenException, TagInUseException, UnauthorizedAccessException, UserAlreadyExistsException, GlobalExceptionHandlerTest, jakarta.servlet.http.HttpServletRequest, MethodArgumentNotValidException (+9 more)

### Community 1 - "org.junit.jupiter.api.Test"
Cohesion: 0.04
Nodes (29): WalletAccessId, AdminDatabaseControllerTest, org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration, AdminUserControllerTest, org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration, org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration, MembersControllerTest, org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration (+21 more)

### Community 2 - "mcp_server.py"
Cohesion: 0.08
Nodes (76): BaseHTTPMiddleware, Context, custom_route, description, FastMCP, Field, ge, gt (+68 more)

### Community 3 - "lombok.RequiredArgsConstructor"
Cohesion: 0.04
Nodes (58): DataInitializer, DemoController, NotificationController, NotificationPreferencesController, PushController, RequestMapping, RestController, UserController (+50 more)

### Community 4 - "react"
Cohesion: 0.05
Nodes (74): Icon(), WalletIconProps, ColorSelectorPropsProps, IconColorSelector(), IconPickerButton(), IconPickerButtonProps, IconSelector(), IconSelectorProps (+66 more)

### Community 5 - "triggerToast"
Cohesion: 0.04
Nodes (72): AdminDashboard(), useBackups(), CreateInviteForm(), CreateInviteFormProps, api, failedQueue, processQueue(), PushMessagesBridge() (+64 more)

### Community 6 - "PatServiceTest"
Cohesion: 0.05
Nodes (20): DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, PatController, PatBulkDeleteRequest (+12 more)

### Community 7 - "WalletAccess"
Cohesion: 0.05
Nodes (36): DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, MembersController, MemberRequest (+28 more)

### Community 8 - "User"
Cohesion: 0.04
Nodes (37): Override, DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, TagController (+29 more)

### Community 9 - "BackupServiceTest"
Cohesion: 0.05
Nodes (19): AdminDatabaseController, BackupEntry, DeleteMapping, GetMapping, PostMapping, RequestMapping, RestController, BackupCronJob (+11 more)

### Community 10 - "WalletAccessRepository"
Cohesion: 0.05
Nodes (41): TagRequest, NotificationRepository, PushSubscriptionRepository, SubscriptionRepository, TagRepository, TransactionRepository, WalletAccessRepository, WalletRepository (+33 more)

### Community 11 - "domain.ts"
Cohesion: 0.06
Nodes (56): MockTransactionRowProps, SyncStateIcon(), SyncStateIconProps, CashFlowSankey(), CashFlowSankeyProps, buildSankeyData(), LinkDef, NodeDef (+48 more)

### Community 12 - "vitest"
Cohesion: 0.04
Nodes (27): TagFilter(), InviteSection(), InvitesBadge(), SubscriptionView(), user, walletsMap, tags, OPTIONS (+19 more)

### Community 13 - "useTabLayout.ts"
Cohesion: 0.06
Nodes (62): GroupEditGrid(), GroupEditGridProps, MemberTile(), MemberTileProps, HiddenTray(), HiddenTrayProps, TrayChipProps, groupBodyId() (+54 more)

### Community 14 - "Button.tsx"
Cohesion: 0.04
Nodes (55): Sphere(), SphereProps, BackgroundBlobs(), BackgroundSpheres(), SphereConfig, SPHERES, CTASection(), CTASectionProps (+47 more)

### Community 15 - "App.tsx"
Cohesion: 0.05
Nodes (54): AdminRoute(), App(), RootRedirect(), AnimateBackground(), AuthLayout(), DEMO_FEATURES, Login(), LoginForm() (+46 more)

### Community 16 - "lombok.Data"
Cohesion: 0.08
Nodes (31): AuthResponse, NotificationPreferencesRequest, NotificationPreferencesResponse, WalletMute, NotificationResponse, PushSubscriptionRequest, RegisterInviteResponse, TagBulkResponse (+23 more)

### Community 17 - "index.ts"
Cohesion: 0.05
Nodes (50): CurrencyOptionRow(), CurrencyOptionRowProps, CurrencySelector(), CurrencySelectorProps, useCurrencyDropdown(), buildCurrencyLists(), MAIN_SET, useCurrencyList() (+42 more)

### Community 18 - "org.junit.jupiter.api.BeforeEach"
Cohesion: 0.07
Nodes (31): GetMapping, PostMapping, PutMapping, RequestMapping, RestController, SubscriptionController, SubscriptionBulkResponse, SubscriptionRequest (+23 more)

### Community 19 - "useWalletContext"
Cohesion: 0.05
Nodes (51): DateRangeValue, DateRangeBanner(), SettingsTab(), buildMonthlyBuckets(), StatisticsSummary(), StatisticsSummaryProps, SummaryCardProps, CHART_TABS (+43 more)

### Community 20 - "Tag"
Cohesion: 0.06
Nodes (52): TagFilterProps, TagPickerTrigger(), TagPickerTriggerProps, TagSelectorAddForm(), AccentHoverButton(), AccentHoverButtonProps, AddCategoryButton(), CategoryChildRowProps (+44 more)

### Community 21 - "SubscriptionModal.tsx"
Cohesion: 0.06
Nodes (40): CustomDatePicker(), TagRowTrailing, TagTreePickerProps, AmountInput(), AmountInputProps, AmountMathToolbar(), AmountMathToolbarProps, FieldLabel() (+32 more)

### Community 22 - "FinanceWebApp Project"
Cohesion: 0.09
Nodes (29): Forgot Password Email Template, Registration Invite Email Template, Wallet Invite Email Template, Spring Boot Backend Service, Database Backup Configuration, Docker Compose Dev Environment, Vite + React Frontend Service, JWT Authentication Configuration (+21 more)

### Community 23 - "jakarta.transaction.Transactional"
Cohesion: 0.06
Nodes (19): GetMapping, PostMapping, PutMapping, RequestMapping, RestController, WalletController, WalletRequest, WalletRole (+11 more)

### Community 24 - "Registrations"
Cohesion: 0.07
Nodes (15): PostMapping, GetMapping, AdminInviteRequest, RegisterInviteRequest, ResetPasswordRequest, InvitationStatus, ACCEPTED, FORGOTPASSWORD (+7 more)

### Community 25 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, axios, date-fns, dexie, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, @emotion/react (+17 more)

### Community 26 - "AdminDashboard.tsx"
Cohesion: 0.05
Nodes (47): UsersPageProps, AdminPageHeader(), AdminPageHeaderProps, AdminStats(), AdminStatsProps, AdminTab, AdminTabs(), TABS (+39 more)

### Community 27 - "Wallet"
Cohesion: 0.06
Nodes (20): AdminInviteResponse, UserResponse, EmailService, AdminInviteMapper, Role, ADMIN, USER, Entity (+12 more)

### Community 28 - "devDependencies"
Cohesion: 0.06
Nodes (34): devDependencies, autoprefixer, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh (+26 more)

### Community 29 - "Tag"
Cohesion: 0.10
Nodes (8): TagNotFoundException, Entity, Table, Tag, IndexedTagRow, TagService, Wallet, TagServiceTest

### Community 30 - "CustomDatePicker.tsx"
Cohesion: 0.07
Nodes (33): CalendarContainer(), CalendarContainerProps, ViewState, CustomDatePickerProps, DatePickerSidebar(), DatePickerSidebarProps, DatePickerSurface(), DatePickerSurfaceProps (+25 more)

### Community 31 - "compilerOptions"
Cohesion: 0.09
Nodes (22): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+14 more)

### Community 32 - "PersonalAccessToken"
Cohesion: 0.09
Nodes (8): PermissionDeniedException, Entity, Table, PersonalAccessToken, PatWalletPermission, WalletSecurity, WalletSecurityTest, org.springframework.security.core.context.SecurityContext

### Community 34 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+11 more)

### Community 35 - "Frontend UI Redesign — TODO"
Cohesion: 0.05
Nodes (37): Backend architecture, Common commands, Conventions & gotchas, Frontend architecture, Frontend code organization (structure guidelines), graphify, MCP server, Overview (+29 more)

### Community 36 - "TagsTab.tsx"
Cohesion: 0.08
Nodes (33): CATEGORIES_TAB_ID, CATEGORIES_WIDGETS, CategoriesWidgetCtx, buildMainCategoryMeta(), CategoryMeta, mainCategoryName(), OTHER_COLOR, buildHeatmap() (+25 more)

### Community 37 - "TagsStep.tsx"
Cohesion: 0.10
Nodes (34): groupTagRequests(), groupToTagRequests(), keyOfName(), RECOMMENDED_TAG_GROUPS, RecommendedTagGroup, fetchTagSources(), MOCK_SOURCE_WALLETS, SourceWallet (+26 more)

### Community 38 - "TransactionServiceTest"
Cohesion: 0.10
Nodes (5): DeleteMapping, ApplicationEventPublisher, Transaction, Wallet, TransactionServiceTest

### Community 39 - "CreateWalletWizard.tsx"
Cohesion: 0.07
Nodes (32): PANEL_VARIANTS, Wizard(), WizardCompletionState, WizardCompletionStatus, WizardProps, WizardStep, WizardStepper(), WizardStepperProps (+24 more)

### Community 40 - ".generateToken"
Cohesion: 0.11
Nodes (5): Override, JwtAuthenticationFilterTest, User, JwtServiceTest, io.jsonwebtoken.Claims

### Community 42 - "frontend/package.json"
Cohesion: 0.06
Nodes (36): @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, name, private, type, version, autoprefixer (+28 more)

### Community 43 - "TokensSection.tsx"
Cohesion: 0.08
Nodes (31): TokenActionButtons(), TokenActionButtonsProps, TokenLastUsedInfo(), TokenLastUsedInfoProps, TokenListItem(), TokenListItemProps, TokenWalletBadges(), TokenWalletBadgesProps (+23 more)

### Community 44 - "WalletsBar.tsx"
Cohesion: 0.09
Nodes (28): RippleItem, useRipple(), UserDashboard(), handleChangeWallet(), resolveWalletParam(), useWalletRouting(), InviteCard(), InviteCardProps (+20 more)

### Community 45 - "<p align="center">FinanceWebApp - Portfolio Showcase</p>"
Cohesion: 0.15
Nodes (12): 🏗️ Architecture Overview, 🚀 Automated Deployment, 🧩 Core Stack, ⚡ Demo & Onboarding Mode, ⚙️ Development Setup, Enabling Demo Features, 🚀 Engineering Highlights, 🛠️ Infrastructure & CI/CD (+4 more)

### Community 46 - "Register.tsx"
Cohesion: 0.11
Nodes (26): AuthBrandLockup(), AuthCard(), AUTH_GLASS_CARD, shakeClass(), AuthErrorCard(), ForgotPassword(), ForgotPasswordSent(), Props (+18 more)

### Community 47 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, test:watch

### Community 48 - "UserServiceTest"
Cohesion: 0.09
Nodes (3): ChangePasswordRequest, User, UserServiceTest

### Community 49 - "Frontend Unit-Test Plan — `frontend/`"
Cohesion: 0.05
Nodes (42): 1.1 Cosa esiste già, 1.2 Convenzioni del repo da rispettare (da `CLAUDE.md` + `frontend/style.md`), 1.3 Convenzioni tecniche di mocking (pattern del repo, da riusare), 1.4 Dipendenze/decisioni da risolvere prima di S1/S3, 1.5 Politica di profondità di validazione (per tier), 1. Analisi dei requisiti, 2. Sezioni di test — ordinate per sicurezza (S1 → S4), 3. Ordine di esecuzione & tracking (+34 more)

### Community 50 - "Wallet"
Cohesion: 0.07
Nodes (30): FloatingActionButton(), FloatingActionButtonProps, formatDateHeader(), groupTransactionsByDate(), PendingRowProps, PendingTransactionsPanel(), PendingTransactionsPanelProps, TransactionRow() (+22 more)

### Community 51 - "NotificationDispatcherTest"
Cohesion: 0.11
Nodes (8): Copy, NotificationCopy, WalletActivityEvent, WalletInviteEvent, NotificationCopyTest, User, NotificationDispatcherTest, org.springframework.transaction.event.TransactionalEventListener

### Community 52 - "AuthControllerTest"
Cohesion: 0.10
Nodes (11): AuthController, PostMapping, RequestMapping, RestController, PutMapping, ForgotPasswordRequest, LoginRequest, UpdateUsernameRequest (+3 more)

### Community 53 - "OAuthController"
Cohesion: 0.09
Nodes (10): GetMapping, Pattern, PostMapping, RestController, OAuthAuthorizeRequest, OAuthController, AuthCodeEntry, OAuthAuthCodeStore (+2 more)

### Community 54 - "ResponsiveOverlay.tsx"
Cohesion: 0.09
Nodes (24): ResponsiveOverlay(), ResponsiveOverlayProps, SwitchableCard(), SwitchableCardProps, Tab, WizardShell(), WizardShellProps, NotificationBell() (+16 more)

### Community 55 - "package.json"
Cohesion: 0.25
Nodes (7): dependencies, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities

### Community 56 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + TypeScript + Vite

### Community 58 - "TagRequest"
Cohesion: 0.10
Nodes (25): TagRequest, MissingTagActions(), MissingTagActionsProps, MissingTagChip(), MissingTransactionTags(), MissingTransactionTagsProps, findRecommendedTagWithParent(), TagSourceDto (+17 more)

### Community 59 - "JobCard.tsx"
Cohesion: 0.13
Nodes (25): buildSchedulePayload(), ScheduleDraft, SchedulePayload, JobCard(), JobRunHistory(), DAYS, DOM_OPTIONS, formatCountdown() (+17 more)

### Community 60 - "ScheduledJobDTO"
Cohesion: 0.11
Nodes (12): AdminJobController, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, ScheduledJobDTO, UpdateEnabledRequest (+4 more)

### Community 61 - "FrankfurterExchangeRateService"
Cohesion: 0.09
Nodes (18): AssignableUuidV7, AssignableUuidV7Generator, Override, CachedRate, FrankfurterExchangeRateService, FrankfurterRate, Builder, Override (+10 more)

### Community 62 - "Transaction"
Cohesion: 0.16
Nodes (7): Entity, Table, Transaction, Type, ReportAggregator, Type, ReportAggregatorTest

### Community 63 - "useCsvImport.ts"
Cohesion: 0.13
Nodes (26): DedupOverwrite, dataRows(), parseSubscriptionsCsv(), parseTagsCsv(), parseTransactionsCsv(), DURATIONS, FREQ_TYPES, isBlank() (+18 more)

### Community 67 - "PatAuthenticationFilterTest.java"
Cohesion: 0.11
Nodes (15): SecurityConfig, JwtAuthenticationFilter, PatAuthenticationFilter, jakarta.servlet.FilterChain, java.security.Key, org.junit.jupiter.api.AfterEach, org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity, org.springframework.security.config.annotation.web.builders.HttpSecurity (+7 more)

### Community 68 - "SubscriptionService"
Cohesion: 0.11
Nodes (12): Duration, FOREVER, TIMES, UNTIL, Entity, Table, Status, ACTIVE (+4 more)

### Community 70 - "BudgetServiceTest"
Cohesion: 0.15
Nodes (4): Type, Budget, BudgetServiceTest, BudgetRequestBuilder

### Community 71 - "OverviewTable.tsx"
Cohesion: 0.09
Nodes (18): CellType, OverviewCell(), OverviewCellContent(), OverviewCellContentProps, OverviewCellProps, DataItem, OverviewRow(), OverviewRowProps (+10 more)

### Community 72 - "Phases D–I — String extraction by area"
Cohesion: 0.06
Nodes (30): Confirmed design decisions (from the interview — do not relitigate), Explicitly out of scope (do not build), Global Constraints (apply to every task), Localization (i18n) — Implementation Plan / TODO, Phase A — Infrastructure, Phase B — Central locale-aware formats, Phase C — Language UI + error mapping, Phase J — Final gates, docs, knowledge graph, manual QA (+22 more)

### Community 73 - "MonthlyChart.tsx"
Cohesion: 0.15
Nodes (25): bucketLabel(), MonthlyBucket, MonthlyChartRow, toCumulativeRows(), toSnapshotRows(), BALANCE_COLOR, darkTheme, EXPENSE_COLOR (+17 more)

### Community 74 - "Budget"
Cohesion: 0.12
Nodes (15): PostMapping, PutMapping, BudgetRequest, BudgetStatusResponse, BudgetConflictException, BudgetNotFoundException, Budget, Entity (+7 more)

### Community 75 - "MFA (TOTP + Email code) — Implementation Plan / TODO"
Cohesion: 0.07
Nodes (29): Explicitly out of scope (do not build), Global Constraints (apply to every task), MFA (TOTP + Email code) — Implementation Plan / TODO, Phase A — Backend foundation, Phase B — Backend settings flows (enroll / disable / recovery codes), Phase C — Backend login flow + admin reset, Phase D — Ops / env plumbing, Phase E — Frontend: login second step (+21 more)

### Community 76 - "walletDataCache.ts"
Cohesion: 0.11
Nodes (23): cache, Entry, fetchAndTrack(), fetchFromApi(), getWalletData(), inflight, peek(), NOTE: not pure — it lazily deletes an entry that has aged past the TTL as a… (+15 more)

### Community 77 - "@fortawesome/fontawesome-svg-core"
Cohesion: 0.12
Nodes (17): InviteComposer(), InviteComposerProps, RoleSelector(), RoleSelectorProps, WalletRole, InviteSectionProps, MemberCategory(), MemberCategoryProps (+9 more)

### Community 78 - "BudgetFormOverlay.tsx"
Cohesion: 0.13
Nodes (21): BoxedSelect(), CustomSelect(), CustomSelectOption, CustomSelectProps, BudgetCard(), BudgetCardProps, BudgetFormOverlay(), BudgetFormOverlayProps (+13 more)

### Community 79 - "PatAuthenticationFilterTest"
Cohesion: 0.15
Nodes (5): InvalidTokenException, Override, User, Wallet, PatAuthenticationFilterTest

### Community 80 - "Interactive Onboarding (guided tour) — Implementation Plan / TODO"
Cohesion: 0.07
Nodes (27): Decisions (locked 2026-07-11 — do not re-litigate during implementation), Explicitly out of scope (do not build), Global Constraints (apply to every task), Interactive Onboarding (guided tour) — Implementation Plan / TODO, Phase A — Backend: flag, exposure, seed removal, Phase B — Tour engine (no product-visible change yet), Phase C — Content: anchors, wizard choreography, sample CSV, registry, Phase D — Triggers, persistence client, replay (+19 more)

### Community 81 - "csvImport.ts"
Cohesion: 0.16
Nodes (22): RFC-4180, CsvColumn, DurationType, FrequencyType, optionalNumber(), optionalRaw(), optionalTrimmed(), rowToSubscriptionRequest() (+14 more)

### Community 82 - "NotificationsSection.tsx"
Cohesion: 0.13
Nodes (22): fetchPublicKey(), getEnrollment(), isPushSupported(), keyToBase64(), PushEnrollment, subscribeThisDevice(), unsubscribeThisDevice(), urlBase64ToUint8Array() (+14 more)

### Community 83 - "Periodic Summary Reports — Implementation Plan"
Cohesion: 0.07
Nodes (26): Final verification (after the last task), Global Constraints, Periodic Summary Reports — Implementation Plan, Phase 1 — Scheduler MONTHLY/YEARLY, Phase 2 — Report aggregation (pure logic), Phase 3 — PDF rendering + templates, Phase 4 — Preferences, email sending, orchestration, jobs, Phase 5 — Settings “Notifications” section (+18 more)

### Community 84 - "Frontend Restructure — Analysis & Execution Plan / TODO"
Cohesion: 0.08
Nodes (25): 5A — dashboard/tag, 5B — dashboard/statistics, 5C — dashboard/layout, 5D — dashboard/settings (CSV), 5E — dashboard core (wallet / transaction / subscription / root), 5F — modals (non-wizard), 5G — components/ui hot spots, 5H — components (pickers/selectors/landing/pat) (+17 more)

### Community 85 - "useTheme"
Cohesion: 0.14
Nodes (11): ThemeSelector(), StyledText, TransactionPieChart(), JAN_15, themeValue, Consumer(), Theme, ThemeContext (+3 more)

### Community 86 - "AccountDeletionServiceTest"
Cohesion: 0.28
Nodes (5): AccountDeletionServiceTest, InvitationStatus, User, Wallet, WalletRole

### Community 87 - "walletOps.ts"
Cohesion: 0.18
Nodes (22): createOp(), createSubscription(), createTag(), createTransaction(), deleteSubscription(), deleteTag(), deleteTransaction(), mutateOnline() (+14 more)

### Community 88 - "BackupRow.tsx"
Cohesion: 0.24
Nodes (15): BackupConfirmModal(), Props, ageColorClass(), formatLabel(), formatSize(), parseKeyDate(), relativeAge(), BackupRow() (+7 more)

### Community 89 - "useSyncStatus.ts"
Cohesion: 0.21
Nodes (18): invalidate(), EMPTY_COUNTS, useSyncStatus(), countByStatus(), enqueueOp(), listOps(), notify(), removeOp() (+10 more)

### Community 90 - "org.springframework.context.annotation.Bean"
Cohesion: 0.17
Nodes (12): ApplicationConfig, AsyncConfig, CacheConfig, ThreadPoolTaskScheduler, SchedulingConfig, org.springframework.cache.annotation.EnableCaching, org.springframework.context.annotation.Bean, org.springframework.context.annotation.Configuration (+4 more)

### Community 91 - "BudgetAlertCronJobTest"
Cohesion: 0.21
Nodes (6): BudgetAlertCronJob, BudgetResolution, Override, BudgetAlertCronJobTest, InvitationStatus, Wallet

### Community 92 - "WalletYearlyReport"
Cohesion: 0.17
Nodes (5): CategoryTotal, PeriodTotals, WalletYearlyReport, YearRecords, ReportHtmlBuilderTest

### Community 93 - "Landing Page Redesign — Design Spec"
Cohesion: 0.09
Nodes (21): 10. Testing & verification, 11. Out of scope, 1. Goal & framing, 2. Decisions (locked with the user), 3. Style-guide compliance (`frontend/style.md`), 4. Page architecture (section order — confirmed), 5.1 Navbar, 5.2 Hero (+13 more)

### Community 94 - "ReportServiceTest"
Cohesion: 0.22
Nodes (4): MonthRow, WalletMonthlyReport, ReportServiceTest, java.time.YearMonth

### Community 95 - "Wallet Creation Wizard — Design Spec"
Cohesion: 0.10
Nodes (20): 10. Testing, 11. Style & copy constraints (`style.md`), 12. Implementation process, 1. Goal, 2. Scope & non-goals, 3. Codebase facts this design is built on, 4. Generic `Wizard` primitive, 5. Full-screen shell (+12 more)

### Community 97 - "TransactionService"
Cohesion: 0.21
Nodes (7): ExchangeRateService, Subscription, Tag, Transaction, Type, Wallet, TransactionService

### Community 98 - "Offline Sync Rework — Implementation Plan / TODO"
Cohesion: 0.10
Nodes (19): Confirmed design decisions (from the interview — do not relitigate), Global Constraints (apply to every task), Offline Sync Rework — Implementation Plan / TODO, Phase A — Backend, Phase B — Frontend: queue + overlay foundations, Phase C — Frontend: wiring, replay, UI, Self-review checklist (run after implementation, before hand-back), Task 10: replay engine (`src/sync/replay.ts`, replaces `utils/syncService.ts`) (+11 more)

### Community 99 - "Web Push Notifications — Implementation Plan / TODO"
Cohesion: 0.10
Nodes (19): Confirmed design decisions (from the interview — do not relitigate), Global Constraints (apply to every task), Phase 1 — Backend push infrastructure, Phase 1 — Frontend, Phase 2 — Notification center (history), Self-review checklist (run after implementation), Task 10: backend — list / mark-read / purge-read + retention job, Task 11: frontend — bell + yellow dot + center overlay with read/purge lifecycle (+11 more)

### Community 100 - "offlineDb.ts"
Cohesion: 0.12
Nodes (13): SyncCenterOverlayProps, SyncStatus, failedOp, missingOp, pendingOp, staleOp, CacheItem, ConflictKind (+5 more)

### Community 101 - "BudgetAlertCronJob.java"
Cohesion: 0.21
Nodes (3): BudgetPeriods, Period, BudgetPeriodsTest

### Community 102 - "Phase A — Backend"
Cohesion: 0.11
Nodes (18): Budgeting — Implementation Plan / TODO, Global Constraints (apply to every task), Phase A — Backend, Phase B — Frontend, Phase C — Wrap-up, Self-review notes (already applied), Task 10: `BudgetFormOverlay` + delete flow, Task 11 (OPTIONAL — confirm with the user first): MCP budget tools (+10 more)

### Community 103 - "ColorSelector.tsx"
Cohesion: 0.19
Nodes (10): COLOR_PRESETS, ColorSelector(), ColorSelectorProps, PRESET_SET, FALLBACK_HEX, hexToRgba(), toHex(), getRecentColors() (+2 more)

### Community 104 - "ManagedJob"
Cohesion: 0.18
Nodes (3): JobRunDTO, ManagedJob, ScheduledJobDTO

### Community 106 - "transactionTags.ts"
Cohesion: 0.22
Nodes (9): TransactionRequest, TransactionsStep(), TransactionsStepProps, groupMissingTransactionTags(), missingTransactionTagCount(), reassignTransactionTag(), removeTransactionsWithTag(), tagKey() (+1 more)

### Community 107 - "DemoCleanupCronJobTest"
Cohesion: 0.23
Nodes (5): DemoCleanupCronJob, Override, DemoCleanupCronJobTest, User, Wallet

### Community 108 - "Frequency"
Cohesion: 0.20
Nodes (9): Frequency, DAILY, MONTHLY, WEEKLY, YEARLY, Tag, Transaction, Type (+1 more)

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

### Community 113 - "Menu.tsx"
Cohesion: 0.15
Nodes (14): Menu, MenuContent(), MenuContentProps, MenuContext, MenuContextValue, MenuItem(), MenuItemProps, MenuItemTone (+6 more)

### Community 114 - ".sendYearlyReports"
Cohesion: 0.20
Nodes (4): Override, YearlyReportCronJob, SendForUser, FunctionalInterface

### Community 115 - "Appendix — full live call-site table"
Cohesion: 0.13
Nodes (14): Admin, Appendix — full live call-site table, Auth & onboarding, Dashboard / wallet, Dead files (never imported — delete; not audited in depth), Modals (wallet / tag / subscription / transaction), OAuth consent, P0 — Correctness bug (+6 more)

### Community 116 - "JobFrequency"
Cohesion: 0.19
Nodes (11): JobFrequency, DAILY, HOURLY, MONTHLY, WEEKLY, YEARLY, Override, JobFrequencyConverter (+3 more)

### Community 117 - "useAmountInput.ts"
Cohesion: 0.25
Nodes (8): AmountType, useAmountInput(), UseAmountInputArgs, AmountType, Harness(), formatAmountString(), hasOperators(), evaluateMathExpression()

### Community 118 - "SubscriptionRequest"
Cohesion: 0.22
Nodes (12): SubscriptionRequest, RECOMMENDED_CONTEXT_TAGS, RecommendedSubscriptionPicker(), RecommendedSubscriptionPickerProps, RecommendedSubscription, StagedSubscriptionEditorProps, StagedSubscriptionRowHeader(), StagedSubscriptionRowHeaderProps (+4 more)

### Community 119 - "PWAProvider.test.tsx"
Cohesion: 0.24
Nodes (8): Consumer(), BeforeInstallPromptEvent, Window, WindowEventMap, PWAContext, PWAContextType, usePWA(), PWAProvider()

### Community 120 - "ScheduledJobService"
Cohesion: 0.25
Nodes (7): Entity, Table, ScheduledJobConfig, ScheduledJobConfigRepository, ScheduledJobService, java.util.concurrent.ScheduledFuture, org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler

### Community 121 - "BudgetMapper"
Cohesion: 0.24
Nodes (4): BudgetMapper, BudgetMapperTest, Wallet, BudgetStatusResponseBuilder

### Community 123 - "Phase map"
Cohesion: 0.14
Nodes (13): Design decisions (agreed in grilling, 2026-07-07), Global Constraints, Phase map, Reminder Subscriptions (Amount-less) Implementation Plan, Task 1: Entity flags + DTO/mapper plumbing (backend), Task 2: SubscriptionService — create/update reminder subscriptions, Task 3: Cron — generate pending transactions, Task 4: Fill endpoint + pending-clearing on update/bulk (backend) (+5 more)

### Community 124 - "axiosConfig.test.ts"
Cohesion: 0.20
Nodes (7): OfflineBanner(), useOnlineStatus(), setOnline(), cacheGet, cachePut, FakeError, InterceptorHandler

### Community 125 - "csvDedup.ts"
Cohesion: 0.29
Nodes (12): DedupResult, detectSubscriptionOverwrites(), detectTagOverwrites(), detectTransactionOverwrites(), isoDate(), norm(), subscriptionKey(), tagKey() (+4 more)

### Community 126 - "refactor.ts"
Cohesion: 0.50
Nodes (3): fileMoves, project, ts-morph

### Community 127 - "BaseWebMvcTest"
Cohesion: 0.12
Nodes (21): RegistrationsRepository, BackendApplicationTests, BaseWebMvcTest, Override, TestWebMvcConfig, ManageUserServiceTest, org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration, NotificationPreferencesControllerTest (+13 more)

### Community 128 - "5. Epic: eliminare `no-explicit-any` (90 → 0)"
Cohesion: 0.09
Nodes (21): 1. Causa radice, 2. Strategia (Ibrido), 3. TODO, 4. Debito tecnico tracciato (warning, da smaltire in futuro), 5. Epic: eliminare `no-explicit-any` (90 → 0), 6. `react-refresh/only-export-components` (7 → 0), 7. `react-hooks/exhaustive-deps` (6 → 0), A. Config ESLint — sblocco (degrado regole rumorose) (+13 more)

### Community 129 - "ImportReviewModal.tsx"
Cohesion: 0.21
Nodes (9): ImportReviewConfirmBody(), ImportReviewRecapBody(), plural(), ImportResource, ImportReviewModal(), ImportReviewModalProps, ImportReviewPhase, RESOURCE_LABEL (+1 more)

### Community 130 - "Wallet data unifier + client cache — Design"
Cohesion: 0.15
Nodes (12): A. Backend — aggregate endpoint (new), Architecture, B. Frontend — unified fetch + TTL cache, Data flow, Design decisions (agreed), Expected result, Goals, Non-goals (+4 more)

### Community 131 - "Invitations in the Wallet Sidebar — Design"
Cohesion: 0.15
Nodes (12): Backend contract (already implemented — `MembersController` @ `/api/invitations`), Components (all new files under `src/dashboard/wallet/`), Count badge & empty state, Edge cases, Files, Goals, Invitations in the Wallet Sidebar — Design, Non-goals (YAGNI) (+4 more)

### Community 132 - "replay.test.ts"
Cohesion: 0.15
Nodes (9): OFFLINE_SYNC_COMPLETE, mockedDelete, mockedInvalidate, mockedListOps, mockedPost, mockedPut, mockedRemoveOp, mockedToast (+1 more)

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

### Community 139 - "BudgetService"
Cohesion: 0.22
Nodes (6): BudgetController, DeleteMapping, GetMapping, RequestMapping, RestController, BudgetService

### Community 140 - "NotificationCleanupCronJob"
Cohesion: 0.35
Nodes (3): Override, NotificationCleanupCronJob, NotificationCleanupCronJobTest

### Community 141 - "SubscriptionCronJob"
Cohesion: 0.35
Nodes (3): Override, SubscriptionCronJob, SubscriptionCronJobTest

### Community 142 - "JobRun"
Cohesion: 0.24
Nodes (7): Entity, Table, JobRun, JobRunRepository, JobRunStatus, FAILURE, SUCCESS

### Community 143 - "Responsive Overlay Pattern — Implementation TODO"
Cohesion: 0.18
Nodes (10): Decisions (from brainstorming), Definition of done, Open / defer, Responsive Overlay Pattern — Implementation TODO, S1 — The `ResponsiveOverlay` primitive (evolve `components/ui/Drawer.tsx`), S2 — Trigger model (keep call sites imperative), S3 — Per-surface migration, S4 — What stays `ModalDialog` (unchanged) (+2 more)

### Community 144 - "replay.ts"
Cohesion: 0.27
Nodes (10): isNetworkError(), classifyReplayError(), collectionUrl(), initSync(), ReplayClassification, resourceUrl(), sendOp(), RFC-7807 (+2 more)

### Community 145 - "csvExport.ts"
Cohesion: 0.38
Nodes (8): CsvRow, downloadCsv(), sortTagsForExport(), subscriptionsCsvRows(), tagsCsvRows(), toCsv(), transactionsCsvRows(), DataTab()

### Community 146 - "sw.ts"
Cohesion: 0.24
Nodes (7): notificationTargetUrl(), PushPayload, workbox-cacheable-response, workbox-expiration, workbox-precaching, workbox-routing, workbox-strategies

### Community 147 - "Decisioni per te (non le ho prese io)"
Cohesion: 0.18
Nodes (10): Convenzioni, Cosa è stato fatto, Decisioni per te (non le ho prese io), Dipendenze npm inutilizzate (F22) — non rimosse, File più grossi prima → dopo, Frontend restructure — notte del 2026-10-27, Le tue modifiche non committate, Piccole differenze di comportamento introdotte (volute, invisibili) (+2 more)

### Community 148 - "AdminUserController"
Cohesion: 0.28
Nodes (5): AdminUserController, DeleteMapping, GetMapping, RequestMapping, RestController

### Community 149 - "MonthlyReportCronJob"
Cohesion: 0.42
Nodes (3): Override, MonthlyReportCronJob, MonthlyReportCronJobTest

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

### Community 154 - "WebPushGateway"
Cohesion: 0.36
Nodes (4): Override, WebPushGateway, nl.martijndwars.webpush.PushService, PushService

### Community 155 - "Kickoff prompt — SETTINGS redesign (copy into a new session)"
Cohesion: 0.25
Nodes (7): Come procedere (IMPORTANTE — è il flusso richiesto), Contesto: lavori recenti già FATTI, File coinvolti (TUTTI da rifare) — `frontend/src/`, Kickoff prompt — SETTINGS redesign (copy into a new session), Obiettivo di questa sessione: la sezione SETTINGS (redesign quasi TOTALE), Verifica sempre verde (dopo ogni elemento), Vincoli fermi

### Community 156 - "5. Authentication protocol changes"
Cohesion: 0.25
Nodes (8): 5.1 Pre-auth salt endpoint, 5.2 Login (V2), 5.3 Registration via invite (V2 from birth), 5.4 Password change (re-wrap PriK only), 5.5 Remember-me and local key persistence, 5.6 Legacy users — lazy upgrade V1 → V2, 5.7 Forgot / reset password, 5. Authentication protocol changes

### Community 157 - "overlayHistory.ts"
Cohesion: 0.46
Nodes (7): CloseFn, ensureListening(), onPopState(), reconcile(), reconcileSoon(), registerOverlay(), stack

### Community 160 - "1. What I extracted from the codebase"
Cohesion: 0.29
Nodes (7): 1.1 Entities (backend `model/`, PostgreSQL via `ddl-auto=update`, no Flyway), 1.2 Current auth flow, 1.3 Current offline / sync layer (frontend), 1.4 Current MCP behavior, 1.5 Authorization & other cross-cutting facts, 1.6 Files that will be touched (complete map), 1. What I extracted from the codebase

### Community 161 - "useLongPressSelect.test.tsx"
Cohesion: 0.43
Nodes (4): LONG_PRESS_MS, MOVE_TOLERANCE_PX, useLongPressSelect(), Row()

### Community 162 - "BudgetAlertLogRepository"
Cohesion: 0.40
Nodes (4): BudgetAlertLog, Entity, Table, BudgetAlertLogRepository

### Community 163 - "Categories (Tags) tab — charts plan"
Cohesion: 0.33
Nodes (5): Categories (Tags) tab — charts plan, Follow-ups — DONE, Increments (propose design in chat → OK → implement → verify → next), Locked decisions (2026-07-03), Verify (after each)

### Community 164 - "8. Sync design (frontend `src/sync/`, extending the existing layer)"
Cohesion: 0.33
Nodes (6): 8.1 Local store (Dexie v2 upgrade of `FinanceAppOffline`), 8.2 Pull (delta apply), 8.3 Push (offline mutations), 8.4 Conflicts — two-way, whole-entity choice (mine or theirs), 8.5 Compaction (`CronJob/ChangeLogCompactionCronJob`, ManagedJob, default weekly), 8. Sync design (frontend `src/sync/`, extending the existing layer)

### Community 165 - "Global Constraints"
Cohesion: 0.33
Nodes (5): Global Constraints, Self-Review, Task 1: Helper `walletSlug` con test, Task 2: Usare lo slug in `UserDashboard.tsx`, Wallet Slug URL Implementation Plan

### Community 166 - "SubscriptionDetailsModal.test.tsx"
Cohesion: 0.40
Nodes (5): SubscriptionDetailsModalHandle, { deleteObject }, renderModal(), sub, wallet()

### Community 168 - "BackendApplication"
Cohesion: 0.60
Nodes (3): BackendApplication, org.springframework.boot.autoconfigure.SpringBootApplication, org.springframework.scheduling.annotation.EnableScheduling

### Community 170 - "Verifying FinanceWebApp changes at runtime"
Cohesion: 0.40
Nodes (4): Frontend, Recipe: isolated backend instance with your working-tree code, Verifying FinanceWebApp changes at runtime, What is usually already running (do NOT touch)

### Community 171 - "9. Sharing, invitation, revocation"
Cohesion: 0.40
Nodes (5): 9.1 Invite A → B (encrypted wallet), 9.2 Invitee without a keypair (V1 user) or without an account, 9.3 Revocation semantics (chosen behavior, stated plainly), 9.4 PENDING_REWRAP recovery (after §5.7 key reset), 9. Sharing, invitation, revocation

### Community 172 - "recommendedSubscriptions.ts"
Cohesion: 0.40
Nodes (3): RecommendedTag, RECOMMENDED_SUBSCRIPTIONS, RecommendedSubscriptionTag

### Community 174 - "Open Banking — note notturne per la revisione"
Cohesion: 0.40
Nodes (4): Dove sta il lavoro, Dubbi e decisioni da rivedere, Niente push / merge / PR, Open Banking — note notturne per la revisione

### Community 175 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 176 - "WalletRole"
Cohesion: 0.50
Nodes (4): WalletRole, EDITOR, OWNER, VIEWER

### Community 177 - "7. E2EE data plane (new API, coexisting with the legacy plane)"
Cohesion: 0.50
Nodes (4): 7.1 Why a separate plane, 7.2 Endpoints (`controller/E2eeController`, service `E2eeSyncService`), 7.3 Change-log append (correctness details), 7. E2EE data plane (new API, coexisting with the legacy plane)

### Community 178 - "Type"
Cohesion: 0.67
Nodes (3): Type, EXPENSE, INCOME

### Community 179 - "Type"
Cohesion: 0.67
Nodes (3): Type, EXPENSE, INCOME

## Knowledge Gaps
- **1100 isolated node(s):** `backend-mark.sh script`, `backend-tests.sh script`, `frontend-mark.sh script`, `WEEKLY`, `MONTHLY` (+1095 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1598 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `ImportReviewModal.tsx`, `triggerToast`, `domain.ts`, `vitest`, `useTabLayout.ts`, `Button.tsx`, `App.tsx`, `index.ts`, `useWalletContext`, `Tag`, `SubscriptionModal.tsx`, `AdminDashboard.tsx`, `CustomDatePicker.tsx`, `useLongPressSelect.test.tsx`, `TagsTab.tsx`, `TagsStep.tsx`, `SubscriptionDetailsModal.test.tsx`, `CreateWalletWizard.tsx`, `TagCreateMode.test.tsx`, `frontend/package.json`, `TokensSection.tsx`, `WalletsBar.tsx`, `TagsStep.test.tsx`, `Register.tsx`, `Wallet`, `ResponsiveOverlay.tsx`, `TagRequest`, `JobCard.tsx`, `useCsvImport.ts`, `OverviewTable.tsx`, `MonthlyChart.tsx`, `walletDataCache.ts`, `@fortawesome/fontawesome-svg-core`, `BudgetFormOverlay.tsx`, `NotificationsSection.tsx`, `useTheme`, `BackupRow.tsx`, `useSyncStatus.ts`, `ColorSelector.tsx`, `transactionTags.ts`, `Menu.tsx`, `useAmountInput.ts`, `PWAProvider.test.tsx`, `axiosConfig.test.ts`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `User` connect `User` to `org.junit.jupiter.api.Test`, `lombok.RequiredArgsConstructor`, `PatServiceTest`, `WalletAccess`, `WalletAccessRepository`, `BudgetService`, `lombok.Data`, `org.junit.jupiter.api.BeforeEach`, `jakarta.transaction.Transactional`, `Registrations`, `Wallet`, `PersonalAccessToken`, `TransactionServiceTest`, `.generateToken`, `SubscriptionServiceTest`, `UserServiceTest`, `NotificationDispatcherTest`, `AuthControllerTest`, `OAuthController`, `.deleteSubscription`, `.deleteWalletById`, `PatAuthenticationFilterTest.java`, `Budget`, `PatAuthenticationFilterTest`, `AccountDeletionServiceTest`, `BudgetAlertCronJobTest`, `ReportServiceTest`, `DemoCleanupCronJobTest`, `.sendYearlyReports`, `BaseWebMvcTest`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `ImportReviewModal.tsx`, `react`, `triggerToast`, `replay.test.ts`, `domain.ts`, `useTabLayout.ts`, `Button.tsx`, `App.tsx`, `index.ts`, `csvExport.ts`, `useWalletContext`, `Tag`, `SubscriptionModal.tsx`, `sw.ts`, `AdminDashboard.tsx`, `CustomDatePicker.tsx`, `useLongPressSelect.test.tsx`, `TagsTab.tsx`, `TagsStep.tsx`, `SubscriptionDetailsModal.test.tsx`, `CreateWalletWizard.tsx`, `TagCreateMode.test.tsx`, `frontend/package.json`, `TokensSection.tsx`, `WalletsBar.tsx`, `TagsStep.test.tsx`, `Register.tsx`, `Wallet`, `ResponsiveOverlay.tsx`, `TagRequest`, `JobCard.tsx`, `useCsvImport.ts`, `OverviewTable.tsx`, `MonthlyChart.tsx`, `walletDataCache.ts`, `@fortawesome/fontawesome-svg-core`, `BudgetFormOverlay.tsx`, `csvImport.ts`, `NotificationsSection.tsx`, `useTheme`, `walletOps.ts`, `BackupRow.tsx`, `useSyncStatus.ts`, `offlineDb.ts`, `ColorSelector.tsx`, `transactionTags.ts`, `useAmountInput.ts`, `PWAProvider.test.tsx`, `axiosConfig.test.ts`, `csvDedup.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Are the 34 inferred relationships involving `User` (e.g. with `.run()` and `.memberWithEmail()`) actually correct?**
  _`User` has 34 INFERRED edges - model-reasoned connections that need verification._
- **What connects `backend-mark.sh script`, `backend-tests.sh script`, `frontend-mark.sh script` to the rest of the system?**
  _1100 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `org.springframework.http.ResponseEntity` be split into smaller, more focused modules?**
  _Cohesion score 0.09730301427815971 - nodes in this community are weakly interconnected._
- **Should `org.junit.jupiter.api.Test` be split into smaller, more focused modules?**
  _Cohesion score 0.03515928515928516 - nodes in this community are weakly interconnected._