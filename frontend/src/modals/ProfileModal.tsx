import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCheck } from '@fortawesome/free-solid-svg-icons';
import { ModalDialog } from './ModalDialog';
import { triggerToast } from '../components/ToastNotification';
import api from '../api/axiosConfig';

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
            onCloseClick={() => dialogRef.current?.close()}
            title={<><FontAwesomeIcon icon={faUser} className="text-[#00bfff]" /> Profile Settings</>}
            headerRight={
                <button type="submit" form="profile-form" disabled={loading} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/40 transition-colors hover:bg-white/10 hover:text-[#00bfff]">
                    <FontAwesomeIcon icon={faCheck} className="text-xl" />
                </button>
            }
        >
            <div className="text-center pb-2">
                <form id="profile-form" onSubmit={handleSubmit} className="space-y-4 text-left">
                    <div>
                        <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-[48px] w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none transition-all focus:border-[#00bfff]"
                        />
                    </div>

                    <div>
                        <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-[48px] w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none transition-all focus:border-[#00bfff]"
                        />
                    </div>

                </form>
            </div>
        </ModalDialog>
    );
});