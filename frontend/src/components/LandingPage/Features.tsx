import React from 'react';
import { Wallet, BarChart3, Tags, Calendar, Users } from 'lucide-react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { TransactionPieChart } from '../../dashboard/tag/CategoryCharts.tsx';
import { CashFlowSankey } from '../../dashboard/statistics/CashFlowSankey.tsx';
import type { Transaction } from '../../utils/types.ts';

/* ── MUI dark theme for chart components ──────────────────────────── */
const darkMuiTheme = createTheme({
    palette: { mode: 'dark', background: { paper: '#1a1a1a' } },
});

/* ── Demo transaction data for landing page charts ────────────────── */
const DEMO_TRANSACTIONS: Transaction[] = [
    // Income
    { id: '1',  name: 'Salary',          tag: { name: 'Main Job',    icon: 'briefcase',    colorHex: '#00ff7f', parentName: 'Work'        }, amount: 2100, type: 'INCOME',  transactionDate: '2025-03-01' },
    { id: '2',  name: 'Bonus',           tag: { name: 'Bonus',       icon: 'laptop',       colorHex: '#06b6d4', parentName: 'Work'        }, amount: 350,  type: 'INCOME',  transactionDate: '2025-03-05' },
    { id: '3',  name: 'Dividends',       tag: { name: 'Investments', icon: 'trending-up',  colorHex: '#a855f7', parentName: null           }, amount: 120,  type: 'INCOME',  transactionDate: '2025-03-10' },
    // Expenses
    { id: '5',  name: 'Rent',            tag: { name: 'Rent',        icon: 'home',         colorHex: '#ff4d4d', parentName: 'Housing'     }, amount: 650,  type: 'EXPENSE', transactionDate: '2025-03-01' },
    { id: '6',  name: 'Groceries',       tag: { name: 'Groceries',   icon: 'shopping-cart', colorHex: '#f97316', parentName: 'Food & Dining' }, amount: 320, type: 'EXPENSE', transactionDate: '2025-03-03' },
    { id: '7',  name: 'Restaurant',      tag: { name: 'Eating Out',  icon: 'utensils',     colorHex: '#f97316', parentName: 'Food & Dining' }, amount: 95,  type: 'EXPENSE', transactionDate: '2025-03-08' },
    { id: '8',  name: 'Electricity',     tag: { name: 'Utilities',   icon: 'zap',          colorHex: '#eab308', parentName: 'Housing'     }, amount: 120,  type: 'EXPENSE', transactionDate: '2025-03-05' },
    { id: '9',  name: 'Internet',        tag: { name: 'Utilities',   icon: 'wifi',         colorHex: '#eab308', parentName: 'Housing'     }, amount: 45,   type: 'EXPENSE', transactionDate: '2025-03-05' },
    { id: '10', name: 'Gym',             tag: { name: 'Fitness',     icon: 'heart',        colorHex: '#ec4899', parentName: 'Health'      }, amount: 40,   type: 'EXPENSE', transactionDate: '2025-03-01' },
    { id: '11', name: 'Spotify',         tag: { name: 'Subscriptions', icon: 'music',      colorHex: '#3b82f6', parentName: 'Entertainment' }, amount: 10, type: 'EXPENSE', transactionDate: '2025-03-01' },
    { id: '12', name: 'Cinema',          tag: { name: 'Leisure',     icon: 'film',         colorHex: '#3b82f6', parentName: 'Entertainment' }, amount: 25, type: 'EXPENSE', transactionDate: '2025-03-12' },
    // { id: '13', name: 'Metro Pass',      tag: { name: 'Transport',   icon: 'train',        colorHex: '#14b8a6', parentName: null           }, amount: 55,   type: 'EXPENSE', transactionDate: '2025-03-01' },
];

const Features: React.FC = () => {
    return (
        <section className="py-24 px-4 max-w-6xl mx-auto space-y-32 z-10 relative">
            
            {/* Feature A — Wallets & Currencies */}
            <div className="flex flex-col md:flex-row items-center gap-24 md:gap-24">
                <div className="flex-1 space-y-6">
                    <div className="text-purple-400 font-semibold tracking-wide uppercase text-sm">Multi-Currency</div>
                    <h2 className="text-4xl md:text-5xl font-bold leading-tight">Unlimited Wallets.<br/>Automatic Conversions.</h2>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        Create as many wallets as you need — one for daily spending, one for travel, one shared with your partner. Each wallet can have its own base currency. Exchange rates are fetched automatically from the <a href="https://frankfurter.dev/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Frankfurter API</a> (powered by the European Central Bank), so every balance and total is always shown in both the original and converted amount.
                    </p>
                </div>
                <div className="flex-1 relative perspective-1000 h-80 w-full flex justify-center items-center">
                    <div className="absolute transform translate-x-4 translate-y-4 rotate-12 bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-white/10 backdrop-blur-md shadow-2xl p-6 rounded-2xl w-64 h-40 transition-transform hover:rotate-6 hover:translate-y-2 duration-500 cursor-default">
                        <div className="flex items-center gap-3 mb-4"><Wallet className="text-pink-400"/><span className="font-semibold text-white/80">Travel Fund</span></div>
                        <div className="text-2xl font-bold text-white">¥ 124,500</div>
                        <div className="text-sm text-gray-500 mt-2">Base: JPY</div>
                    </div>
                    <div className="absolute transform -translate-x-4 -rotate-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-white/10 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,255,255,0.2)] p-6 rounded-2xl w-72 h-44 z-10 transition-transform hover:rotate-0 hover:-translate-y-2 duration-500 cursor-default">
                        <div className="flex items-center gap-3 mb-4"><Wallet className="text-cyan-400"/><span className="font-semibold text-white">Main Account</span></div>
                        <div className="text-3xl font-bold text-white">$ 12,450.00</div>
                        <div className="text-sm text-[#00ff7f] mt-2">+ $ 2,400 this month</div>
                    </div>
                </div>
            </div>

            {/* ── Row 1 — Tags & Transaction Preview ─────────────────────── */}
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
                {/* Left on desktop, below on mobile */}
                <div className="flex-1 w-full order-2 md:order-1">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm shadow-xl w-full space-y-4">
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                            <div className="w-12 h-12 rounded-full bg-[#00ff7f]/20 flex items-center justify-center shrink-0"><BarChart3 className="text-[#00ff7f] w-6 h-6"/></div>
                            <div className="flex-1 min-w-[120px]">
                                <div className="font-semibold text-white text-lg">Salary</div>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/20 text-xs mt-1.5">Main Job</div>
                            </div>
                            <div className="text-[#00ff7f] font-bold text-xl sm:text-right w-full sm:w-auto">+€2,100.00</div>
                        </div>
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                            <div className="w-12 h-12 rounded-full bg-[#ff4d4d]/20 flex items-center justify-center shrink-0"><Tags className="text-[#ff4d4d] w-6 h-6"/></div>
                            <div className="flex-1 min-w-[120px]">
                                <div className="font-semibold text-white text-lg">Groceries</div>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-400/10 text-orange-300 border border-orange-400/20 text-xs mt-1.5">Food & Dining</div>
                            </div>
                            <div className="text-[#ff4d4d] font-bold text-xl sm:text-right w-full sm:w-auto">-€124.50</div>
                        </div>
                    </div>
                </div>
                {/* Right on desktop, above on mobile */}
                <div className="flex-1 space-y-6 order-1 md:order-2">
                    <div className="text-cyan-400 font-semibold tracking-wide uppercase text-sm">Deep Analytics</div>
                    <h2 className="text-4xl md:text-5xl font-bold leading-tight">Hierarchical Tags.<br/>Rich Visualizations.</h2>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        Every transaction is categorized with a full tag hierarchy — parent categories with sub-tags, each with its own color and icon. <span className="text-[#00ff7f]">Income is always green</span>, <span className="text-[#ff4d4d]">expenses are red</span> — you know where you stand at a glance.
                    </p>
                </div>
            </div>

            {/* ── Row 2 — Pie Chart ──────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
                {/* Left: explanation */}
                <div className="flex-1 space-y-6">
                    <div className="text-purple-400 font-semibold tracking-wide uppercase text-sm">Category Breakdown</div>
                    <h2 className="text-4xl md:text-5xl font-bold leading-tight">Nested Pie Charts.</h2>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        Spending is visualized as an interactive <strong className="text-white">nested donut chart</strong> — the inner ring groups by parent category, the outer ring breaks into sub-tags. Hover any slice to see the exact amount and percentage. It's the fastest way to spot where your money goes.
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
                    <div className="text-cyan-400 font-semibold tracking-wide uppercase text-sm">Cash Flow</div>
                    <h2 className="text-4xl md:text-5xl font-bold leading-tight">Sankey Diagram.</h2>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        A full <strong className="text-white">Sankey diagram</strong> maps every euro from its income source — salary, freelance, investments — through a central node and out to each expense category. The width of each flow is proportional to the amount, so you instantly see the balance between earning and spending. Savings (or deficit) appear as a distinct node at the end.
                    </p>
                </div>
            </div>

            {/* Feature C & D Grid */}
            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm hover:bg-white/10 transition-all hover:-translate-y-1 duration-300 cursor-default">
                    <Calendar className="text-orange-400 w-10 h-10 mb-6" />
                    <h3 className="text-2xl font-bold mb-3">The Subscription Engine</h3>
                    <p className="text-gray-400 leading-relaxed">
                        Go beyond basic "monthly" repeats. I built a cron-based engine that supports complex recurrence rules — like "every last working day of the month" or "every 2 weeks on Friday." Each subscription renders on an interactive calendar and tracks upcoming payments with a full timeline view.
                    </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm hover:bg-white/10 transition-all hover:-translate-y-1 duration-300 relative overflow-hidden cursor-default">
                    <Users className="text-pink-400 w-10 h-10 mb-6 relative z-10" />
                    <h3 className="text-2xl font-bold mb-3 relative z-10">Wallet Collaboration</h3>
                    <p className="text-gray-400 leading-relaxed relative z-10">
                        Share any wallet with other people. I implemented an invitation system where you can assign roles — <strong className="text-white">Owner</strong>, <strong className="text-white">Editor</strong>, or <strong className="text-white">Viewer</strong> — so couples, roommates, or families can manage shared finances together with the right level of control.
                    </p>
                    {/* Decorative floating avatars */}
                    <div className="absolute -bottom-6 -right-6 flex -space-x-4 opacity-40 filter blur-[1px]">
                        <div className="w-16 h-16 rounded-full border-4 border-[#0d0d12] bg-cyan-500"></div>
                        <div className="w-16 h-16 rounded-full border-4 border-[#0d0d12] bg-purple-500"></div>
                        <div className="w-16 h-16 rounded-full border-4 border-[#0d0d12] bg-pink-500"></div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Features;

