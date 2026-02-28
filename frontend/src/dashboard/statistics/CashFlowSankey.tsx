import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import {useTheme} from '@mui/material/styles';
import {SankeyDataProvider, SankeyLinkPlot, SankeyNodePlot, SankeyTooltip,} from '@mui/x-charts-pro/SankeyChart';
import {ChartsWrapper} from '@mui/x-charts-pro/ChartsWrapper';
import {ChartsSurface} from '@mui/x-charts-pro/ChartsSurface';
import type {Transaction} from '../../utils/types';

interface CashFlowSankeyProps {
    transactions: Transaction[];
}

export const CashFlowSankey: React.FC<CashFlowSankeyProps> = ({ transactions }) => {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));

    // --- ELABORAZIONE DATI PER IL SANKEY ---
    const nodesMap = new Map<string, { id: string, label: string, color: string }>();
    const linksMap = new Map<string, { source: string, target: string, value: number }>();

    let hasData = false;

    // Nodo Centrale (Il Wallet)
    nodesMap.set('Wallet', { id: 'Wallet', label: 'Wallet', color: '#ffffff' });

    transactions.forEach(tx => {
        if (tx.amount <= 0) return;
        const isIncome = tx.type === 'INCOME';
        const isExpense = tx.type === 'EXPENSE';
        if (!isIncome && !isExpense) return;
        hasData = true;

        const mainName = tx.tag.parentName || tx.tag.name;
        const subName = tx.tag.parentName ? tx.tag.name : null;

        // Usiamo un prefisso per separare le Entrate (IN) dalle Uscite (OUT) nel caso in cui i nomi dei tag siano uguali
        const mainId = isIncome ? `IN-${mainName}` : `OUT-${mainName}`;
        const subId = subName ? (isIncome ? `IN-SUB-${subName}` : `OUT-SUB-${subName}`) : null;

        // 1. Registra Nodi
        if (!nodesMap.has(mainId)) {
            nodesMap.set(mainId, { id: mainId, label: mainName, color: tx.tag.colorHex || '#595b63' });
        }
        if (subName && subId && !nodesMap.has(subId)) {
            nodesMap.set(subId, { id: subId, label: subName, color: tx.tag.colorHex || '#595b63' });
        }

        // 2. Registra Links (Archi)
        if (isIncome) {
            // Flusso Entrate: Sub-categoria -> Categoria Padre -> Wallet
            if (subName && subId) {
                const linkId = `${subId}->${mainId}`;
                const val = linksMap.get(linkId)?.value || 0;
                linksMap.set(linkId, { source: subId, target: mainId, value: val + tx.amount });
            }
            const link2Id = `${mainId}->Wallet`;
            const val2 = linksMap.get(link2Id)?.value || 0;
            linksMap.set(link2Id, { source: mainId, target: 'Wallet', value: val2 + tx.amount });
        } else {
            // Flusso Uscite: Wallet -> Categoria Padre -> Sub-categoria
            const link1Id = `Wallet->${mainId}`;
            const val1 = linksMap.get(link1Id)?.value || 0;
            linksMap.set(link1Id, { source: 'Wallet', target: mainId, value: val1 + tx.amount });

            if (subName && subId) {
                const linkId = `${mainId}->${subId}`;
                const val = linksMap.get(linkId)?.value || 0;
                linksMap.set(linkId, { source: mainId, target: subId, value: val + tx.amount });
            }
        }
    });

    if (!hasData) return null;

    const data = {
        nodes: Array.from(nodesMap.values()),
        links: Array.from(linksMap.values())
    };

    const valueFormatter = (value: number, context: { type: string }) => {
        if (context.type === 'link') return `${value.toFixed(2)}`;
        return `${value.toFixed(2)} Total`;
    };

    return (
        <Box sx={{ width: '100%', mt: 6, p: 4, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)' }}>
            <Typography variant="h5" component="h2" gutterBottom align="center" sx={{ fontWeight: 'bold', color: 'white' }}>
                Cash Flow Overview
            </Typography>
            <Typography variant="subtitle1" align="center" sx={{ mb: 4, color: 'rgba(255,255,255,0.5)' }}>
                Flow from Income to Expenses
            </Typography>

            <Box sx={{ width: '100%', height: 500 }}>
                <SankeyDataProvider
                    series={[
                        {
                            type: 'sankey' as const,
                            data,
                            valueFormatter,
                            nodeOptions: {
                                sort: 'fixed',
                                padding: 20,
                                width: 15,
                                showLabels: isDesktop, // Usa le etichette di default di MUI se su desktop
                            },
                            linkOptions: {
                                color: 'source', // Colora il link in base alla sorgente (o 'target')
                                opacity: 0.6,
                                curveCorrection: 0,
                                showValues: !isDesktop,
                            },
                        },
                    ]}
                    margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                    <ChartsWrapper>
                        <ChartsSurface>
                            <SankeyNodePlot />
                            <SankeyLinkPlot />
                        </ChartsSurface>
                        <SankeyTooltip trigger="item" />
                    </ChartsWrapper>
                </SankeyDataProvider>
            </Box>
        </Box>
    );
}