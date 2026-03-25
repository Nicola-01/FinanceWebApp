import React from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { ModalDialogRightAction } from './ModalDialogRightAction';
import type { ModalDialogRightActionProp } from './ModalDialogRightAction';

interface ModalDialogProps {
    ref?: React.Ref<HTMLDialogElement>;
    children: React.ReactNode;
    className?: string;
    onClose?: () => void;
    onCancel?: (e: any) => void;
    showClose?: boolean;
    onCloseClick?: () => void;
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    rightActions?: ModalDialogRightActionProp[];
}

export const ModalDialog = ({
    ref,
    children,
    className = "",
    onClose,
    onCancel,
    showClose = true,
    onCloseClick,
    rightActions,
    title,
    subtitle
}: ModalDialogProps) => {
    const modalRoot = document.getElementById('modal-root');

    if (!modalRoot) {
        console.error("L'elemento con id 'modal-root' non è stato trovato nel DOM.");
        return null;
    }

    const handleCloseClick = () => {
        if (onCloseClick)
            onCloseClick();
        else if (ref && 'current' in ref && ref.current)
            ref.current.close();
    };

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
                    focus:outline-none
                    ${className}
                `}
        >
            {/* INTESTAZIONE (Pulsante X - Titolo - Custom Actions) */}
            {(showClose || rightActions || title) && (
                <div className="flex w-full items-center justify-between mb-2">

                    {/* Sinistra: Pulsante X (con flex-1) */}
                    <div className="flex flex-1 justify-start">
                        {showClose && (
                            <button
                                type="button"
                                onClick={handleCloseClick}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                            >
                                <FontAwesomeIcon icon={faTimes} className="text-xl" />
                            </button>
                        )}
                    </div>

                    {/* Centro: Titolo */}
                    {title && (
                        <div className="flex shrink-0 items-center justify-center px-4">
                            <h3 className="m-0 flex items-center justify-center gap-3 text-2xl font-semibold text-white">
                                {title}
                            </h3>
                        </div>
                    )}

                    {/* Destra: Pulsanti aggiuntivi (con flex-1) */}
                    <div className="flex flex-1 justify-end">
                        {rightActions && rightActions.length > 0 && (
                            <ModalDialogRightAction actions={rightActions} />
                        )}
                    </div>

                </div>
            )}

            {/* SOTTOTITOLO (Subito sotto la riga del titolo) */}
            {subtitle && (
                <div className="text-center mb-6">
                    <p className="text-sm text-white/60">
                        {subtitle}
                    </p>
                </div>
            )}

            {/* CONTENUTO */}
            <div className={(showClose || rightActions || title || subtitle) ? "mt-4" : ""}>
                {children}
            </div>
        </dialog>
        ,
        modalRoot
    );
};