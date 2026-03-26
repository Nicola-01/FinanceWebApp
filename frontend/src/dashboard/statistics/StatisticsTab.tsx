import React, { useState, useCallback } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useWalletContext } from '../wallet/WalletContext.tsx';
import { MonthlyOverview } from './MonthlyOverview.tsx';
import { MonthlySnapshotChart } from './MonthlySnapshotChart.tsx';
import { CumulativeChart } from './CumulativeChart.tsx';
import type { ZoomData } from '@mui/x-charts/internals';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        background: { paper: '#1a1a1a' }
    },
});

type ChartMode = 'snapshot' | 'cumulative';

export const StatisticsTab: React.FC = () => {
    const { transactions } = useWalletContext();
    const [chartMode, setChartMode] = useState<ChartMode>('snapshot');
    const [zoomData, setZoomData] = useState<ZoomData[]>([{ axisId: 'x-axis', start: 0, end: 100 }]);

    const handleZoomChange = useCallback((newZoom: ZoomData[]) => {
        setZoomData(newZoom);
    }, []);

    const toggle = (
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5">
            <button
                onClick={() => setChartMode('snapshot')}
                className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                    chartMode === 'snapshot'
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
            >
                Monthly
            </button>
            <button
                onClick={() => setChartMode('cumulative')}
                className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                    chartMode === 'cumulative'
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
            >
                Cumulative
            </button>
        </div>
    );

    return (
        <ThemeProvider theme={darkTheme}>
            <div className="flex flex-col flex-1 animate-[fadeIn_0.3s_ease-out] pb-10 relative">
                {/* Monthly/Yearly Overview Table */}
                <MonthlyOverview transactions={transactions} />

                {/* Chart with toggle inside */}
                <div className="mt-2">
                    {chartMode === 'snapshot' ? (
                        <MonthlySnapshotChart
                            transactions={transactions}
                            headerRight={toggle}
                            zoomData={zoomData}
                            onZoomChange={handleZoomChange}
                        />
                    ) : (
                        <CumulativeChart
                            transactions={transactions}
                            headerRight={toggle}
                            zoomData={zoomData}
                            onZoomChange={handleZoomChange}
                        />
                    )}
                </div>
            </div>
        </ThemeProvider>
    );
};