import {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSignOutAlt} from "@fortawesome/free-solid-svg-icons";
import {ModalDialog} from '../common/ModalDialog';
import api from '../../api/axiosConfig';

export interface LogoutModalHandle {
    openModal: () => void;
}

export const LogoutModal = forwardRef<LogoutModalHandle>(
    ({}, ref) => {
        const dialogRef = useRef<HTMLDialogElement>(null);
        
        const [logoutAll, setLogoutAll] = useState(false);
        const [isLoggingOut, setIsLoggingOut] = useState(false);

        useImperativeHandle(ref, () => ({
            openModal: () => {
                setLogoutAll(false);
                setIsLoggingOut(false);
                dialogRef.current?.showModal();
            }
        }));

        const handleConfirm = async () => {
            setIsLoggingOut(true);
            try {
                if (logoutAll) {
                    await api.post('/auth/logout-all');
                } else {
                    await api.post('/auth/logout');
                }
            } catch (e) {
                // Ignora errori di rete — procediamo comunque col logout locale
            }
            localStorage.removeItem('jwtToken');
            sessionStorage.removeItem('jwtToken');
            localStorage.removeItem('mustChangePWD');
            window.location.href = '/login';
        };

        const handleCancel = () => {
            dialogRef.current?.close();
        };

        return createPortal(
            <>
                <ModalDialog ref={dialogRef} title="Confirm Logout" showClose={true}>
                    <div className="p-[20px] text-center text-app-text">
                        <div className="mb-5">
                            <FontAwesomeIcon
                                icon={faSignOutAlt}
                                className="mb-2.5 text-5xl text-[#e74c3c]"
                            />
                        </div>

                        <p className="mb-6">Are you sure you want to log out?</p>

                        <div className="mb-8 flex items-center justify-center text-sm text-app-text">
                            <label className="group flex cursor-pointer select-none items-center">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="peer h-5 w-5 appearance-none rounded border border-app-border bg-app-hover transition-all checked:border-[#e74c3c] checked:bg-[#e74c3c] cursor-pointer"
                                        checked={logoutAll}
                                        onChange={(e) => setLogoutAll(e.target.checked)}
                                    />
                                    <svg
                                        className="pointer-events-none absolute left-[3px] top-[3px] h-[14px] w-[14px] theme-text-default opacity-0 transition-opacity peer-checked:opacity-100"
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                                <span className="ml-3 font-light transition-colors group-hover:text-app-text">
                                    Log out from <strong className="font-semibold">all devices</strong>
                                </span>
                            </label>
                        </div>

                        <div className="mt-7.5 flex justify-center gap-4">
                            <button
                                className="rounded-lg bg-app-input px-6 py-3 font-semibold text-app-text transition-colors hover:bg-app-border"
                                onClick={handleCancel}
                                disabled={isLoggingOut}
                            >
                                Cancel
                            </button>
                            <button
                                className="rounded-lg bg-[#e74c3c] px-6 py-3 font-bold theme-text-default transition-all duration-300 hover:bg-[#c0392b] disabled:cursor-not-allowed disabled:bg-[#e74c3c]/50"
                                onClick={handleConfirm}
                                disabled={isLoggingOut}
                            >
                                {isLoggingOut ? "Logging out..." : "Logout"}
                            </button>
                        </div>
                    </div>
                </ModalDialog>
            </>,
            document.getElementById('modal-root')!
        );
    }
);
