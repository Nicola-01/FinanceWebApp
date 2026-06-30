# Graph Report - FinanceWebApp  (2026-07-01)

## Corpus Check
- 289 files · ~134,398 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1552 nodes · 4659 edges · 83 communities (69 shown, 14 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 441 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2bc16d14`
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
- [[_COMMUNITY_Community 47|Community 47]]
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
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]

## God Nodes (most connected - your core abstractions)
1. `User` - 69 edges
2. `WalletAccess` - 45 edges
3. `useWalletContext()` - 42 edges
4. `Wallet` - 40 edges
5. `api` - 31 edges
6. `triggerToast()` - 30 edges
7. `_backend_request()` - 30 edges
8. `PersonalAccessToken` - 29 edges
9. `Transaction` - 29 edges
10. `AppContext` - 29 edges

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

## Communities (83 total, 14 thin omitted)

### Community 0 - "MCP Server Tools"
Cohesion: 0.06
Nodes (33): ADMIN_TABS, UsersPageProps, ActionCardProps, BackupEntry, BackupSelectorProps, CreateInviteForm(), CreateInviteFormProps, AdminInvite (+25 more)

### Community 1 - "Frontend Dependencies"
Cohesion: 0.14
Nodes (11): FilterChain, GrantedAuthority, User, OncePerRequestFilter, Override, ManageUserRepository, CustomUserDetailsService, JwtAuthenticationFilter (+3 more)

### Community 2 - "Transaction Modal UI"
Cohesion: 0.14
Nodes (4): PermissionDeniedException, PatWalletPermission, WalletSecurity, WalletSecurityTest

### Community 3 - "Wallet Dashboard"
Cohesion: 0.11
Nodes (9): Collection, EntityGraph, PatWalletPermission, WalletMapper, Optional, UserRepository, WalletAccessRepository, WalletRepository (+1 more)

### Community 4 - "Tag Management UI"
Cohesion: 0.08
Nodes (72): BaseHTTPMiddleware, Context, description, FastMCP, Field, ge, gt, JSONResponse (+64 more)

### Community 5 - "Statistics Charts"
Cohesion: 0.12
Nodes (25): DateRangeValue, DataTab(), InviteSection(), InviteSectionProps, SettingsCard(), SettingsCardProps, SettingsTab(), ShareSettingsSection() (+17 more)

### Community 6 - "Subscription UI"
Cohesion: 0.09
Nodes (35): CurrencySelector(), CurrencySelectorProps, Props, SubscriptionModal, SubscriptionModalHandle, ViewMode, TagPicker(), TransactionRowProps (+27 more)

### Community 7 - "Landing Page"
Cohesion: 0.16
Nodes (7): MembersController, DeleteMapping, MemberRequest, MemberResponse, WalletInviteResponse, User, Void

### Community 8 - "User Service Layer"
Cohesion: 0.13
Nodes (20): AboutAppModal, AboutAppModalHandle, ChangePasswordModal, ChangePasswordModalHandle, LogoutModal, LogoutModalHandle, ProfileModal, ProfileModalHandle (+12 more)

### Community 9 - "Date Picker Component"
Cohesion: 0.19
Nodes (10): DeleteModal, DeleteModalProvider(), App(), PWAPrompt(), ToastNotification(), PWAContext, PWAContextType, PWAProvider() (+2 more)

### Community 10 - "Wallet Service Layer"
Cohesion: 0.10
Nodes (12): TagController, TagRequest, TagResponse, TagHasChildrenException, TagInUseException, TagNotFoundException, TagMapper, Tag (+4 more)

### Community 11 - "Icon Selector Component"
Cohesion: 0.18
Nodes (10): GlobalExceptionHandler, GlobalExceptionHandlerTest, OAuthAuthorizeRequest, Exception, ExceptionHandler, UserAlreadyExistsException, HttpServletRequest, HttpStatus (+2 more)

### Community 12 - "Theme & PWA Context"
Cohesion: 0.10
Nodes (7): BackendApplication, OAuthController, EmailService, AuthCodeEntry, OAuthAuthCodeStore, SendEmailService, String

### Community 13 - "Subscription Service"
Cohesion: 0.16
Nodes (19): CalendarDayDetailPanel, CalendarDayDetailPanelProps, DayDetailModalHandle, SubscriptionCalendar(), SubscriptionCalendarProps, formatCompactFrequency(), getDaysLeft(), getDaysLeftColor() (+11 more)

### Community 14 - "Tag Service Layer"
Cohesion: 0.20
Nodes (7): Footer(), HeroProps, LandingPage(), NavbarProps, ToDoSection(), ToDoPage(), getUserAuth()

### Community 15 - "Transaction Service"
Cohesion: 0.09
Nodes (29): Spring Boot Backend Service, Database Backup Configuration, Docker Compose Dev Environment, Vite + React Frontend Service, JWT Authentication Configuration, SMTP Mail Configuration, MCP Server Service (AI Bridge), PostgreSQL 16 Database Service (+21 more)

### Community 16 - "Wallet Security"
Cohesion: 0.21
Nodes (10): AdminStats(), AdminStatsProps, StatCard(), StatCardProps, SortConfig, UserDirectory(), UserDirectoryProps, UserRow() (+2 more)

### Community 17 - "User Registration"
Cohesion: 0.16
Nodes (7): BadCredentialsException, Cacheable, CacheEvict, ChangePasswordRequest, PasswordEncoder, UserService, UserServiceTest

### Community 18 - "PAT Token Management"
Cohesion: 0.15
Nodes (9): fileMoves, project, Key, Path, PostConstruct, ProcessBuilder, BackupService, BackupEntry (+1 more)

### Community 19 - "Member Management"
Cohesion: 0.08
Nodes (25): dependencies, axios, date-fns, dexie, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, @emotion/react (+17 more)

### Community 20 - "User Model & Repository"
Cohesion: 0.11
Nodes (12): Async, PatController, PatCreateRequest, PatCreateResponse, PatResponse, PatUpdateRequest, WalletPermission, InvalidTokenException (+4 more)

### Community 21 - "Docker Infrastructure"
Cohesion: 0.10
Nodes (24): ColorSelectorPropsProps, IconColorSelector(), IconPickerButton(), IconPickerButtonProps, IconSelector(), IconSelectorProps, ColorSelector(), ColorSelectorProps (+16 more)

### Community 22 - "CI/CD Pipeline"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+13 more)

### Community 23 - "Profile & Settings Modals"
Cohesion: 0.18
Nodes (11): CalendarContainerProps, ViewState, CustomDatePicker(), CustomDatePickerProps, DatePickerValue, PresetType, DayCellProps, MonthGrid() (+3 more)

### Community 24 - "Offline DB & Sync"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+11 more)

### Community 25 - "Subscription Calendar"
Cohesion: 0.12
Nodes (7): UserResponse, UserNotFoundException, UserMapper, PersonalAccessTokenRepository, Scheduled, AdminUserInviteService, UUID

### Community 26 - "Frontend Vite Config"
Cohesion: 0.18
Nodes (6): LocalDate, Subscription, Wallet, SubscriptionRepository, SubscriptionService, Subscription

### Community 27 - "Frontend Dev Dependencies"
Cohesion: 0.10
Nodes (20): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, postcss (+12 more)

### Community 28 - "Axios & Shared Modals"
Cohesion: 0.12
Nodes (25): ConsentView, PatFormView(), PatFormViewProps, PatListView(), PatListViewProps, PatModal, PatModalHandle, PatShowTokenView() (+17 more)

### Community 29 - "Admin & Wallet Modals"
Cohesion: 0.17
Nodes (12): AuthenticationConfiguration, AuthenticationManager, AuthenticationProvider, Bean, CacheManager, Clock, ApplicationConfig, CacheConfig (+4 more)

### Community 30 - "Transaction Backend"
Cohesion: 0.11
Nodes (19): AdminDashboard(), DeleteModalHandle, DeleteModalContext, useDeleteModal(), UserDashboard(), Props, SubscriptionDetailsModal, SubscriptionDetailsModalHandle (+11 more)

### Community 31 - "Wallet Controller"
Cohesion: 0.30
Nodes (4): AuthController, ForgotPasswordRequest, HttpServletResponse, PostMapping

### Community 32 - "Settings & Overview UI"
Cohesion: 0.16
Nodes (7): WalletController, WalletResponse, UnauthorizedAccessException, WalletAccessId, PutMapping, Serializable, WalletService

### Community 33 - "Auth Registration Flow"
Cohesion: 0.24
Nodes (4): RegisterInviteRequest, RegisterInviteResponse, RegisterService, RegisterServiceTest

### Community 34 - "Demo Service & Tags"
Cohesion: 0.38
Nodes (5): Frequency, type, DemoService, Tag, Wallet

### Community 35 - "Login & Demo Controller"
Cohesion: 0.48
Nodes (5): MemberCategory(), MemberCategoryProps, MemberRow(), MemberRowProps, WalletMember

### Community 36 - "Cron Jobs & Scheduling"
Cohesion: 0.14
Nodes (7): TransactionController, TransactionRequest, TransactionResponse, TransactionMapper, Transaction, TransactionRepository, Transaction

### Community 37 - "JWT Token Service"
Cohesion: 0.11
Nodes (8): Claims, Date, Function, Map, Object, JwtService, JwtServiceTest, T

### Community 38 - "OAuth Controller"
Cohesion: 0.16
Nodes (14): Icon(), WalletIconProps, TagCardProps, TagChildRowProps, TagFilter(), TagFilterProps, TagFilterRow(), TagFilterRowProps (+6 more)

### Community 39 - "Subscription Controller"
Cohesion: 0.27
Nodes (6): WalletNotFoundException, IllegalArgumentException, PreAuthorize, MemberService, TransactionService, Transactional

### Community 40 - "Password Reset UI"
Cohesion: 0.27
Nodes (4): DemoController, AuthResponse, MemberMapper, Role

### Community 41 - "ToDo Feature"
Cohesion: 0.15
Nodes (12): 🏗️ Architecture Overview, 🚀 Automated Deployment, 🧩 Core Stack, ⚡ Demo & Onboarding Mode, ⚙️ Development Setup, Enabling Demo Features, 🚀 Engineering Highlights, 🛠️ Infrastructure & CI/CD (+4 more)

### Community 42 - "Admin Backups UI"
Cohesion: 0.09
Nodes (7): BackendApplicationTests, SubscriptionControllerTest, TransactionControllerTest, JwtAuthenticationFilterTest, SendEmailServiceTest, TransactionServiceTest, Test

### Community 43 - "Community 43"
Cohesion: 0.21
Nodes (3): Modifying, Query, RegistrationsRepository

### Community 44 - "Amount Input Component"
Cohesion: 0.33
Nodes (6): useMobileMath(), AmountInput(), AmountInputProps, formatAmountString(), hasOperators(), evaluateMathExpression()

### Community 45 - "Admin User Invites"
Cohesion: 0.12
Nodes (8): AdminInviteRequest, AdminInviteResponse, RegisterInviteResponse, ResetPasswordRequest, LocalDateTime, AdminInviteMapper, Registrations, AdminUserInviteServiceTest

### Community 46 - "Frontend Package Config"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, preview, version

### Community 47 - "Community 47"
Cohesion: 0.14
Nodes (16): buildMonthlyBuckets(), MonthlyBucket, CumulativeChart(), CumulativeChartProps, darkTheme, lightTheme, MONTH_LABELS, darkTheme (+8 more)

### Community 48 - "Root Package DnD Kit"
Cohesion: 0.40
Nodes (4): dependencies, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities

### Community 56 - "MCP Server Document"
Cohesion: 0.11
Nodes (3): AfterEach, PatAuthenticationFilterTest, BackupServiceTest

### Community 58 - "Community 58"
Cohesion: 0.15
Nodes (3): SubscriptionCronJob, SubscriptionCronJobTest, SubscriptionServiceTest

### Community 59 - "Community 59"
Cohesion: 0.18
Nodes (4): AdminUserController, GetMapping, InvitationStatus, List

### Community 60 - "Community 60"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + TypeScript + Vite

### Community 61 - "Community 61"
Cohesion: 0.29
Nodes (5): CacheItem, FinanceDb, offlineDb, SyncQueueItem, syncOfflineData()

### Community 64 - "Community 64"
Cohesion: 0.18
Nodes (3): BeforeEach, WalletAccess, MemberServiceTest

### Community 65 - "Community 65"
Cohesion: 0.24
Nodes (4): SubscriptionController, SubscriptionRequest, SubscriptionResponse, SubscriptionMapper

### Community 66 - "Community 66"
Cohesion: 0.24
Nodes (5): rawToDoData, todoData, ToDoItem, ToDoItemInput, ToDoStatus

### Community 67 - "Community 67"
Cohesion: 0.20
Nodes (8): MonthlyOverviewProps, MONTHS, OverviewTable(), TABS, ViewMode, SwitchableCard(), SwitchableCardProps, Tab

### Community 68 - "Community 68"
Cohesion: 0.20
Nodes (3): WalletControllerTest, WalletRequest, WalletServiceTest

### Community 69 - "Community 69"
Cohesion: 0.29
Nodes (4): Status, ManageUserServiceTest, IdorIntegrationTest, WithMockUser

### Community 70 - "Community 70"
Cohesion: 0.13
Nodes (15): darkMuiTheme, DEMO_TRANSACTIONS, Features(), ThemeSelector(), CashFlowSankey(), CashFlowSankeyProps, LinkDef, NodeDef (+7 more)

### Community 71 - "Community 71"
Cohesion: 0.21
Nodes (4): BackupEntry, AdminDatabaseController, MultipartFile, Resource

### Community 73 - "Community 73"
Cohesion: 0.28
Nodes (7): CellType, formatAmount(), OverviewCell(), OverviewCellProps, DataItem, OverviewRow(), OverviewRowProps

### Community 76 - "Community 76"
Cohesion: 0.57
Nodes (5): DecodedToken, getDecodedToken(), getToken(), isTokenValid(), ProtectedRoute()

## Knowledge Gaps
- **217 isolated node(s):** `recordToolUse.sh script`, `UserRequest`, `PatWalletPermission`, `ManageUserRepository`, `WalletRepository` (+212 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Status` connect `Community 69` to `MCP Server Tools`, `Frontend Vite Config`, `Community 58`?**
  _High betweenness centrality (0.347) - this node is a cross-community bridge._
- **Why does `api` connect `MCP Server Tools` to `Statistics Charts`, `Subscription UI`, `User Service Layer`, `Tag Service Layer`, `Docker Infrastructure`, `Axios & Shared Modals`, `Community 61`, `Transaction Backend`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `triggerToast()` connect `MCP Server Tools` to `Statistics Charts`, `Subscription UI`, `User Service Layer`, `Tag Service Layer`, `Docker Infrastructure`, `Axios & Shared Modals`, `Transaction Backend`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **What connects `recordToolUse.sh script`, `UserRequest`, `PatWalletPermission` to the rest of the system?**
  _247 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `MCP Server Tools` be split into smaller, more focused modules?**
  _Cohesion score 0.06498015873015874 - nodes in this community are weakly interconnected._
- **Should `Frontend Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.13636363636363635 - nodes in this community are weakly interconnected._
- **Should `Transaction Modal UI` be split into smaller, more focused modules?**
  _Cohesion score 0.14444444444444443 - nodes in this community are weakly interconnected._