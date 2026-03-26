import React, { useMemo, useId } from 'react';
import { ChartDataProviderPro } from '@mui/x-charts-pro/ChartDataProviderPro';
import { ChartsSurface } from '@mui/x-charts-pro/ChartsSurface';
import { LinePlot } from '@mui/x-charts-pro/LineChart';
import { ChartsXAxis } from '@mui/x-charts-pro/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts-pro/ChartsYAxis';
import { ChartsTooltip } from '@mui/x-charts-pro/ChartsTooltip';
import { ChartsGrid } from '@mui/x-charts-pro/ChartsGrid';
import { ChartZoomSlider } from '@mui/x-charts-pro/ChartZoomSlider';
import { ChartsClipPath } from '@mui/x-charts-pro/ChartsClipPath';
import { ChartsAxisHighlight } from '@mui/x-charts/ChartsAxisHighlight';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { Transaction } from '../../utils/types.ts';
import { buildMonthlyBuckets } from './ChartRangeSelector.tsx';
import type { ZoomData } from '@mui/x-charts/internals';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const chartTheme = createTheme({
    palette: { mode: 'dark', background: { paper: 'transparent' } },
});

interface CumulativeChartProps {
    transactions: Transaction[];
    headerRight?: React.ReactNode;
    zoomData?: readonly ZoomData[];
    onZoomChange?: (zoomData: ZoomData[]) => void;
}

export const CumulativeChart: React.FC<CumulativeChartProps> = ({ transactions, headerRight, zoomData, onZoomChange }) => {
    const clipPathId = useId();

    const buckets = useMemo(() => buildMonthlyBuckets(transactions), [transactions]);

    const labels = useMemo(() =>
        buckets.map(b => {
            const m = MONTH_LABELS[b.date.getMonth()];
            const y = b.date.getFullYear();
            return `${m} ${y}`;
        }),
    [buckets]);

    // Cumulative always starts from the very beginning so that
    // zooming into recent months still shows the accumulated totals.
    const dataset = useMemo(() => {
        let cumIncome = 0;
        let cumExpense = 0;
        return buckets.map((b, i) => {
            cumIncome += b.income;
            cumExpense += b.expense;
            return {
                label: labels[i],
                income: cumIncome,
                expense: cumExpense,
                balance: cumIncome - cumExpense,
            };
        });
    }, [buckets, labels]);

    if (dataset.length === 0) {
        return (
            <div className="bg-black/20 rounded-2xl border border-white/10 p-6">
                <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-4">Cumulative</h3>
                <div className="flex items-center justify-center h-[300px] text-white/40">
                    No data available.
                </div>
            </div>
        );
    }

    return (
        <ThemeProvider theme={chartTheme}>
            <div className="bg-black/20 rounded-2xl border border-white/10 p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-1">
                    <h3 className="text-xl font-bold text-white uppercase tracking-wider">Cumulative</h3>
                    {headerRight}
                </div>
                <p className="text-white/40 text-xs mb-4">Running total of income & expenses over time. Use the slider below to zoom.</p>

                <ChartDataProviderPro
                    height={420}
                    dataset={dataset}
                    series={[
                        {
                            type: 'line',
                            dataKey: 'income',
                            label: 'Cumulative Income',
                            color: '#34d399',
                            curve: 'monotoneX',
                            showMark: false,
                            valueFormatter: (v) => v == null ? '' : `+${v.toFixed(2)}`,
                        },
                        {
                            type: 'line',
                            dataKey: 'expense',
                            label: 'Cumulative Expenses',
                            color: '#f87171',
                            curve: 'monotoneX',
                            showMark: false,
                            valueFormatter: (v) => v == null ? '' : `-${v.toFixed(2)}`,
                        },
                        {
                            type: 'line',
                            dataKey: 'balance',
                            label: 'Net Balance',
                            color: '#60a5fa',
                            curve: 'monotoneX',
                            showMark: false,
                            valueFormatter: (v) => v == null ? '' : `${v >= 0 ? '+' : ''}${v.toFixed(2)}`,
                        },
                    ]}
                    xAxis={[{
                        id: 'x-axis',
                        scaleType: 'band',
                        dataKey: 'label',
                        zoom: { slider: { enabled: true }, minSpan: 5, panning: true },
                    }]}
                    yAxis={[{
                        id: 'y-axis',
                        tickLabelStyle: { fill: '#ffffff60', fontSize: 11 },
                    }]}
                    initialZoom={zoomData ?? [{ axisId: 'x-axis', start: 0, end: 100 }]}
                    onZoomChange={onZoomChange}
                >
                    <ChartsSurface>
                        <ChartsClipPath id={clipPathId} />
                        <ChartsGrid horizontal />
                        <g clipPath={`url(#${clipPathId})`}>
                            <LinePlot />
                        </g>
                        <ChartsXAxis axisId="x-axis" />
                        <ChartsYAxis axisId="y-axis" />
                        <ChartsAxisHighlight x="line" />
                        <ChartZoomSlider />
                    </ChartsSurface>
                    <ChartsTooltip />
                </ChartDataProviderPro>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mt-3">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-1 rounded-full bg-emerald-400" />
                        <span className="text-xs text-white/60">Cum. Income</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-1 rounded-full bg-red-400" />
                        <span className="text-xs text-white/60">Cum. Expenses</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-1 rounded-full bg-blue-400" />
                        <span className="text-xs text-white/60">Net Balance</span>
                    </div>
                </div>
            </div>
        </ThemeProvider>
    );
};
