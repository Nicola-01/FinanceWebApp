import React, { useState, forwardRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type IconKey, ICONS } from '../../utils/icons.ts';
import type { Wallet } from "../../utils/types.ts";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface WalletProps {
    wallet: Wallet;
    isSelected: boolean;
    onClick?: () => void;
    isDragging?: boolean;
    isOverlay?: boolean;
}

export const WalletCardUI = forwardRef<HTMLDivElement, WalletProps & React.HTMLAttributes<HTMLDivElement>>(({
                                                                                                                wallet, isSelected, onClick, isDragging, isOverlay, style, ...props
                                                                                                            }, ref) => {
    const [ripples, setRipples] = useState<Array<{ x: number, y: number, id: number }>>([]);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isOverlay) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newRipple = { x, y, id: Date.now() };
        setRipples((prev) => [...prev, newRipple]);

        setTimeout(() => {
            setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
        }, 600);

        if (props.onPointerDown) {
            props.onPointerDown(e);
        }
    };

    const combinedStyle = {
        ...style,
        borderColor: isSelected ? wallet.color : 'transparent',
        boxShadow: isOverlay
            ? `0 30px 60px -12px rgba(0, 0, 0, 0.3), 0 0 40px ${wallet.color}40`
            : isSelected ? `0 0 25px ${wallet.color}20` : 'none',
        opacity: isDragging && !isOverlay ? 0.3 : 1,
        zIndex: isOverlay ? 50 : (isSelected ? 10 : 1),
    };

    return (
        <div
            ref={ref}
            style={combinedStyle}
            onClick={onClick}
            {...props}
            onPointerDown={handlePointerDown}
            className={`
                group relative overflow-hidden flex items-center gap-4 p-4 rounded-2xl border backdrop-blur-md shrink-0 
                
                /* Larghezze bloccate per consistenza */
                w-[260px] xl:w-[272px]
                
                ${isOverlay || isDragging ? 'cursor-move ring-2 ring-app-border shadow-2xl scale-[1.02]' : 'cursor-pointer hover:bg-app-input/50'}
                
                transition-all duration-300
                bg-app-surface/60 ${isSelected ? '' : 'border-app-border'}
            `}
        >
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 z-0 ${isSelected ? 'bg-app-input opacity-100' : 'bg-app-input opacity-0 group-hover:opacity-100'}`} />

            <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden z-0">
                {ripples.map((ripple) => (
                    <span
                        key={ripple.id}
                        className="absolute rounded-full"
                        style={{
                            top: ripple.y, left: ripple.x, width: 100, height: 100, marginTop: -50, marginLeft: -50,
                            backgroundColor: wallet.color,
                            animation: 'custom-ripple 0.6s ease-out forwards'
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-app-input text-xl shadow-inner" style={{ color: wallet.color || 'var(--color-app-green)' }}>
                <FontAwesomeIcon icon={ICONS[wallet.icon as IconKey] || ICONS['wallet']} />
            </div>

            <div className="relative z-10 flex flex-1 flex-col min-w-0">
                <h4 className="m-0 truncate font-app-mono text-sm font-black tracking-tight transition-colors" style={{ color: isSelected ? wallet.color : 'var(--text-secondary)' }}>
                    {wallet.name}
                </h4>
                <p className="mt-1 w-fit rounded-lg bg-app-input px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-app-muted transition-all group-hover:bg-app-surface group-hover:text-app-text border border-app-border shadow-sm">
                    {wallet.currency}
                </p>
            </div>
        </div>
    );
});

// 2. IL COMPONENTE SMART (Gestisce la logica del Drag & Drop)
const WalletCard: React.FC<WalletProps> = ({ wallet, isSelected, onClick }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: wallet.id });

    const style = {
        // IL FIX: Ora permettiamo di nuovo al segnaposto di muoversi e farsi spazio!
        transform: CSS.Translate.toString(transform),
        transition,
    };

    return (
        <WalletCardUI
            ref={setNodeRef}
            wallet={wallet}
            isSelected={isSelected}
            onClick={onClick}
            isDragging={isDragging}
            style={style}
            {...attributes}
            {...listeners}
        />
    );
};

export default WalletCard;