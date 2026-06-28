import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPlus, faSpinner, faXmark } from '@fortawesome/free-solid-svg-icons';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { Tag } from '../../utils/types.ts';
import TagCard from "./TagCard.tsx";
import { IconPickerButton } from '../../components/icon/IconPickerButton.tsx';
import type { IconKey } from '../../utils/icons.ts';
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { TransactionPieChart } from './CategoryCharts.tsx';
import { CashFlowSankey } from '../statistics/CashFlowSankey.tsx';
import { DateRangeBanner } from '../statistics/DateRangeBanner.tsx';
import { useTheme } from '../../utils/ThemeContext.tsx';
import { Collapse } from "../../components/ui/Collapse.tsx";

const lightTheme = createTheme({
    palette: { mode: 'light', background: { paper: '#ffffff' } },
});

const darkTheme = createTheme({
    palette: { mode: 'dark', background: { paper: 'var(--color-app-card)' } },
});

// --- COMPONENTE SKELETON INTERNO ---
const TagSkeleton = () => (
    <div
        className="break-inside-avoid mb-6 rounded-xl border border-app-border bg-app-input p-4 flex flex-col gap-4 animate-pulse">
        <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-app-surface shrink-0"></div>
            <div className="h-6 w-32 bg-app-surface rounded-md"></div>
        </div>
        <div className="ml-4 flex flex-col gap-3 border-l-2 border-app-border pl-4">
            <div className="h-3 w-3/4 bg-app-input rounded"></div>
            <div className="h-3 w-1/2 bg-app-input rounded"></div>
        </div>
    </div>
);

export const TagsTab: React.FC = () => {
    const {
        wallet,
        tags,
        filteredTransactions,
        handleAddTag: onAddTag,
        handleUpdateTag: onUpdateTag,
        handleDeleteTag: onDeleteTag,
        isLoading
    } = useWalletContext();
    const { resolvedTheme } = useTheme();
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [showNewMainSelector, setShowNewMainSelector] = useState(false);
    const [savingMain, setSavingMain] = useState(false);

    const [newTag, setNewTag] = useState<Tag>({
        name: '', icon: 'tag', colorHex: 'var(--color-app-green)', parentName: null
    });

    const handleAddMainTag = async () => {
        if (!newTag.name.trim()) {
            setIsAddingTag(false);
            return;
        }
        setSavingMain(true);
        const success = await onAddTag(newTag);

        if (success) {
            setNewTag({ name: '', icon: 'tag', colorHex: 'var(--color-app-green)', parentName: null });
            setIsAddingTag(false);
        }
        setSavingMain(false);
    };

    const organizedTags: Record<string, { parent: Tag, children: Tag[] }> = {};

    tags.forEach(tag => {
        if (!tag.parentName) organizedTags[tag.name] = { parent: tag, children: [] };
    });
    tags.forEach(tag => {
        if (tag.parentName && organizedTags[tag.parentName]) organizedTags[tag.parentName].children.push(tag);
        else if (tag.parentName && !organizedTags[tag.parentName]) organizedTags[tag.parentName] = {
            parent: tag,
            children: []
        };
    });

    return (
        <ThemeProvider theme={resolvedTheme === 'dark' ? darkTheme : lightTheme}>
            <div className="flex flex-col flex-1 animate-[fadeIn_0.3s_ease-out] pb-10 relative">

                <DateRangeBanner />

                <div className="mb-4 mt-2">
                    <h2 className="text-2xl font-bold text-app-text">Visual Distribution</h2>
                    <p className="text-app-muted text-sm">Analyze your income and expenses by category and
                        sub-category.</p>
                </div>

                {/* Pie Charts */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <TransactionPieChart transactions={filteredTransactions} type="INCOME"
                        title="Income Distribution" />
                    <TransactionPieChart transactions={filteredTransactions} type="EXPENSE"
                        title="Expense Distribution" />
                </div>

                <CashFlowSankey transactions={filteredTransactions} />

                <Collapse title="Manage Categories" className="mt-3">
                    <div
                        className="rounded-2xl border border-app-border bg-app-card/20 p-6 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
                        {/* Add Main Category */}
                        {!isLoading && wallet.userRole !== 'VIEWER' && (
                            <div className="mb-8 w-full">
                                {isAddingTag ? (
                                    <div
                                        className="group flex w-full items-center gap-4 rounded-2xl border-2 border-app-green/30 bg-app-green/5 p-4 text-app-text transition-all shadow-sm">
                                        <div
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-app-input">
                                            <IconPickerButton
                                                icon={newTag.icon as IconKey}
                                                color={newTag.colorHex as string}
                                                onIconChange={(icon: IconKey) => setNewTag({ ...newTag, icon: icon })}
                                                onColorChange={(color: string) => setNewTag({
                                                    ...newTag,
                                                    colorHex: color
                                                })}
                                                isOpen={showNewMainSelector}
                                                onToggle={setShowNewMainSelector}
                                            />
                                        </div>

                                        <input
                                            autoFocus
                                            className="flex-1 theme-bg-transparent text-left font-bold tracking-wide text-app-text outline-none placeholder-app-muted/30"
                                            placeholder="Category Name..."
                                            value={newTag.name}
                                            onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                                            disabled={savingMain}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleAddMainTag();
                                                if (e.key === 'Escape') {
                                                    setIsAddingTag(false);
                                                    setNewTag({ ...newTag, name: '' });
                                                }
                                            }}
                                        />

                                        {savingMain ? (
                                            <FontAwesomeIcon icon={faSpinner} spin className="text-app-green mx-2" />
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={handleAddMainTag}
                                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-app-green/20 text-app-green hover:bg-app-green hover:theme-text-inverse transition-all"
                                                    title="Confirm"
                                                >
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsAddingTag(false);
                                                        setNewTag({ ...newTag, name: '' });
                                                    }}
                                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-app-input text-app-muted hover:theme-bg-danger-light hover:theme-text-danger transition-all"
                                                    title="Cancel"
                                                >
                                                    <FontAwesomeIcon icon={faXmark} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsAddingTag(true)}
                                        className="group flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-app-border theme-bg-transparent p-4 text-app-muted transition-all hover:border-app-text/30 hover:bg-app-input hover:text-app-text"
                                    >
                                        <div
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-app-input transition-all group-hover:bg-app-surface group-hover:scale-105">
                                            <FontAwesomeIcon icon={faPlus} />
                                        </div>

                                        <div className="flex-1 text-left font-bold tracking-wide">
                                            Add Main Category
                                        </div>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Tag Grid */}
                        <div className="columns-1 md:columns-2 xl:columns-3 gap-6">
                            {isLoading ? (
                                <>
                                    <TagSkeleton />
                                    <TagSkeleton />
                                    <TagSkeleton />
                                    <TagSkeleton />
                                </>
                            ) : (
                                <>
                                    {Object.values(organizedTags).map(({ parent, children }) => (
                                        <div key={parent.name} className="break-inside-avoid mb-6">
                                            <TagCard
                                                parent={parent}
                                                children={children}
                                                onAddTag={onAddTag}
                                                onUpdateTag={onUpdateTag}
                                                onDeleteTag={onDeleteTag}
                                            />
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </Collapse>
            </div>
        </ThemeProvider>
    );
};