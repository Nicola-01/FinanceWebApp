import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import api from '../api/axiosConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faLock, faShieldAlt, faCheck } from '@fortawesome/free-solid-svg-icons';
import { ModalDialog } from './ModalDialog';
import { triggerToast } from '../components/ToastNotification';
import { PasswordInput } from './PasswordInput';
import { PasswordRequirements, isPasswordValid } from '../components/PasswordRequirements';

export interface ChangePasswordModalHandle {
    openModal: (mandatoryChange?: boolean) => void;
}

export const ChangePasswordModal = forwardRef<ChangePasswordModalHandle>((_, ref) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
    const [loading, setLoading] = useState(false);
    const [mandatory, setMandatory] = useState(false);

    useImperativeHandle(ref, () => ({
        openModal: (mandatoryChange: boolean = false) => {
            setPasswords({ old: '', new: '', confirm: '' });
            setLoading(false);
            setMandatory(mandatoryChange);
            dialogRef.current?.showModal();
        }
    }));

    const isValid = isPasswordValid(passwords.new, passwords.confirm) && passwords.old.length > 0;

    const handleSubmit = async () => {
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
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || "Error updating password";
            triggerToast(errorMessage, false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalDialog
            ref={dialogRef}
            onCancel={(e) => { if (mandatory) e.preventDefault(); }}
            showClose={!mandatory}
            title={<><FontAwesomeIcon icon={faShieldAlt} /> Account Security</>}
            subtitle="Please enter your current password and set a new one."
            rightActions={[
                {
                    icon: <FontAwesomeIcon icon={faCheck} className="text-xl" />,
                    onClick: async () => {
                        if (isValid && !loading)
                            await handleSubmit()
                    },
                    hoverColor: 'hover:text-[#00ff7f]',
                    disabled: !isValid || loading
                }
            ]}
        >
            <div className="text-center pb-2">
                <div id="change-password-form">
                    <PasswordInput
                        label="Current Password" placeholder="Enter current password" value={passwords.old}
                        icon={faKey} onChange={(val) => setPasswords({ ...passwords, old: val })}
                    />

                    <hr className="my-5 h-[1px] border-0 bg-white/10" />

                    {/* I requisiti tornano a essere fissi e inline! */}
                    <PasswordRequirements password={passwords.new} confirmPassword={passwords.confirm} />

                    <div className="space-y-4">
                        <PasswordInput
                            label="New Password" placeholder="Enter new password" value={passwords.new}
                            icon={faLock} onChange={(val) => setPasswords({ ...passwords, new: val })}
                        />

                        <PasswordInput
                            label="Confirm New Password" placeholder="Confirm new password" value={passwords.confirm}
                            icon={faLock} onChange={(val) => setPasswords({ ...passwords, confirm: val })}
                        />
                    </div>
                </div>
            </div>
        </ModalDialog>
    );
});