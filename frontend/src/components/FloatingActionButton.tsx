import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import React from "react";
import type { Wallet } from "../utils/types.ts";

interface FloatingActionButtonProps {
    wallet: Wallet;
    onClick: () => void;
    label?: string;
    mobileLabel?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
    wallet,
    onClick,
    label = "New Transaction",
    mobileLabel = "Add"
}) => {
    return (
        <div className="sticky bottom-8 mt-auto mx-auto w-max z-100 pointer-events-none">
            <button
                onClick={onClick}
                className="group flex items-center justify-center gap-3 rounded-2xl border backdrop-blur-md px-6 py-4 shadow-xl hover:brightness-110 active:scale-95 transition-all font-black pointer-events-auto"
                style={{
                    backgroundColor: wallet.color + '26', // 15% opacity
                    borderColor: wallet.color + '40', // 25% opacity
                    boxShadow: `0 8px 32px 0 ${wallet.color}33`, // 20% opacity
                    color: wallet.color // Force text color to follow wallet color
                }}
            >
                <FontAwesomeIcon icon={faPlus} className="text-xl transition-transform" />
                <span className="hidden sm:inline tracking-wide font-black">{label}</span>
                <span className="inline sm:hidden tracking-wide font-black">{mobileLabel}</span>
            </button>
        </div>
    );
};
