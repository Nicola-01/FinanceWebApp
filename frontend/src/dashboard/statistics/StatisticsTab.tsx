import React, { useState } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useWalletContext } from '../wallet/WalletContext.tsx';
import { OverviewTable } from './OverviewTable.tsx';
import { MonthlySnapshotChart } from './MonthlySnapshotChart.tsx';
import { CumulativeChart } from './CumulativeChart.tsx';
import { SwitchableCard } from './SwitchableCard.tsx';
import type { ZoomData } from '@mui/x-charts/internals';

import { useTheme } from '../../utils/ThemeContext.tsx';
import { buildMonthlyBuckets } from './ChartRangeSelector.tsx';

const lightTheme = createTheme({
    palette: { mode: 'light', background: { paper: '#ffffff' } },
});

const darkTheme = createTheme({
    palette: { mode: 'dark', background: { paper: 'var(--color-app-card)' } },
});

type ChartMode = 'snapshot' | 'cumulative';

const CHART_TABS = [
    {
        key: 'snapshot',
        label: 'Monthly',
        title: 'Monthly Snapshot',
        subtitle: 'Income & expenses per month with net balance line.',
    },
    {
        key: 'cumulative',
        label: 'Cumulative',
        title: 'Cumulative',
        subtitle: 'Running total of income & expenses over time.',
    },
];

export const StatisticsTab: React.FC = () => {
    const { transactions, wallet } = useWalletContext();
    const { resolvedTheme } = useTheme();
    const [chartMode, setChartMode] = useState<ChartMode>('snapshot');
    const [zoomData, setZoomData] = useState<ZoomData[]>([{ axisId: 'x-axis', start: 0, end: 100 }]);
    const [zoomInitializedForWallet, setZoomInitializedForWallet] = useState<string | null>(null);

    const initialZoomCalculated = React.useMemo(() => {
        if (wallet.id !== zoomInitializedForWallet && transactions && transactions.length > 0) {
            const buckets = buildMonthlyBuckets(transactions);
            const totalMonths = buckets.length;
            if (totalMonths > 12) {
                const startPercent = ((totalMonths - 12) / totalMonths) * 100;
                return [{ axisId: 'x-axis', start: startPercent, end: 100 }];
            }
            return [{ axisId: 'x-axis', start: 0, end: 100 }];
        }
        return null;
    }, [transactions, wallet.id, zoomInitializedForWallet]);

    const effectiveZoomData = initialZoomCalculated || zoomData;

    React.useEffect(() => {
        if (initialZoomCalculated) {
            setZoomData(initialZoomCalculated);
            setZoomInitializedForWallet(wallet.id);
        }
    }, [initialZoomCalculated, wallet.id]);

    const handleZoomChange = React.useCallback((newZoom: ZoomData[]) => {
        setZoomData(newZoom);
    }, []);

    const currentTab = CHART_TABS.find(t => t.key === chartMode)!;

    return (
        <ThemeProvider theme={resolvedTheme === 'dark' ? darkTheme : lightTheme}>
            <div className="flex flex-col flex-1 animate-[fadeIn_0.3s_ease-out] pb-10 relative">
                {/* Monthly/Yearly Overview Table */}
                <OverviewTable transactions={transactions} />

                {/* Chart with SwitchableCard */}
                <div className="mt-2">
                    <SwitchableCard
                        tabs={CHART_TABS}
                        activeTab={chartMode}
                        onTabChange={(key) => setChartMode(key as ChartMode)}
                        title={currentTab.title}
                        subtitle={currentTab.subtitle}
                    >
                        {chartMode === 'snapshot' ? (
                            <MonthlySnapshotChart
                                transactions={transactions}
                                zoomData={effectiveZoomData}
                                onZoomChange={handleZoomChange}
                            />
                        ) : (
                            <CumulativeChart
                                transactions={transactions}
                                zoomData={effectiveZoomData}
                                onZoomChange={handleZoomChange}
                            />
                        )}
                    </SwitchableCard>
                </div>
            </div>
        </ThemeProvider>
    );
};