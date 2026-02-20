import React, { useState } from 'react';
import api from '../api/axiosConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faLock, faUserCheck, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { triggerToast } from '../Components/ToastNotification.tsx';

interface CreateUserFormProps {
    onUserCreated: () => void; // Callback to tell the parent to refresh the user list
}

export const CreateUserForm: React.FC<CreateUserFormProps> = ({ onUserCreated }) => {
    // Local state for the form
    const [newUser, setNewUser] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newUser.username.trim().length < 3) {
            triggerToast("Username must be at least 3 characters.", false);
            return;
        }

        try {
            const response = await api.post('admin/management/newuser', { username: newUser.username });
            setNewUser({ username: newUser.username, password: response.data.tempPassword });
            triggerToast("User created!", true);
            onUserCreated(); // Trigger the refresh in the parent component
        } catch (err: any) {
            triggerToast(err.response?.data?.title || 'User creation failed', false);
        }
    };

    const copyToClipboard = () => {
        if (newUser.password) {
            navigator.clipboard.writeText(newUser.password);
            triggerToast('Copied!', true);
        }
    };

    const resetForm = () => {
        setNewUser({ username: '', password: '' });
        setShowPassword(false);
    };

    return (
        <div className="mb-10 rounded-xl border border-white/5 bg-white/[0.02] p-[25px]">
            <h4 className="mb-[15px] flex items-center gap-2.5 text-[1.1rem] font-semibold text-[#00ff7f]">
                <FontAwesomeIcon icon={faUserPlus} /> Create New User
            </h4>

            <form className="grid grid-cols-1 items-center gap-[15px] lg:grid-cols-[minmax(200px,3fr)_minmax(220px,1fr)_auto]" onSubmit={handleCreate}>

                {/* Username Input */}
                <div className="w-full">
                    <input
                        className="h-[50px] w-full rounded-[10px] border border-white/10 bg-black/30 px-[15px] py-3 text-[0.95rem] text-white outline-none transition-colors focus:border-[#00ff7f]"
                        placeholder="Enter username..."
                        value={newUser.username}
                        onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                        disabled={!!newUser.password} // Disable input if password is generated
                    />
                </div>

                {/* Password Display / Placeholder */}
                <div className="w-full">
                    {!newUser.password ? (
                        <div className="flex h-[50px] w-full items-center justify-center gap-2.5 whitespace-nowrap rounded-[10px] border border-dashed border-white/20 bg-black/20 text-[0.85rem] text-white/40">
                            <FontAwesomeIcon icon={faLock} />
                            <span>Password Auto-generated</span>
                        </div>
                    ) : (
                        <div className="flex h-[50px] w-full items-center overflow-hidden rounded-[10px] border border-[#00ff7f] bg-[#00ff7f]/10 pr-2">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={newUser.password}
                                readOnly
                                className="min-w-0 flex-grow bg-transparent pl-[15px] font-[Courier_New] text-base text-white outline-none"
                                onClick={copyToClipboard}
                                title="Click to copy"
                            />
                            <button
                                type="button"
                                className="flex h-8 w-8 items-center justify-center rounded-md bg-transparent text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <div className="w-full lg:w-auto">
                    {!newUser.password ? (
                        <button
                            type="submit"
                            className="flex h-[50px] w-full items-center justify-center rounded-[10px] bg-[#00ff7f] text-[1.2rem] text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#00e673] hover:shadow-[0_4px_15px_rgba(0,255,127,0.3)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/20 disabled:shadow-none lg:w-[60px]"
                            disabled={newUser.username.length < 3}
                        >
                            <FontAwesomeIcon icon={faUserPlus} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="flex h-[50px] w-full items-center justify-center rounded-[10px] border border-[#00ff7f] bg-transparent text-[1.2rem] text-[#00ff7f] transition-all duration-200 hover:bg-[#00ff7f]/10 lg:w-[60px]"
                            onClick={resetForm}
                            title="Create another user"
                        >
                            <FontAwesomeIcon icon={faUserCheck} />
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};