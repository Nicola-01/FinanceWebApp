import {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import type {Transaction, User, Wallet, Subscription} from "../../utils/types";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faTriangleExclamation} from "@fortawesome/free-solid-svg-icons";
import {ModalDialog} from './ModalDialog';

export interface DeleteModalHandle {
    deleteObject: (object: User | Wallet | Transaction | Subscription,
                   typeName: string,
                   handleConfirmClick: () => void | Promise<void>,
                   requireTyping?: boolean,
                   timeout?: number) => void;
}

const TIMEOUT_DURATION = 2;

export const DeleteModal = forwardRef<DeleteModalHandle>(
    ({}, ref) => {
        const dialogRef = useRef<HTMLDialogElement>(null);

        // Stati interni del modale
        const [objToDelete, setObjToDelete] = useState<User | Wallet | Transaction | Subscription | null>(null);
        const [onConfirmCb, setOnConfirmCb] = useState<(() => void | Promise<void>) | null>(null);

        const [confirmationText, setConfirmationText] = useState("");
        const [deleteTimer, setDeleteTimer] = useState(TIMEOUT_DURATION);
        const [isDeleting, setIsDeleting] = useState(false);
        const [itemType, setItemType] = useState<string>("");

        // FIX 1: requireTyping deve essere uno state, non una let!
        const [isTypingRequired, setIsTypingRequired] = useState(false);

        useImperativeHandle(ref, () => ({
            deleteObject: (object, typeName, handleConfirmClick, requireTyping = false, timeout = TIMEOUT_DURATION ) => {
                setObjToDelete(object);
                setItemType(typeName)
                setOnConfirmCb(() => handleConfirmClick);

                setConfirmationText("");
                setDeleteTimer(timeout);
                setIsDeleting(false);
                setIsTypingRequired(requireTyping); // Salviamo nello state

                dialogRef.current?.showModal();
            }
        }));

        useEffect(() => {
            if (deleteTimer > 0) {
                const timer = setInterval(() => setDeleteTimer(prev => prev - 1), 1000);
                return () => clearInterval(timer);
            }
        }, [deleteTimer]);

        const handleConfirm = async () => {
            if (!onConfirmCb) return;
            setIsDeleting(true);
            await onConfirmCb();
            if (dialogRef.current?.open)
                dialogRef.current?.close();
        };

        // FIX 2: Il bottone controlla il testo SOLO se isTypingRequired è true!
        const isTextMismatch = isTypingRequired && confirmationText !== objToDelete?.name;
        const isButtonDisabled = !objToDelete || deleteTimer > 0 || isTextMismatch || isDeleting;

        return createPortal(
            <>
                <ModalDialog ref={dialogRef}>
                    <div className="p-[35px] text-center text-white">

                        <div className="mb-5">
                            <FontAwesomeIcon
                                icon={faTriangleExclamation}
                                className="mb-2.5 text-5xl text-[#e74c3c] drop-shadow-[0_0_10px_rgba(231,76,60,0.5)]"
                            />
                        </div>

                        <p>You are about to permanently delete this {itemType}:</p>

                        <h3 className="my-[15px] rounded-lg border border-dashed border-white/30 bg-app-surface p-3 text-lg break-words font-['JetBrains_Mono',_monospace]">
                            {objToDelete?.name}
                        </h3>


                        {isTypingRequired && (
                            <>
                                <p className="mb-5 text-[0.9rem] text-app-muted"> To confirm, type the name below: </p>

                                <input
                                    className="w-full p-3 bg-black/20 border border-white/20 rounded-lg text-white text-base text-center transition-all duration-300
                            focus:border-[#e74c3c] focus:bg-black/40 focus:outline-none focus:shadow-[0_0_10px_rgba(231,76,60,0.3)]"
                                    type="text"
                                    value={confirmationText}
                                    onChange={(e) => setConfirmationText(e.target.value)}
                                    placeholder={objToDelete?.name}
                                    autoFocus
                                />
                            </>
                        )}


                        <div className="mt-7.5 flex justify-center">
                            <button
                                className="rounded-lg w-50 bg-[#e74c3c] px-6.25 py-3 font-bold text-white transition-all duration-300 hover:bg-[#c0392b] disabled:cursor-not-allowed disabled:bg-[#e74c3c]/30 disabled:opacity-60"
                                onClick={handleConfirm}
                                disabled={isButtonDisabled}
                            >
                                {isDeleting ? "Deleting..." :
                                    deleteTimer > 0 ? `Wait ${deleteTimer}s` : "DELETE"}
                            </button>

                        </div>
                    </div>
                </ModalDialog>
            </>,
            document.getElementById('modal-root')!
        );
    }
);