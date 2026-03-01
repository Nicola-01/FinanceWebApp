import React, {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import api from '../api/axiosConfig';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faKey, faLock, faShieldAlt} from '@fortawesome/free-solid-svg-icons';
import {ModalDialog} from './ModalDialog';
import {triggerToast} from '../components/ToastNotification';
import {PasswordInput} from './PasswordInput';
import {PasswordRequirements, isPasswordValid} from '../components/PasswordRequirements'; // <-- IMPORT

export interface ChangePasswordModalHandle {
    openModal: (mandatoryChange?: boolean) => void;
}

export const ChangePasswordModal = forwardRef<ChangePasswordModalHandle>((_, ref) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    const [passwords, setPasswords] = useState({old: '', new: '', confirm: ''});
    const [loading, setLoading] = useState(false);
    const [mandatory, setMandatory] = useState(false);

    useImperativeHandle(ref, () => ({
        openModal: (mandatoryChange: boolean = false) => {
            setPasswords({old: '', new: '', confirm: ''});
            setLoading(false);
            setMandatory(mandatoryChange);
            dialogRef.current?.showModal();
        }
    }));

    const closeDialog = () => dialogRef.current?.close();

    const isValid = isPasswordValid(passwords.new, passwords.confirm) && passwords.old.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        setLoading(true);
        try {
            await api.post('/auth/change-password', {
                currentPassword: passwords.old,
                newPassword: passwords.new,
                confirmPassword: passwords.confirm
            });
            triggerToast("Password updated successfully!", true);
            localStorage.setItem('mustChangePWD', JSON.stringify(false));
            closeDialog();
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || "Error updating password";
            triggerToast(errorMessage, false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalDialog ref={dialogRef} onCancel={(e) => { if (mandatory) e.preventDefault(); }}>
            <div className="text-center">
                <h3 className="mb-2 flex items-center justify-center gap-3 text-[1.6rem] font-semibold text-white">
                    <FontAwesomeIcon icon={faShieldAlt}/> Account Security
                </h3>
                <p className="mb-[25px] text-[0.95rem] text-white/60">
                    Please enter your current password and set a new one.
                </p>

                <form onSubmit={handleSubmit} noValidate>
                    <PasswordInput
                        label="Current Password" placeholder="Enter current password" value={passwords.old}
                        icon={faKey} onChange={(val) => setPasswords({...passwords, old: val})}
                    />
                    <hr className="my-5 h-[1px] border-0 bg-white/10"/>
                    <PasswordInput
                        label="New Password" placeholder="Enter new password" value={passwords.new}
                        icon={faLock} onChange={(val) => setPasswords({...passwords, new: val})}
                    />
                    <PasswordInput
                        label="Confirm New Password" placeholder="Confirm new password" value={passwords.confirm}
                        icon={faLock} onChange={(val) => setPasswords({...passwords, confirm: val})}
                    />

                    <PasswordRequirements password={passwords.new} confirmPassword={passwords.confirm} />

                    <div className="mt-[25px] flex gap-[15px]">
                        {!mandatory && (
                            <button type="button" className="w-1/3 rounded-lg bg-white/10 p-3 text-base font-bold text-white transition-colors hover:bg-white/20" onClick={closeDialog}>
                                Cancel
                            </button>
                        )}
                        <button type="submit" disabled={!isValid || loading} className={`${mandatory ? 'w-full' : 'w-2/3'} rounded-lg border-none bg-[#00ff7f] p-3 text-base font-bold text-black transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#00e673] hover:shadow-[0_4px_15px_rgba(0,255,127,0.3)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-[#333] disabled:text-[#666] disabled:shadow-none`}>
                            {loading ? "Updating..." : "Update Password"}
                        </button>
                    </div>
                </form>
            </div>
        </ModalDialog>
    );
});