# Graph Report - .  (2026-06-23)

## Corpus Check
- 266 files · ~120,933 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1201 nodes · 3248 edges · 58 communities (53 shown, 5 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 172 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

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

## Communities (58 total, 5 thin omitted)

### Community 0 - "MCP Server Tools"
Cohesion: 0.06
Nodes (45): ThemeSelector(), darkMuiTheme, DEMO_TRANSACTIONS, Features(), CashFlowSankey(), CashFlowSankeyProps, LinkDef, NodeDef (+37 more)

### Community 1 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (28): AuthenticationConfiguration, AuthenticationProvider, BackendApplication, Bean, CacheManager, CommandLineRunner, CacheConfig, DataInitializer (+20 more)

### Community 2 - "Transaction Modal UI"
Cohesion: 0.07
Nodes (19): Async, Cacheable, CacheEvict, PatController, PatCreateRequest, PatCreateResponse, PatResponse, RegisterInviteResponse (+11 more)

### Community 3 - "Wallet Dashboard"
Cohesion: 0.09
Nodes (15): Collection, DemoCleanupCronJob, MemberRequest, MemberResponse, UserResponse, WalletInviteResponse, EntityGraph, InvitationStatus (+7 more)

### Community 4 - "Tag Management UI"
Cohesion: 0.11
Nodes (46): BaseHTTPMiddleware, Context, description, FastMCP, Field, ge, gt, JSONResponse (+38 more)

### Community 5 - "Statistics Charts"
Cohesion: 0.10
Nodes (30): Collapse(), CollapseProps, SettingsCard(), SettingsCardProps, DateRangeValue, DataTab(), InviteSection(), InviteSectionProps (+22 more)

### Community 6 - "Subscription UI"
Cohesion: 0.11
Nodes (27): CurrencySelector(), CurrencySelectorProps, FloatingActionButton(), FloatingActionButtonProps, Props, Props, SubscriptionView(), TagPicker() (+19 more)

### Community 7 - "Landing Page"
Cohesion: 0.14
Nodes (12): AdminUserController, MembersController, TagController, TransactionController, DeleteMapping, TagRequest, TagResponse, GetMapping (+4 more)

### Community 8 - "User Service Layer"
Cohesion: 0.09
Nodes (29): AppHeader(), AppHeaderProps, AppHeaderTab, AboutAppModal, AboutAppModalHandle, ChangePasswordModal, ChangePasswordModalHandle, InvitationsModal (+21 more)

### Community 9 - "Date Picker Component"
Cohesion: 0.10
Nodes (17): PWAPrompt(), CTASectionProps, DemoSectionProps, Footer(), HeroProps, LandingPage(), NavbarProps, ToDoSection() (+9 more)

### Community 10 - "Wallet Service Layer"
Cohesion: 0.17
Nodes (11): TransactionRequest, TagNotFoundException, IllegalArgumentException, Tag, Wallet, PreAuthorize, TagRepository, SubscriptionService (+3 more)

### Community 11 - "Icon Selector Component"
Cohesion: 0.14
Nodes (9): PermissionDeniedException, TagHasChildrenException, UnauthorizedAccessException, UserNotFoundException, WalletNotFoundException, RuntimeException, WalletSecurity, WalletService (+1 more)

### Community 12 - "Theme & PWA Context"
Cohesion: 0.12
Nodes (5): EmailService, RegistrationsRepository, UserRepository, SendEmailService, String

### Community 13 - "Subscription Service"
Cohesion: 0.12
Nodes (25): DayDetailModalHandle, DayDetailPanel, DayDetailPanelProps, Props, SubscriptionDetailsModal, SubscriptionDetailsModalHandle, SubscriptionModal, SubscriptionModalHandle (+17 more)

### Community 14 - "Tag Service Layer"
Cohesion: 0.13
Nodes (17): ColorSelector(), ColorSelectorProps, FLUO_PRESETS, ColorSelectorPropsProps, IconColorSelector(), IconPickerButton(), IconPickerButtonProps, IconSelector() (+9 more)

### Community 15 - "Transaction Service"
Cohesion: 0.09
Nodes (29): Spring Boot Backend Service, Database Backup Configuration, Docker Compose Dev Environment, Vite + React Frontend Service, JWT Authentication Configuration, SMTP Mail Configuration, MCP Server Service (AI Bridge), PostgreSQL 16 Database Service (+21 more)

### Community 16 - "Wallet Security"
Cohesion: 0.11
Nodes (19): ADMIN_TABS, UsersPageProps, AdminStats(), AdminStatsProps, CreateInviteForm(), CreateInviteFormProps, AdminInvite, InvitesTable() (+11 more)

### Community 17 - "User Registration"
Cohesion: 0.22
Nodes (9): BadCredentialsException, GlobalExceptionHandler, Exception, ExceptionHandler, TagInUseException, UserAlreadyExistsException, HttpServletRequest, HttpStatus (+1 more)

### Community 18 - "PAT Token Management"
Cohesion: 0.17
Nodes (7): Key, Path, PostConstruct, ProcessBuilder, BackupService, BackupEntry, R2StorageService

### Community 19 - "Member Management"
Cohesion: 0.08
Nodes (25): dependencies, axios, date-fns, dexie, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, @emotion/react (+17 more)

### Community 20 - "User Model & Repository"
Cohesion: 0.14
Nodes (12): Sphere(), SphereProps, LoginBackground(), LoginForm(), Requirements, ConsentView, PatToken, WalletPermState (+4 more)

### Community 21 - "Docker Infrastructure"
Cohesion: 0.17
Nodes (14): Icon(), WalletIconProps, TagFilter(), TagFilterProps, TagFilterRow(), TagFilterRowProps, HierarchicalTagSelectorProps, TagPickerAddForm() (+6 more)

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
Nodes (7): BackupEntry, AdminDatabaseController, ChangePasswordRequest, ForgotPasswordRequest, MultipartFile, PostMapping, Resource

### Community 26 - "Frontend Vite Config"
Cohesion: 0.19
Nodes (4): LocalDate, Subscription, SubscriptionRepository, Subscription

### Community 27 - "Frontend Dev Dependencies"
Cohesion: 0.11
Nodes (19): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, postcss (+11 more)

### Community 28 - "Axios & Shared Modals"
Cohesion: 0.17
Nodes (11): api, CreateTagModal, CreateTagModalHandle, Props, ShareWalletModal, ShareWalletModalHandle, CacheItem, FinanceDb (+3 more)

### Community 29 - "Admin & Wallet Modals"
Cohesion: 0.17
Nodes (10): AdminDashboard(), UserDashboard(), CreateWalletModal, CreateWalletModalHandle, Props, DeleteModalContext, DeleteModalProvider(), useDeleteModal() (+2 more)

### Community 30 - "Transaction Backend"
Cohesion: 0.16
Nodes (5): TransactionResponse, TransactionMapper, Transaction, TransactionRepository, Transaction

### Community 31 - "Wallet Controller"
Cohesion: 0.20
Nodes (6): WalletController, WalletRequest, WalletResponse, WalletMapper, WalletAccessId, Serializable

### Community 32 - "Settings & Overview UI"
Cohesion: 0.17
Nodes (12): MemberCategory(), MemberCategoryProps, MemberRow(), MemberRowProps, CellType, formatAmount(), OverviewCell(), OverviewCellProps (+4 more)

### Community 33 - "Auth Registration Flow"
Cohesion: 0.23
Nodes (5): AuthController, RegisterInviteRequest, ResetPasswordRequest, RegisterInviteResponse, RegisterService

### Community 34 - "Demo Service & Tags"
Cohesion: 0.30
Nodes (6): Frequency, type, TagMapper, DemoService, Tag, Wallet

### Community 35 - "Login & Demo Controller"
Cohesion: 0.22
Nodes (5): DemoController, AuthResponse, LoginRequest, MemberMapper, Role

### Community 36 - "Cron Jobs & Scheduling"
Cohesion: 0.20
Nodes (5): BackupCronJob, SubscriptionCronJob, Scheduled, AuthCodeEntry, OAuthAuthCodeStore

### Community 37 - "JWT Token Service"
Cohesion: 0.29
Nodes (5): Claims, Date, Function, JwtService, T

### Community 38 - "OAuth Controller"
Cohesion: 0.24
Nodes (5): AuthenticationManager, OAuthAuthorizeRequest, OAuthController, Map, Object

### Community 39 - "Subscription Controller"
Cohesion: 0.27
Nodes (4): SubscriptionController, SubscriptionRequest, SubscriptionResponse, SubscriptionMapper

### Community 40 - "Password Reset UI"
Cohesion: 0.33
Nodes (8): ResetInviteResponse, ResetPassword(), getPasswordRequirements(), isPasswordValid(), PasswordRequirements(), PasswordRequirementsProps, Register(), RegisterInviteResponse

### Community 41 - "ToDo Feature"
Cohesion: 0.24
Nodes (5): rawToDoData, todoData, ToDoItem, ToDoItemInput, ToDoStatus

### Community 42 - "Admin Backups UI"
Cohesion: 0.20
Nodes (3): ActionCardProps, BackupEntry, BackupSelectorProps

### Community 43 - "Backend Tests"
Cohesion: 0.36
Nodes (5): Status, BackendApplicationTests, AdminUserIntegrationTest, Test, WithMockUser

### Community 44 - "Amount Input Component"
Cohesion: 0.33
Nodes (6): AmountInput(), AmountInputProps, formatAmountString(), hasOperators(), useMobileMath(), evaluateMathExpression()

### Community 45 - "Admin User Invites"
Cohesion: 0.36
Nodes (3): AdminInviteRequest, AdminInviteResponse, AdminUserInviteService

### Community 46 - "Frontend Package Config"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, preview, version

### Community 47 - "Backup Shell Scripts"
Cohesion: 0.71
Nodes (6): backup_sh.sh script, do_backup(), do_download(), do_restore(), get_latest_backup_name(), interactive_menu()

### Community 48 - "Root Package DnD Kit"
Cohesion: 0.40
Nodes (4): dependencies, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities

## Knowledge Gaps
- **200 isolated node(s):** `UserRequest`, `ManageUserRepository`, `WalletRepository`, `name`, `private` (+195 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Status` connect `Backend Tests` to `Admin Backups UI`, `Frontend Vite Config`?**
  _High betweenness centrality (0.383) - this node is a cross-community bridge._
- **Why does `type` connect `Demo Service & Tags` to `Frontend Package Config`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `triggerToast()` connect `User Model & Repository` to `Statistics Charts`, `Subscription UI`, `Password Reset UI`, `Date Picker Component`, `Admin Backups UI`, `User Service Layer`, `Wallet Security`, `Axios & Shared Modals`, `Admin & Wallet Modals`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **What connects `UserRequest`, `ManageUserRepository`, `WalletRepository` to the rest of the system?**
  _217 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `MCP Server Tools` be split into smaller, more focused modules?**
  _Cohesion score 0.05593220338983051 - nodes in this community are weakly interconnected._
- **Should `Frontend Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06170598911070781 - nodes in this community are weakly interconnected._
- **Should `Transaction Modal UI` be split into smaller, more focused modules?**
  _Cohesion score 0.06821480406386067 - nodes in this community are weakly interconnected._