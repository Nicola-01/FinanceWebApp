import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, } from '@fortawesome/free-solid-svg-icons';
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
        <ModalDialog ref={dialogRef} className="max-w-[450px]">
            <div className="text-center">
                <h3 className="mb-6 flex items-center justify-center gap-3 text-2xl font-semibold text-white">
                    <FontAwesomeIcon icon={faUser} className="text-[#00bfff]" />
                    Profile Settings
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4 text-left">
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
                    <div className="pt-2 border-t border-white/5 mt-2">
                        <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50">New Password (leave blank to keep current)</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-[48px] w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none transition-all focus:border-[#00bfff]"
                        />
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-white/10">
                        <button type="button" onClick={() => dialogRef.current?.close()} className="flex-1 rounded-xl bg-white/5 py-3 font-bold text-white transition-colors hover:bg-white/10">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-[#00bfff] py-3 font-bold text-black transition-all hover:-translate-y-1 hover:bg-[#0099cc]">
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </ModalDialog>
    );
});