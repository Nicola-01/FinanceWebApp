import React from 'react';
import CustomDatePicker, { type DateRangeValue } from '../../components/DataPicker/CustomDatePicker.tsx';
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { TagFilter } from '../../components/TagFilter/TagFilter.tsx';

export const TransactionsFilter: React.FC = () => {
    const { wallet, tags, selectedTags, setSelectedTags, setDateRange } = useWalletContext();

    const activeTags = selectedTags ?? tags.map(t => t.name); // Using context state

    return (
        <div
            className="relative z-50 flex flex-wrap items-center gap-4 mb-6 p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">

            <div className="flex-1 min-w-[280px] max-w-sm">
                <CustomDatePicker
                    isRange={true}
                    color={wallet.color}
                    isDark={true}
                    onChange={(val) => setDateRange(val as DateRangeValue)}
                />
            </div>

            {/* Filtro Tag Dinamico */}
            <div className="ml-auto flex items-center gap-2">
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