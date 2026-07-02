# Graph Report - .  (2026-07-01)

## Corpus Check
- 0 files · ~0 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1777 nodes · 5511 edges · 70 communities (59 shown, 11 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 668 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Admin, Auth & Shared UI Pages|Admin, Auth & Shared UI Pages]]
- [[_COMMUNITY_JWTPAT Auth Filters|JWT/PAT Auth Filters]]
- [[_COMMUNITY_Wallet Security & Access Checks|Wallet Security & Access Checks]]
- [[_COMMUNITY_Wallet Member Repository & Service|Wallet Member Repository & Service]]
- [[_COMMUNITY_MCP Server Tools|MCP Server Tools]]
- [[_COMMUNITY_Wallet Dashboard & Theme Context|Wallet Dashboard & Theme Context]]
- [[_COMMUNITY_Transaction & Subscription Modals|Transaction & Subscription Modals]]
- [[_COMMUNITY_JWT Filter Tests|JWT Filter Tests]]
- [[_COMMUNITY_App Header & Profile Modals|App Header & Profile Modals]]
- [[_COMMUNITY_Custom User Details Service|Custom User Details Service]]
- [[_COMMUNITY_Tag Backend (ControllerServiceRepo)|Tag Backend (Controller/Service/Repo)]]
- [[_COMMUNITY_Admin, Auth & OAuth Controllers|Admin, Auth & OAuth Controllers]]
- [[_COMMUNITY_Email Service & User Repository|Email Service & User Repository]]
- [[_COMMUNITY_Subscription Calendar UI|Subscription Calendar UI]]
- [[_COMMUNITY_Landing Page & ToDo Feature|Landing Page & ToDo Feature]]
- [[_COMMUNITY_README Architecture Overview|README Architecture Overview]]
- [[_COMMUNITY_Tag Filter & Picker UI|Tag Filter & Picker UI]]
- [[_COMMUNITY_User Password Change Service|User Password Change Service]]
- [[_COMMUNITY_Backup Cron & R2 Storage|Backup Cron & R2 Storage]]
- [[_COMMUNITY_Frontend Runtime Dependencies|Frontend Runtime Dependencies]]
- [[_COMMUNITY_Personal Access Token (PAT) Backend|Personal Access Token (PAT) Backend]]
- [[_COMMUNITY_IconColor Selector & Wallet Cards|Icon/Color Selector & Wallet Cards]]
- [[_COMMUNITY_TS App Config|TS App Config]]
- [[_COMMUNITY_Subscription Calendar Grid UI|Subscription Calendar Grid UI]]
- [[_COMMUNITY_TS Node Config|TS Node Config]]
- [[_COMMUNITY_User Response Mapper|User Response Mapper]]
- [[_COMMUNITY_Subscription Backend Service|Subscription Backend Service]]
- [[_COMMUNITY_Frontend Dev Dependencies|Frontend Dev Dependencies]]
- [[_COMMUNITY_PAT Token Management UI|PAT Token Management UI]]
- [[_COMMUNITY_Spring Security Config|Spring Security Config]]
- [[_COMMUNITY_JWT Service Tests|JWT Service Tests]]
- [[_COMMUNITY_Cache Config & Password Encoder|Cache Config & Password Encoder]]
- [[_COMMUNITY_Wallet Controller & Service|Wallet Controller & Service]]
- [[_COMMUNITY_Registration & Password Reset Service|Registration & Password Reset Service]]
- [[_COMMUNITY_Demo Wallet Generation Service|Demo Wallet Generation Service]]
- [[_COMMUNITY_Wallet Mapper & Role|Wallet Mapper & Role]]
- [[_COMMUNITY_Transaction Backend (ControllerRepo)|Transaction Backend (Controller/Repo)]]
- [[_COMMUNITY_JWT Token Service|JWT Token Service]]
- [[_COMMUNITY_Test Generator Script|Test Generator Script]]
- [[_COMMUNITY_WalletTagSubscription Service Exceptions|Wallet/Tag/Subscription Service Exceptions]]
- [[_COMMUNITY_Login & Refresh Token Flow|Login & Refresh Token Flow]]
- [[_COMMUNITY_README Deployment & Demo|README Deployment & Demo]]
- [[_COMMUNITY_Backend Integration & Backup Tests|Backend Integration & Backup Tests]]
- [[_COMMUNITY_Registration Invite Repository|Registration Invite Repository]]
- [[_COMMUNITY_Amount Input Math Parser|Amount Input Math Parser]]
- [[_COMMUNITY_Admin Invite & Email Notification|Admin Invite & Email Notification]]
- [[_COMMUNITY_Frontend Package Metadata|Frontend Package Metadata]]
- [[_COMMUNITY_Statistics Charts & Overview UI|Statistics Charts & Overview UI]]
- [[_COMMUNITY_Root Package DnD Kit|Root Package DnD Kit]]
- [[_COMMUNITY_TS Project References|TS Project References]]
- [[_COMMUNITY_Recurring Payment Toggle|Recurring Payment Toggle]]
- [[_COMMUNITY_Admin Header|Admin Header]]
- [[_COMMUNITY_User Request DTO|User Request DTO]]
- [[_COMMUNITY_Gradle Build Config|Gradle Build Config]]
- [[_COMMUNITY_Gradle Settings|Gradle Settings]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_MCP Server Python Dependencies|MCP Server Python Dependencies]]
- [[_COMMUNITY_Subscription Cron Job Tests|Subscription Cron Job Tests]]
- [[_COMMUNITY_Frontend README (Vite Template)|Frontend README (Vite Template)]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Graphify Skill Doc|Graphify Skill Doc]]
- [[_COMMUNITY_Graphify Workflow Doc|Graphify Workflow Doc]]
- [[_COMMUNITY_IDORPAT Integration Tests|IDOR/PAT Integration Tests]]

## God Nodes (most connected - your core abstractions)
1. `User` - 89 edges
2. `WalletAccess` - 66 edges
3. `PersonalAccessToken` - 42 edges
4. `useWalletContext()` - 42 edges
5. `Wallet` - 40 edges
6. `Wallet` - 40 edges
7. `WalletSecurityTest` - 32 edges
8. `api` - 31 edges
9. `Status` - 30 edges
10. `triggerToast()` - 30 edges

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

## Communities (70 total, 11 thin omitted)

### Community 0 - "Admin, Auth & Shared UI Pages"
Cohesion: 0.05
Nodes (34): AdminDatabaseController, AdminUserController, AuthController, DemoController, GlobalExceptionHandler, GlobalExceptionHandlerTest, MembersController, OAuthAuthorizeRequest (+26 more)

### Community 1 - "JWT/PAT Auth Filters"
Cohesion: 0.04
Nodes (11): BackendApplicationTests, BackupEntry, MembersControllerTest, WalletControllerTest, TransactionMapperTest, WalletMapperTest, Transaction, BackupServiceTest (+3 more)

### Community 2 - "Wallet Security & Access Checks"
Cohesion: 0.08
Nodes (72): BaseHTTPMiddleware, Context, description, FastMCP, Field, ge, gt, JSONResponse (+64 more)

### Community 3 - "Wallet Member Repository & Service"
Cohesion: 0.06
Nodes (13): Async, PatCreateRequest, PatCreateResponse, PatResponse, PatUpdateRequest, WalletPermission, InvalidTokenException, LocalDateTime (+5 more)

### Community 4 - "MCP Server Tools"
Cohesion: 0.06
Nodes (41): Icon(), WalletIconProps, ColorSelectorPropsProps, IconColorSelector(), IconPickerButton(), IconPickerButtonProps, IconSelector(), IconSelectorProps (+33 more)

### Community 5 - "Wallet Dashboard & Theme Context"
Cohesion: 0.05
Nodes (47): darkMuiTheme, DEMO_TRANSACTIONS, ThemeSelector(), InviteSection(), InviteSectionProps, CashFlowSankey(), CashFlowSankeyProps, LinkDef (+39 more)

### Community 6 - "Transaction & Subscription Modals"
Cohesion: 0.06
Nodes (32): ActionCardProps, BackupEntry, BackupSelectorProps, CreateInviteFormProps, api, failedQueue, Sphere(), SphereProps (+24 more)

### Community 7 - "JWT Filter Tests"
Cohesion: 0.09
Nodes (38): CurrencySelector(), CurrencySelectorProps, Props, SubscriptionDetailsModal, SubscriptionDetailsModalHandle, Props, SubscriptionModal, SubscriptionModalHandle (+30 more)

### Community 8 - "App Header & Profile Modals"
Cohesion: 0.07
Nodes (16): BackupCronJob, BackupCronJobTest, SubscriptionCronJob, fileMoves, project, Key, Path, PostConstruct (+8 more)

### Community 9 - "Custom User Details Service"
Cohesion: 0.11
Nodes (14): MemberResponse, WalletInviteResponse, TagNotFoundException, UnauthorizedAccessException, UserNotFoundException, WalletNotFoundException, IllegalArgumentException, PreAuthorize (+6 more)

### Community 10 - "Tag Backend (Controller/Service/Repo)"
Cohesion: 0.09
Nodes (10): TagRequest, TagResponse, TagHasChildrenException, TagInUseException, TagMapper, TagMapperTest, Tag, TagRepository (+2 more)

### Community 11 - "Admin, Auth & OAuth Controllers"
Cohesion: 0.12
Nodes (5): PermissionDeniedException, PersonalAccessToken, PatWalletPermission, WalletSecurity, WalletSecurityTest

### Community 12 - "Email Service & User Repository"
Cohesion: 0.07
Nodes (25): CTASectionProps, DemoSectionProps, Features(), Footer(), HeroProps, LandingPage(), NavbarProps, ToDoSection() (+17 more)

### Community 13 - "Subscription Calendar UI"
Cohesion: 0.07
Nodes (32): ADMIN_TABS, AdminDashboard(), UsersPageProps, AdminStats(), AdminStatsProps, CreateInviteForm(), AdminInvite, InvitesTable() (+24 more)

### Community 14 - "Landing Page & ToDo Feature"
Cohesion: 0.08
Nodes (9): ManageUserServiceTest, AdminInviteRequest, AdminInviteResponse, AdminInviteMapper, AdminInviteMapperTest, AdminUserInviteServiceTest, SendEmailService, SendEmailServiceTest (+1 more)

### Community 15 - "README Architecture Overview"
Cohesion: 0.12
Nodes (9): Status, BaseIntegrationTest, IdorIntegrationTest, PatIntegrationTest, MemberMapperTest, WalletAccess, WalletAccessId, PrePersist (+1 more)

### Community 16 - "Tag Filter & Picker UI"
Cohesion: 0.11
Nodes (7): BeforeEach, TransactionRequest, User, Wallet, Optional, ManageUserRepository, WalletRepository

### Community 17 - "User Password Change Service"
Cohesion: 0.12
Nodes (28): CustomDatePicker(), CustomDatePickerProps, DatePickerValue, DateRangeValue, DataTab(), SettingsCard(), SettingsCardProps, SettingsTab() (+20 more)

### Community 18 - "Backup Cron & R2 Storage"
Cohesion: 0.12
Nodes (25): ConsentView, PatFormView(), PatFormViewProps, PatListView(), PatListViewProps, PatModal, PatModalHandle, PatShowTokenView() (+17 more)

### Community 19 - "Frontend Runtime Dependencies"
Cohesion: 0.11
Nodes (7): SubscriptionRequest, SubscriptionResponse, LocalDate, SubscriptionMapper, SubscriptionRepository, SubscriptionService, Subscription

### Community 20 - "Personal Access Token (PAT) Backend"
Cohesion: 0.12
Nodes (4): MemberRequest, WalletAccessRepository, WalletAccessRepositoryTest, MemberServiceTest

### Community 21 - "Icon/Color Selector & Wallet Cards"
Cohesion: 0.17
Nodes (5): RegisterInviteRequest, ResetPasswordRequest, RegisterInviteResponse, RegisterService, RegisterServiceTest

### Community 22 - "TS App Config"
Cohesion: 0.09
Nodes (29): Spring Boot Backend Service, Database Backup Configuration, Docker Compose Dev Environment, Vite + React Frontend Service, JWT Authentication Configuration, SMTP Mail Configuration, MCP Server Service (AI Bridge), PostgreSQL 16 Database Service (+21 more)

### Community 23 - "Subscription Calendar Grid UI"
Cohesion: 0.10
Nodes (6): BaseWebMvcTest, SubscriptionControllerTest, TagControllerTest, TransactionControllerTest, DemoCleanupCronJob, DemoCleanupCronJobTest

### Community 24 - "TS Node Config"
Cohesion: 0.13
Nodes (20): AboutAppModal, AboutAppModalHandle, ChangePasswordModal, ChangePasswordModalHandle, LogoutModal, LogoutModalHandle, ProfileModal, ProfileModalHandle (+12 more)

### Community 25 - "User Response Mapper"
Cohesion: 0.08
Nodes (25): dependencies, axios, date-fns, dexie, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, @emotion/react (+17 more)

### Community 27 - "Frontend Dev Dependencies"
Cohesion: 0.17
Nodes (18): CalendarDayDetailPanel, CalendarDayDetailPanelProps, DayDetailModalHandle, SubscriptionCalendar(), SubscriptionCalendarProps, formatCompactFrequency(), getDaysLeft(), getDaysLeftColor() (+10 more)

### Community 28 - "PAT Token Management UI"
Cohesion: 0.09
Nodes (23): devDependencies, autoprefixer, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh (+15 more)

### Community 29 - "Spring Security Config"
Cohesion: 0.15
Nodes (6): InvitationStatus, Registrations, Modifying, Query, RegistrationsRepository, RegistrationsRepositoryTest

### Community 30 - "JWT Service Tests"
Cohesion: 0.15
Nodes (7): BadCredentialsException, Cacheable, CacheEvict, AuthControllerTest, ChangePasswordRequest, UserService, UserServiceTest

### Community 31 - "Cache Config & Password Encoder"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+13 more)

### Community 32 - "Wallet Controller & Service"
Cohesion: 0.19
Nodes (9): AfterEach, FilterChain, HttpServletResponse, OncePerRequestFilter, CustomUserDetailsService, JwtAuthenticationFilter, PatAuthenticationFilter, UserDetails (+1 more)

### Community 33 - "Registration & Password Reset Service"
Cohesion: 0.14
Nodes (6): TestWebMvcConfig, EntityGraph, HandlerMethodArgumentResolver, List, PersonalAccessTokenRepository, WebMvcConfigurer

### Community 34 - "Demo Wallet Generation Service"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+11 more)

### Community 35 - "Wallet Mapper & Role"
Cohesion: 0.20
Nodes (10): AuthenticationConfiguration, AuthenticationManager, AuthenticationProvider, Bean, Clock, ApplicationConfig, SecurityConfig, CorsConfigurationSource (+2 more)

### Community 36 - "Transaction Backend (Controller/Repo)"
Cohesion: 0.23
Nodes (6): Frequency, type, DemoService, DemoServiceTest, Tag, Wallet

### Community 37 - "JWT Token Service"
Cohesion: 0.19
Nodes (4): Collection, GrantedAuthority, Override, CustomUserDetailsServiceTest

### Community 38 - "Test Generator Script"
Cohesion: 0.23
Nodes (3): SubscriptionCronJobTest, SubscriptionMapperTest, Subscription

### Community 39 - "Wallet/Tag/Subscription Service Exceptions"
Cohesion: 0.17
Nodes (9): CalendarContainerProps, ViewState, PresetType, DayCellProps, MonthGrid(), MonthGridProps, MonthSelector(), MonthSelectorProps (+1 more)

### Community 41 - "README Deployment & Demo"
Cohesion: 0.18
Nodes (3): LoginRequest, MemberMapper, Role

### Community 43 - "Registration Invite Repository"
Cohesion: 0.18
Nodes (3): EmailService, UserRepository, String

### Community 44 - "Amount Input Math Parser"
Cohesion: 0.21
Nodes (4): TransactionResponse, TransactionMapper, TransactionRepository, Transaction

### Community 45 - "Admin Invite & Email Notification"
Cohesion: 0.15
Nodes (12): 🏗️ Architecture Overview, 🚀 Automated Deployment, 🧩 Core Stack, ⚡ Demo & Onboarding Mode, ⚙️ Development Setup, Enabling Demo Features, 🚀 Engineering Highlights, 🛠️ Infrastructure & CI/CD (+4 more)

### Community 46 - "Frontend Package Metadata"
Cohesion: 0.29
Nodes (4): Claims, Date, Function, JwtService

### Community 47 - "Statistics Charts & Overview UI"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, preview, version

### Community 49 - "TS Project References"
Cohesion: 0.28
Nodes (7): CellType, formatAmount(), OverviewCell(), OverviewCellProps, DataItem, OverviewRow(), OverviewRowProps

### Community 50 - "Recurring Payment Toggle"
Cohesion: 0.36
Nodes (4): CacheManager, CacheConfig, RegisterInviteResponse, PasswordEncoder

### Community 51 - "Admin Header"
Cohesion: 0.29
Nodes (3): UserResponse, UserMapper, UserMapperTest

### Community 52 - "User Request DTO"
Cohesion: 0.36
Nodes (5): useMobileMath(), AmountInputProps, formatAmountString(), hasOperators(), evaluateMathExpression()

### Community 53 - "Gradle Build Config"
Cohesion: 0.33
Nodes (3): BackendApplication, CommandLineRunner, DataInitializer

### Community 54 - "Gradle Settings"
Cohesion: 0.38
Nodes (3): PatWalletPermission, WalletMapper, WalletRole

### Community 55 - "ESLint Config"
Cohesion: 0.40
Nodes (4): dependencies, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities

### Community 56 - "Community 56"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **220 isolated node(s):** `recordToolUse.sh script`, `UserRequest`, `PatWalletPermission`, `ManageUserRepository`, `WalletRepository` (+215 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Status` connect `README Architecture Overview` to `Test Generator Script`, `Transaction & Subscription Modals`, `Landing Page & ToDo Feature`, `Tag Filter & Picker UI`, `Frontend Runtime Dependencies`?**
  _High betweenness centrality (0.364) - this node is a cross-community bridge._
- **Why does `api` connect `Transaction & Subscription Modals` to `MCP Server Tools`, `JWT Filter Tests`, `Email Service & User Repository`, `Subscription Calendar UI`, `User Password Change Service`, `Backup Cron & R2 Storage`, `TS Node Config`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `triggerToast()` connect `Transaction & Subscription Modals` to `MCP Server Tools`, `JWT Filter Tests`, `Email Service & User Repository`, `Subscription Calendar UI`, `User Password Change Service`, `Backup Cron & R2 Storage`, `TS Node Config`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **What connects `recordToolUse.sh script`, `UserRequest`, `PatWalletPermission` to the rest of the system?**
  _250 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin, Auth & Shared UI Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.05064836003051106 - nodes in this community are weakly interconnected._
- **Should `JWT/PAT Auth Filters` be split into smaller, more focused modules?**
  _Cohesion score 0.043029259896729774 - nodes in this community are weakly interconnected._
- **Should `Wallet Security & Access Checks` be split into smaller, more focused modules?**
  _Cohesion score 0.08144144144144144 - nodes in this community are weakly interconnected._