import React, { useState, useCallback } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useWalletContext } from '../wallet/WalletContext.tsx';
import { OverviewTable } from './OverviewTable.tsx';
import { MonthlySnapshotChart } from './MonthlySnapshotChart.tsx';
import { CumulativeChart } from './CumulativeChart.tsx';
import { SwitchableCard } from './SwitchableCard.tsx';
import type { ZoomData } from '@mui/x-charts/internals';

import { useTheme } from '../../utils/ThemeContext.tsx';

const lightTheme = createTheme({
    palette: { mode: 'light', background: { paper: '#ffffff' } },
});

const darkTheme = createTheme({
    palette: { mode: 'dark', background: { paper: '#1a1a1a' } },
});

type ChartMode = 'snapshot' | 'cumulative';

const CHART_TABS = [
    { key: 'snapshot', label: 'Monthly' },
    { key: 'cumulative', label: 'Cumulative' },
];

const CHART_META: Record<ChartMode, { title: string; subtitle: string }> = {
    snapshot: {
        title: 'Monthly Snapshot',
        subtitle: 'Income & expenses per month with net balance line. Use the slider below to zoom.',
    },
    cumulative: {
        title: 'Cumulative',
        subtitle: 'Running total of income & expenses over time. Use the slider below to zoom.',
    },
};

export const StatisticsTab: React.FC = () => {
    const { transactions } = useWalletContext();
    const { resolvedTheme } = useTheme();
    const [chartMode, setChartMode] = useState<ChartMode>('snapshot');
    const [zoomData, setZoomData] = useState<ZoomData[]>([{ axisId: 'x-axis', start: 0, end: 100 }]);

    const handleZoomChange = useCallback((newZoom: ZoomData[]) => {
        setZoomData(newZoom);
    }, []);

    const meta = CHART_META[chartMode];

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
                        title={meta.title}
                        subtitle={meta.subtitle}
                    >
                        {chartMode === 'snapshot' ? (
                            <MonthlySnapshotChart
                                transactions={transactions}
                                zoomData={zoomData}
                                onZoomChange={handleZoomChange}
                            />
                        ) : (
                            <CumulativeChart
                                transactions={transactions}
                                zoomData={zoomData}
                                onZoomChange={handleZoomChange}
                            />
                        )}
                    </SwitchableCard>
                </div>
            </div>
        </ThemeProvider>
    );
};