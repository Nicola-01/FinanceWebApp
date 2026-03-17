import React from 'react';
import {pieArcLabelClasses, PieChart} from '@mui/x-charts/PieChart';
import {createTheme, styled, ThemeProvider} from '@mui/material/styles';
import {useDrawingArea} from '@mui/x-charts/hooks';
import type {Transaction} from '../../utils/types.ts';
import {CashFlowSankey} from './CashFlowSankey.tsx';

interface StatisticsTabProps {
    transactions: Transaction[];
}

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        background: { paper: '#1a1a1a' }
    },
});

const hexToRgba = (hex: string, alpha: number): string => {
    if (!hex) return `rgba(0, 255, 127, ${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const StyledText = styled('text')(() => ({
    fill: '#ffffff',
    textAnchor: 'middle',
    dominantBaseline: 'central',
    fontSize: 16,
    fontWeight: 'bold'
}));

function PieCenterLabel({ children }: { children: React.ReactNode }): React.ReactElement {
    const { width, height, left, top } = useDrawingArea();
    return (
        <StyledText x={left + width / 2} y={top + height / 2}>
            {children}
        </StyledText>
    );
}

const TransactionPieChart = ({ transactions, type, title }: { transactions: Transaction[], type: 'INCOME' | 'EXPENSE', title: string }) => {
    const txs = transactions.filter(t => t.type === type);
    const totalAmount = txs.reduce((acc, t) => acc + t.amount, 0);

    if (totalAmount === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] w-full bg-white/5 rounded-2xl border border-white/10">
                <p className="text-white/40">No {title.toLowerCase()} data available.</p>
            </div>
        );
    }

    const mainMap = new Map<string, { value: number, color: string }>();
    const subMap = new Map<string, { main: string, value: number, color: string }>();

    txs.forEach(tx => {
        const mainName = tx.tag.parentName || tx.tag.name;
        const subName = tx.tag.name;

        if (!mainMap.has(mainName)) mainMap.set(mainName, { value: 0, color: tx.tag.colorHex });
        mainMap.get(mainName)!.value += tx.amount;

        if (!subMap.has(subName)) subMap.set(subName, { main: mainName, value: 0, color: tx.tag.colorHex });
        subMap.get(subName)!.value += tx.amount;
    });

    const innerData = Array.from(mainMap.entries())
        .sort((a, b) => b[1].value - a[1].value)
        .map(([id, data]) => ({
            id, label: id, value: data.value, percentage: (data.value / totalAmount) * 100, color: data.color
        }));

    const outerData: any[] = [];
    innerData.forEach(mainItem => {
        const subs = Array.from(subMap.entries())
            .filter(([_, data]) => data.main === mainItem.id)
            .sort((a, b) => b[1].value - a[1].value);

        subs.forEach(([subId, subData]) => {
            outerData.push({
                id: subId, label: subId, value: subData.value, percentage: (subData.value / totalAmount) * 100,
                color: subId === mainItem.id ? subData.color : hexToRgba(subData.color, 0.6)
            });
        });
    });

    const innerRadius = 70;
    const middleRadius = 140;

    return (
        <div className="flex flex-col items-center w-full bg-black/20 rounded-2xl border border-white/10 py-3 md:p-6">
            <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider">{title}</h3>

            <div className="w-full flex justify-center h-[400px]">
                <PieChart
                    series={[
                        {
                            innerRadius,
                            outerRadius: middleRadius,
                            data: innerData,
                            arcLabel: (item) => (item as any).percentage > 5 ? `${item.id}` : '',
                            valueFormatter: ({ value }) => `${value.toFixed(2)} (${((value / totalAmount) * 100).toFixed(1)}%)`,
                            highlightScope: { fade: 'global', highlight: 'item' },
                            highlighted: { additionalRadius: 2 },
                            cornerRadius: 3,
                        },
                        {
                            innerRadius: middleRadius + 2,
                            outerRadius: middleRadius + 20,
                            data: outerData,
                            arcLabel: (item) => (item as any).percentage > 3 ? `${item.id}` : '',
                            valueFormatter: ({ value }) => `${value.toFixed(2)} (${((value / totalAmount) * 100).toFixed(1)}%)`,
                            arcLabelRadius: middleRadius + 35,
                            highlightScope: { fade: 'global', highlight: 'item' },
                            highlighted: { additionalRadius: 2 },
                            cornerRadius: 2,
                        },
                    ]}
                    sx={{
                        [`& .${pieArcLabelClasses.root}`]: { fill: '#ffffff', fontSize: '11px', fontWeight: 'bold' },
                    }}
                    hideLegend
                >
                    <PieCenterLabel>{totalAmount.toFixed(0)}</PieCenterLabel>
                </PieChart>
            </div>
        </div>
    );
};

export const StatisticsTab: React.FC<StatisticsTabProps> = ({ transactions }) => {
    return (
        <ThemeProvider theme={darkTheme}>
            {/* Contenitore con scroll per vedere bene tutti i grafici */}
            <div className="flex flex-col h-full animate-[fadeIn_0.3s_ease-out] overflow-y-auto pb-10 custom-scrollbar pr-2">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white">Visual Distribution</h2>
                    <p className="text-white/50 text-sm">Analyze your income and expenses by category and sub-category.</p>
                </div>

                {/* 1. I Grafici a Torta in cima */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <TransactionPieChart transactions={transactions} type="INCOME" title="Income Distribution" />
                    <TransactionPieChart transactions={transactions} type="EXPENSE" title="Expense Distribution" />
                </div>

                {/* 2. Il Grafico Sankey sotto */}
                <CashFlowSankey transactions={transactions} />
            </div>
        </ThemeProvider>
    );
};