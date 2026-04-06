import * as React from 'react';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
    Unstable_SankeyChart as SankeyChart,
    type SankeyValueFormatterContext,
} from '@mui/x-charts-pro/SankeyChart';
import type {Transaction} from '../../utils/types';
import {useTheme} from '../../utils/ThemeContext';

interface CashFlowSankeyProps {
    transactions: Transaction[];
}

const SAVINGS_COLOR = 'url(#savingsPattern)';
const DEFICIT_COLOR = 'url(#deficitPattern)';
const CHART_HEIGHT = 600;

type NodeDef = { id: string; label: string; color: string; parentId?: string };
type LinkDef = { source: string; target: string; value: number; color?: string };

export const CashFlowSankey: React.FC<CashFlowSankeyProps> = ({transactions}) => {
    const {resolvedTheme} = useTheme();
    const muiTheme = useMuiTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

    const incomeSubNodes = new Map<string, NodeDef>();
    const incomeNodes = new Map<string, NodeDef>();
    const expenseNodes = new Map<string, NodeDef>();
    const expenseSubNodes = new Map<string, NodeDef>();
    const linksMap = new Map<string, LinkDef>();
    const nodeTotals = new Map<string, number>();

    let totalIncome = 0;
    let totalExpenses = 0;
    let hasData = false;

    const addToNodeTotal = (id: string, amount: number) => {
        nodeTotals.set(id, (nodeTotals.get(id) || 0) + amount);
    };

    transactions.forEach(tx => {
        if (tx.amount <= 0) return;
        const isIncome = tx.type === 'INCOME';
        const isExpense = tx.type === 'EXPENSE';
        if (!isIncome && !isExpense) return;
        hasData = true;

        if (isIncome) totalIncome += tx.amount;
        if (isExpense) totalExpenses += tx.amount;

        const mainName = tx.tag.parentName || tx.tag.name;
        const subName = tx.tag.parentName ? tx.tag.name : null;
        const nodeColor = tx.tag.colorHex || '#595b63';

        const mainId = isIncome ? `IN-${mainName}` : `OUT-${mainName}`;
        const subId = subName
            ? isIncome ? `IN-SUB-${subName}` : `OUT-SUB-${subName}`
            : null;

        if (isIncome) {
            if (!incomeNodes.has(mainId))
                incomeNodes.set(mainId, {id: mainId, label: mainName, color: nodeColor});
            if (subName && subId && !incomeSubNodes.has(subId))
                incomeSubNodes.set(subId, {id: subId, label: subName, color: nodeColor, parentId: mainId});
        } else {
            if (!expenseNodes.has(mainId))
                expenseNodes.set(mainId, {id: mainId, label: mainName, color: nodeColor});
            if (subName && subId && !expenseSubNodes.has(subId))
                expenseSubNodes.set(subId, {id: subId, label: subName, color: nodeColor, parentId: mainId});
        }

        addToNodeTotal(mainId, tx.amount);
        if (subId) addToNodeTotal(subId, tx.amount);

        const addLink = (source: string, target: string, amount: number) => {
            const key = `${source}->${target}`;
            const ex = linksMap.get(key);
            linksMap.set(key, {source, target, value: (ex?.value ?? 0) + amount});
        };

        if (isIncome) {
            if (subName && subId) addLink(subId, mainId, tx.amount);
            addLink(mainId, 'Income', tx.amount);
        } else {
            addLink('Income', mainId, tx.amount);
            if (subName && subId) addLink(mainId, subId, tx.amount);
        }
    });

    if (!hasData) return null;

    const savings = totalIncome - totalExpenses;
    if (savings > 0) addToNodeTotal('Savings', savings);

    // --- ORDINAMENTO NODI DAL PIÙ GRANDE AL PIÙ PICCOLO ---
    const sortByTotalDesc = (a: NodeDef, b: NodeDef) => (nodeTotals.get(b.id) || 0) - (nodeTotals.get(a.id) || 0);

    const sortSubNodes = (a: NodeDef, b: NodeDef) => {
        const parentTotalA = a.parentId ? (nodeTotals.get(a.parentId) || 0) : 0;
        const parentTotalB = b.parentId ? (nodeTotals.get(b.parentId) || 0) : 0;
        if (parentTotalA !== parentTotalB) return parentTotalB - parentTotalA;
        return (nodeTotals.get(b.id) || 0) - (nodeTotals.get(a.id) || 0);
    };

    const nodesArray: NodeDef[] = [
        ...Array.from(incomeSubNodes.values()).sort(sortSubNodes),
        ...Array.from(incomeNodes.values()).sort(sortByTotalDesc),
        {id: 'Income', label: 'Income', color: resolvedTheme === 'dark' ? '#ffffff' : '#bbbbbb'},
        ...Array.from(expenseNodes.values()).sort(sortByTotalDesc),
        ...Array.from(expenseSubNodes.values()).sort(sortSubNodes),
        ...(savings > 0 ? [{id: 'Savings', label: 'Savings', color: SAVINGS_COLOR}] : [{
            id: 'Deficit',
            label: 'Deficit',
            color: DEFICIT_COLOR
        }]),
    ];

    const nodeIndexMap = new Map(nodesArray.map((n, i) => [n.id, i]));

    if (savings > 0) {
        linksMap.set('Income->Savings', {source: 'Income', target: 'Savings', value: savings});
    } else {
        linksMap.set('Deficit->Income', {source: 'Deficit', target: 'Income', value: -savings});
    }

    // --- ORDINAMENTO LINK PER EVITARE INCROCI ---
    const linksArray: LinkDef[] = Array.from(linksMap.values())
        .map(link => {
            const rightSide = link.source === 'Income' || link.source.startsWith('OUT-');
            return {...link, color: rightSide ? 'target' : 'source'};
        })
        .sort((a, b) => {
            const sourceA = nodeIndexMap.get(a.source) ?? 0;
            const sourceB = nodeIndexMap.get(b.source) ?? 0;
            const targetA = nodeIndexMap.get(a.target) ?? 0;
            const targetB = nodeIndexMap.get(b.target) ?? 0;

            if (a.source === b.source) return targetA - targetB;
            if (a.target === b.target) return sourceA - sourceB;
            return sourceA - sourceB || targetA - targetB;
        });

    const data = {nodes: nodesArray, links: linksArray};

    const valueFormatter = (value: number, context: SankeyValueFormatterContext) => {
        const fmt = new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 2
        }).format(value);
        return context.type === 'node' ? `${fmt} totale` : fmt;
    };

    const sidePadding = isMobile ? 12 : 24;


    const labelColor = resolvedTheme === 'dark' ? '#ffffff' : '#1a1a1a';

    return (
        <div className="w-full my-2 md:my-4 p-1 sm:p-3 md:p-4 bg-app-card/20 backdrop-blur-sm rounded-2xl border border-app-border">
            <h2 className="text-center font-bold text-app-text text-lg md:text-2xl mb-1">Cash Flow Overview</h2>
            <p className="text-center text-app-muted text-sm md:text-base mb-2 md:mb-4">Flow from Income to Expenses</p>

            <div className="w-full flex justify-center">
                <div className="w-full" style={{ height: CHART_HEIGHT }}>
                    <SankeyChart
                        height={CHART_HEIGHT}
                        margin={{top: 20, bottom: 20, left: sidePadding, right: sidePadding}}
                        series={{
                            data,
                            valueFormatter,
                            nodeOptions: {
                                sort: 'fixed',
                                padding: 16,
                                width: isMobile ? 8 : 15,
                                showLabels: true,
                            },
                            linkOptions: {
                                opacity: 0.55,
                                curveCorrection: 10,
                                showValues: false,
                                sort: 'fixed',
                                highlight: 'nodes',
                                fade: 'global',
                            },
                            iterations: 32,
                        }}
                        sx={{
                            '& .MuiChartsSankey-label, & text': {
                                fill: `${labelColor} !important`,
                                fontFamily: 'inherit',
                                fontSize: { xs: '10px !important', sm: '12px !important' },
                                fontWeight: '500 !important',
                            }
                        }}
                    >
                        <defs>
                            <pattern id="savingsPattern" patternUnits="userSpaceOnUse" width="8" height="8"
                                     patternTransform="rotate(45)">
                                <rect width="8" height="8" fill="#1e3a8a"/>
                                <line x1="0" y1="0" x2="0" y2="8" stroke="#3b82f6" strokeWidth="4"/>
                            </pattern>
                            <pattern id="deficitPattern" patternUnits="userSpaceOnUse" width="8" height="8"
                                     patternTransform="rotate(45)">
                                <rect width="8" height="8" fill="#7f1d1d"/>
                                <line x1="0" y1="0" x2="0" y2="8" stroke="#ef4444" strokeWidth="4"/>
                            </pattern>
                        </defs>
                    </SankeyChart>
                </div>
            </div>
        </div>
    );
};