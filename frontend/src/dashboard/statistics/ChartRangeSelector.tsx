import type { Transaction } from '../../utils/types.ts';

export interface MonthlyBucket {
    date: Date;
    income: number;
    expense: number;
}

/**
 * Groups transactions into monthly buckets, sorted by date ascending.
 */
export function buildMonthlyBuckets(transactions: Transaction[]): MonthlyBucket[] {
    if (transactions.length === 0) return [];

    const bucketsMap = new Map<string, MonthlyBucket>();

    transactions.forEach(tx => {
        const d = new Date(tx.transactionDate);
        const year = d.getFullYear();
        const month = d.getMonth();
        const key = `${year}-${month}`;

        if (!bucketsMap.has(key)) {
            bucketsMap.set(key, {
                date: new Date(year, month, 1),
                income: 0,
                expense: 0
            });
        }

        const bucket = bucketsMap.get(key)!;
        if (tx.type === 'INCOME') {
            bucket.income += tx.amount;
        } else if (tx.type === 'EXPENSE') {
            bucket.expense += tx.amount;
        }
    });

    return Array.from(bucketsMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}
