import React from 'react';
import CustomDatePicker, { type DateRangeValue } from '../../components/DataPicker/CustomDatePicker.tsx';
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { TagFilter } from '../../components/TagFilter/TagFilter.tsx';

export const TransactionsFilter: React.FC = () => {
    const { wallet, tags, selectedTags, setSelectedTags, setDateRange, dateRange, datePreset, setDatePreset } = useWalletContext();

    const activeTags = selectedTags ?? tags.map(t => t.name); // Using context state

    return (
        <div className="relative z-50 flex items-center justify-between gap-4 p-2 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-lg">

            {/* Spacer a sinistra (nascosto su mobile) per bilanciare il bottone dei filtri a destra e permettere al date picker di essere perfettamente centrato */}
            <div className="hidden sm:block w-[48px] h-[48px] shrink-0"></div>

            <div className="flex-1 flex justify-center min-w-[240px]">
                <div className="w-full max-w-sm">
                    <CustomDatePicker
                        isRange={true}
                        color={wallet.color}
                        isDark={true}
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