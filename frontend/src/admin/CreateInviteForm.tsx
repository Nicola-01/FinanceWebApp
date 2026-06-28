import React, {useState} from 'react';
import api from '../api/axiosConfig';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faEnvelope, faPaperPlane, faStickyNote} from '@fortawesome/free-solid-svg-icons';
import {triggerToast} from '../components/ui/ToastNotification.tsx';

interface CreateInviteFormProps {
    onInviteCreated: () => void;
}

export const CreateInviteForm: React.FC<CreateInviteFormProps> = ({ onInviteCreated }) => {
    const [email, setEmail] = useState('');
    const [note, setNote] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateEmail(email)) {
            triggerToast("Please enter a valid email address.", false);
            return;
        }

        setIsLoading(true);
        try {
            // L'endpoint è stato ricavato dal controller Java
            await api.post('/admin/management', { email: email.trim(), note: note.trim() });
            triggerToast("Invite sent successfully!", true);
            setEmail('');
            setNote('');
            onInviteCreated();
        } catch (err: any) {
            triggerToast(err.response?.data?.title || 'Failed to send invite', false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mb-10 rounded-xl border border-app-border bg-white/[0.02] p-[25px]">
            <h4 className="mb-[15px] flex items-center gap-2.5 text-[1.1rem] font-semibold text-[#00ff7f]">
                <FontAwesomeIcon icon={faEnvelope} /> Invite New User
            </h4>

            <form className="grid grid-cols-1 items-center gap-[15px] lg:grid-cols-[minmax(200px,2fr)_minmax(200px,2fr)_auto]" onSubmit={handleCreate}>

                {/* Email Input (type="search" per evitare Bitwarden) */}
                <div className="w-full relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                        <FontAwesomeIcon icon={faEnvelope} />
                    </div>
                    <input
                        type="search"
                        className="h-[50px] w-full rounded-[10px] border border-app-border bg-black/30 pl-[40px] pr-[15px] py-3 text-[0.95rem] text-white outline-none transition-colors focus:border-[#00ff7f] [&::-webkit-search-cancel-button]:hidden"
                        placeholder="User email address..."
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        disabled={isLoading}
                        autoComplete="off"
                    />
                </div>

                {/* Note Input */}
                <div className="w-full relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                        <FontAwesomeIcon icon={faStickyNote} />
                    </div>
                    <input
                        type="text"
                        className="h-[50px] w-full rounded-[10px] border border-app-border bg-black/30 pl-[40px] pr-[15px] py-3 text-[0.95rem] text-white outline-none transition-colors focus:border-[#00ff7f]"
                        placeholder="Optional note..."
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                {/* Action Button */}
                <div className="w-full lg:w-auto">
                    <button
                        type="submit"
                        className="flex h-[50px] w-full items-center justify-center rounded-[10px] bg-[#00ff7f] text-[1.2rem] text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#00e673] hover:shadow-[0_4px_15px_rgba(0,255,127,0.3)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-app-surface disabled:text-white/20 disabled:shadow-none lg:w-[60px]"
                        disabled={!email || isLoading}
                    >
                        <FontAwesomeIcon icon={faPaperPlane} className={isLoading ? "animate-pulse" : ""} />
                    </button>
                </div>
            </form>
        </div>
    );
};