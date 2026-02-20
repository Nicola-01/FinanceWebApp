import {useState, useEffect, useRef, useImperativeHandle, forwardRef} from 'react';
import {createPortal} from 'react-dom';
import type {User, Wallet} from "../types";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faTriangleExclamation} from "@fortawesome/free-solid-svg-icons";
import {ModalDialog} from './ModalDialog';

export interface DeleteModalHandle {
    deleteObject: (object: User | Wallet,
                   typeName: string,
                   handleConfirmClick: () => void | Promise<void>) => void;
}

const TIMEOUT_DURATION = 3;

export const DeleteConfirmationModal = forwardRef<DeleteModalHandle>(
    ({}, ref) => {
        const dialogRef = useRef<HTMLDialogElement>(null);

        // Stati interni del modale
        const [objToDelete, setObjToDelete] = useState<User | Wallet | null>(null);
        const [onConfirmCb, setOnConfirmCb] = useState<(() => void | Promise<void>) | null>(null);

        const [confirmationText, setConfirmationText] = useState("");
        const [deleteTimer, setDeleteTimer] = useState(TIMEOUT_DURATION);
        const [isDeleting, setIsDeleting] = useState(false);

        const [itemType, setItemType] = useState<string>("");

        useImperativeHandle(ref, () => ({
            deleteObject: (object, typeName, handleConfirmClick) => {
                setObjToDelete(object);
                setItemType(typeName)
                setOnConfirmCb(() => handleConfirmClick);

                setConfirmationText("");
                setDeleteTimer(TIMEOUT_DURATION);
                setIsDeleting(false);

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
            dialogRef.current?.close();
        };

        const isButtonDisabled = deleteTimer > 0 || confirmationText !== objToDelete?.name || isDeleting;

        // if (!objToDelete) return createPortal(<dialog ref={dialogRef}/>, document.getElementById('modal-root')!);

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

                        <h3 className="my-[15px] rounded-lg border border-dashed border-white/30 bg-white/10 p-3 text-lg break-words font-['JetBrains_Mono',_monospace]">
                            {objToDelete?.name}
                        </h3>

                        <p className="mb-5 text-[0.9rem] text-white/70"> To confirm, type the username below: </p>

                        <input
                            className="w-full p-3 bg-black/20 border border-white/20 rounded-lg text-white text-base text-center transition-all duration-300
                            focus:border-[#e74c3c] focus:bg-black/40 focus:outline-none focus:shadow-[0_0_10px_rgba(231,76,60,0.3)]"
                            type="search"
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value)}
                            placeholder={objToDelete?.name}
                            autoFocus
                        />

                        <div className="mt-[30px] flex justify-center gap-[15px]">
                            <button
                                className="rounded-lg bg-white/10 px-[25px] py-[12px] text-white transition-colors hover:bg-white/20"
                                onClick={() => dialogRef.current?.close()}
                            >
                                Cancel
                            </button>

                            <button
                                className="rounded-lg bg-[#e74c3c] px-[25px] py-[12px] font-bold text-white transition-all duration-300 hover:bg-[#c0392b] disabled:cursor-not-allowed disabled:bg-[#e74c3c]/30 disabled:opacity-60"
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