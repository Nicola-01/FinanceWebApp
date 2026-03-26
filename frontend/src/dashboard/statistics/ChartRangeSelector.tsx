import React from 'react';

export type RangePreset = 'all' | '10y' | '5y' | '1y';

const PRESETS: { key: RangePreset; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: '10y', label: '10Y' },
    { key: '5y', label: '5Y' },
    { key: '1y', label: '1Y' },
];

interface ChartRangeSelectorProps {
    value: RangePreset;
    onChange: (preset: RangePreset) => void;
}

export const ChartRangeSelector: React.FC<ChartRangeSelectorProps> = ({ value, onChange }) => {
    return (
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5">
            {PRESETS.map(p => (
                <button
                    key={p.key}
                    onClick={() => onChange(p.key)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        value === p.key
                            ? 'bg-white/15 text-white shadow-sm'
                            : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                    }`}
                >
                    {p.label}
                </button>
            ))}
        </div>
    );
};

export interface MonthBucket {
    date: Date;         // 1st of the month
    income: number;
    expense: number;
}

/**
 * Aggregate transactions into monthly buckets sorted chronologically.
 * Always uses ALL transactions to build the full timeline.
 */
export function buildMonthlyBuckets(
    transactions: { transactionDate: string; type: string; amount: number }[]
): MonthBucket[] {
    const map = new Map<string, MonthBucket>();

    transactions.forEach(tx => {
        const d = new Date(tx.transactionDate);
        const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;

        if (!map.has(key)) {
            map.set(key, { date: new Date(d.getFullYear(), d.getMonth(), 1), income: 0, expense: 0 });
        }
        const entry = map.get(key)!;
        if (tx.type === 'INCOME') entry.income += tx.amount;
        else entry.expense += tx.amount;
    });

    return Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Compute zoom range [0-100, 0-100] for a given preset relative to the full data extent.
 */
export function getZoomForPreset(preset: RangePreset, buckets: MonthBucket[]): [number, number] {
    if (preset === 'all' || buckets.length === 0) return [0, 100];

    const first = buckets[0].date.getTime();
    const last = buckets[buckets.length - 1].date.getTime();
    const totalSpan = last - first;
    if (totalSpan <= 0) return [0, 100];

    const now = Date.now();
    const yearsBack = preset === '10y' ? 10 : preset === '5y' ? 5 : 1;
    const cutoff = new Date(new Date().getFullYear() - yearsBack, new Date().getMonth(), 1).getTime();

    const startPct = Math.max(0, ((cutoff - first) / totalSpan) * 100);
    return [startPct, 100];
}
