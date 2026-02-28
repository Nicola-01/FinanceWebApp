import React, {useState} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {type IconKey, ICONS} from '../../utils/icons.ts';
import type {Wallet} from "../../utils/types.ts";

interface WalletProps {
    wallet: Wallet;
    isSelected: boolean;
    onClick: () => void;
}

const WalletCard: React.FC<WalletProps> = ({wallet, isSelected, onClick}) => {
    // Stato per gestire i cerchi dell'onda (ripple)
    const [ripples, setRipples] = useState<Array<{ x: number, y: number, id: number }>>([]);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        // Calcola la posizione esatta del click relativa alla card
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newRipple = {x, y, id: Date.now()};
        setRipples((prev) => [...prev, newRipple]);

        // Pulisce l'elemento ripple dal DOM una volta finita l'animazione (600ms)
        setTimeout(() => {
            setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
        }, 600);
    };

    return (

        <div
            onClick={onClick}
            onPointerDown={handlePointerDown} // Usiamo onPointerDown così funziona subito sia con mouse che con touch

            className={`
                    group relative overflow-hidden cursor-pointer flex items-center gap-4 p-4 rounded-2xl border backdrop-blur-md shrink-0 w-65 xl:w-full
                    transform-gpu backface-hidden will-change-[transform,box-shadow]
                    transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                    opacity-0 animate-[popUp_0.4s_ease-out_forwards]
                    hover:scale-105 active:scale-95 hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.6)]
                    bg-[rgba(20,20,20,0.6)] ${isSelected ? 'z-10' : 'border-white/10'}                    
                `}

            style={{
                borderColor: isSelected ? wallet.color : 'transparent',
                boxShadow: isSelected ? `0 0 20px ${wallet.color}26` : 'none'
            }}
        >
            <div
                className={`absolute inset-0 pointer-events-none transition-opacity duration-300 z-0 ${
                    isSelected ? 'bg-white/10 opacity-100' : 'bg-white/5 opacity-0 group-hover:opacity-100'
                }`}
            />

            <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden z-0">
                {ripples.map((ripple) => (
                    <span
                        key={ripple.id}
                        className="absolute rounded-full"
                        style={{
                            top: ripple.y,
                            left: ripple.x,
                            width: 100, // Dimensione base
                            height: 100,
                            marginTop: -50, // Centra verticalmente rispetto al click
                            marginLeft: -50, // Centra orizzontalmente rispetto al click
                            backgroundColor: wallet.color, // Il ripple usa il colore del wallet!
                            animation: 'custom-ripple 0.6s ease-out forwards'
                        }}
                    />
                ))}
            </div>

            <div
                className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/5 text-xl"
                style={{color: wallet.color || '#00ff7f'}}
            >
                <FontAwesomeIcon icon={ICONS[wallet.icon as IconKey] || ICONS['wallet']}/>
            </div>

            <div className="relative z-10 flex flex-1 flex-col min-w-0">
                <h4 className={'m-0 truncate font-app-mono text-sm font-extrabold transition-colors'}
                    style={{
                        color: isSelected ? wallet.color : 'rgba(255, 255, 255, 0.5)'
                    }}
                >
                    {wallet.name}
                </h4>
                <p className="mt-1 w-fit rounded-md bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-widest text-white/50 transition-colors group-hover:bg-white/10 group-hover:text-white/70 border border-white/5">
                    {wallet.currency}
                </p>
            </div>
        </div>
    );
};

export default WalletCard;