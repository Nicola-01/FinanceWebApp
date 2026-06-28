import React from 'react';
import { Wallet, BarChart3, Tags, Calendar, Users } from 'lucide-react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { TransactionPieChart } from '../../dashboard/tag/CategoryCharts.tsx';
import { CashFlowSankey } from '../../dashboard/statistics/CashFlowSankey.tsx';
import type { Transaction } from '../../utils/types.ts';

/* ── MUI dark theme for chart components ──────────────────────────── */
const darkMuiTheme = createTheme({
    palette: { mode: 'dark', background: { paper: 'var(--color-app-card)' } },
});

/* ── Demo transaction data for landing page charts ────────────────── */
const DEMO_TRANSACTIONS: Transaction[] = [
    // Income
    { id: '1',  name: 'Salary',          tag: { name: 'Main Job',    icon: 'briefcase',    colorHex: 'var(--color-app-green)', parentName: 'Work'        }, amount: 2100, type: 'INCOME',  transactionDate: '2025-03-01' },
    { id: '2',  name: 'Bonus',           tag: { name: 'Bonus',       icon: 'laptop',       colorHex: 'var(--color-app-cyan)', parentName: 'Work'        }, amount: 350,  type: 'INCOME',  transactionDate: '2025-03-05' },
    { id: '3',  name: 'Dividends',       tag: { name: 'Investments', icon: 'trending-up',  colorHex: 'var(--color-app-purple)', parentName: null           }, amount: 120,  type: 'INCOME',  transactionDate: '2025-03-10' },
    // Expenses
    { id: '5',  name: 'Rent',            tag: { name: 'Rent',        icon: 'home',         colorHex: 'var(--color-app-red)', parentName: 'Housing'     }, amount: 650,  type: 'EXPENSE', transactionDate: '2025-03-01' },
    { id: '6',  name: 'Groceries',       tag: { name: 'Groceries',   icon: 'shopping-cart', colorHex: 'var(--color-app-orange)', parentName: 'Food & Dining' }, amount: 320, type: 'EXPENSE', transactionDate: '2025-03-03' },
    { id: '7',  name: 'Restaurant',      tag: { name: 'Eating Out',  icon: 'utensils',     colorHex: 'var(--color-app-orange)', parentName: 'Food & Dining' }, amount: 95,  type: 'EXPENSE', transactionDate: '2025-03-08' },
    { id: '8',  name: 'Electricity',     tag: { name: 'Utilities',   icon: 'zap',          colorHex: 'var(--color-app-yellow)', parentName: 'Housing'     }, amount: 120,  type: 'EXPENSE', transactionDate: '2025-03-05' },
    { id: '9',  name: 'Internet',        tag: { name: 'Utilities',   icon: 'wifi',         colorHex: 'var(--color-app-yellow)', parentName: 'Housing'     }, amount: 45,   type: 'EXPENSE', transactionDate: '2025-03-05' },
    { id: '10', name: 'Gym',             tag: { name: 'Fitness',     icon: 'heart',        colorHex: 'var(--color-app-pink)', parentName: 'Health'      }, amount: 40,   type: 'EXPENSE', transactionDate: '2025-03-01' },
    { id: '11', name: 'Spotify',         tag: { name: 'Subscriptions', icon: 'music',      colorHex: 'var(--color-app-blue)', parentName: 'Entertainment' }, amount: 10, type: 'EXPENSE', transactionDate: '2025-03-01' },
    { id: '12', name: 'Cinema',          tag: { name: 'Leisure',     icon: 'film',         colorHex: 'var(--color-app-blue)', parentName: 'Entertainment' }, amount: 25, type: 'EXPENSE', transactionDate: '2025-03-12' },
    // { id: '13', name: 'Metro Pass',      tag: { name: 'Transport',   icon: 'train',        colorHex: 'var(--color-app-teal)', parentName: null           }, amount: 55,   type: 'EXPENSE', transactionDate: '2025-03-01' },
];

const Features: React.FC = () => {
    return (
        <section className="py-24 px-4 max-w-6xl mx-auto space-y-32 z-10 relative">
            
            {/* Feature A — Wallets & Currencies */}
            <div className="flex flex-col md:flex-row items-center gap-24 md:gap-24">
                <div className="flex-1 space-y-6">
                    <div className="theme-text-brand font-semibold tracking-wide uppercase text-sm">Multi-Currency</div>
                    <h2 className="text-4xl md:text-5xl font-bold leading-tight">Unlimited Wallets.<br/>Automatic Conversions.</h2>
                    <p className="theme-text-muted text-lg leading-relaxed">
                        Create as many wallets as you need — one for daily spending, one for travel, one shared with your partner. Each wallet can have its own base currency. Exchange rates are fetched automatically from the <a href="https://frankfurter.dev/" target="_blank" rel="noopener noreferrer" className="theme-text-primary hover:underline">Frankfurter API</a> (powered by the European Central Bank), so every balance and total is always shown in both the original and converted amount.
                    </p>
                </div>
                <div className="flex-1 relative perspective-1000 h-80 w-full flex justify-center items-center">
                    <div className="absolute transform translate-x-4 translate-y-4 rotate-12 bg-gradient-to-br theme-gradient-brand-from-transparent theme-gradient-brand-to-transparent border border-app-border backdrop-blur-md shadow-2xl p-6 rounded-2xl w-64 h-40 transition-transform hover:rotate-6 hover:translate-y-2 duration-500 cursor-default">
                        <div className="flex items-center gap-3 mb-4"><Wallet className="theme-text-brand"/><span className="font-semibold theme-text-muted">Travel Fund</span></div>
                        <div className="text-2xl font-bold theme-text-default">¥ 124,500</div>
                        <div className="text-sm theme-text-subtle mt-2">Base: JPY</div>
                    </div>
                    <div className="absolute transform -translate-x-4 -rotate-6 bg-gradient-to-br theme-gradient-primary-from-transparent theme-gradient-primary-to-transparent border border-app-border backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,255,255,0.2)] p-6 rounded-2xl w-72 h-44 z-10 transition-transform hover:rotate-0 hover:-translate-y-2 duration-500 cursor-default">
                        <div className="flex items-center gap-3 mb-4"><Wallet className="theme-text-primary"/><span className="font-semibold theme-text-default">Main Account</span></div>
                        <div className="text-3xl font-bold theme-text-default">$ 12,450.00</div>
                        <div className="text-sm text-app-green mt-2">+ $ 2,400 this month</div>
                    </div>
                </div>
            </div>

            {/* ── Row 1 — Tags & Transaction Preview ─────────────────────── */}
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
                {/* Left on desktop, below on mobile */}
                <div className="flex-1 w-full order-2 md:order-1">
                    <div className="bg-app-input border border-app-border rounded-3xl p-6 backdrop-blur-sm shadow-xl w-full space-y-4">
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 theme-bg-overlay-light p-4 rounded-2xl border border-app-border hover:border-app-border transition-colors">
                            <div className="w-12 h-12 rounded-full bg-app-green/20 flex items-center justify-center shrink-0"><BarChart3 className="text-app-green w-6 h-6"/></div>
                            <div className="flex-1 min-w-[120px]">
                                <div className="font-semibold theme-text-default text-lg">Salary</div>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full theme-bg-primary-transparent theme-text-primary-light border theme-border-primary text-xs mt-1.5">Main Job</div>
                            </div>
                            <div className="text-app-green font-bold text-xl sm:text-right w-full sm:w-auto">+€2,100.00</div>
                        </div>
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 theme-bg-overlay-light p-4 rounded-2xl border border-app-border hover:border-app-border transition-colors">
                            <div className="w-12 h-12 rounded-full bg-app-red/20 flex items-center justify-center shrink-0"><Tags className="text-app-red w-6 h-6"/></div>
                            <div className="flex-1 min-w-[120px]">
                                <div className="font-semibold theme-text-default text-lg">Groceries</div>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full theme-bg-warning-transparent theme-text-warning-light border theme-border-warning text-xs mt-1.5">Food & Dining</div>
                            </div>
                            <div className="text-app-red font-bold text-xl sm:text-right w-full sm:w-auto">-€124.50</div>
                        </div>
                    </div>
                </div>
                {/* Right on desktop, above on mobile */}
                <div className="flex-1 space-y-6 order-1 md:order-2">
                    <div className="theme-text-primary font-semibold tracking-wide uppercase text-sm">Deep Analytics</div>
                    <h2 className="text-4xl md:text-5xl font-bold leading-tight">Hierarchical Tags.<br/>Rich Visualizations.</h2>
                    <p className="theme-text-muted text-lg leading-relaxed">
                        Every transaction is categorized with a full tag hierarchy — parent categories with sub-tags, each with its own color and icon. <span className="text-app-green">Income is always green</span>, <span className="text-app-red">expenses are red</span> — you know where you stand at a glance.
                    </p>
                </div>
            </div>

            {/* ── Row 2 — Pie Chart ──────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
                {/* Left: explanation */}
                <div className="flex-1 space-y-6">
                    <div className="theme-text-brand font-semibold tracking-wide uppercase text-sm">Category Breakdown</div>
                    <h2 className="text-4xl md:text-5xl font-bold leading-tight">Nested Pie Charts.</h2>
                    <p className="theme-text-muted text-lg leading-relaxed">
                        Spending is visualized as an interactive <strong className="theme-text-default">nested donut chart</strong> — the inner ring groups by parent category, the outer ring breaks into sub-tags. Hover any slice to see the exact amount and percentage. It's the fastest way to spot where your money goes.
                    </p>
                </div>
                {/* Right: pie chart */}
                <div className="flex-1 w-full">
                    <ThemeProvider theme={darkMuiTheme}>
                        <TransactionPieChart transactions={DEMO_TRANSACTIONS} type="EXPENSE" title="Distribution" />
                    </ThemeProvider>
                </div>
            </div>

            {/* ── Row 3 — Sankey Diagram ─────────────────────────────────── */}
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
                {/* Left on desktop, below on mobile */}
                <div className="flex-1 w-full order-2 md:order-1">
                    <ThemeProvider theme={darkMuiTheme}>
                        <CashFlowSankey transactions={DEMO_TRANSACTIONS} />
                    </ThemeProvider>
                </div>
                {/* Right on desktop, above on mobile */}
                <div className="flex-1 space-y-6 order-1 md:order-2">
                    <div className="theme-text-primary font-semibold tracking-wide uppercase text-sm">Cash Flow</div>
                    <h2 className="text-4xl md:text-5xl font-bold leading-tight">Sankey Diagram.</h2>
                    <p className="theme-text-muted text-lg leading-relaxed">
                        A full <strong className="theme-text-default">Sankey diagram</strong> maps every euro from its income source — salary, freelance, investments — through a central node and out to each expense category. The width of each flow is proportional to the amount, so you instantly see the balance between earning and spending. Savings (or deficit) appear as a distinct node at the end.
                    </p>
                </div>
            </div>

            {/* Feature C & D Grid */}
            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-app-input border border-app-border rounded-3xl p-8 backdrop-blur-sm hover:bg-app-hover transition-all hover:-translate-y-1 duration-300 cursor-default">
                    <Calendar className="theme-text-warning w-10 h-10 mb-6" />
                    <h3 className="text-2xl font-bold mb-3">The Subscription Engine</h3>
                    <p className="theme-text-muted leading-relaxed">
                        Go beyond basic "monthly" repeats. I built a cron-based engine that supports complex recurrence rules — like "every last working day of the month" or "every 2 weeks on Friday." Each subscription renders on an interactive calendar and tracks upcoming payments with a full timeline view.
                    </p>
                </div>
                <div className="bg-app-input border border-app-border rounded-3xl p-8 backdrop-blur-sm hover:bg-app-hover transition-all hover:-translate-y-1 duration-300 relative overflow-hidden cursor-default">
                    <Users className="theme-text-brand w-10 h-10 mb-6 relative z-10" />
                    <h3 className="text-2xl font-bold mb-3 relative z-10">Wallet Collaboration</h3>
                    <p className="theme-text-muted leading-relaxed relative z-10">
                        Share any wallet with other people. I implemented an invitation system where you can assign roles — <strong className="theme-text-default">Owner</strong>, <strong className="theme-text-default">Editor</strong>, or <strong className="theme-text-default">Viewer</strong> — so couples, roommates, or families can manage shared finances together with the right level of control.
                    </p>
                    {/* Decorative floating avatars */}
                    <div className="absolute -bottom-6 -right-6 flex -space-x-4 opacity-40 filter blur-[1px]">
                        <div className="w-16 h-16 rounded-full border-4 border-app-bg theme-bg-primary"></div>
                        <div className="w-16 h-16 rounded-full border-4 border-app-bg theme-bg-brand"></div>
                        <div className="w-16 h-16 rounded-full border-4 border-app-bg theme-bg-brand"></div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Features;

