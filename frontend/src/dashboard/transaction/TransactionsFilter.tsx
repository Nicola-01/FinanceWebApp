import React from 'react';
import CustomDatePicker, {type DateRangeValue} from '../../components/DataPicker/CustomDatePicker.tsx';
import {useWalletContext} from "../wallet/WalletContext.tsx";
import {TagFilter} from '../../components/TagFilter/TagFilter.tsx';
import {useTheme} from '../../utils/ThemeContext.tsx';

export const TransactionsFilter: React.FC = () => {
    const {
        wallet,
        tags,
        selectedTags,
        setSelectedTags,
        setDateRange,
        dateRange,
        datePreset,
        setDatePreset
    } = useWalletContext();
    const {resolvedTheme} = useTheme();

    const activeTags = selectedTags ?? tags.map(t => t.name); // Using context state

    return (
        <div className="sticky top-17 z-80 mb-4 flex items-center justify-between gap-4 p-2 rounded-2xl border border-app-border bg-app-card/60 backdrop-blur-xl shadow-lg transition-all">

            {/* Spacer a sinistra (nascosto su mobile) per bilanciare il bottone dei filtri a destra e permettere al date picker di essere perfettamente centrato */}
            <div className="hidden sm:block w-12 h-12 shrink-0"></div>

            <div className="flex-1 flex justify-center min-w-60">
                <div className="w-full max-w-sm">
                    <CustomDatePicker
                        isRange={true}
                        color={wallet.color}
                        isDark={resolvedTheme === 'dark'}
                        onChange={(val) => setDateRange(val as DateRangeValue)}
                        initialPreset={datePreset}
                        initialStartDate={dateRange.start}
                        initialEndDate={dateRange.end}
                        onPresetChange={(preset) => setDatePreset(preset)}
                    />
                </div>
            </div>

            {/* Filtro Tag Dinamico */}
            <div className="shrink-0 flex items-center justify-center">
                <TagFilter
                    tags={tags}
                    selectedTags={activeTags}
                    color={wallet.color}
                    onChange={(newSelection) => {
                        if (newSelection.length === tags.length) {
                            setSelectedTags(null);
                        } else {
                            setSelectedTags(newSelection);
                        }
                    }}
                />
            </div>

        </div>
    );
};