# Graph Report - FinanceWebApp  (2026-10-27)

## Corpus Check
- 977 files · ~467,934 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 5911 nodes · 19538 edges · 200 communities (170 shown, 26 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 2325 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `415e66ce`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- org.springframework.http.ResponseEntity
- org.junit.jupiter.api.Test
- mcp_server.py
- DemoController.java
- Tag
- triggerToast
- PatResponse
- WalletAccess
- User
- BackupServiceTest
- BankConnection
- Transaction
- vitest
- useTabLayout.ts
- react
- useOAuthAuthorize.ts
- lombok.Data
- @fortawesome/free-solid-svg-icons
- TagResponse
- WalletProvider.test.tsx
- tagOrder.ts
- StagedSubscriptionEditor.tsx
- FinanceWebApp Project
- WalletRequest
- Registrations
- dependencies
- BankAccountsSection.tsx
- SendEmailService
- devDependencies
- Tag
- CustomDatePicker.tsx
- compilerOptions
- WalletSecurityTest
- org.springframework.security.access.prepost.PreAuthorize
- compilerOptions
- Frontend UI Redesign — TODO
- categoriesWidgets.tsx
- TagsStep.tsx
- TransactionServiceTest
- Wizard.tsx
- JwtAuthenticationFilterTest
- SubscriptionServiceTest
- frontend/package.json
- TokensSection.tsx
- WalletsBar.tsx
- <p align="center">FinanceWebApp - Portfolio Showcase</p>
- Wallet
- scripts
- UserServiceTest
- Frontend Unit-Test Plan — `frontend/`
- EnableBankingClient
- NotificationType
- AuthControllerTest
- OAuthAuthCodeStore
- ResponsiveOverlay.tsx
- package.json
- React + TypeScript + Vite
- tsconfig.json
- TagRequest
- JobCard.tsx
- ScheduledJobService
- FrankfurterExchangeRateService
- Transaction
- csvValidation.ts
- org.junit.jupiter.api.BeforeEach
- Duration
- MCP Server Python Dependencies
- BankLinkService
- OverviewTable.tsx
- Phases D–I — String extraction by area
- MonthlyChart.tsx
- Budget
- MFA (TOTP + Email code) — Implementation Plan / TODO
- useWalletData.ts
- @fortawesome/fontawesome-svg-core
- domain.ts
- PatAuthenticationFilterTest
- Interactive Onboarding (guided tour) — Implementation Plan / TODO
- csvImport.ts
- SettingsPage.tsx
- Periodic Summary Reports — Implementation Plan
- Frontend Restructure — Analysis & Execution Plan / TODO
- TransactionPieChart.tsx
- AccountDeletionServiceTest
- walletOps.ts
- BackupRow.tsx
- useSyncStatus.ts
- RegistrationsRepository
- BankLinkServiceTest
- ReportHtmlBuilderTest
- Landing Page Redesign — Design Spec
- ReportServiceTest
- Wallet Creation Wizard — Design Spec
- BankSyncServiceTest
- TransactionService
- Offline Sync Rework — Implementation Plan / TODO
- Web Push Notifications — Implementation Plan / TODO
- SyncCenterOverlay.test.tsx
- .budget
- Phase A — Backend
- ColorSelector.tsx
- WalletResponse
- PersonalAccessToken
- CreateWalletWizard.tsx
- PatServiceTest
- Frequency
- vite.config.ts
- Settings tab — redesign plan
- Wallet End-to-End Encryption — Implementation TODO
- Settings Refactor — TODO
- Menu.tsx
- .sendAll
- Appendix — full live call-site table
- StatisticsTab.tsx
- useAmountInput.ts
- BankSyncCronJobTest
- PWAProvider.test.tsx
- .findAllByUserIdAndStatus
- EbTransaction
- ReportHtmlBuilder
- Phase map
- axiosConfig.test.ts
- csvDedup.ts
- refactor.ts
- org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
- 5. Epic: eliminare `no-explicit-any` (90 → 0)
- DeleteModal.tsx
- Wallet data unifier + client cache — Design
- Invitations in the Wallet Sidebar — Design
- replay.ts
- WebPushSenderTest
- File map
- Task 3 — GroupEditGrid mini-tiles + shared DnD (depends on 1 & 2)
- Wallet End-to-End Encryption — Architecture Plan
- Wallet Creation Wizard — Implementation Plan / TODO
- Wallet slug leggibile nell'URL
- R2StorageServiceTest
- lombok.RequiredArgsConstructor
- SubscriptionCronJob
- jakarta.servlet.http.HttpServletResponse
- Responsive Overlay Pattern — Implementation TODO
- offlineDb.ts
- TagServiceTest.java
- sw.ts
- Decisioni per te (non le ho prese io)
- catalogue.ts
- categoryChartData.ts
- Admin Section Redesign — TODO
- Category Management — Redesign (planning only)
- Wallet Data Unifier + Client Cache — Implementation Plan
- Global Constraints
- WebPushGateway
- Kickoff prompt — SETTINGS redesign (copy into a new session)
- 5. Authentication protocol changes
- overlayHistory.ts
- Transaction.java
- walletCreation.ts
- 1. What I extracted from the codebase
- AdminDatabaseController
- jakarta.transaction.Transactional
- Categories (Tags) tab — charts plan
- 8. Sync design (frontend `src/sync/`, extending the existing layer)
- Global Constraints
- .monthly
- overlay.test.ts
- BackendApplication
- BackupService
- Verifying FinanceWebApp changes at runtime
- 9. Sharing, invitation, revocation
- RecommendedSubscriptionPicker.tsx
- PatMapperTest
- Open Banking: note notturne per la revisione
- gradlew
- ToDoList.tsx
- 7. E2EE data plane (new API, coexisting with the legacy plane)
- NotificationTypeConstraintCleanup
- ChangePasswordRequest
- .generateToken
- frontend-checks.sh
- runtime-env.d.ts
- rules/graphify.md
- workflows/graphify.md
- .setUp
- .extractClaim
- backend-mark.sh
- backend-tests.sh
- frontend-mark.sh
- open-banking-followups.md
- 40-config.sh
- .listAvailableBackups
- java.time.YearMonth
- tagDraft.ts
- Status
- InvitationStatus
- Status
- EnableBankingException

## God Nodes (most connected - your core abstractions)
1. `react` - 327 edges
2. `User` - 252 edges
3. `vitest` - 205 edges
4. `@fortawesome/free-solid-svg-icons` - 150 edges
5. `@fortawesome/react-fontawesome` - 145 edges
6. `@testing-library/react` - 140 edges
7. `WalletAccess` - 129 edges
8. `Wallet` - 108 edges
9. `triggerToast()` - 103 edges
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

## Communities (200 total, 26 thin omitted)

### Community 0 - "org.springframework.http.ResponseEntity"
Cohesion: 0.07
Nodes (23): GlobalExceptionHandler, GetMapping, Pattern, PostMapping, RestController, OAuthController, DeleteMapping, DeleteMapping (+15 more)

### Community 1 - "org.junit.jupiter.api.Test"
Cohesion: 0.03
Nodes (33): OAuthAuthorizeRequest, PatBulkDeleteRequest, PatBulkPauseRequest, WalletAccessId, AdminDatabaseControllerTest, org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration, org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration, MembersControllerTest (+25 more)

### Community 2 - "mcp_server.py"
Cohesion: 0.08
Nodes (76): BaseHTTPMiddleware, Context, custom_route, description, FastMCP, Field, ge, gt (+68 more)

### Community 3 - "DemoController.java"
Cohesion: 0.09
Nodes (10): DemoController, NotificationController, PushController, NotificationPreferenceServiceTest, org.springframework.boot.autoconfigure.condition.ConditionalOnProperty, org.springframework.web.bind.annotation.DeleteMapping, org.springframework.web.bind.annotation.GetMapping, org.springframework.web.bind.annotation.PostMapping (+2 more)

### Community 4 - "Tag"
Cohesion: 0.04
Nodes (79): Icon(), WalletIconProps, ColorSelectorPropsProps, IconColorSelector(), IconPickerButton(), IconPickerButtonProps, IconSelector(), IconSelectorProps (+71 more)

### Community 5 - "triggerToast"
Cohesion: 0.03
Nodes (128): AdminDashboard(), UsersPageProps, AdminPageHeader(), AdminPageHeaderProps, Backups(), useBackups(), CreateInviteForm(), CreateInviteFormProps (+120 more)

### Community 6 - "PatResponse"
Cohesion: 0.14
Nodes (10): GetMapping, PostMapping, PutMapping, RequestMapping, RestController, PatController, PatCreateResponse, PatResponse (+2 more)

### Community 7 - "WalletAccess"
Cohesion: 0.06
Nodes (29): DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, MembersController, MemberRequest (+21 more)

### Community 8 - "User"
Cohesion: 0.05
Nodes (32): DeleteMapping, PostMapping, PutMapping, RequestMapping, RestController, TransactionController, DeleteMapping, GetMapping (+24 more)

### Community 10 - "BankConnection"
Cohesion: 0.04
Nodes (36): BankAccountLink, AllArgsConstructor, Builder, Data, Entity, NoArgsConstructor, Table, BankConnection (+28 more)

### Community 11 - "Transaction"
Cohesion: 0.03
Nodes (90): FloatingActionButton(), FloatingActionButtonProps, InputProps, AmountType, NumberInput, NumberInputProps, TYPE_OPTIONS, BASE_DAYS (+82 more)

### Community 12 - "vitest"
Cohesion: 0.03
Nodes (46): ThemeSelector(), TagFilter(), TagTreeSearchGroup, useTagTree(), Collapse(), CollapseProps, CustomSelect(), CustomSelectProps (+38 more)

### Community 13 - "useTabLayout.ts"
Cohesion: 0.06
Nodes (64): AccentHoverButton(), AccentHoverButtonProps, GroupEditGrid(), GroupEditGridProps, MemberTile(), MemberTileProps, HiddenTray(), HiddenTrayProps (+56 more)

### Community 14 - "react"
Cohesion: 0.05
Nodes (58): Sphere(), SphereProps, AnimateBackground(), AuthLayout(), ForgotPasswordSent(), Props, formatCooldown(), useCooldown() (+50 more)

### Community 15 - "useOAuthAuthorize.ts"
Cohesion: 0.07
Nodes (31): OAuthErrorState(), useOAuthAuthorize(), OAuthParams, useOAuthParams(), OAuthConsent(), WalletPermissionSelector(), WalletPermissionSelectorProps, PatFormView() (+23 more)

### Community 16 - "lombok.Data"
Cohesion: 0.14
Nodes (23): NotificationPreferencesResponse, WalletMute, NotificationResponse, PushSubscriptionRequest, RegisterInviteResponse, UserRequest, WalletMuteRequest, PatWalletPermission (+15 more)

### Community 17 - "@fortawesome/free-solid-svg-icons"
Cohesion: 0.04
Nodes (76): CustomDatePicker(), CurrencyDropdownPanel(), CurrencyDropdownPanelProps, sectionLabel(), CurrencyOptionRow(), CurrencySelector(), CurrencySelectorProps, useCurrencyDropdown() (+68 more)

### Community 18 - "TagResponse"
Cohesion: 0.13
Nodes (16): SubscriptionResponse, TagResponse, TransactionBulkResponse, Type, TransactionFillRequest, TransactionResponse, StaleWriteException, SubscriptionMapper (+8 more)

### Community 19 - "WalletProvider.test.tsx"
Cohesion: 0.10
Nodes (16): cachedData, CaptureConsumer(), Consumer(), createTagOp, createTxOp, createTxWithPendingTagOp, FilterConsumer(), FilteredOverlayConsumer() (+8 more)

### Community 20 - "tagOrder.ts"
Cohesion: 0.11
Nodes (30): buildChildParent(), CONTAINER_PREFIX, moveChildToParent(), nestedCollisionDetection(), resolveTargetParent(), CategoryTreeListProps, ChildDropZone(), useCategoryTree() (+22 more)

### Community 21 - "StagedSubscriptionEditor.tsx"
Cohesion: 0.16
Nodes (15): buildSchedulePayload(), ScheduleFields, StagedSubscriptionEditor(), durationChangePatch(), parseIsoDate(), base, CachedFxRate, cacheKey() (+7 more)

### Community 22 - "FinanceWebApp Project"
Cohesion: 0.09
Nodes (29): Forgot Password Email Template, Registration Invite Email Template, Wallet Invite Email Template, Spring Boot Backend Service, Database Backup Configuration, Docker Compose Dev Environment, Vite + React Frontend Service, JWT Authentication Configuration (+21 more)

### Community 23 - "WalletRequest"
Cohesion: 0.12
Nodes (4): PutMapping, WalletRequest, WalletRole, WalletProvisioningServiceTest

### Community 24 - "Registrations"
Cohesion: 0.05
Nodes (19): AdminUserController, DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, GetMapping (+11 more)

### Community 25 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, axios, date-fns, dexie, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, @emotion/react (+17 more)

### Community 26 - "BankAccountsSection.tsx"
Cohesion: 0.09
Nodes (31): Aspsp, BankAccountLink, BankConnection, connectBank(), deleteConnection(), getWalletBank(), listAspsps(), renewConnection() (+23 more)

### Community 27 - "SendEmailService"
Cohesion: 0.08
Nodes (20): EmailService, Pattern, SendEmailService, BaseWebMvcTest, Override, TestWebMvcConfig, ManageUserServiceTest, BaseIntegrationTest (+12 more)

### Community 28 - "devDependencies"
Cohesion: 0.06
Nodes (34): devDependencies, autoprefixer, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh (+26 more)

### Community 29 - "Tag"
Cohesion: 0.09
Nodes (8): TagNotFoundException, Entity, Table, Tag, IndexedTagRow, TagService, Wallet, TagServiceTest

### Community 30 - "CustomDatePicker.tsx"
Cohesion: 0.07
Nodes (32): CalendarContainer(), CalendarContainerProps, ViewState, CustomDatePickerProps, DatePickerSidebar(), DatePickerSidebarProps, DatePickerSurface(), DatePickerSurfaceProps (+24 more)

### Community 31 - "compilerOptions"
Cohesion: 0.09
Nodes (22): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+14 more)

### Community 32 - "WalletSecurityTest"
Cohesion: 0.10
Nodes (3): AccessDeniedException, PermissionDeniedException, WalletSecurityTest

### Community 34 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+11 more)

### Community 35 - "Frontend UI Redesign — TODO"
Cohesion: 0.05
Nodes (37): Backend architecture, Common commands, Conventions & gotchas, Frontend architecture, Frontend code organization (structure guidelines), graphify, MCP server, Overview (+29 more)

### Community 36 - "categoriesWidgets.tsx"
Cohesion: 0.16
Nodes (15): CATEGORIES_TAB_ID, CATEGORIES_WIDGETS, FlowType, CategoryHeatmapChart(), CategoryHeatmapChartProps, COLOR_SCALE, CategoryRanking(), CategoryTrendChart() (+7 more)

### Community 37 - "TagsStep.tsx"
Cohesion: 0.10
Nodes (31): groupTagRequests(), groupToTagRequests(), keyOfName(), RECOMMENDED_TAG_GROUPS, RecommendedTagGroup, MOCK_SOURCE_WALLETS, SourceWallet, StagedTagTree() (+23 more)

### Community 38 - "TransactionServiceTest"
Cohesion: 0.10
Nodes (5): TransactionMapperTest, ApplicationEventPublisher, Transaction, Wallet, TransactionServiceTest

### Community 39 - "Wizard.tsx"
Cohesion: 0.16
Nodes (13): PANEL_VARIANTS, Wizard(), WizardCompletionState, WizardCompletionStatus, WizardProps, WizardStep, WizardStepper(), WizardStepperProps (+5 more)

### Community 41 - "SubscriptionServiceTest"
Cohesion: 0.06
Nodes (9): Entity, Table, Subscription, Status, SubscriptionService, ApplicationEventPublisher, Subscription, Wallet (+1 more)

### Community 42 - "frontend/package.json"
Cohesion: 0.06
Nodes (35): @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, name, private, type, version, autoprefixer (+27 more)

### Community 43 - "TokensSection.tsx"
Cohesion: 0.08
Nodes (23): TokenActionButtons(), TokenActionButtonsProps, TokenLastUsedInfo(), TokenLastUsedInfoProps, TokenListItem(), TokenListItemProps, TokenWalletBadges(), TokenWalletBadgesProps (+15 more)

### Community 44 - "WalletsBar.tsx"
Cohesion: 0.07
Nodes (33): UserDashboard(), handleChangeWallet(), resolveWalletParam(), useWalletRouting(), InviteCard(), InviteCardProps, useWalletDragReorder(), AddWalletTile() (+25 more)

### Community 45 - "<p align="center">FinanceWebApp - Portfolio Showcase</p>"
Cohesion: 0.15
Nodes (12): 🏗️ Architecture Overview, 🚀 Automated Deployment, 🧩 Core Stack, ⚡ Demo & Onboarding Mode, ⚙️ Development Setup, Enabling Demo Features, 🚀 Engineering Highlights, 🛠️ Infrastructure & CI/CD (+4 more)

### Community 46 - "Wallet"
Cohesion: 0.08
Nodes (41): TransactionRequest, UserNotFoundException, WalletNotFoundException, Entity, Table, Wallet, BankSyncService, BankConnectionRepository (+33 more)

### Community 47 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, test:watch

### Community 49 - "Frontend Unit-Test Plan — `frontend/`"
Cohesion: 0.05
Nodes (42): 1.1 Cosa esiste già, 1.2 Convenzioni del repo da rispettare (da `CLAUDE.md` + `frontend/style.md`), 1.3 Convenzioni tecniche di mocking (pattern del repo, da riusare), 1.4 Dipendenze/decisioni da risolvere prima di S1/S3, 1.5 Politica di profondità di validazione (per tier), 1. Analisi dei requisiti, 2. Sezioni di test — ordinate per sicurezza (S1 → S4), 3. Ordine di esecuzione & tracking (+34 more)

### Community 50 - "EnableBankingClient"
Cohesion: 0.08
Nodes (22): Aspsp, EnableBankingClient, Builder, RawAccount, RawAmount, RawAspsps, RawAuth, RawIban (+14 more)

### Community 51 - "NotificationType"
Cohesion: 0.05
Nodes (29): NotificationType, BANK_CONNECTION, MONTHLY_REPORT, RECURRING_EXECUTED, SUBSCRIPTION_CREATED, SUBSCRIPTION_DELETED, SUBSCRIPTION_UPDATED, TRANSACTION_CREATED (+21 more)

### Community 52 - "AuthControllerTest"
Cohesion: 0.13
Nodes (7): AuthController, PostMapping, RequestMapping, RestController, ForgotPasswordRequest, AuthControllerTest, User

### Community 53 - "OAuthAuthCodeStore"
Cohesion: 0.18
Nodes (4): AuthCodeEntry, OAuthAuthCodeStore, OAuthAuthCodeStoreTest, lombok.Getter

### Community 54 - "ResponsiveOverlay.tsx"
Cohesion: 0.05
Nodes (31): AmountInput(), AmountInputProps, AmountMathToolbar(), AmountMathToolbarProps, MenuRoot(), ResponsiveOverlay(), ResponsiveOverlayProps, SwitchableCard() (+23 more)

### Community 55 - "package.json"
Cohesion: 0.25
Nodes (7): dependencies, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities

### Community 56 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + TypeScript + Vite

### Community 58 - "TagRequest"
Cohesion: 0.09
Nodes (32): SubscriptionRequest, TagRequest, MissingTagActions(), MissingTagActionsProps, MissingTagChip(), RecommendedMatch, MissingTransactionTags(), MissingTransactionTagsProps (+24 more)

### Community 59 - "JobCard.tsx"
Cohesion: 0.12
Nodes (26): buildSchedulePayload(), ScheduleDraft, SchedulePayload, JobCard(), JobRunHistory(), DAYS, DOM_OPTIONS, formatCountdown() (+18 more)

### Community 60 - "ScheduledJobService"
Cohesion: 0.05
Nodes (31): AdminJobController, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, JobRunDTO, ScheduledJobDTO (+23 more)

### Community 61 - "FrankfurterExchangeRateService"
Cohesion: 0.17
Nodes (8): CachedRate, FrankfurterExchangeRateService, FrankfurterRate, Builder, Override, FrankfurterExchangeRateServiceTest, org.springframework.test.web.client.MockRestServiceServer, org.springframework.web.client.RestClient

### Community 62 - "Transaction"
Cohesion: 0.19
Nodes (11): Type, EXPENSE, INCOME, Entity, Table, Transaction, Type, EXPENSE (+3 more)

### Community 63 - "csvValidation.ts"
Cohesion: 0.15
Nodes (13): CsvUploadFieldProps, CsvResource, DURATIONS, FREQ_TYPES, isBlank(), isValidIsoDate(), norm(), ParsedCsv (+5 more)

### Community 67 - "org.junit.jupiter.api.BeforeEach"
Cohesion: 0.06
Nodes (30): AdminInviteMapper, NotificationRepository, JobFrequency, DAILY, HOURLY, MONTHLY, WEEKLY, YEARLY (+22 more)

### Community 68 - "Duration"
Cohesion: 0.50
Nodes (4): Duration, FOREVER, TIMES, UNTIL

### Community 70 - "BankLinkService"
Cohesion: 0.07
Nodes (19): OpenBankingDisabledException, BankAccountResponse, BankConnectionResponse, BankDtos, ConnectRequest, Status, UrlResponse, WalletBankResponse (+11 more)

### Community 71 - "OverviewTable.tsx"
Cohesion: 0.12
Nodes (16): CellType, OverviewCell(), OverviewCellContent(), OverviewCellContentProps, OverviewCellProps, DataItem, OverviewRow(), OverviewRowProps (+8 more)

### Community 72 - "Phases D–I — String extraction by area"
Cohesion: 0.06
Nodes (30): Confirmed design decisions (from the interview — do not relitigate), Explicitly out of scope (do not build), Global Constraints (apply to every task), Localization (i18n) — Implementation Plan / TODO, Phase A — Infrastructure, Phase B — Central locale-aware formats, Phase C — Language UI + error mapping, Phase J — Final gates, docs, knowledge graph, manual QA (+22 more)

### Community 73 - "MonthlyChart.tsx"
Cohesion: 0.17
Nodes (23): bucketLabel(), MonthlyBucket, MonthlyChartRow, toCumulativeRows(), toSnapshotRows(), BALANCE_COLOR, darkTheme, EXPENSE_COLOR (+15 more)

### Community 74 - "Budget"
Cohesion: 0.05
Nodes (36): BudgetController, DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, BudgetAlertCronJob (+28 more)

### Community 75 - "MFA (TOTP + Email code) — Implementation Plan / TODO"
Cohesion: 0.07
Nodes (29): Explicitly out of scope (do not build), Global Constraints (apply to every task), MFA (TOTP + Email code) — Implementation Plan / TODO, Phase A — Backend foundation, Phase B — Backend settings flows (enroll / disable / recovery codes), Phase C — Backend login flow + admin reset, Phase D — Ops / env plumbing, Phase E — Frontend: login second step (+21 more)

### Community 76 - "useWalletData.ts"
Cohesion: 0.23
Nodes (15): syncWalletIfStale(), cache, Entry, fetchAndTrack(), fetchFromApi(), getWalletData(), inflight, peek() (+7 more)

### Community 77 - "@fortawesome/fontawesome-svg-core"
Cohesion: 0.09
Nodes (22): AdminTab, AdminTabs(), TABS, InviteComposer(), InviteComposerProps, RoleSelector(), RoleSelectorProps, WalletRole (+14 more)

### Community 78 - "domain.ts"
Cohesion: 0.06
Nodes (40): AdminStats(), AdminStatsProps, StatCard(), StatCardProps, SortConfig, UserDirectory(), UserDirectoryProps, UserRow() (+32 more)

### Community 79 - "PatAuthenticationFilterTest"
Cohesion: 0.19
Nodes (3): InvalidTokenException, Override, PatAuthenticationFilterTest

### Community 80 - "Interactive Onboarding (guided tour) — Implementation Plan / TODO"
Cohesion: 0.07
Nodes (27): Decisions (locked 2026-07-11 — do not re-litigate during implementation), Explicitly out of scope (do not build), Global Constraints (apply to every task), Interactive Onboarding (guided tour) — Implementation Plan / TODO, Phase A — Backend: flag, exposure, seed removal, Phase B — Tour engine (no product-visible change yet), Phase C — Content: anchors, wizard choreography, sample CSV, registry, Phase D — Triggers, persistence client, replay (+19 more)

### Community 81 - "csvImport.ts"
Cohesion: 0.13
Nodes (29): RFC-4180, CsvFormatModalProps, CsvColumn, dataRows(), DurationType, FrequencyType, optionalNumber(), optionalRaw() (+21 more)

### Community 82 - "SettingsPage.tsx"
Cohesion: 0.07
Nodes (36): DashboardBackground(), fetchPublicKey(), getEnrollment(), isPushSupported(), keyToBase64(), PushEnrollment, subscribeThisDevice(), unsubscribeThisDevice() (+28 more)

### Community 83 - "Periodic Summary Reports — Implementation Plan"
Cohesion: 0.07
Nodes (26): Final verification (after the last task), Global Constraints, Periodic Summary Reports — Implementation Plan, Phase 1 — Scheduler MONTHLY/YEARLY, Phase 2 — Report aggregation (pure logic), Phase 3 — PDF rendering + templates, Phase 4 — Preferences, email sending, orchestration, jobs, Phase 5 — Settings “Notifications” section (+18 more)

### Community 84 - "Frontend Restructure — Analysis & Execution Plan / TODO"
Cohesion: 0.08
Nodes (25): 5A — dashboard/tag, 5B — dashboard/statistics, 5C — dashboard/layout, 5D — dashboard/settings (CSV), 5E — dashboard core (wallet / transaction / subscription / root), 5F — modals (non-wizard), 5G — components/ui hot spots, 5H — components (pickers/selectors/landing/pat) (+17 more)

### Community 85 - "TransactionPieChart.tsx"
Cohesion: 0.36
Nodes (5): StyledText, TransactionPieChart(), FALLBACK_HEX, hexToRgba(), toHex()

### Community 86 - "AccountDeletionServiceTest"
Cohesion: 0.14
Nodes (10): DemoCleanupCronJob, Override, DemoCleanupCronJobTest, User, Wallet, AccountDeletionServiceTest, InvitationStatus, User (+2 more)

### Community 87 - "walletOps.ts"
Cohesion: 0.17
Nodes (23): createOp(), createSubscription(), createTag(), createTransaction(), deleteSubscription(), deleteTag(), deleteTransaction(), isNetworkError() (+15 more)

### Community 88 - "BackupRow.tsx"
Cohesion: 0.24
Nodes (15): BackupConfirmModal(), Props, ageColorClass(), formatLabel(), formatSize(), parseKeyDate(), relativeAge(), BackupRow() (+7 more)

### Community 89 - "useSyncStatus.ts"
Cohesion: 0.20
Nodes (19): invalidate(), EMPTY_COUNTS, useSyncStatus(), countByStatus(), enqueueOp(), listOps(), notify(), removeOp() (+11 more)

### Community 90 - "RegistrationsRepository"
Cohesion: 0.07
Nodes (31): ApplicationConfig, AsyncConfig, CacheConfig, DataInitializer, Override, ThreadPoolTaskScheduler, SchedulingConfig, SecurityConfig (+23 more)

### Community 91 - "BankLinkServiceTest"
Cohesion: 0.20
Nodes (8): CallbackRequest, EbAccount, EbSession, BankLinkServiceTest, User, Wallet, WalletRole, jakarta.persistence.EntityManager

### Community 92 - "ReportHtmlBuilderTest"
Cohesion: 0.16
Nodes (5): CategoryTotal, PeriodTotals, ReportPdfRenderer, WalletMonthlyReport, ReportHtmlBuilderTest

### Community 93 - "Landing Page Redesign — Design Spec"
Cohesion: 0.09
Nodes (21): 10. Testing & verification, 11. Out of scope, 1. Goal & framing, 2. Decisions (locked with the user), 3. Style-guide compliance (`frontend/style.md`), 4. Page architecture (section order — confirmed), 5.1 Navbar, 5.2 Hero (+13 more)

### Community 95 - "Wallet Creation Wizard — Design Spec"
Cohesion: 0.10
Nodes (20): 10. Testing, 11. Style & copy constraints (`style.md`), 12. Implementation process, 1. Goal, 2. Scope & non-goals, 3. Codebase facts this design is built on, 4. Generic `Wizard` primitive, 5. Full-screen shell (+12 more)

### Community 96 - "BankSyncServiceTest"
Cohesion: 0.13
Nodes (7): Status, Outcome, SyncResult, EbDtos, EbTransactionPage, PsuContext, BankSyncServiceTest

### Community 97 - "TransactionService"
Cohesion: 0.24
Nodes (6): Subscription, Tag, Transaction, Type, Wallet, TransactionService

### Community 98 - "Offline Sync Rework — Implementation Plan / TODO"
Cohesion: 0.10
Nodes (19): Confirmed design decisions (from the interview — do not relitigate), Global Constraints (apply to every task), Offline Sync Rework — Implementation Plan / TODO, Phase A — Backend, Phase B — Frontend: queue + overlay foundations, Phase C — Frontend: wiring, replay, UI, Self-review checklist (run after implementation, before hand-back), Task 10: replay engine (`src/sync/replay.ts`, replaces `utils/syncService.ts`) (+11 more)

### Community 99 - "Web Push Notifications — Implementation Plan / TODO"
Cohesion: 0.10
Nodes (19): Confirmed design decisions (from the interview — do not relitigate), Global Constraints (apply to every task), Phase 1 — Backend push infrastructure, Phase 1 — Frontend, Phase 2 — Notification center (history), Self-review checklist (run after implementation), Task 10: backend — list / mark-read / purge-read + retention job, Task 11: frontend — bell + yellow dot + center overlay with read/purge lifecycle (+11 more)

### Community 100 - "SyncCenterOverlay.test.tsx"
Cohesion: 0.20
Nodes (7): SyncCenterOverlayProps, SyncStatus, failedOp, missingOp, pendingOp, staleOp, PendingOp

### Community 101 - ".budget"
Cohesion: 0.24
Nodes (3): BudgetPeriods, Period, BudgetPeriodsTest

### Community 102 - "Phase A — Backend"
Cohesion: 0.11
Nodes (18): Budgeting — Implementation Plan / TODO, Global Constraints (apply to every task), Phase A — Backend, Phase B — Frontend, Phase C — Wrap-up, Self-review notes (already applied), Task 10: `BudgetFormOverlay` + delete flow, Task 11 (OPTIONAL — confirm with the user first): MCP budget tools (+10 more)

### Community 103 - "ColorSelector.tsx"
Cohesion: 0.31
Nodes (7): COLOR_PRESETS, ColorSelector(), ColorSelectorProps, PRESET_SET, getRecentColors(), pushRecentColor(), @uiw/react-color

### Community 104 - "WalletResponse"
Cohesion: 0.10
Nodes (20): GetMapping, PostMapping, PutMapping, RequestMapping, RestController, SubscriptionController, GetMapping, PostMapping (+12 more)

### Community 105 - "PersonalAccessToken"
Cohesion: 0.17
Nodes (5): Entity, Table, PersonalAccessToken, User, Wallet

### Community 106 - "CreateWalletWizard.tsx"
Cohesion: 0.10
Nodes (18): CsvUploadField(), TransactionRequest, CreateWalletWizard, CreateWalletWizardHandle, DEFAULT_DRAFT, Props, WalletDraft, fetchTagSources() (+10 more)

### Community 107 - "PatServiceTest"
Cohesion: 0.15
Nodes (3): PatCreateRequest, User, PatServiceTest

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
Cohesion: 0.16
Nodes (13): Menu, MenuContent(), MenuContentProps, MenuContext, MenuContextValue, MenuItem(), MenuItemProps, MenuItemTone (+5 more)

### Community 115 - "Appendix — full live call-site table"
Cohesion: 0.13
Nodes (14): Admin, Appendix — full live call-site table, Auth & onboarding, Dashboard / wallet, Dead files (never imported — delete; not audited in depth), Modals (wallet / tag / subscription / transaction), OAuth consent, P0 — Correctness bug (+6 more)

### Community 116 - "StatisticsTab.tsx"
Cohesion: 0.12
Nodes (16): buildMonthlyBuckets(), CumulativeChart(), MonthlySnapshotChart(), StatisticsSummary(), StatisticsSummaryProps, SummaryCardProps, CHART_TABS, ChartMode (+8 more)

### Community 117 - "useAmountInput.ts"
Cohesion: 0.25
Nodes (8): AmountType, useAmountInput(), UseAmountInputArgs, AmountType, Harness(), formatAmountString(), hasOperators(), evaluateMathExpression()

### Community 118 - "BankSyncCronJobTest"
Cohesion: 0.20
Nodes (5): Override, Status, BankSyncCronJobTest, Status, SyncResult

### Community 119 - "PWAProvider.test.tsx"
Cohesion: 0.24
Nodes (8): Consumer(), BeforeInstallPromptEvent, Window, WindowEventMap, PWAContext, PWAContextType, usePWA(), PWAProvider()

### Community 120 - ".findAllByUserIdAndStatus"
Cohesion: 0.16
Nodes (5): Role, ADMIN, USER, User, Wallet

### Community 121 - "EbTransaction"
Cohesion: 0.22
Nodes (5): BankTransactionMapper, Type, MappedTx, EbTransaction, BankTransactionMapperTest

### Community 122 - "ReportHtmlBuilder"
Cohesion: 0.26
Nodes (3): Pattern, ReportHtmlBuilder, WalletYearlyReport

### Community 123 - "Phase map"
Cohesion: 0.14
Nodes (13): Design decisions (agreed in grilling, 2026-07-07), Global Constraints, Phase map, Reminder Subscriptions (Amount-less) Implementation Plan, Task 1: Entity flags + DTO/mapper plumbing (backend), Task 2: SubscriptionService — create/update reminder subscriptions, Task 3: Cron — generate pending transactions, Task 4: Fill endpoint + pending-clearing on update/bulk (backend) (+5 more)

### Community 124 - "axiosConfig.test.ts"
Cohesion: 0.18
Nodes (9): OfflineBanner(), useOnlineStatus(), base64url(), makeJwt(), setOnline(), cacheGet, cachePut, FakeError (+1 more)

### Community 125 - "csvDedup.ts"
Cohesion: 0.29
Nodes (12): DedupResult, detectSubscriptionOverwrites(), detectTagOverwrites(), detectTransactionOverwrites(), isoDate(), norm(), subscriptionKey(), tagKey() (+4 more)

### Community 126 - "refactor.ts"
Cohesion: 0.50
Nodes (3): fileMoves, project, ts-morph

### Community 127 - "org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest"
Cohesion: 0.25
Nodes (7): NotificationPreferencesController, NotificationPreferencesRequest, NotificationPreferenceService, org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration, NotificationPreferencesControllerTest, org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest, org.springframework.web.bind.annotation.PutMapping

### Community 128 - "5. Epic: eliminare `no-explicit-any` (90 → 0)"
Cohesion: 0.09
Nodes (21): 1. Causa radice, 2. Strategia (Ibrido), 3. TODO, 4. Debito tecnico tracciato (warning, da smaltire in futuro), 5. Epic: eliminare `no-explicit-any` (90 → 0), 6. `react-refresh/only-export-components` (7 → 0), 7. `react-hooks/exhaustive-deps` (6 → 0), A. Config ESLint — sblocco (degrado regole rumorose) (+13 more)

### Community 129 - "DeleteModal.tsx"
Cohesion: 0.07
Nodes (31): DedupOverwrite, RowError, ImportJob, ImportModalState, useHoldToConfirm(), ConfirmModal(), ConfirmModalProps, TONES (+23 more)

### Community 130 - "Wallet data unifier + client cache — Design"
Cohesion: 0.15
Nodes (12): A. Backend — aggregate endpoint (new), Architecture, B. Frontend — unified fetch + TTL cache, Data flow, Design decisions (agreed), Expected result, Goals, Non-goals (+4 more)

### Community 131 - "Invitations in the Wallet Sidebar — Design"
Cohesion: 0.15
Nodes (12): Backend contract (already implemented — `MembersController` @ `/api/invitations`), Components (all new files under `src/dashboard/wallet/`), Count badge & empty state, Edge cases, Files, Goals, Invitations in the Wallet Sidebar — Design, Non-goals (YAGNI) (+4 more)

### Community 132 - "replay.ts"
Cohesion: 0.12
Nodes (17): classifyReplayError(), collectionUrl(), initSync(), OFFLINE_SYNC_COMPLETE, ReplayClassification, resourceUrl(), sendOp(), RFC-7807 (+9 more)

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

### Community 140 - "lombok.RequiredArgsConstructor"
Cohesion: 0.06
Nodes (29): BackupCronJob, Override, BankSyncCronJob, Override, MonthlyReportCronJob, Override, NotificationCleanupCronJob, Override (+21 more)

### Community 141 - "SubscriptionCronJob"
Cohesion: 0.35
Nodes (3): Override, SubscriptionCronJob, SubscriptionCronJobTest

### Community 142 - "jakarta.servlet.http.HttpServletResponse"
Cohesion: 0.20
Nodes (4): PutMapping, LoginRequest, UpdateUsernameRequest, jakarta.servlet.http.HttpServletResponse

### Community 143 - "Responsive Overlay Pattern — Implementation TODO"
Cohesion: 0.18
Nodes (10): Decisions (from brainstorming), Definition of done, Open / defer, Responsive Overlay Pattern — Implementation TODO, S1 — The `ResponsiveOverlay` primitive (evolve `components/ui/Drawer.tsx`), S2 — Trigger model (keep call sites imperative), S3 — Per-surface migration, S4 — What stays `ModalDialog` (unchanged) (+2 more)

### Community 144 - "offlineDb.ts"
Cohesion: 0.22
Nodes (7): CacheItem, ConflictKind, FinanceDb, offlineDb, OpEntityType, OpKind, dexie

### Community 145 - "TagServiceTest.java"
Cohesion: 0.17
Nodes (9): DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, TagController, TagBulkResponse (+1 more)

### Community 146 - "sw.ts"
Cohesion: 0.24
Nodes (7): notificationTargetUrl(), PushPayload, workbox-cacheable-response, workbox-expiration, workbox-precaching, workbox-routing, workbox-strategies

### Community 147 - "Decisioni per te (non le ho prese io)"
Cohesion: 0.14
Nodes (13): Convenzioni, Cosa NON ho fatto, Cosa è stato fatto, Decisioni per te (non le ho prese io), Dipendenze npm inutilizzate (F22) — non rimosse, File più grossi prima → dopo, Frontend restructure — notte del 2026-10-27, Le tue modifiche non committate (+5 more)

### Community 148 - "catalogue.ts"
Cohesion: 0.18
Nodes (14): CurrencyOptionRowProps, buildCurrencyLists(), MAIN_SET, useCurrencyList(), META, CachedCurrencies, FrankfurterCurrency, getCurrencies() (+6 more)

### Community 149 - "categoryChartData.ts"
Cohesion: 0.22
Nodes (12): buildMainCategoryMeta(), CategoryMeta, mainCategoryName(), OTHER_COLOR, buildHeatmap(), buildRanking(), buildTrend(), HeatmapData (+4 more)

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
Cohesion: 0.29
Nodes (5): Override, WebPushGateway, jakarta.annotation.PostConstruct, nl.martijndwars.webpush.PushService, PushService

### Community 155 - "Kickoff prompt — SETTINGS redesign (copy into a new session)"
Cohesion: 0.25
Nodes (7): Come procedere (IMPORTANTE — è il flusso richiesto), Contesto: lavori recenti già FATTI, File coinvolti (TUTTI da rifare) — `frontend/src/`, Kickoff prompt — SETTINGS redesign (copy into a new session), Obiettivo di questa sessione: la sezione SETTINGS (redesign quasi TOTALE), Verifica sempre verde (dopo ogni elemento), Vincoli fermi

### Community 156 - "5. Authentication protocol changes"
Cohesion: 0.25
Nodes (8): 5.1 Pre-auth salt endpoint, 5.2 Login (V2), 5.3 Registration via invite (V2 from birth), 5.4 Password change (re-wrap PriK only), 5.5 Remember-me and local key persistence, 5.6 Legacy users — lazy upgrade V1 → V2, 5.7 Forgot / reset password, 5. Authentication protocol changes

### Community 157 - "overlayHistory.ts"
Cohesion: 0.46
Nodes (7): CloseFn, ensureListening(), onPopState(), reconcile(), reconcileSoon(), registerOverlay(), stack

### Community 158 - "Transaction.java"
Cohesion: 0.12
Nodes (12): AssignableUuidV7, AssignableUuidV7Generator, Override, Override, UuidV7GeneratorTest, java.lang.annotation.Retention, java.lang.annotation.Target, org.hibernate.annotations.IdGeneratorType (+4 more)

### Community 159 - "walletCreation.ts"
Cohesion: 0.15
Nodes (12): bulkOutcome(), BulkResponse, createWalletFromDraft(), invitesTask(), ResourceKey, ResourceOutcome, WalletBasics, WalletCreateError (+4 more)

### Community 160 - "1. What I extracted from the codebase"
Cohesion: 0.29
Nodes (7): 1.1 Entities (backend `model/`, PostgreSQL via `ddl-auto=update`, no Flyway), 1.2 Current auth flow, 1.3 Current offline / sync layer (frontend), 1.4 Current MCP behavior, 1.5 Authorization & other cross-cutting facts, 1.6 Files that will be touched (complete map), 1. What I extracted from the codebase

### Community 161 - "AdminDatabaseController"
Cohesion: 0.16
Nodes (9): AdminDatabaseController, BackupEntry, DeleteMapping, GetMapping, PostMapping, RequestMapping, RestController, org.springframework.core.io.Resource (+1 more)

### Community 162 - "jakarta.transaction.Transactional"
Cohesion: 0.05
Nodes (26): DeleteMapping, PatMapper, ImportedBankTransaction, AllArgsConstructor, Builder, Data, Entity, NoArgsConstructor (+18 more)

### Community 163 - "Categories (Tags) tab — charts plan"
Cohesion: 0.33
Nodes (5): Categories (Tags) tab — charts plan, Follow-ups — DONE, Increments (propose design in chat → OK → implement → verify → next), Locked decisions (2026-07-03), Verify (after each)

### Community 164 - "8. Sync design (frontend `src/sync/`, extending the existing layer)"
Cohesion: 0.33
Nodes (6): 8.1 Local store (Dexie v2 upgrade of `FinanceAppOffline`), 8.2 Pull (delta apply), 8.3 Push (offline mutations), 8.4 Conflicts — two-way, whole-entity choice (mine or theirs), 8.5 Compaction (`CronJob/ChangeLogCompactionCronJob`, ManagedJob, default weekly), 8. Sync design (frontend `src/sync/`, extending the existing layer)

### Community 165 - "Global Constraints"
Cohesion: 0.33
Nodes (5): Global Constraints, Self-Review, Task 1: Helper `walletSlug` con test, Task 2: Usare lo slug in `UserDashboard.tsx`, Wallet Slug URL Implementation Plan

### Community 167 - "overlay.test.ts"
Cohesion: 0.16
Nodes (11): filterTransactions(), WalletProvider(), applyPendingOps(), resolveTag(), stateOf(), foodTag, snacksTag, sub1 (+3 more)

### Community 168 - "BackendApplication"
Cohesion: 0.60
Nodes (3): BackendApplication, org.springframework.boot.autoconfigure.SpringBootApplication, org.springframework.scheduling.annotation.EnableScheduling

### Community 170 - "Verifying FinanceWebApp changes at runtime"
Cohesion: 0.40
Nodes (4): Frontend, Recipe: isolated backend instance with your working-tree code, Verifying FinanceWebApp changes at runtime, What is usually already running (do NOT touch)

### Community 171 - "9. Sharing, invitation, revocation"
Cohesion: 0.40
Nodes (5): 9.1 Invite A → B (encrypted wallet), 9.2 Invitee without a keypair (V1 user) or without an account, 9.3 Revocation semantics (chosen behavior, stated plainly), 9.4 PENDING_REWRAP recovery (after §5.7 key reset), 9. Sharing, invitation, revocation

### Community 172 - "RecommendedSubscriptionPicker.tsx"
Cohesion: 0.31
Nodes (6): RecommendedTag, RECOMMENDED_CONTEXT_TAGS, RecommendedSubscriptionPickerProps, RECOMMENDED_SUBSCRIPTIONS, RecommendedSubscription, RecommendedSubscriptionTag

### Community 174 - "Open Banking: note notturne per la revisione"
Cohesion: 0.25
Nodes (7): Da provare tu, con banca e chiave reali, Decisioni prese da me (da rivedere), Open Banking: note notturne per la revisione, ✅ Sistemati (commit `fdec269`, `./gradlew check` verde), Spegnimento, Stato in breve, (storico) Problemi trovati prima del merge

### Community 175 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 176 - "ToDoList.tsx"
Cohesion: 0.26
Nodes (6): rawToDoData, todoData, ToDoItem, ToDoItemInput, ToDoStatus, ToDoList()

### Community 177 - "7. E2EE data plane (new API, coexisting with the legacy plane)"
Cohesion: 0.50
Nodes (4): 7.1 Why a separate plane, 7.2 Endpoints (`controller/E2eeController`, service `E2eeSyncService`), 7.3 Change-log append (correctness details), 7. E2EE data plane (new API, coexisting with the legacy plane)

### Community 178 - "NotificationTypeConstraintCleanup"
Cohesion: 0.31
Nodes (6): Override, NotificationTypeConstraintCleanup, NotificationTypeConstraintCleanupTest, org.springframework.boot.ApplicationArguments, org.springframework.boot.ApplicationRunner, org.springframework.jdbc.core.JdbcTemplate

### Community 180 - ".generateToken"
Cohesion: 0.17
Nodes (4): User, Wallet, User, JwtServiceTest

### Community 185 - ".setUp"
Cohesion: 0.22
Nodes (4): Type, User, Wallet, WalletRole

### Community 194 - "java.time.YearMonth"
Cohesion: 0.38
Nodes (3): MonthRow, YearRecords, java.time.YearMonth

### Community 195 - "tagDraft.ts"
Cohesion: 0.48
Nodes (4): addTagToDraft(), DEFAULT_TAG_COLOR, DEFAULT_TAG_ICON, tagKey()

### Community 196 - "Status"
Cohesion: 0.33
Nodes (6): Status, ACTIVE, ERROR, EXPIRED, PAUSED, PENDING

### Community 197 - "InvitationStatus"
Cohesion: 0.33
Nodes (6): InvitationStatus, ACCEPTED, LEFT, PENDING, REJECTED, REVOKED

### Community 198 - "Status"
Cohesion: 0.50
Nodes (4): Status, ACTIVE, COMPLETED, PAUSED

## Knowledge Gaps
- **1121 isolated node(s):** `backend-mark.sh script`, `backend-tests.sh script`, `frontend-mark.sh script`, `PENDING`, `ACTIVE` (+1116 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1671 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `DeleteModal.tsx`, `Tag`, `triggerToast`, `Transaction`, `vitest`, `useTabLayout.ts`, `useOAuthAuthorize.ts`, `@fortawesome/free-solid-svg-icons`, `WalletProvider.test.tsx`, `catalogue.ts`, `categoryChartData.ts`, `tagOrder.ts`, `BankAccountsSection.tsx`, `CustomDatePicker.tsx`, `categoriesWidgets.tsx`, `TagsStep.tsx`, `Wizard.tsx`, `frontend/package.json`, `TokensSection.tsx`, `WalletsBar.tsx`, `ToDoList.tsx`, `ResponsiveOverlay.tsx`, `TagRequest`, `JobCard.tsx`, `OverviewTable.tsx`, `MonthlyChart.tsx`, `useWalletData.ts`, `@fortawesome/fontawesome-svg-core`, `domain.ts`, `SettingsPage.tsx`, `TransactionPieChart.tsx`, `BackupRow.tsx`, `useSyncStatus.ts`, `ColorSelector.tsx`, `CreateWalletWizard.tsx`, `Menu.tsx`, `StatisticsTab.tsx`, `useAmountInput.ts`, `PWAProvider.test.tsx`, `axiosConfig.test.ts`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `DeleteModal.tsx`, `Tag`, `triggerToast`, `replay.ts`, `Transaction`, `useTabLayout.ts`, `react`, `useOAuthAuthorize.ts`, `offlineDb.ts`, `@fortawesome/free-solid-svg-icons`, `sw.ts`, `WalletProvider.test.tsx`, `catalogue.ts`, `StagedSubscriptionEditor.tsx`, `categoryChartData.ts`, `tagOrder.ts`, `BankAccountsSection.tsx`, `CustomDatePicker.tsx`, `walletCreation.ts`, `categoriesWidgets.tsx`, `TagsStep.tsx`, `Wizard.tsx`, `overlay.test.ts`, `frontend/package.json`, `TokensSection.tsx`, `WalletsBar.tsx`, `ToDoList.tsx`, `ResponsiveOverlay.tsx`, `TagRequest`, `JobCard.tsx`, `csvValidation.ts`, `tagDraft.ts`, `OverviewTable.tsx`, `MonthlyChart.tsx`, `useWalletData.ts`, `@fortawesome/fontawesome-svg-core`, `domain.ts`, `csvImport.ts`, `SettingsPage.tsx`, `TransactionPieChart.tsx`, `walletOps.ts`, `BackupRow.tsx`, `useSyncStatus.ts`, `SyncCenterOverlay.test.tsx`, `ColorSelector.tsx`, `CreateWalletWizard.tsx`, `StatisticsTab.tsx`, `useAmountInput.ts`, `PWAProvider.test.tsx`, `axiosConfig.test.ts`, `csvDedup.ts`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `User` connect `User` to `org.springframework.http.ResponseEntity`, `org.junit.jupiter.api.Test`, `DemoController.java`, `PatResponse`, `WalletAccess`, `BankConnection`, `lombok.RequiredArgsConstructor`, `jakarta.servlet.http.HttpServletResponse`, `lombok.Data`, `TagServiceTest.java`, `TagResponse`, `WalletRequest`, `Registrations`, `SendEmailService`, `WalletSecurityTest`, `org.springframework.security.access.prepost.PreAuthorize`, `jakarta.transaction.Transactional`, `TransactionServiceTest`, `JwtAuthenticationFilterTest`, `SubscriptionServiceTest`, `Wallet`, `UserServiceTest`, `ChangePasswordRequest`, `AuthControllerTest`, `NotificationType`, `.generateToken`, `.setUp`, `org.junit.jupiter.api.BeforeEach`, `BankLinkService`, `Budget`, `PatAuthenticationFilterTest`, `AccountDeletionServiceTest`, `RegistrationsRepository`, `BankLinkServiceTest`, `ReportServiceTest`, `BankSyncServiceTest`, `WalletResponse`, `PersonalAccessToken`, `PatServiceTest`, `.sendAll`, `BankSyncCronJobTest`, `.findAllByUserIdAndStatus`, `org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 34 inferred relationships involving `User` (e.g. with `.run()` and `.memberWithEmail()`) actually correct?**
  _`User` has 34 INFERRED edges - model-reasoned connections that need verification._
- **What connects `backend-mark.sh script`, `backend-tests.sh script`, `frontend-mark.sh script` to the rest of the system?**
  _1121 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `org.springframework.http.ResponseEntity` be split into smaller, more focused modules?**
  _Cohesion score 0.06758742286218043 - nodes in this community are weakly interconnected._
- **Should `org.junit.jupiter.api.Test` be split into smaller, more focused modules?**
  _Cohesion score 0.02870279146141215 - nodes in this community are weakly interconnected._