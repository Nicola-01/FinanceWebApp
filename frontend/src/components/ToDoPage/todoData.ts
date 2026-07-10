export type ToDoStatus = "STARTED" | "FINISHED" | "PLANNED" | "EVALUATION";

export interface ToDoItem {
  id: string;
  title: string;
  description?: string;
  status: ToDoStatus;
  subtasks?: string[];
}

// Temporary type for the raw list without IDs
type ToDoItemInput = Omit<ToDoItem, "id">;

const rawToDoData: ToDoItemInput[] = [
  // {
  //   title: "BUGS",
  //   description: "List of bugs to fix",
  //   status: "STARTED",
  //   subtasks: [""],
  // },
  {
    title: "Minor improvements",
    description: "List of improvements",
    status: "PLANNED",
    subtasks: ["Wallet Description", "Subscription Name & Description"],
  },
  {
    title: "Guide",
    description: "How to use the application",
    status: "PLANNED",
  },
  {
    title: "Core API",
    description: "The core API of the application (Spring Boot).",
    status: "FINISHED",
  },
  {
    title: "Core UI",
    description: "The core UI of the application (React + Tailwind).",
    status: "FINISHED",
  },
  {
    title: "Core Database",
    description: "The core database of the application (PostgreSQL).",
    status: "FINISHED",
  },
  {
    title: "Docker",
    description:
      "Docker implementation for the Backend, Frontend and Database.",
    status: "FINISHED",
  },
  {
    title: "Auto deployment",
    description: "Auto deployment of the application on my personal HomeLab.",
    status: "FINISHED",
    subtasks: ["GitHub Actions", "Docker Compose", "Nginx", "Cloudflare"],
  },
  {
    title: "Server Backup",
    description: "Server backup implementation",
    status: "FINISHED",
    subtasks: [
      "Cloudflare R2 backup",
      "Daily backup (Cron job on server)",
      "Encrypted backup on Cloudflare servers",
      "Backup decryption and restore",
    ],
  },
  {
    title: "Server Backup Admin Page",
    description: "Server backup from admin page",
    status: "FINISHED",
    subtasks: [
      "Perform backup and restore from admin page",
      "Manage backup files (delete, download, restore)",
      "Manage backup schedule (enable, disable, frequency)",
    ],
  },
  {
    title: "Rate Limit",
    description: "Add a rate limit",
    status: "FINISHED",
    subtasks: ["Configuration in Cloudflare", "Configuration in Nginx"],
  },
  {
    title: "Core Subscription Engine",
    description: "Advanced cron-based recurring transactions.",
    status: "FINISHED",
    subtasks: [
      "Basic monthly/weekly repeats",
      "Calendar view",
      "Advanced recurring rules",
    ],
  },
  {
    title: "Multi-Currency Wallets",
    description: "Support for boundless wallets with custom base currencies.",
    status: "FINISHED",
    subtasks: [
      "Live conversion rates (https://frankfurter.dev/)",
      "Dashboard with original and converted amounts",
    ],
  },
  {
    title: "Demo Mode",
    description: "Allow to try the application without an account.",
    status: "FINISHED",
    subtasks: ["Restricted API scope for demo"],
  },
  {
    title: "Custom Categories & Tags",
    description: "Categories with fully customizable nested tags.",
    status: "FINISHED",
    subtasks: [
      "Tag hierarchy & inheritance",
      "Color and icon selection per tag",
      "Rule-based automatic tagging",
    ],
  },
  {
    title: "Wallet Collaboration",
    description: "Shared wallets for families and roommates.",
    status: "FINISHED",
    subtasks: [
      "Invitation and permission system (Owner, Viewer, Editor)",
      // 'WebSocket-based live updates',
      // 'Activity feed'
    ],
  },
  {
    title: "AI Financial Insights",
    description: "A proactive AI agent that scans for savings opportunities.",
    status: "STARTED",
    subtasks: [
      "MCP Server integration (with OAuth2)",
      "Spending anomaly detection",
      "AI-powered insights",
    ],
  },
  {
    title: "Monthly Summarized",
    description: "Monthly summarized reports via Email/Push.",
    status: "PLANNED",
    subtasks: [
      "Generate monthly/weekly summarized reports",
      "Yearly wrap-up report",
      "Send reports via Email",
      "Send reports via Push notifications",
    ],
  },
  {
    title: "Notifications",
    description: "Notifications system for the application.",
    status: "PLANNED",
    subtasks: [
      "Push notifications",
      "PWA notifications",
      "Wallet invitation",
      "New transactions",
    ],
  },
  {
    title: "Remainders (Notifications)",
    description: "",
    status: "PLANNED",
    subtasks: [
      "Daily reminders",
      "For subscription payments",
      "subscription without amount, ask the user to insert the amount when due -> e.g. salary is not fixed, so notify to the user to insert it ",
      "For transaction reminders (save for later (remidner 1h 6h 24h)",
    ],
  },
  {
    title: "Bank Sync",
    description: "Connect directly to some institutions for automatic imports.",
    status: "STARTED",
    subtasks: [
      // 'Plaid integration',
      "European Open Banking standard (e.g., enablebanking)",
    ],
  },
  // {
  //   title: "PWA (Progressive Web App)",
  //   description: "Progressive Web App.",
  //   status: "FINISHED",
  //   subtasks: [
  //     "Temporary implementation for Android App",
  //     "Installable on Android",
  //     "Push notifications",
  //     "Background sync",
  //   ],
  // },
  {
    title: "Android App",
    description: "Android application.",
    status: "STARTED",
    subtasks: [
      "PWA",
      "Authentication/APIs integration",
      "Sync with backend",
      "Offline support - sync/unsync Badge",
      "Push notifications",
      "Background sync",
      "Widgets",
      "G-Pay notification integration (suggests to insert the new transaction after the payment)",
    ],
  },
  // {
  //     title: 'Crypto & Investment Wallet Tracking',
  //     description: 'Beyond fiat: manage stocks, ETFs, and crypto tokens.',
  //     status: 'PLANNED',
  //     subtasks: [
  //         'Price feeds',
  //         'Profit/Loss historical chart',
  //         'Cold wallet manual entries'
  //     ]
  // },
  {
    title: "Transaction Split Integration",
    description: "Split transactions with friends and family.",
    status: "PLANNED",
    subtasks: [
      "Inglobate functions as Tricount/Splitwise",
      "A single wallet keep track of the debts",
    ],
  },
  {
    title: "Car Consumption Tracking",
    description: "Track car consumption.",
    status: "PLANNED",
    subtasks: [
      "Fuel consumption tracking",
      "Maintenance tracking",
      "Cost per km tracking",
    ],
  },
  {
    title: "Budgeting",
    description: "Budgeting features.",
    status: "PLANNED",
    subtasks: ["Budget Page", "Budget creation/tracking", "Budget alerts"],
  },
  {
    title: "CSV Import/Export",
    description: "Import/Export CSV files.",
    status: "FINISHED",
  },
  {
    title: "Encrypted Wallets",
    description: "Save the wallets data encrypted.",
    status: "PLANNED",
    subtasks: [
      "Give the possibility to the user to have the wallets data encrypted on the server",
      "Avoiding the plain text data on the server",
      "The user will be able to decrypt the data only with his private key",
      "If the user will lose his private key, he will lose the data",
      "The private key will be generated with the password of the user",
      "The private key will be stored only on the client side",
    ],
  },
  {
    title: "Multi-Factor Authentication (MFA)",
    // description: 'Multi-Factor Authentication.',
    status: "PLANNED",
    subtasks: ["Passkey/OTP app"],
  },
  // ——— Under evaluation: ideas being considered, not confirmed yet ———
  {
    title: "Cash-Flow Forecast",
    description: "Project wallet balances into the future.",
    status: "EVALUATION",
    subtasks: [
      "30/90-day balance projection chart",
      "Based on upcoming subscriptions and budgets",
    ],
  },
  {
    title: "Savings Goals",
    description: "Saving targets with progress tracking.",
    status: "EVALUATION",
    subtasks: [
      "Goal creation with target amount and date",
      "Progress bar and estimated completion date",
    ],
  },
  {
    title: "Subscription Audit",
    description: "Rule-based insights on recurring costs.",
    status: "EVALUATION",
    subtasks: [
      "Annualized cost overview",
      "Price-increase detection",
      "Unused (zombie) subscription detection",
      "Upcoming charges (next 30 days)",
    ],
  },
  {
    title: "Scheduled One-Off Transactions",
    description: "Plan future one-time transactions without a subscription.",
    status: "EVALUATION",
    subtasks: [
      "Future-dated planned transactions",
      "Feeds the cash-flow forecast",
    ],
  },
  {
    title: "Duplicate Detection",
    description: "Warn about possible duplicate transactions.",
    status: "EVALUATION",
    subtasks: ["On manual entry", "On CSV import and bank sync"],
  },
  {
    title: "Global Search",
    description: "Command palette (Ctrl+K) to search the whole app.",
    status: "EVALUATION",
    subtasks: [
      "Cross-wallet transaction search",
      "Quick navigation to wallets, settings and actions",
    ],
  },
  {
    title: "Net Worth Overview",
    description: "Aggregated dashboard across all wallets.",
    status: "EVALUATION",
    subtasks: [
      "Total balance converted to a preferred currency",
      "Historical net-worth trend",
    ],
  },
  {
    title: "Transaction Templates & Quick Add",
    description: "One-tap entry for frequent expenses.",
    status: "EVALUATION",
    subtasks: [
      "Favorite transaction templates",
      "Quick-add chips (coffee, fuel, ...)",
      "Pairs with Android home-screen widgets",
    ],
  },
  {
    title: "Interactive Onboarding",
    description: "Guided in-app tour for new users.",
    status: "EVALUATION",
    subtasks: [
      "Step-by-step guided tour",
      "Seeded example wallet (reusing demo-mode logic)",
    ],
  },
  {
    title: "Wallet Activity Feed",
    description: "Audit log for shared wallets.",
    status: "EVALUATION",
    subtasks: [
      "Who changed what, and when",
      "Foundation for WebSocket live updates",
    ],
  },
  {
    title: "Trash & Undo",
    description: "Soft-delete with restore.",
    status: "EVALUATION",
    subtasks: [
      "Trash bin for deleted transactions and wallets",
      "30-day restore window",
    ],
  },
  {
    title: "Session Management",
    description: "Active sessions overview in Settings.",
    status: "EVALUATION",
    subtasks: [
      "List active devices/sessions",
      "Per-device revocation",
      "Log out everywhere",
    ],
  },
  {
    title: "Full Export / Import",
    description: "Complete account data portability beyond CSV.",
    status: "EVALUATION",
    subtasks: [
      "Full account export (JSON/ZIP)",
      "Re-import support",
      "Recommended before enabling wallet encryption",
    ],
  },
  {
    title: "Localization (i18n)",
    description: "Multi-language support.",
    status: "EVALUATION",
    subtasks: ["Italian translation", "Locale-aware number and date formats"],
  },
  {
    title: "Public API Docs",
    description: "OpenAPI/Swagger documentation for the REST API.",
    status: "EVALUATION",
    subtasks: [
      "springdoc-openapi + Swagger UI",
      "Makes personal access tokens useful beyond the MCP server",
    ],
  },
  {
    title: "AI Receipt Scanning",
    description: "Turn receipt photos into transactions.",
    status: "EVALUATION",
    subtasks: [
      "Attach a photo/PDF to a transaction",
      "AI extraction of amount, date and merchant",
      "Prefilled transaction from the receipt",
    ],
  },
  {
    title: "Merchant / Payee Field",
    description: "Merchant tracking on transactions.",
    status: "EVALUATION",
    subtasks: [
      "New payee field on transactions",
      "Merchant-based auto-tagging rules",
      "Prepares Bank Sync merchant normalization",
    ],
  },
  {
    title: "Observability",
    description: "Monitoring for the HomeLab deployment.",
    status: "EVALUATION",
    subtasks: ["Prometheus metrics (Spring Actuator)", "Grafana dashboards"],
  },
];

// Automatically generate IDs based on index
export const todoData: ToDoItem[] = rawToDoData.map((item, index) => ({
  ...item,
  id: (index + 1).toString(),
}));
