# Graph Report - FinanceWebApp  (2026-06-28)

## Corpus Check
- 258 files · ~125,004 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1299 nodes · 3611 edges · 70 communities (61 shown, 9 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 202 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a6870772`
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
- [[_COMMUNITY_Backend Tests|Backend Tests]]
- [[_COMMUNITY_Amount Input Component|Amount Input Component]]
- [[_COMMUNITY_Admin User Invites|Admin User Invites]]
- [[_COMMUNITY_Frontend Package Config|Frontend Package Config]]
- [[_COMMUNITY_Backup Shell Scripts|Backup Shell Scripts]]
- [[_COMMUNITY_Root Package DnD Kit|Root Package DnD Kit]]
- [[_COMMUNITY_Frontend TSConfig|Frontend TSConfig]]
- [[_COMMUNITY_Recurring Payment Toggle|Recurring Payment Toggle]]
- [[_COMMUNITY_User Request DTO|User Request DTO]]
- [[_COMMUNITY_MCP Server Document|MCP Server Document]]
- [[_COMMUNITY_MCP Requirements|MCP Requirements]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]

## God Nodes (most connected - your core abstractions)
1. `useWalletContext()` - 38 edges
2. `Wallet` - 38 edges
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

## Communities (70 total, 9 thin omitted)

### Community 0 - "MCP Server Tools"
Cohesion: 0.08
Nodes (30): ThemeSelector(), darkMuiTheme, DEMO_TRANSACTIONS, CashFlowSankey(), CashFlowSankeyProps, LinkDef, NodeDef, buildMonthlyBuckets() (+22 more)

### Community 1 - "Frontend Dependencies"
Cohesion: 0.13
Nodes (8): BackendApplication, CommandLineRunner, DataInitializer, GrantedAuthority, User, Override, PrePersist, ManageUserRepository

### Community 2 - "Transaction Modal UI"
Cohesion: 0.10
Nodes (16): Async, Cacheable, CacheEvict, PatController, ChangePasswordRequest, PatCreateRequest, PatCreateResponse, PatResponse (+8 more)

### Community 3 - "Wallet Dashboard"
Cohesion: 0.12
Nodes (11): Collection, MemberRequest, MemberResponse, WalletInviteResponse, InvitationStatus, MemberMapper, WalletAccess, PreAuthorize (+3 more)

### Community 4 - "Tag Management UI"
Cohesion: 0.08
Nodes (72): BaseHTTPMiddleware, Context, description, FastMCP, Field, ge, gt, JSONResponse (+64 more)

### Community 5 - "Statistics Charts"
Cohesion: 0.15
Nodes (21): DateRangeValue, DataTab(), SettingsTab(), ShareSettingsSection(), DateRangeBanner(), StatisticsTab(), SubscriptionTab(), TagCard() (+13 more)

### Community 6 - "Subscription UI"
Cohesion: 0.10
Nodes (32): CurrencySelector(), CurrencySelectorProps, FloatingActionButton(), FloatingActionButtonProps, TagBadge(), Props, TagPicker(), TransactionRowProps (+24 more)

### Community 7 - "Landing Page"
Cohesion: 0.29
Nodes (4): MembersController, DeleteMapping, User, Void

### Community 8 - "User Service Layer"
Cohesion: 0.10
Nodes (23): AppHeader(), AppHeaderProps, AppHeaderTab, AboutAppModal, AboutAppModalHandle, ChangePasswordModal, ChangePasswordModalHandle, InvitationsModal (+15 more)

### Community 9 - "Date Picker Component"
Cohesion: 0.09
Nodes (20): CTASectionProps, DemoSectionProps, Features(), Footer(), HeroProps, LandingPage(), NavbarProps, ToDoSection() (+12 more)

### Community 10 - "Wallet Service Layer"
Cohesion: 0.17
Nodes (7): TransactionController, TransactionRequest, TransactionResponse, TagNotFoundException, TransactionMapper, PutMapping, TransactionService

### Community 11 - "Icon Selector Component"
Cohesion: 0.19
Nodes (7): PermissionDeniedException, UserNotFoundException, WalletNotFoundException, RuntimeException, PatWalletPermission, WalletSecurity, UUID

### Community 12 - "Theme & PWA Context"
Cohesion: 0.14
Nodes (5): EmailService, RegistrationsRepository, UserRepository, SendEmailService, String

### Community 13 - "Subscription Service"
Cohesion: 0.14
Nodes (23): DayDetailModalHandle, DayDetailPanel, DayDetailPanelProps, SubscriptionDetailsModalHandle, SubscriptionModal, SubscriptionModalHandle, SubscriptionViewProps, SubscriptionCalendar() (+15 more)

### Community 14 - "Tag Service Layer"
Cohesion: 0.11
Nodes (19): Collapse(), CollapseProps, ColorSelector(), ColorSelectorProps, FLUO_PRESETS, ColorSelectorPropsProps, IconPickerButton(), IconPickerButtonProps (+11 more)

### Community 15 - "Transaction Service"
Cohesion: 0.09
Nodes (29): Spring Boot Backend Service, Database Backup Configuration, Docker Compose Dev Environment, Vite + React Frontend Service, JWT Authentication Configuration, SMTP Mail Configuration, MCP Server Service (AI Bridge), PostgreSQL 16 Database Service (+21 more)

### Community 16 - "Wallet Security"
Cohesion: 0.13
Nodes (17): ADMIN_TABS, UsersPageProps, AdminStats(), AdminStatsProps, CreateInviteForm(), CreateInviteFormProps, AdminInvite, InvitesTable() (+9 more)

### Community 17 - "User Registration"
Cohesion: 0.38
Nodes (8): BadCredentialsException, GlobalExceptionHandler, Exception, ExceptionHandler, HttpServletRequest, HttpStatus, ProblemDetail, ResponseEntity

### Community 18 - "PAT Token Management"
Cohesion: 0.14
Nodes (9): BackupEntry, Key, Path, PostConstruct, ProcessBuilder, Resource, BackupService, BackupEntry (+1 more)

### Community 19 - "Member Management"
Cohesion: 0.08
Nodes (25): dependencies, axios, date-fns, dexie, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, @emotion/react (+17 more)

### Community 20 - "User Model & Repository"
Cohesion: 0.13
Nodes (14): api, failedQueue, IconColorSelector(), CreateTagModal, CreateTagModalHandle, Props, Props, ShareWalletModal (+6 more)

### Community 21 - "Docker Infrastructure"
Cohesion: 0.15
Nodes (16): Icon(), WalletIconProps, TagCardProps, TagChildRowProps, TagFilter(), TagFilterProps, TagFilterRow(), TagFilterRowProps (+8 more)

### Community 22 - "CI/CD Pipeline"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+13 more)

### Community 23 - "Profile & Settings Modals"
Cohesion: 0.14
Nodes (12): CalendarContainerProps, ViewState, CustomDatePicker(), CustomDatePickerProps, DatePickerValue, PresetType, DayCellProps, MonthGrid() (+4 more)

### Community 24 - "Offline DB & Sync"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+11 more)

### Community 25 - "Subscription Calendar"
Cohesion: 0.13
Nodes (5): UserResponse, List, UserMapper, TransactionRepository, Transaction

### Community 26 - "Frontend Vite Config"
Cohesion: 0.11
Nodes (12): SubscriptionController, SubscriptionRequest, SubscriptionResponse, LocalDate, SubscriptionMapper, Subscription, Tag, Transaction (+4 more)

### Community 27 - "Frontend Dev Dependencies"
Cohesion: 0.11
Nodes (19): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, postcss (+11 more)

### Community 28 - "Axios & Shared Modals"
Cohesion: 0.15
Nodes (17): ConsentView, PatModal, PatModalHandle, PatFormView(), PatFormViewProps, PatListView(), PatListViewProps, PatShowTokenView() (+9 more)

### Community 29 - "Admin & Wallet Modals"
Cohesion: 0.19
Nodes (12): AuthenticationConfiguration, AuthenticationManager, AuthenticationProvider, Bean, CacheManager, ApplicationConfig, CacheConfig, SecurityConfig (+4 more)

### Community 30 - "Transaction Backend"
Cohesion: 0.13
Nodes (8): TagController, TagRequest, TagResponse, TagHasChildrenException, TagInUseException, TagMapper, TagRepository, TagService

### Community 31 - "Wallet Controller"
Cohesion: 0.17
Nodes (7): AdminDatabaseController, AuthController, ForgotPasswordRequest, LoginRequest, HttpServletResponse, MultipartFile, PostMapping

### Community 32 - "Settings & Overview UI"
Cohesion: 0.20
Nodes (7): WalletController, WalletRequest, WalletResponse, UnauthorizedAccessException, WalletAccessId, Serializable, WalletService

### Community 33 - "Auth Registration Flow"
Cohesion: 0.35
Nodes (3): RegisterInviteRequest, RegisterInviteResponse, RegisterService

### Community 34 - "Demo Service & Tags"
Cohesion: 0.34
Nodes (5): Frequency, type, DemoService, Tag, Wallet

### Community 35 - "Login & Demo Controller"
Cohesion: 0.21
Nodes (9): LoginForm(), Requirements, SettingsCard(), SettingsCardProps, ToastData, ToastNotification(), triggerToast(), InviteSection() (+1 more)

### Community 36 - "Cron Jobs & Scheduling"
Cohesion: 0.20
Nodes (5): BackupCronJob, SubscriptionCronJob, Scheduled, AuthCodeEntry, OAuthAuthCodeStore

### Community 37 - "JWT Token Service"
Cohesion: 0.20
Nodes (6): Claims, Date, Function, JwtService, UserService, T

### Community 39 - "Subscription Controller"
Cohesion: 0.20
Nodes (10): PWAPrompt(), DeleteModal, DeleteModalHandle, DeleteModalContext, DeleteModalProvider(), App(), PWAContext, PWAContextType (+2 more)

### Community 40 - "Password Reset UI"
Cohesion: 0.24
Nodes (4): DemoCleanupCronJob, ResetPasswordRequest, IllegalArgumentException, Transactional

### Community 41 - "ToDo Feature"
Cohesion: 0.15
Nodes (12): 🏗️ Architecture Overview, 🚀 Automated Deployment, 🧩 Core Stack, ⚡ Demo & Onboarding Mode, ⚙️ Development Setup, Enabling Demo Features, 🚀 Engineering Highlights, 🛠️ Infrastructure & CI/CD (+4 more)

### Community 42 - "Admin Backups UI"
Cohesion: 0.20
Nodes (3): ActionCardProps, BackupEntry, BackupSelectorProps

### Community 43 - "Backend Tests"
Cohesion: 0.29
Nodes (7): FilterChain, OncePerRequestFilter, CustomUserDetailsService, JwtAuthenticationFilter, PatAuthenticationFilter, UserDetails, UserDetailsService

### Community 44 - "Amount Input Component"
Cohesion: 0.33
Nodes (6): AmountInput(), AmountInputProps, formatAmountString(), hasOperators(), useMobileMath(), evaluateMathExpression()

### Community 45 - "Admin User Invites"
Cohesion: 0.11
Nodes (10): AdminUserController, AdminInviteRequest, AdminInviteResponse, RegisterInviteResponse, LocalDateTime, AdminInviteMapper, Registrations, Modifying (+2 more)

### Community 46 - "Frontend Package Config"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, preview, version

### Community 47 - "Backup Shell Scripts"
Cohesion: 0.71
Nodes (6): backup_sh.sh script, do_backup(), do_download(), do_restore(), get_latest_backup_name(), interactive_menu()

### Community 48 - "Root Package DnD Kit"
Cohesion: 0.40
Nodes (4): dependencies, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities

### Community 58 - "Community 58"
Cohesion: 0.12
Nodes (15): CellType, formatAmount(), OverviewCell(), OverviewCellProps, DataItem, OverviewRow(), OverviewRowProps, MonthlyOverviewProps (+7 more)

### Community 59 - "Community 59"
Cohesion: 0.21
Nodes (5): DemoController, OAuthAuthorizeRequest, AuthResponse, Map, Object

### Community 60 - "Community 60"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + TypeScript + Vite

### Community 61 - "Community 61"
Cohesion: 0.25
Nodes (9): LoginBackground(), ResetInviteResponse, ResetPassword(), getPasswordRequirements(), isPasswordValid(), PasswordRequirements(), PasswordRequirementsProps, Register() (+1 more)

### Community 64 - "Community 64"
Cohesion: 0.19
Nodes (10): AdminDashboard(), UserDashboard(), CreateWalletModal, CreateWalletModalHandle, Props, useDeleteModal(), WalletCardUI, WalletDashboard() (+2 more)

### Community 65 - "Community 65"
Cohesion: 0.23
Nodes (5): PatWalletPermission, WalletMapper, Optional, WalletRepository, WalletRole

### Community 66 - "Community 66"
Cohesion: 0.24
Nodes (5): rawToDoData, todoData, ToDoItem, ToDoItemInput, ToDoStatus

### Community 67 - "Community 67"
Cohesion: 0.36
Nodes (5): Status, BackendApplicationTests, AdminUserIntegrationTest, Test, WithMockUser

### Community 68 - "Community 68"
Cohesion: 0.32
Nodes (3): Sphere(), SphereProps, RegisterInviteResponse

## Knowledge Gaps
- **210 isolated node(s):** `UserRequest`, `PatWalletPermission`, `ManageUserRepository`, `WalletRepository`, `PatWalletPermission` (+205 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Status` connect `Community 67` to `Admin Backups UI`, `Frontend Vite Config`?**
  _High betweenness centrality (0.364) - this node is a cross-community bridge._
- **Why does `triggerToast()` connect `Login & Demo Controller` to `Community 64`, `Community 68`, `Statistics Charts`, `Subscription UI`, `User Service Layer`, `Date Picker Component`, `Admin Backups UI`, `Tag Service Layer`, `Wallet Security`, `User Model & Repository`, `Axios & Shared Modals`, `Community 61`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `api` connect `User Model & Repository` to `Community 64`, `Login & Demo Controller`, `Community 68`, `Statistics Charts`, `Subscription UI`, `User Service Layer`, `Date Picker Component`, `Admin Backups UI`, `Tag Service Layer`, `Wallet Security`, `Axios & Shared Modals`, `Community 61`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **What connects `UserRequest`, `PatWalletPermission`, `ManageUserRepository` to the rest of the system?**
  _240 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `MCP Server Tools` be split into smaller, more focused modules?**
  _Cohesion score 0.07804878048780488 - nodes in this community are weakly interconnected._
- **Should `Frontend Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `Transaction Modal UI` be split into smaller, more focused modules?**
  _Cohesion score 0.09696969696969697 - nodes in this community are weakly interconnected._