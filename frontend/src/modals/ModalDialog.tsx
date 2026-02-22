import React from 'react';
import {createPortal} from 'react-dom';

interface ModalDialogProps {
    ref?: React.Ref<HTMLDialogElement>;
    children: React.ReactNode;
    className?: string;
    onClose?: () => void;
    onCancel?: (e: any) => void;
}

export const ModalDialog = ({ref, children, className = "", onClose, onCancel}: ModalDialogProps) => {
    const modalRoot = document.getElementById('modal-root');

    if (!modalRoot) {
        console.error("L'elemento con id 'modal-root' non è stato trovato nel DOM.");
        return null;
    }

    return createPortal(
        <dialog
            ref={ref}
            onClose={onClose}
            onCancel={onCancel}
            className={`
                    m-auto w-screen md:w-[90vw] max-w-112.5 
                    rounded-[20px] border border-white/10 bg-white/5 p-8.75 text-white 
                    shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-[15px] 
                    backdrop:bg-black/75 backdrop:backdrop-blur-sm 
                    open:animate-[modalFadeIn_0.3s_ease-out]
                    ${className}
                `}
        >
            {children}
        </dialog>
        ,
        modalRoot
    );
};