# Graph Report - FinanceWebApp  (2026-06-28)

## Corpus Check
- 261 files · ~124,774 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1305 nodes · 3623 edges · 69 communities (57 shown, 12 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 202 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `426b9d8c`
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

## Communities (69 total, 12 thin omitted)

### Community 0 - "MCP Server Tools"
Cohesion: 0.09
Nodes (24): buildMonthlyBuckets(), MonthlyBucket, CumulativeChart(), CumulativeChartProps, darkTheme, lightTheme, MONTH_LABELS, darkTheme (+16 more)

### Community 1 - "Frontend Dependencies"
Cohesion: 0.11
Nodes (10): BackendApplication, CommandLineRunner, DataInitializer, UserResponse, GrantedAuthority, UserMapper, User, Override (+2 more)

### Community 2 - "Transaction Modal UI"
Cohesion: 0.21
Nodes (6): PatCreateResponse, WalletPermission, EntityGraph, PatMapper, PersonalAccessToken, PersonalAccessTokenRepository

### Community 3 - "Wallet Dashboard"
Cohesion: 0.11
Nodes (11): Collection, PatWalletPermission, WalletMapper, WalletAccess, WalletAccessId, Optional, UserRepository, WalletAccessRepository (+3 more)

### Community 4 - "Tag Management UI"
Cohesion: 0.08
Nodes (72): BaseHTTPMiddleware, Context, description, FastMCP, Field, ge, gt, JSONResponse (+64 more)

### Community 5 - "Statistics Charts"
Cohesion: 0.15
Nodes (17): SettingsTab(), StatisticsTab(), TagsTab(), TagFilter(), TagFilterProps, TagFilterRow(), TransactionsFilter(), TransactionsTab() (+9 more)

### Community 6 - "Subscription UI"
Cohesion: 0.12
Nodes (23): CurrencySelector(), CurrencySelectorProps, Props, SubscriptionModal, SubscriptionModalHandle, SubscriptionTab(), ViewMode, TransactionsTable() (+15 more)

### Community 7 - "Landing Page"
Cohesion: 0.10
Nodes (16): AdminUserController, MembersController, PatController, TagController, WalletController, DeleteMapping, MemberRequest, MemberResponse (+8 more)

### Community 8 - "User Service Layer"
Cohesion: 0.11
Nodes (24): AboutAppModal, AboutAppModalHandle, ChangePasswordModal, ChangePasswordModalHandle, LogoutModal, LogoutModalHandle, ProfileModal, ProfileModalHandle (+16 more)

### Community 9 - "Date Picker Component"
Cohesion: 0.11
Nodes (22): DeleteModal, DeleteModalProvider(), AppHeader(), Features(), Footer(), LandingPage(), NavbarProps, ToDoSection() (+14 more)

### Community 10 - "Wallet Service Layer"
Cohesion: 0.14
Nodes (9): TransactionController, TransactionRequest, TransactionResponse, TagNotFoundException, TransactionMapper, PreAuthorize, TagRepository, TagService (+1 more)

### Community 11 - "Icon Selector Component"
Cohesion: 0.16
Nodes (9): PermissionDeniedException, TagHasChildrenException, WalletNotFoundException, TransactionRepository, RuntimeException, PatWalletPermission, WalletSecurity, Transaction (+1 more)

### Community 13 - "Subscription Service"
Cohesion: 0.09
Nodes (27): DateRangeValue, DayDetailModalHandle, DayDetailPanel, DayDetailPanelProps, SubscriptionCalendar(), SubscriptionCalendarProps, formatCompactFrequency(), getDaysLeft() (+19 more)

### Community 14 - "Tag Service Layer"
Cohesion: 0.15
Nodes (16): ColorSelectorPropsProps, IconColorSelector(), IconPickerButton(), IconPickerButtonProps, IconSelector(), IconSelectorProps, ColorSelector(), ColorSelectorProps (+8 more)

### Community 15 - "Transaction Service"
Cohesion: 0.09
Nodes (29): Spring Boot Backend Service, Database Backup Configuration, Docker Compose Dev Environment, Vite + React Frontend Service, JWT Authentication Configuration, SMTP Mail Configuration, MCP Server Service (AI Bridge), PostgreSQL 16 Database Service (+21 more)

### Community 16 - "Wallet Security"
Cohesion: 0.12
Nodes (17): ADMIN_TABS, UsersPageProps, AdminStats(), AdminStatsProps, AdminInvite, InvitesTable(), InvitesTableProps, StatCard() (+9 more)

### Community 17 - "User Registration"
Cohesion: 0.22
Nodes (9): BadCredentialsException, GlobalExceptionHandler, Exception, ExceptionHandler, TagInUseException, UserAlreadyExistsException, HttpServletRequest, HttpStatus (+1 more)

### Community 18 - "PAT Token Management"
Cohesion: 0.10
Nodes (13): BackupEntry, BackupCronJob, SubscriptionCronJob, fileMoves, project, Key, Path, PostConstruct (+5 more)

### Community 19 - "Member Management"
Cohesion: 0.08
Nodes (25): dependencies, axios, date-fns, dexie, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, @emotion/react (+17 more)

### Community 20 - "User Model & Repository"
Cohesion: 0.15
Nodes (7): Async, Cacheable, PatCreateRequest, PatUpdateRequest, InvalidTokenException, UserNotFoundException, PatService

### Community 21 - "Docker Infrastructure"
Cohesion: 0.22
Nodes (10): Icon(), WalletIconProps, TagFilterRowProps, HierarchicalTagSelectorProps, TagPicker(), TagPickerRow(), TagPickerRowProps, TransactionsSearchProps (+2 more)

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
Cohesion: 0.14
Nodes (4): DemoCleanupCronJob, PatResponse, List, Resource

### Community 26 - "Frontend Vite Config"
Cohesion: 0.09
Nodes (12): SubscriptionController, SubscriptionRequest, SubscriptionResponse, LocalDate, SubscriptionMapper, Subscription, Tag, Transaction (+4 more)

### Community 27 - "Frontend Dev Dependencies"
Cohesion: 0.10
Nodes (20): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, postcss (+12 more)

### Community 28 - "Axios & Shared Modals"
Cohesion: 0.15
Nodes (17): ConsentView, PatFormViewProps, PatListView(), PatListViewProps, TokenActionButtons(), TokenActionButtonsProps, TokenLastUsedInfo(), TokenLastUsedInfoProps (+9 more)

### Community 29 - "Admin & Wallet Modals"
Cohesion: 0.19
Nodes (12): AuthenticationConfiguration, AuthenticationManager, AuthenticationProvider, Bean, CacheManager, ApplicationConfig, CacheConfig, SecurityConfig (+4 more)

### Community 30 - "Transaction Backend"
Cohesion: 0.12
Nodes (24): AdminDashboard(), DeleteModalHandle, DeleteModalContext, useDeleteModal(), UserDashboard(), Props, SubscriptionDetailsModal, SubscriptionDetailsModalHandle (+16 more)

### Community 31 - "Wallet Controller"
Cohesion: 0.18
Nodes (7): AdminDatabaseController, AuthController, ForgotPasswordRequest, LoginRequest, HttpServletResponse, MultipartFile, PostMapping

### Community 32 - "Settings & Overview UI"
Cohesion: 0.24
Nodes (4): WalletRequest, WalletResponse, UnauthorizedAccessException, WalletService

### Community 33 - "Auth Registration Flow"
Cohesion: 0.20
Nodes (6): RegisterInviteRequest, IllegalArgumentException, RegisterInviteResponse, MemberService, RegisterService, Transactional

### Community 34 - "Demo Service & Tags"
Cohesion: 0.30
Nodes (6): Frequency, type, TagMapper, DemoService, Tag, Wallet

### Community 35 - "Login & Demo Controller"
Cohesion: 0.22
Nodes (11): DataTab(), InviteSection(), InviteSectionProps, MemberCategory(), MemberCategoryProps, MemberRow(), MemberRowProps, SettingsCard() (+3 more)

### Community 36 - "Cron Jobs & Scheduling"
Cohesion: 0.11
Nodes (19): darkMuiTheme, DEMO_TRANSACTIONS, ThemeSelector(), CashFlowSankey(), CashFlowSankeyProps, LinkDef, NodeDef, DateRangeBanner() (+11 more)

### Community 37 - "JWT Token Service"
Cohesion: 0.17
Nodes (6): Claims, Date, Function, JwtService, String, T

### Community 38 - "OAuth Controller"
Cohesion: 0.30
Nodes (7): FilterChain, OncePerRequestFilter, CustomUserDetailsService, JwtAuthenticationFilter, PatAuthenticationFilter, UserDetails, UserDetailsService

### Community 39 - "Subscription Controller"
Cohesion: 0.80
Nodes (4): advanceByOneInterval(), applyMonthlyRules(), generateSubscriptionOccurrences(), getLastWorkingDayOfMonth()

### Community 40 - "Password Reset UI"
Cohesion: 0.27
Nodes (4): DemoController, AuthResponse, MemberMapper, Role

### Community 41 - "ToDo Feature"
Cohesion: 0.15
Nodes (12): 🏗️ Architecture Overview, 🚀 Automated Deployment, 🧩 Core Stack, ⚡ Demo & Onboarding Mode, ⚙️ Development Setup, Enabling Demo Features, 🚀 Engineering Highlights, 🛠️ Infrastructure & CI/CD (+4 more)

### Community 42 - "Admin Backups UI"
Cohesion: 0.14
Nodes (8): ActionCardProps, BackupEntry, BackupSelectorProps, Status, BackendApplicationTests, AdminUserIntegrationTest, Test, WithMockUser

### Community 43 - "Community 43"
Cohesion: 0.22
Nodes (3): RegisterInviteResponse, ResetPasswordRequest, LocalDateTime

### Community 44 - "Amount Input Component"
Cohesion: 0.33
Nodes (6): useMobileMath(), AmountInput(), AmountInputProps, formatAmountString(), hasOperators(), evaluateMathExpression()

### Community 45 - "Admin User Invites"
Cohesion: 0.15
Nodes (9): AdminInviteRequest, AdminInviteResponse, InvitationStatus, AdminInviteMapper, Registrations, Modifying, Query, RegistrationsRepository (+1 more)

### Community 46 - "Frontend Package Config"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, preview, version

### Community 47 - "Community 47"
Cohesion: 0.39
Nodes (3): CacheEvict, ChangePasswordRequest, UserService

### Community 48 - "Root Package DnD Kit"
Cohesion: 0.40
Nodes (4): dependencies, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities

### Community 58 - "Community 58"
Cohesion: 0.28
Nodes (7): CellType, formatAmount(), OverviewCell(), OverviewCellProps, DataItem, OverviewRow(), OverviewRowProps

### Community 60 - "Community 60"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + TypeScript + Vite

### Community 61 - "Community 61"
Cohesion: 0.08
Nodes (29): CreateInviteForm(), CreateInviteFormProps, api, failedQueue, LoginBackground(), LoginForm(), Requirements, PasswordInput() (+21 more)

### Community 65 - "Community 65"
Cohesion: 0.22
Nodes (4): OAuthAuthorizeRequest, OAuthController, AuthCodeEntry, OAuthAuthCodeStore

### Community 66 - "Community 66"
Cohesion: 0.24
Nodes (5): rawToDoData, todoData, ToDoItem, ToDoItemInput, ToDoStatus

## Knowledge Gaps
- **213 isolated node(s):** `UserRequest`, `PatWalletPermission`, `ManageUserRepository`, `WalletRepository`, `PatWalletPermission` (+208 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Status` connect `Admin Backups UI` to `Frontend Vite Config`?**
  _High betweenness centrality (0.358) - this node is a cross-community bridge._
- **Why does `triggerToast()` connect `Community 61` to `Login & Demo Controller`, `Subscription UI`, `User Service Layer`, `Date Picker Component`, `Admin Backups UI`, `Subscription Service`, `Wallet Security`, `Axios & Shared Modals`, `Transaction Backend`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `api` connect `Community 61` to `Login & Demo Controller`, `Subscription UI`, `User Service Layer`, `Date Picker Component`, `Admin Backups UI`, `Subscription Service`, `Wallet Security`, `Axios & Shared Modals`, `Transaction Backend`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **What connects `UserRequest`, `PatWalletPermission`, `ManageUserRepository` to the rest of the system?**
  _243 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `MCP Server Tools` be split into smaller, more focused modules?**
  _Cohesion score 0.08817204301075268 - nodes in this community are weakly interconnected._
- **Should `Frontend Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `Wallet Dashboard` be split into smaller, more focused modules?**
  _Cohesion score 0.11290322580645161 - nodes in this community are weakly interconnected._