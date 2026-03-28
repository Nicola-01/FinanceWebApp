import React, { useState } from 'react';

export interface Tab {
    key: string;
    label: string;
}

interface SwitchableCardProps {
    tabs: Tab[];
    activeTab?: string;
    onTabChange?: (key: string) => void;
    title?: string;
    subtitle?: string;
    centerElement?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    /** If true, the card body uses no padding (e.g. for tables that need edge-to-edge layout) */
    noPadding?: boolean;
}

export const SwitchableCard: React.FC<SwitchableCardProps> = ({
    tabs,
    activeTab: controlledActiveTab,
    onTabChange,
    title,
    subtitle,
    centerElement,
    children,
    className = '',
    noPadding = false,
}) => {
    const [internalTab, setInternalTab] = useState(tabs[0]?.key ?? '');
    const activeTab = controlledActiveTab ?? internalTab;

    const handleTabChange = (key: string) => {
        if (onTabChange) {
            onTabChange(key);
        } else {
            setInternalTab(key);
        }
    };

    return (
        <div className={`bg-app-card/20 rounded-2xl border border-app-border overflow-hidden ${className}`.trim()}>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 md:px-6 py-4 border-b border-app-border">
                {/* Left: Title + subtitle + center element — truncates if needed */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0 flex-1">
                    {(title || subtitle) && (
                        <div className="flex flex-col min-w-0">
                            {title && (
                                <h3 className="text-xl font-bold text-app-text uppercase tracking-wider truncate">
                                    {title}
                                </h3>
                            )}
                            {subtitle && (
                                <p className="text-app-muted text-xs mt-0.5 truncate">{subtitle}</p>
                            )}
                        </div>
                    )}

                    {/* Center element (e.g. year selector) */}
                    {centerElement && (
                        <div className="flex items-center flex-shrink-0">
                            {centerElement}
                        </div>
                    )}
                </div>

                {/* Toggle buttons — always right, fixed width */}
                {tabs.length > 1 && (
                    <div className="flex items-center gap-1 bg-app-input border border-app-border rounded-lg p-0.5 flex-shrink-0">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`w-[90px] py-2 text-xs font-bold rounded-md transition-all text-center ${
                                    activeTab === tab.key
                                        ? 'bg-app-card text-app-text shadow-sm'
                                        : 'text-app-muted hover:text-app-text hover:bg-app-card/30'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Body */}
            <div className={noPadding ? '' : 'p-4'}>
                {children}
            </div>
        </div>
    );
};
