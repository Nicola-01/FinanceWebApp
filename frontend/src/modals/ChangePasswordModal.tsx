import React, {useState, useRef, useImperativeHandle, forwardRef} from 'react';
import api from '../api/axiosConfig';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faLock, faShieldAlt, faCheck, faTimes, faKey} from '@fortawesome/free-solid-svg-icons';
import {ModalDialog} from './ModalDialog';
import {triggerToast} from '../components/ToastNotification';
import {PasswordInput} from './PasswordInput'; // Import the new component

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

    // Security Requirements logic
    const requirements = [
        {label: "At least 8 characters", test: (pw: string) => pw.length >= 8},
        {label: "One lowercase letter", test: (pw: string) => /[a-z]/.test(pw)},
        {label: "One uppercase letter", test: (pw: string) => /[A-Z]/.test(pw)},
        {label: "At least one number", test: (pw: string) => /[0-9]/.test(pw)},
        {label: "One special symbol (!@#$...)", test: (pw: string) => /[^A-Za-z0-9]/.test(pw)},
        {label: "Passwords match", test: (pw: string) => pw === passwords.confirm && pw !== ''}
    ];

    const isRequirementsMet = requirements.every(req => req.test(passwords.new));
    const isValid = isRequirementsMet && passwords.old.length > 0;

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
        <ModalDialog ref={dialogRef}
                     onCancel={(e) => {
                         if (mandatory) e.preventDefault();
                     }}
        >
            <div className="text-center">
                <h3 className="mb-2 flex items-center justify-center gap-3 text-[1.6rem] font-semibold text-white">
                    <FontAwesomeIcon icon={faShieldAlt}/> Account Security
                </h3>
                <p className="mb-[25px] text-[0.95rem] text-white/60">
                    Please enter your current password and set a new one.
                </p>

                <form onSubmit={handleSubmit} noValidate>
                    {/* Reusable Input for Old Password */}
                    <PasswordInput
                        label="Current Password"
                        placeholder="Enter current password"
                        value={passwords.old}
                        icon={faKey}
                        onChange={(val) => setPasswords({...passwords, old: val})}
                    />

                    <hr className="my-5 h-[1px] border-0 bg-white/10"/>

                    {/* Reusable Input for New Password */}
                    <PasswordInput
                        label="New Password"
                        placeholder="Enter new password"
                        value={passwords.new}
                        icon={faLock}
                        onChange={(val) => setPasswords({...passwords, new: val})}
                    />

                    {/* Reusable Input for Confirm Password */}
                    <PasswordInput
                        label="Confirm New Password"
                        placeholder="Confirm new password"
                        value={passwords.confirm}
                        icon={faLock}
                        onChange={(val) => setPasswords({...passwords, confirm: val})}
                    />

                    {/* Requirements List */}
                    <div className="my-5 rounded-lg border border-white/5 bg-black/20 p-[15px] text-left">
                        {requirements.map((req, index) => (
                            <div
                                key={index}
                                className={`mb-2 flex items-center gap-2.5 text-[0.85rem] transition-colors duration-300 last:mb-0 ${
                                    req.test(passwords.new) ? 'text-[#00ff7f]' : 'text-white/30'
                                }`}
                            >
                                <FontAwesomeIcon icon={req.test(passwords.new) ? faCheck : faTimes}/>
                                <span>{req.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="mt-[25px] flex gap-[15px]">
                        {!mandatory && (
                            <button
                                type="button"
                                className="w-1/3 rounded-lg bg-white/10 p-3 text-base font-bold text-white transition-colors hover:bg-white/20"
                                onClick={closeDialog}
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            className={`${mandatory ? 'w-full' : 'w-2/3'} rounded-lg border-none bg-[#00ff7f] p-3 text-base font-bold text-black transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#00e673] hover:shadow-[0_4px_15px_rgba(0,255,127,0.3)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-[#333] disabled:text-[#666] disabled:shadow-none`}
                            disabled={!isValid || loading}
                        >
                            {loading ? "Updating..." : "Update Password"}
                        </button>
                    </div>
                </form>
            </div>
        </ModalDialog>
    );
});