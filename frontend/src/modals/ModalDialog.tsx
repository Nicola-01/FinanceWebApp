import React from 'react';
import {createPortal} from 'react-dom';

interface ModalDialogProps {
    ref?: React.Ref<HTMLDialogElement>;
    children: React.ReactNode;
    className?: string;
    onClose?: () => void;
}

export const ModalDialog = ({ref, children, className = "", onClose}: ModalDialogProps) => {
    const modalRoot = document.getElementById('modal-root');

    if (!modalRoot) {
        console.error("L'elemento con id 'modal-root' non è stato trovato nel DOM.");
        return null;
    }

    return createPortal(
        <>
            <style>{`
                @keyframes modalFadeIn {
                    from { opacity: 0; transform: translateY(-20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>

            <dialog
                ref={ref}
                onClose={onClose}
                className={`
                    m-auto w-[90vw] max-w-[450px] 
                    rounded-[20px] border border-white/10 bg-white/5 p-[35px] text-white 
                    shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-[15px] 
                    backdrop:bg-black/75 backdrop:backdrop-blur-[8px] 
                    open:animate-[modalFadeIn_0.3s_ease-out]
                    ${className}
                `}
            >
                {children}
            </dialog>
        </>,
        modalRoot
    );
};