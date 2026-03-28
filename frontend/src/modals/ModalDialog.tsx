import React from 'react';
import {createPortal} from 'react-dom';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faTimes} from '@fortawesome/free-solid-svg-icons';
import {ModalDialogRightAction} from './ModalDialogRightAction';
import type {ModalDialogRightActionProp} from './ModalDialogRightAction';

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
                    rounded-[32px] border border-app-border bg-app-surface p-8.75 text-app-text 
                    shadow-2xl backdrop-blur-[20px] 
                    backdrop:bg-black/20 dark:backdrop:bg-black/60 backdrop:backdrop-blur-md
                    open:animate-[modalFadeIn_0.4s_cubic-bezier(0.16,1,0.3,1)]
                    focus:outline-none 
                    ${className}
                `}
        >
            {/* INTESTAZIONE (Pulsante X - Titolo - Custom Actions) */}
            {(showClose || rightActions || title) && (
                // 1. Aggiunto 'relative' e 'min-h-[40px]' per fare da ancoraggio al titolo
                <div className="relative flex w-full items-center justify-between mb-2 min-h-[40px]">

                    {/* Sinistra: Pulsante X */}
                    <div className="relative z-10 flex shrink-0">
                        {showClose && (
                            <button
                                type="button"
                                onClick={handleCloseClick}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-app-input text-app-muted transition-all hover:bg-app-border hover:text-app-text"
                            >
                                <FontAwesomeIcon icon={faTimes} className="text-xl" />
                            </button>
                        )}
                    </div>

                    {/* Centro: Titolo */}
                    {title && (
                        // 2. Posizionamento ASSOLUTO. px-12 (o px-16) crea una "zona sicura" vuota ai lati
                        // per forzare il taglio (truncate) PRIMA che il testo tocchi i pulsanti!
                        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none px-14 sm:px-24">
                            <h3 className="m-0 text-xl sm:text-2xl font-bold tracking-tight text-app-text truncate pointer-events-auto [&>svg]:mr-2 [&>svg]:align-middle">
                                {title}
                            </h3>
                        </div>
                    )}

                    {/* Destra: Pulsanti aggiuntivi */}
                    <div className="relative z-10 flex shrink-0">
                        {rightActions && rightActions.length > 0 && (
                            <ModalDialogRightAction actions={rightActions} />
                        )}
                    </div>

                </div>
            )}

            {/* SOTTOTITOLO (Subito sotto la riga del titolo) */}
            {subtitle && (
                <div className="text-center mb-6">
                    <p className="text-sm font-medium text-app-muted">
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