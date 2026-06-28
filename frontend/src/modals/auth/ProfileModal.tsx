import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCheck } from '@fortawesome/free-solid-svg-icons';
import { ModalDialog } from '../common/ModalDialog';
import { triggerToast } from '../../components/ui/ToastNotification.tsx';
import api from '../../api/axiosConfig';

export interface ProfileModalHandle {
    openModal: () => void;
}

export const ProfileModal = forwardRef<ProfileModalHandle>((_props, ref) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [loading, setLoading] = useState(false);

    // Stati del form (Idealmente caricati dal backend all'apertura)
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');



    useImperativeHandle(ref, () => ({
        openModal: () => {
            // TODO: Fai una chiamata api.get('/users/me') per pre-compilare name ed email
            setPassword('');
            dialogRef.current?.showModal();
        }
    }));

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload: any = { name, email };
            if (password) payload.password = password; // Invia la password solo se modificata

            await api.put(`/users/me`, payload);
            triggerToast("Profile updated successfully!", true);
            dialogRef.current?.close();
        } catch (err: any) {
            triggerToast(err.response?.data?.title || "Error updating profile", false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalDialog
            ref={dialogRef}
            className="max-w-[450px]"
            title={<><FontAwesomeIcon icon={faUser} className="text-[#00bfff]" /> Profile Settings</>}
            rightActions={[
                {
                    icon: <FontAwesomeIcon icon={faCheck} className="text-xl" />,
                    onClick: async () => {
                        if (!loading)
                            await handleSubmit()
                    },
                    hoverColor: 'hover:text-[#00bfff]'
                }
            ]}
        >
            <div className="text-center pb-2">
                <div id="profile-form" className="space-y-6 text-left">
                    <div>
                        <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-app-muted">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-[48px] w-full rounded-xl border border-app-border bg-app-input px-4 text-app-text outline-none transition-all focus:border-[#00bfff] focus:ring-2 focus:ring-[#00bfff]/20"
                        />
                    </div>

                    <div>
                        <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-app-muted">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-[48px] w-full rounded-xl border border-app-border bg-app-input px-4 text-app-text outline-none transition-all focus:border-[#00bfff] focus:ring-2 focus:ring-[#00bfff]/20"
                        />
                    </div>

                </div>
            </div>
        </ModalDialog>
    );
});