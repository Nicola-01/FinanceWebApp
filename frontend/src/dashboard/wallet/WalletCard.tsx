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
            ? `0 30px 40px -10px rgba(0, 0, 0, 0.8), 0 0 30px ${wallet.color}60`
            : isSelected ? `0 0 20px ${wallet.color}26` : 'none',
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
                
                /* FIX: Larghezze bloccate al pixel per combaciare perfettamente con l'ologramma */
                w-[260px] xl:w-[272px]
                
                /* FIX: Cursore a doppie frecce (move) e rimozione dello scale */
                ${isOverlay || isDragging ? 'cursor-move ring-1 ring-white/20 shadow-2xl' : 'cursor-pointer hover:bg-white/5'}
                
                transition-colors duration-200
                bg-[rgba(20,20,20,0.6)] ${isSelected ? '' : 'border-white/10'}
            `}
        >
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 z-0 ${isSelected ? 'bg-white/10 opacity-100' : 'bg-white/5 opacity-0 group-hover:opacity-100'}`} />

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

            <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/5 text-xl" style={{ color: wallet.color || '#00ff7f' }}>
                <FontAwesomeIcon icon={ICONS[wallet.icon as IconKey] || ICONS['wallet']} />
            </div>

            <div className="relative z-10 flex flex-1 flex-col min-w-0">
                <h4 className="m-0 truncate font-app-mono text-sm font-extrabold transition-colors" style={{ color: isSelected ? wallet.color : 'rgba(255, 255, 255, 0.5)' }}>
                    {wallet.name}
                </h4>
                <p className="mt-1 w-fit rounded-md bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-widest text-white/50 transition-colors group-hover:bg-white/10 group-hover:text-white/70 border border-white/5">
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