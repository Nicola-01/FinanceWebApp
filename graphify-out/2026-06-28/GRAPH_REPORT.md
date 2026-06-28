# Graph Report - FinanceWebApp  (2026-06-28)

## Corpus Check
- 250 files · ~121,745 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1234 nodes · 3322 edges · 64 communities (53 shown, 11 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 182 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a40e19dd`
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

## God Nodes (most connected - your core abstractions)
1. `useWalletContext()` - 38 edges
2. `Wallet` - 34 edges
3. `User` - 30 edges
4. `triggerToast()` - 30 edges
5. `api` - 29 edges
6. `Transaction` - 29 edges
7. `Tag` - 26 edges
8. `WalletAccess` - 24 edges
9. `Subscription` - 22 edges
10. `IconKey` - 21 edges

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

## Communities (64 total, 11 thin omitted)

### Community 0 - "MCP Server Tools"
Cohesion: 0.13
Nodes (16): ThemeSelector(), darkMuiTheme, DEMO_TRANSACTIONS, Features(), CashFlowSankey(), CashFlowSankeyProps, LinkDef, NodeDef (+8 more)

### Community 1 - "Frontend Dependencies"
Cohesion: 0.13
Nodes (7): BackendApplication, GrantedAuthority, UserMapper, User, Override, PrePersist, ManageUserRepository

### Community 2 - "Transaction Modal UI"
Cohesion: 0.14
Nodes (9): Async, Cacheable, CacheEvict, EntityGraph, InvalidTokenException, PatMapper, PersonalAccessToken, PersonalAccessTokenRepository (+1 more)

### Community 3 - "Wallet Dashboard"
Cohesion: 0.09
Nodes (12): Collection, WalletRequest, WalletResponse, UnauthorizedAccessException, MemberMapper, WalletMapper, WalletAccess, WalletAccessId (+4 more)

### Community 4 - "Tag Management UI"
Cohesion: 0.11
Nodes (46): BaseHTTPMiddleware, Context, description, FastMCP, Field, ge, gt, JSONResponse (+38 more)

### Community 5 - "Statistics Charts"
Cohesion: 0.10
Nodes (29): Collapse(), CollapseProps, IconPickerButton(), SettingsCard(), SettingsCardProps, DataTab(), InviteSection(), InviteSectionProps (+21 more)

### Community 6 - "Subscription UI"
Cohesion: 0.11
Nodes (30): CurrencySelector(), CurrencySelectorProps, FloatingActionButton(), FloatingActionButtonProps, TagBadge(), Props, SubscriptionModal, SubscriptionModalHandle (+22 more)

### Community 7 - "Landing Page"
Cohesion: 0.14
Nodes (11): AdminUserController, MembersController, TagController, WalletController, DeleteMapping, MemberRequest, GetMapping, PutMapping (+3 more)

### Community 8 - "User Service Layer"
Cohesion: 0.10
Nodes (24): AppHeader(), AppHeaderProps, AppHeaderTab, AboutAppModal, AboutAppModalHandle, ChangePasswordModal, ChangePasswordModalHandle, InvitationsModal (+16 more)

### Community 9 - "Date Picker Component"
Cohesion: 0.06
Nodes (31): PWAPrompt(), ToastNotification(), CTASectionProps, DemoSectionProps, Footer(), HeroProps, LandingPage(), NavbarProps (+23 more)

### Community 10 - "Wallet Service Layer"
Cohesion: 0.12
Nodes (11): TransactionController, TagRequest, TagResponse, TransactionRequest, TransactionResponse, TagNotFoundException, TagMapper, TransactionMapper (+3 more)

### Community 11 - "Icon Selector Component"
Cohesion: 0.11
Nodes (12): UserResponse, PermissionDeniedException, TagHasChildrenException, UserNotFoundException, WalletNotFoundException, TransactionRepository, WalletRepository, RuntimeException (+4 more)

### Community 12 - "Theme & PWA Context"
Cohesion: 0.16
Nodes (5): InvitationStatus, EmailService, RegistrationsRepository, SendEmailService, String

### Community 13 - "Subscription Service"
Cohesion: 0.13
Nodes (24): DayDetailModalHandle, DayDetailPanel, DayDetailPanelProps, Props, SubscriptionDetailsModal, SubscriptionDetailsModalHandle, SubscriptionView(), SubscriptionViewProps (+16 more)

### Community 14 - "Tag Service Layer"
Cohesion: 0.10
Nodes (21): ColorSelector(), ColorSelectorProps, FLUO_PRESETS, WalletIconProps, ColorSelectorPropsProps, IconColorSelector(), IconPickerButtonProps, IconSelector() (+13 more)

### Community 15 - "Transaction Service"
Cohesion: 0.09
Nodes (29): Spring Boot Backend Service, Database Backup Configuration, Docker Compose Dev Environment, Vite + React Frontend Service, JWT Authentication Configuration, SMTP Mail Configuration, MCP Server Service (AI Bridge), PostgreSQL 16 Database Service (+21 more)

### Community 16 - "Wallet Security"
Cohesion: 0.10
Nodes (24): ADMIN_TABS, AdminDashboard(), UsersPageProps, AdminStats(), AdminStatsProps, AdminInvite, InvitesTable(), InvitesTableProps (+16 more)

### Community 17 - "User Registration"
Cohesion: 0.28
Nodes (8): BadCredentialsException, GlobalExceptionHandler, Exception, ExceptionHandler, UserAlreadyExistsException, HttpServletRequest, HttpStatus, ProblemDetail

### Community 18 - "PAT Token Management"
Cohesion: 0.11
Nodes (11): BackupCronJob, DemoCleanupCronJob, SubscriptionCronJob, Key, Path, PostConstruct, ProcessBuilder, Scheduled (+3 more)

### Community 19 - "Member Management"
Cohesion: 0.08
Nodes (25): dependencies, axios, date-fns, dexie, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, @emotion/react (+17 more)

### Community 20 - "User Model & Repository"
Cohesion: 0.07
Nodes (31): CreateInviteForm(), CreateInviteFormProps, api, failedQueue, Sphere(), SphereProps, LoginBackground(), LoginForm() (+23 more)

### Community 21 - "Docker Infrastructure"
Cohesion: 0.13
Nodes (18): Icon(), InvitationsModalHandle, TagChildRowProps, TagFilter(), TagFilterProps, TagFilterRow(), TagFilterRowProps, HierarchicalTagSelectorProps (+10 more)

### Community 22 - "CI/CD Pipeline"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+13 more)

### Community 23 - "Profile & Settings Modals"
Cohesion: 0.16
Nodes (13): CalendarContainerProps, ViewState, CustomDatePicker(), CustomDatePickerProps, DatePickerValue, DateRangeValue, PresetType, DayCellProps (+5 more)

### Community 24 - "Offline DB & Sync"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+11 more)

### Community 25 - "Subscription Calendar"
Cohesion: 0.11
Nodes (10): BackupEntry, AdminDatabaseController, PatController, PatCreateRequest, PatCreateResponse, PatResponse, WalletPermission, List (+2 more)

### Community 26 - "Frontend Vite Config"
Cohesion: 0.12
Nodes (10): MemberResponse, WalletInviteResponse, LocalDate, Subscription, Tag, Transaction, Wallet, SubscriptionRepository (+2 more)

### Community 27 - "Frontend Dev Dependencies"
Cohesion: 0.11
Nodes (19): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, postcss (+11 more)

### Community 28 - "Axios & Shared Modals"
Cohesion: 0.13
Nodes (17): buildMonthlyBuckets(), MonthlyBucket, CumulativeChart(), CumulativeChartProps, darkTheme, lightTheme, MONTH_LABELS, darkTheme (+9 more)

### Community 29 - "Admin & Wallet Modals"
Cohesion: 0.20
Nodes (10): AuthenticationConfiguration, AuthenticationManager, AuthenticationProvider, Bean, CacheManager, CacheConfig, SecurityConfig, CorsConfigurationSource (+2 more)

### Community 31 - "Wallet Controller"
Cohesion: 0.24
Nodes (5): AuthController, ForgotPasswordRequest, LoginRequest, HttpServletResponse, PostMapping

### Community 32 - "Settings & Overview UI"
Cohesion: 0.28
Nodes (7): CellType, formatAmount(), OverviewCell(), OverviewCellProps, DataItem, OverviewRow(), OverviewRowProps

### Community 33 - "Auth Registration Flow"
Cohesion: 0.36
Nodes (3): RegisterInviteRequest, RegisterInviteResponse, RegisterService

### Community 34 - "Demo Service & Tags"
Cohesion: 0.38
Nodes (5): Frequency, type, DemoService, Tag, Wallet

### Community 35 - "Login & Demo Controller"
Cohesion: 0.18
Nodes (7): CommandLineRunner, DataInitializer, DemoController, AuthResponse, ChangePasswordRequest, PasswordEncoder, UserService

### Community 36 - "Cron Jobs & Scheduling"
Cohesion: 0.19
Nodes (4): Optional, UserRepository, AuthCodeEntry, OAuthAuthCodeStore

### Community 37 - "JWT Token Service"
Cohesion: 0.26
Nodes (5): Claims, Date, Function, JwtService, T

### Community 39 - "Subscription Controller"
Cohesion: 0.27
Nodes (4): SubscriptionController, SubscriptionRequest, SubscriptionResponse, SubscriptionMapper

### Community 40 - "Password Reset UI"
Cohesion: 0.28
Nodes (4): IllegalArgumentException, Role, MemberService, Transactional

### Community 41 - "ToDo Feature"
Cohesion: 0.15
Nodes (12): 🏗️ Architecture Overview, 🚀 Automated Deployment, 🧩 Core Stack, ⚡ Demo & Onboarding Mode, ⚙️ Development Setup, Enabling Demo Features, 🚀 Engineering Highlights, 🛠️ Infrastructure & CI/CD (+4 more)

### Community 42 - "Admin Backups UI"
Cohesion: 0.14
Nodes (8): ActionCardProps, BackupEntry, BackupSelectorProps, Status, BackendApplicationTests, AdminUserIntegrationTest, Test, WithMockUser

### Community 43 - "Backend Tests"
Cohesion: 0.33
Nodes (7): FilterChain, OncePerRequestFilter, CustomUserDetailsService, JwtAuthenticationFilter, PatAuthenticationFilter, UserDetails, UserDetailsService

### Community 44 - "Amount Input Component"
Cohesion: 0.33
Nodes (6): AmountInput(), AmountInputProps, formatAmountString(), hasOperators(), useMobileMath(), evaluateMathExpression()

### Community 45 - "Admin User Invites"
Cohesion: 0.13
Nodes (9): AdminInviteRequest, AdminInviteResponse, RegisterInviteResponse, ResetPasswordRequest, LocalDateTime, AdminInviteMapper, Registrations, Modifying (+1 more)

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
Cohesion: 0.20
Nodes (8): MonthlyOverviewProps, MONTHS, OverviewTable(), TABS, ViewMode, SwitchableCard(), SwitchableCardProps, Tab

### Community 60 - "Community 60"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **212 isolated node(s):** `UserRequest`, `ManageUserRepository`, `WalletRepository`, `name`, `private` (+207 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Status` connect `Admin Backups UI` to `Frontend Vite Config`?**
  _High betweenness centrality (0.370) - this node is a cross-community bridge._
- **Why does `type` connect `Demo Service & Tags` to `Frontend Package Config`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `triggerToast()` connect `User Model & Repository` to `Statistics Charts`, `Subscription UI`, `User Service Layer`, `Date Picker Component`, `Admin Backups UI`, `Subscription Service`, `Tag Service Layer`, `Wallet Security`, `Docker Infrastructure`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **What connects `UserRequest`, `ManageUserRepository`, `WalletRepository` to the rest of the system?**
  _229 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `MCP Server Tools` be split into smaller, more focused modules?**
  _Cohesion score 0.12648221343873517 - nodes in this community are weakly interconnected._
- **Should `Frontend Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.12681159420289856 - nodes in this community are weakly interconnected._
- **Should `Transaction Modal UI` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._