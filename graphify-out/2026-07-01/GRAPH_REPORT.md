# Graph Report - .  (2026-07-01)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1777 nodes · 5511 edges · 70 communities (59 shown, 11 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 668 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `290ba181`
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
- [[_COMMUNITY_Subscription Controller|Subscription Controller]]
- [[_COMMUNITY_Password Reset UI|Password Reset UI]]
- [[_COMMUNITY_ToDo Feature|ToDo Feature]]
- [[_COMMUNITY_Admin Backups UI|Admin Backups UI]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Amount Input Component|Amount Input Component]]
- [[_COMMUNITY_Admin User Invites|Admin User Invites]]
- [[_COMMUNITY_Frontend Package Config|Frontend Package Config]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Root Package DnD Kit|Root Package DnD Kit]]
- [[_COMMUNITY_Frontend TSConfig|Frontend TSConfig]]
- [[_COMMUNITY_Recurring Payment Toggle|Recurring Payment Toggle]]
- [[_COMMUNITY_User Request DTO|User Request DTO]]
- [[_COMMUNITY_MCP Requirements|MCP Requirements]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 81|Community 81]]

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

### Community 0 - "MCP Server Tools"
Cohesion: 0.04
Nodes (61): ADMIN_TABS, AdminDashboard(), UsersPageProps, AdminStats(), AdminStatsProps, ActionCardProps, BackupEntry, BackupSelectorProps (+53 more)

### Community 1 - "Frontend Dependencies"
Cohesion: 0.19
Nodes (9): AfterEach, FilterChain, HttpServletResponse, OncePerRequestFilter, CustomUserDetailsService, JwtAuthenticationFilter, PatAuthenticationFilter, UserDetails (+1 more)

### Community 2 - "Transaction Modal UI"
Cohesion: 0.12
Nodes (5): PermissionDeniedException, PersonalAccessToken, PatWalletPermission, WalletSecurity, WalletSecurityTest

### Community 3 - "Wallet Dashboard"
Cohesion: 0.12
Nodes (4): MemberRequest, WalletAccessRepository, WalletAccessRepositoryTest, MemberServiceTest

### Community 4 - "Tag Management UI"
Cohesion: 0.08
Nodes (72): BaseHTTPMiddleware, Context, description, FastMCP, Field, ge, gt, JSONResponse (+64 more)

### Community 5 - "Statistics Charts"
Cohesion: 0.08
Nodes (40): CustomDatePicker(), CustomDatePickerProps, DatePickerValue, DateRangeValue, ThemeSelector(), DataTab(), InviteSection(), InviteSectionProps (+32 more)

### Community 6 - "Subscription UI"
Cohesion: 0.09
Nodes (38): CurrencySelector(), CurrencySelectorProps, Props, SubscriptionDetailsModal, SubscriptionDetailsModalHandle, Props, SubscriptionModal, SubscriptionModalHandle (+30 more)

### Community 8 - "User Service Layer"
Cohesion: 0.11
Nodes (23): AboutAppModal, AboutAppModalHandle, ChangePasswordModal, ChangePasswordModalHandle, LogoutModal, LogoutModalHandle, ProfileModal, ProfileModalHandle (+15 more)

### Community 9 - "Date Picker Component"
Cohesion: 0.19
Nodes (4): Collection, GrantedAuthority, Override, CustomUserDetailsServiceTest

### Community 10 - "Wallet Service Layer"
Cohesion: 0.09
Nodes (10): TagRequest, TagResponse, TagHasChildrenException, TagInUseException, TagMapper, TagMapperTest, Tag, TagRepository (+2 more)

### Community 11 - "Icon Selector Component"
Cohesion: 0.05
Nodes (34): AdminDatabaseController, AdminUserController, AuthController, DemoController, GlobalExceptionHandler, GlobalExceptionHandlerTest, MembersController, OAuthAuthorizeRequest (+26 more)

### Community 12 - "Theme & PWA Context"
Cohesion: 0.18
Nodes (3): EmailService, UserRepository, String

### Community 13 - "Subscription Service"
Cohesion: 0.17
Nodes (18): CalendarDayDetailPanel, CalendarDayDetailPanelProps, DayDetailModalHandle, SubscriptionCalendar(), SubscriptionCalendarProps, formatCompactFrequency(), getDaysLeft(), getDaysLeftColor() (+10 more)

### Community 14 - "Tag Service Layer"
Cohesion: 0.07
Nodes (25): CTASectionProps, DemoSectionProps, Features(), Footer(), HeroProps, LandingPage(), NavbarProps, ToDoSection() (+17 more)

### Community 15 - "Transaction Service"
Cohesion: 0.09
Nodes (29): Spring Boot Backend Service, Database Backup Configuration, Docker Compose Dev Environment, Vite + React Frontend Service, JWT Authentication Configuration, SMTP Mail Configuration, MCP Server Service (AI Bridge), PostgreSQL 16 Database Service (+21 more)

### Community 16 - "Wallet Security"
Cohesion: 0.16
Nodes (14): Icon(), WalletIconProps, TagCardProps, TagChildRowProps, TagFilter(), TagFilterProps, TagFilterRow(), TagFilterRowProps (+6 more)

### Community 17 - "User Registration"
Cohesion: 0.15
Nodes (7): BadCredentialsException, Cacheable, CacheEvict, AuthControllerTest, ChangePasswordRequest, UserService, UserServiceTest

### Community 18 - "PAT Token Management"
Cohesion: 0.07
Nodes (16): BackupCronJob, BackupCronJobTest, SubscriptionCronJob, fileMoves, project, Key, Path, PostConstruct (+8 more)

### Community 19 - "Member Management"
Cohesion: 0.08
Nodes (25): dependencies, axios, date-fns, dexie, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, @emotion/react (+17 more)

### Community 20 - "User Model & Repository"
Cohesion: 0.06
Nodes (13): Async, PatCreateRequest, PatCreateResponse, PatResponse, PatUpdateRequest, WalletPermission, InvalidTokenException, LocalDateTime (+5 more)

### Community 21 - "Docker Infrastructure"
Cohesion: 0.09
Nodes (27): ColorSelectorPropsProps, IconColorSelector(), IconPickerButton(), IconPickerButtonProps, IconSelector(), IconSelectorProps, ColorSelector(), ColorSelectorProps (+19 more)

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
Cohesion: 0.29
Nodes (3): UserResponse, UserMapper, UserMapperTest

### Community 26 - "Frontend Vite Config"
Cohesion: 0.11
Nodes (7): SubscriptionRequest, SubscriptionResponse, LocalDate, SubscriptionMapper, SubscriptionRepository, SubscriptionService, Subscription

### Community 27 - "Frontend Dev Dependencies"
Cohesion: 0.09
Nodes (23): devDependencies, autoprefixer, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh (+15 more)

### Community 28 - "Axios & Shared Modals"
Cohesion: 0.12
Nodes (25): ConsentView, PatFormView(), PatFormViewProps, PatListView(), PatListViewProps, PatModal, PatModalHandle, PatShowTokenView() (+17 more)

### Community 29 - "Admin & Wallet Modals"
Cohesion: 0.20
Nodes (10): AuthenticationConfiguration, AuthenticationManager, AuthenticationProvider, Bean, Clock, ApplicationConfig, SecurityConfig, CorsConfigurationSource (+2 more)

### Community 31 - "Wallet Controller"
Cohesion: 0.36
Nodes (4): CacheManager, CacheConfig, RegisterInviteResponse, PasswordEncoder

### Community 33 - "Auth Registration Flow"
Cohesion: 0.17
Nodes (5): RegisterInviteRequest, ResetPasswordRequest, RegisterInviteResponse, RegisterService, RegisterServiceTest

### Community 34 - "Demo Service & Tags"
Cohesion: 0.23
Nodes (6): Frequency, type, DemoService, DemoServiceTest, Tag, Wallet

### Community 35 - "Login & Demo Controller"
Cohesion: 0.38
Nodes (3): PatWalletPermission, WalletMapper, WalletRole

### Community 36 - "Cron Jobs & Scheduling"
Cohesion: 0.21
Nodes (4): TransactionResponse, TransactionMapper, TransactionRepository, Transaction

### Community 37 - "JWT Token Service"
Cohesion: 0.29
Nodes (4): Claims, Date, Function, JwtService

### Community 39 - "Subscription Controller"
Cohesion: 0.11
Nodes (14): MemberResponse, WalletInviteResponse, TagNotFoundException, UnauthorizedAccessException, UserNotFoundException, WalletNotFoundException, IllegalArgumentException, PreAuthorize (+6 more)

### Community 40 - "Password Reset UI"
Cohesion: 0.18
Nodes (3): LoginRequest, MemberMapper, Role

### Community 41 - "ToDo Feature"
Cohesion: 0.15
Nodes (12): 🏗️ Architecture Overview, 🚀 Automated Deployment, 🧩 Core Stack, ⚡ Demo & Onboarding Mode, ⚙️ Development Setup, Enabling Demo Features, 🚀 Engineering Highlights, 🛠️ Infrastructure & CI/CD (+4 more)

### Community 42 - "Admin Backups UI"
Cohesion: 0.04
Nodes (11): BackendApplicationTests, BackupEntry, MembersControllerTest, WalletControllerTest, TransactionMapperTest, WalletMapperTest, Transaction, BackupServiceTest (+3 more)

### Community 43 - "Community 43"
Cohesion: 0.15
Nodes (6): InvitationStatus, Registrations, Modifying, Query, RegistrationsRepository, RegistrationsRepositoryTest

### Community 44 - "Amount Input Component"
Cohesion: 0.36
Nodes (5): useMobileMath(), AmountInputProps, formatAmountString(), hasOperators(), evaluateMathExpression()

### Community 45 - "Admin User Invites"
Cohesion: 0.08
Nodes (9): ManageUserServiceTest, AdminInviteRequest, AdminInviteResponse, AdminInviteMapper, AdminInviteMapperTest, AdminUserInviteServiceTest, SendEmailService, SendEmailServiceTest (+1 more)

### Community 46 - "Frontend Package Config"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, preview, version

### Community 47 - "Community 47"
Cohesion: 0.06
Nodes (35): darkMuiTheme, DEMO_TRANSACTIONS, CashFlowSankey(), CashFlowSankeyProps, LinkDef, NodeDef, buildMonthlyBuckets(), MonthlyBucket (+27 more)

### Community 48 - "Root Package DnD Kit"
Cohesion: 0.40
Nodes (4): dependencies, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities

### Community 58 - "Community 58"
Cohesion: 0.23
Nodes (3): SubscriptionCronJobTest, SubscriptionMapperTest, Subscription

### Community 59 - "Community 59"
Cohesion: 0.14
Nodes (6): TestWebMvcConfig, EntityGraph, HandlerMethodArgumentResolver, List, PersonalAccessTokenRepository, WebMvcConfigurer

### Community 60 - "Community 60"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + TypeScript + Vite

### Community 64 - "Community 64"
Cohesion: 0.11
Nodes (7): BeforeEach, TransactionRequest, User, Wallet, Optional, ManageUserRepository, WalletRepository

### Community 69 - "Community 69"
Cohesion: 0.12
Nodes (9): Status, BaseIntegrationTest, IdorIntegrationTest, PatIntegrationTest, MemberMapperTest, WalletAccess, WalletAccessId, PrePersist (+1 more)

### Community 72 - "Community 72"
Cohesion: 0.10
Nodes (6): BaseWebMvcTest, SubscriptionControllerTest, TagControllerTest, TransactionControllerTest, DemoCleanupCronJob, DemoCleanupCronJobTest

### Community 73 - "Community 73"
Cohesion: 0.28
Nodes (7): CellType, formatAmount(), OverviewCell(), OverviewCellProps, DataItem, OverviewRow(), OverviewRowProps

### Community 78 - "Community 78"
Cohesion: 0.33
Nodes (3): BackendApplication, CommandLineRunner, DataInitializer

## Knowledge Gaps
- **220 isolated node(s):** `recordToolUse.sh script`, `UserRequest`, `PatWalletPermission`, `ManageUserRepository`, `WalletRepository` (+215 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Status` connect `Community 69` to `MCP Server Tools`, `Community 64`, `Community 58`, `Admin User Invites`, `Frontend Vite Config`?**
  _High betweenness centrality (0.364) - this node is a cross-community bridge._
- **Why does `api` connect `MCP Server Tools` to `Statistics Charts`, `Subscription UI`, `User Service Layer`, `Tag Service Layer`, `Docker Infrastructure`, `Axios & Shared Modals`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `triggerToast()` connect `MCP Server Tools` to `Statistics Charts`, `Subscription UI`, `User Service Layer`, `Tag Service Layer`, `Docker Infrastructure`, `Axios & Shared Modals`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **What connects `recordToolUse.sh script`, `UserRequest`, `PatWalletPermission` to the rest of the system?**
  _250 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `MCP Server Tools` be split into smaller, more focused modules?**
  _Cohesion score 0.03974358974358974 - nodes in this community are weakly interconnected._
- **Should `Transaction Modal UI` be split into smaller, more focused modules?**
  _Cohesion score 0.12025901942645699 - nodes in this community are weakly interconnected._
- **Should `Wallet Dashboard` be split into smaller, more focused modules?**
  _Cohesion score 0.12298387096774194 - nodes in this community are weakly interconnected._