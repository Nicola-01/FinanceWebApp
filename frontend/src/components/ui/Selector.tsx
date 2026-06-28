import React from 'react';

export interface SelectorOption<T extends string | number> {
    value: T;
    label?: React.ReactNode;
    icon?: React.ReactNode;
    activeColorClass?: string;
    activeBgClass?: string;
    disabled?: boolean;
    disabledTitle?: string;
    style?: React.CSSProperties;
}

export interface SelectorProps<T extends string | number> {
    options: SelectorOption<T>[];
    value: T;
    onChange: (value: T) => void;
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    className?: string;
}

export const Selector = <T extends string | number>({
    options,
    value,
    onChange,
    size = 'md',
    fullWidth = true,
    className = ''
}: SelectorProps<T>) => {
    
    const containerSizeClass = 
        size === 'sm' ? 'h-8 rounded-lg p-0.5' :
        size === 'lg' ? 'h-12 rounded-xl p-1' :
        'h-10 rounded-lg p-1';
        
    const buttonSizeClass =
        size === 'sm' ? 'text-[10px] rounded gap-1.5' :
        size === 'lg' ? 'text-sm rounded-lg gap-2' :
        'text-xs rounded-md gap-2';

    const containerClassName = `grid grid-flow-col auto-cols-fr bg-app-input border border-app-border shadow-inner ${containerSizeClass} ${fullWidth ? 'w-full' : ''} ${className}`;
    
    const inactiveClassName = "text-app-muted hover:text-app-text";
    
    return (
        <div className={containerClassName}>
            {options.map((option) => {
                const isActive = value === option.value;
                const isDisabled = option.disabled;
                
                const defaultActiveBg = "bg-app-surface";
                const defaultActiveText = "theme-text-primary";
                
                let currentClass = isActive 
                    ? `${option.activeBgClass || defaultActiveBg} ${option.activeColorClass || defaultActiveText} shadow-sm font-bold`
                    : `${inactiveClassName} font-semibold`;
                    
                if (isDisabled) {
                    currentClass = 'opacity-40 cursor-not-allowed text-app-muted font-semibold';
                }

                return (
                    <button
                        key={String(option.value)}
                        type="button"
                        onClick={() => !isDisabled && onChange(option.value)}
                        disabled={isDisabled}
                        title={option.disabledTitle}
                        className={`flex-1 flex items-center justify-center transition-all px-2 ${buttonSizeClass} ${currentClass}`}
                        style={option.style}
                    >
                        {option.icon && <span className="flex items-center justify-center">{option.icon}</span>}
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
};
