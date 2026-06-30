# Graph Report - FinanceWebApp  (2026-06-28)

## Corpus Check
- 262 files · ~124,833 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1307 nodes · 3638 edges · 64 communities (55 shown, 9 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 204 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b2bad2ba`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_MCP Server Tools|MCP Server Tools]]
- [[_COMMUNITY_Frontend Dependencies|Frontend Dependencies]]
- [[_COMMUNITY_Transaction Modal UI|Transaction Modal UI]]
- [[_COMMUNITY_Wallet Dashboard|Wallet Dashboard]]
- [[_COMMUNITY_Tag Management UI|Tag Management UI]]
- [[_COMMUNITY_Statistics Charts|Statistics Charts]]
- [[_COMMUNITY_Subscription UI|Subscription UI]]
- [[_COMMUNITY_Landing Page|Landing Page]]
- [[_COMMUNITY_User Service Layer|User Service Layer]]
- [[_COMMUNITY_Date Picker Component|Date Picker Component]]
- [[_COMMUNITY_Wallet Service Layer|Wallet Service Layer]]
- [[_COMMUNITY_Icon Selector Component|Icon Selector Component]]
- [[_COMMUNITY_Theme & PWA Context|Theme & PWA Context]]
- [[_COMMUNITY_Subscription Service|Subscription Service]]
- [[_COMMUNITY_Tag Service Layer|Tag Service Layer]]
- [[_COMMUNITY_Transaction Service|Transaction Service]]
- [[_COMMUNITY_Wallet Security|Wallet Security]]
- [[_COMMUNITY_User Registration|User Registration]]
- [[_COMMUNITY_PAT Token Management|PAT Token Management]]
- [[_COMMUNITY_Member Management|Member Management]]
- [[_COMMUNITY_User Model & Repository|User Model & Repository]]
- [[_COMMUNITY_Docker Infrastructure|Docker Infrastructure]]
- [[_COMMUNITY_CICD Pipeline|CI/CD Pipeline]]
- [[_COMMUNITY_Profile & Settings Modals|Profile & Settings Modals]]
- [[_COMMUNITY_Offline DB & Sync|Offline DB & Sync]]
- [[_COMMUNITY_Subscription Calendar|Subscription Calendar]]
- [[_COMMUNITY_Frontend Vite Config|Frontend Vite Config]]
- [[_COMMUNITY_Frontend Dev Dependencies|Frontend Dev Dependencies]]
- [[_COMMUNITY_Axios & Shared Modals|Axios & Shared Modals]]
- [[_COMMUNITY_Admin & Wallet Modals|Admin & Wallet Modals]]
- [[_COMMUNITY_Transaction Backend|Transaction Backend]]
- [[_COMMUNITY_Wallet Controller|Wallet Controller]]
- [[_COMMUNITY_Settings & Overview UI|Settings & Overview UI]]
- [[_COMMUNITY_Auth Registration Flow|Auth Registration Flow]]
- [[_COMMUNITY_Demo Service & Tags|Demo Service & Tags]]
- [[_COMMUNITY_Login & Demo Controller|Login & Demo Controller]]
- [[_COMMUNITY_Cron Jobs & Scheduling|Cron Jobs & Scheduling]]
- [[_COMMUNITY_JWT Token Service|JWT Token Service]]
- [[_COMMUNITY_OAuth Controller|OAuth Controller]]
- [[_COMMUNITY_Subscription Controller|Subscription Controller]]
- [[_COMMUNITY_Password Reset UI|Password Reset UI]]
- [[_COMMUNITY_ToDo Feature|ToDo Feature]]
- [[_COMMUNITY_Admin Backups UI|Admin Backups UI]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Amount Input Component|Amount Input Component]]
- [[_COMMUNITY_Admin User Invites|Admin User Invites]]
- [[_COMMUNITY_Frontend Package Config|Frontend Package Config]]
- [[_COMMUNITY_Root Package DnD Kit|Root Package DnD Kit]]
- [[_COMMUNITY_Frontend TSConfig|Frontend TSConfig]]
- [[_COMMUNITY_Recurring Payment Toggle|Recurring Payment Toggle]]
- [[_COMMUNITY_User Request DTO|User Request DTO]]
- [[_COMMUNITY_MCP Server Document|MCP Server Document]]
- [[_COMMUNITY_MCP Requirements|MCP Requirements]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 70|Community 70]]

## God Nodes (most connected - your core abstractions)
1. `Wallet` - 40 edges
2. `useWalletContext()` - 38 edges
3. `User` - 32 edges
4. `api` - 30 edges
5. `triggerToast()` - 30 edges
6. `_backend_request()` - 30 edges
7. `Transaction` - 29 edges
8. `AppContext` - 29 edges
9. `Tag` - 26 edges
10. `WalletAccess` - 25 edges

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
- **Email Notification System** — docker_compose_mail_config, email_forgotpasswordemail, email_registrationinviteemail, email_walletinviteemail [INFERRED 0.85]
- **CI/CD Deployment Pipeline** — workflows_deploy, workflows_deploy_matrix_deploy, workflows_deploy_git_post_deploy, workflows_deploy_weekly_cleanup, docker_compose_prod [EXTRACTED 1.00]

## Communities (64 total, 9 thin omitted)

### Community 0 - "MCP Server Tools"
Cohesion: 0.17
Nodes (13): AnimateBackground(), ChangePasswordModal, ChangePasswordModalHandle, PasswordInput(), PasswordInputProps, getPasswordRequirements(), isPasswordValid(), PasswordRequirements() (+5 more)

### Community 1 - "Frontend Dependencies"
Cohesion: 0.13
Nodes (8): BackendApplication, CommandLineRunner, DataInitializer, GrantedAuthority, User, Override, PrePersist, ManageUserRepository

### Community 2 - "Transaction Modal UI"
Cohesion: 0.18
Nodes (12): ADMIN_TABS, UsersPageProps, CreateInviteForm(), CreateInviteFormProps, AdminInvite, InvitesTable(), InvitesTableProps, ToastData (+4 more)

### Community 3 - "Wallet Dashboard"
Cohesion: 0.09
Nodes (16): Collection, MemberRequest, MemberResponse, WalletInviteResponse, IllegalArgumentException, PatWalletPermission, WalletMapper, WalletAccess (+8 more)

### Community 4 - "Tag Management UI"
Cohesion: 0.08
Nodes (72): BaseHTTPMiddleware, Context, description, FastMCP, Field, ge, gt, JSONResponse (+64 more)

### Community 5 - "Statistics Charts"
Cohesion: 0.07
Nodes (46): CustomDatePicker(), CustomDatePickerProps, DatePickerValue, DateRangeValue, ThemeSelector(), SettingsTab(), buildMonthlyBuckets(), MonthlyBucket (+38 more)

### Community 6 - "Subscription UI"
Cohesion: 0.20
Nodes (15): CurrencySelector(), CurrencySelectorProps, Props, TagPicker(), ExchangeRateSection(), UnifiedExchangeRateProps, Props, TransactionMetadataInputs() (+7 more)

### Community 7 - "Landing Page"
Cohesion: 0.09
Nodes (19): BackupEntry, AdminDatabaseController, AdminUserController, MembersController, OAuthAuthorizeRequest, OAuthController, PatController, TagController (+11 more)

### Community 8 - "User Service Layer"
Cohesion: 0.12
Nodes (18): AboutAppModal, AboutAppModalHandle, LogoutModal, LogoutModalHandle, ProfileModal, ProfileModalHandle, AppHeader(), AppHeaderProps (+10 more)

### Community 9 - "Date Picker Component"
Cohesion: 0.20
Nodes (14): DeleteModal, DeleteModalProvider(), LandingPage(), App(), ToDoPage(), PWAPrompt(), ToastNotification(), DecodedToken (+6 more)

### Community 10 - "Wallet Service Layer"
Cohesion: 0.14
Nodes (11): TagRequest, TagResponse, TransactionRequest, TransactionResponse, TagNotFoundException, TransactionMapper, PreAuthorize, TagRepository (+3 more)

### Community 11 - "Icon Selector Component"
Cohesion: 0.10
Nodes (14): GlobalExceptionHandler, Exception, ExceptionHandler, PermissionDeniedException, TagHasChildrenException, TagInUseException, UserAlreadyExistsException, WalletNotFoundException (+6 more)

### Community 12 - "Theme & PWA Context"
Cohesion: 0.16
Nodes (5): InvitationStatus, EmailService, RegistrationsRepository, SendEmailService, String

### Community 13 - "Subscription Service"
Cohesion: 0.12
Nodes (26): DayDetailModalHandle, DayDetailPanel, DayDetailPanelProps, SubscriptionCalendar(), SubscriptionCalendarProps, formatCompactFrequency(), getDaysLeft(), getDaysLeftColor() (+18 more)

### Community 14 - "Tag Service Layer"
Cohesion: 0.13
Nodes (6): CTASectionProps, DemoSectionProps, Footer(), HeroProps, NavbarProps, ToDoSection()

### Community 15 - "Transaction Service"
Cohesion: 0.09
Nodes (29): Spring Boot Backend Service, Database Backup Configuration, Docker Compose Dev Environment, Vite + React Frontend Service, JWT Authentication Configuration, SMTP Mail Configuration, MCP Server Service (AI Bridge), PostgreSQL 16 Database Service (+21 more)

### Community 16 - "Wallet Security"
Cohesion: 0.21
Nodes (10): AdminStats(), AdminStatsProps, StatCard(), StatCardProps, SortConfig, UserDirectory(), UserDirectoryProps, UserRow() (+2 more)

### Community 17 - "User Registration"
Cohesion: 0.20
Nodes (3): ActionCardProps, BackupEntry, BackupSelectorProps

### Community 18 - "PAT Token Management"
Cohesion: 0.09
Nodes (14): BackupCronJob, SubscriptionCronJob, fileMoves, project, Key, Path, PostConstruct, ProcessBuilder (+6 more)

### Community 19 - "Member Management"
Cohesion: 0.08
Nodes (25): dependencies, axios, date-fns, dexie, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, @emotion/react (+17 more)

### Community 20 - "User Model & Repository"
Cohesion: 0.10
Nodes (13): Async, BadCredentialsException, Cacheable, CacheEvict, ChangePasswordRequest, WalletPermission, EntityGraph, InvalidTokenException (+5 more)

### Community 21 - "Docker Infrastructure"
Cohesion: 0.08
Nodes (31): Icon(), WalletIconProps, ColorSelectorPropsProps, IconColorSelector(), IconPickerButton(), IconPickerButtonProps, IconSelector(), IconSelectorProps (+23 more)

### Community 22 - "CI/CD Pipeline"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+13 more)

### Community 23 - "Profile & Settings Modals"
Cohesion: 0.17
Nodes (9): CalendarContainerProps, ViewState, PresetType, DayCellProps, MonthGrid(), MonthGridProps, MonthSelector(), MonthSelectorProps (+1 more)

### Community 24 - "Offline DB & Sync"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+11 more)

### Community 25 - "Subscription Calendar"
Cohesion: 0.11
Nodes (10): DemoCleanupCronJob, PatCreateRequest, PatCreateResponse, PatResponse, PatUpdateRequest, UserNotFoundException, List, TransactionRepository (+2 more)

### Community 26 - "Frontend Vite Config"
Cohesion: 0.11
Nodes (12): SubscriptionController, SubscriptionRequest, SubscriptionResponse, LocalDate, SubscriptionMapper, Subscription, Tag, Transaction (+4 more)

### Community 27 - "Frontend Dev Dependencies"
Cohesion: 0.10
Nodes (20): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, postcss (+12 more)

### Community 28 - "Axios & Shared Modals"
Cohesion: 0.14
Nodes (24): ConsentView, PatFormView(), PatFormViewProps, PatListView(), PatListViewProps, PatShowTokenView(), PatShowTokenViewProps, TokenActionButtons() (+16 more)

### Community 29 - "Admin & Wallet Modals"
Cohesion: 0.19
Nodes (12): AuthenticationConfiguration, AuthenticationManager, AuthenticationProvider, Bean, CacheManager, ApplicationConfig, CacheConfig, SecurityConfig (+4 more)

### Community 30 - "Transaction Backend"
Cohesion: 0.09
Nodes (21): AdminDashboard(), DeleteModalHandle, DeleteModalContext, useDeleteModal(), ModalDialog(), ModalDialogProps, ModalDialogRightAction(), ModalDialogRightActionProp (+13 more)

### Community 31 - "Wallet Controller"
Cohesion: 0.27
Nodes (3): AuthController, ForgotPasswordRequest, HttpServletResponse

### Community 32 - "Settings & Overview UI"
Cohesion: 0.21
Nodes (5): WalletController, WalletRequest, WalletResponse, UnauthorizedAccessException, WalletService

### Community 33 - "Auth Registration Flow"
Cohesion: 0.14
Nodes (7): RegisterInviteRequest, RegisterInviteResponse, ResetPasswordRequest, AdminInviteMapper, Registrations, RegisterInviteResponse, RegisterService

### Community 34 - "Demo Service & Tags"
Cohesion: 0.42
Nodes (4): Frequency, DemoService, Tag, Wallet

### Community 35 - "Login & Demo Controller"
Cohesion: 0.22
Nodes (11): DataTab(), InviteSection(), InviteSectionProps, MemberCategory(), MemberCategoryProps, MemberRow(), MemberRowProps, SettingsCard() (+3 more)

### Community 36 - "Cron Jobs & Scheduling"
Cohesion: 0.32
Nodes (3): Sphere(), SphereProps, RegisterInviteResponse

### Community 37 - "JWT Token Service"
Cohesion: 0.26
Nodes (5): Claims, Date, Function, JwtService, T

### Community 38 - "OAuth Controller"
Cohesion: 0.31
Nodes (6): FilterChain, OncePerRequestFilter, CustomUserDetailsService, JwtAuthenticationFilter, PatAuthenticationFilter, UserDetailsService

### Community 40 - "Password Reset UI"
Cohesion: 0.18
Nodes (7): DemoController, AuthResponse, LoginRequest, MemberMapper, Object, Role, UserDetails

### Community 41 - "ToDo Feature"
Cohesion: 0.15
Nodes (12): 🏗️ Architecture Overview, 🚀 Automated Deployment, 🧩 Core Stack, ⚡ Demo & Onboarding Mode, ⚙️ Development Setup, Enabling Demo Features, 🚀 Engineering Highlights, 🛠️ Infrastructure & CI/CD (+4 more)

### Community 42 - "Admin Backups UI"
Cohesion: 0.36
Nodes (5): Status, BackendApplicationTests, AdminUserIntegrationTest, Test, WithMockUser

### Community 44 - "Amount Input Component"
Cohesion: 0.33
Nodes (6): useMobileMath(), AmountInput(), AmountInputProps, formatAmountString(), hasOperators(), evaluateMathExpression()

### Community 45 - "Admin User Invites"
Cohesion: 0.13
Nodes (6): AdminInviteRequest, AdminInviteResponse, UserResponse, LocalDateTime, UserMapper, AdminUserInviteService

### Community 46 - "Frontend Package Config"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, preview, type (+1 more)

### Community 48 - "Root Package DnD Kit"
Cohesion: 0.40
Nodes (4): dependencies, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities

### Community 60 - "Community 60"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + TypeScript + Vite

### Community 61 - "Community 61"
Cohesion: 0.18
Nodes (9): api, failedQueue, LoginForm(), Requirements, CacheItem, FinanceDb, offlineDb, SyncQueueItem (+1 more)

### Community 66 - "Community 66"
Cohesion: 0.24
Nodes (5): rawToDoData, todoData, ToDoItem, ToDoItemInput, ToDoStatus

### Community 67 - "Community 67"
Cohesion: 0.12
Nodes (15): CellType, formatAmount(), OverviewCell(), OverviewCellProps, DataItem, OverviewRow(), OverviewRowProps, MonthlyOverviewProps (+7 more)

### Community 70 - "Community 70"
Cohesion: 0.08
Nodes (23): darkMuiTheme, DEMO_TRANSACTIONS, Features(), CashFlowSankey(), CashFlowSankeyProps, LinkDef, NodeDef, StyledText (+15 more)

## Knowledge Gaps
- **213 isolated node(s):** `UserRequest`, `PatWalletPermission`, `ManageUserRepository`, `WalletRepository`, `PatWalletPermission` (+208 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Status` connect `Admin Backups UI` to `User Registration`, `Frontend Vite Config`?**
  _High betweenness centrality (0.354) - this node is a cross-community bridge._
- **Why does `api` connect `Community 61` to `MCP Server Tools`, `Transaction Modal UI`, `Login & Demo Controller`, `Cron Jobs & Scheduling`, `Statistics Charts`, `Subscription UI`, `Community 70`, `User Service Layer`, `Subscription Service`, `Tag Service Layer`, `User Registration`, `Docker Infrastructure`, `Axios & Shared Modals`, `Transaction Backend`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `triggerToast()` connect `Transaction Modal UI` to `MCP Server Tools`, `Login & Demo Controller`, `Cron Jobs & Scheduling`, `Statistics Charts`, `Subscription UI`, `Community 70`, `User Service Layer`, `Date Picker Component`, `Subscription Service`, `Tag Service Layer`, `User Registration`, `Docker Infrastructure`, `Axios & Shared Modals`, `Community 61`, `Transaction Backend`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **What connects `UserRequest`, `PatWalletPermission`, `ManageUserRepository` to the rest of the system?**
  _243 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `Wallet Dashboard` be split into smaller, more focused modules?**
  _Cohesion score 0.09065679925994449 - nodes in this community are weakly interconnected._
- **Should `Tag Management UI` be split into smaller, more focused modules?**
  _Cohesion score 0.08144144144144144 - nodes in this community are weakly interconnected._