import React from 'react';

export type CellType = 'income' | 'expense' | 'balance';

interface OverviewCellProps {
    value: number;
    type: CellType;
    isBold?: boolean;
    className?: string;
}

const formatAmount = (value: number): string => {
    if (value === 0) return '—';
    return value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const OverviewCell: React.FC<OverviewCellProps> = ({
                                                              value,
                                                              type,
                                                              isBold = false,
                                                              className = ''
                                                          }) => {
    const hasData = value !== 0;
    let color = 'text-app-muted/30';
    let prefix = '';
    let displayValue = value;

    if (hasData) {
        if (type === 'income') {
            color = 'theme-text-success';
            prefix = '+';
        } else if (type === 'expense') {
            color = 'theme-text-danger';
            prefix = '-';
            displayValue = Math.abs(value);
        } else {
            color = value >= 0 ? 'theme-text-success' : 'theme-text-danger';
            prefix = value >= 0 ? '+' : '-';
            displayValue = Math.abs(value);
        }
    }

    return (
        <td className={`text-center px-1 py-3 ${className}`.trim()}>
            <span className={`text-xs md:text-sm whitespace-nowrap ${isBold ? 'font-bold' : 'font-medium'} ${color}`}>
                {hasData ? `${prefix}${formatAmount(displayValue)}` : '—'}
            </span>
        </td>
    );
};