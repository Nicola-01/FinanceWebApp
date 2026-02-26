import {useEffect, useRef} from 'react';
import {ChangePasswordModal, type ChangePasswordModalHandle} from '../modals/ChangePasswordModal';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faUser, faSignOutAlt, faKey} from '@fortawesome/free-solid-svg-icons';
import {getUserAuth} from "../utils/authHelper.ts";

export const AccountSettings = () => {
    // Reference to the ChangePasswordModal handle to call its imperative methods
    const changePwModalRef = useRef<ChangePasswordModalHandle>(null);
    const user = getUserAuth();

    useEffect(() => {
        const mustChangeValue = localStorage.getItem('mustChangePWD');

        if (mustChangeValue) {
            try {
                const mustChange = JSON.parse(mustChangeValue);
                if (mustChange === true) changePwModalRef.current?.openModal(true);
            } catch (e) {
                console.error("Error parsing mustChange from localStorage", e);
            }
        }
    }, []);

    return (
        <div
            className="fixed bottom-6 left-6 z-50 flex w-full max-w-md items-center justify-between rounded-2xl border border-dashed border-white/30 bg-white/5 p-6 backdrop-blur-md shadow-2xl"
        >

            {/* Left Side: Avatar and Name */}
            <div className="flex items-center gap-4">
                {/* Generic User Icon Container */}
                <div
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/80 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]">
                    <FontAwesomeIcon icon={faUser} className="text-xl"/>
                </div>

                <div>
                    {/* Replace with actual user name variable if available */}
                    <h3 className="font-app-mono text-lg font-bold text-white tracking-wide">
                        {user?.username}
                    </h3>
                </div>
            </div>

            {/* Right Side: Actions */}
            <div className="flex items-center gap-3">
                {/* Change Password Button */}
                <button
                    onClick={() => changePwModalRef.current?.openModal()}
                    className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/60 transition-all hover:bg-[#00ff7f]/20 hover:text-[#00ff7f]"
                    title="Change Password"
                >
                    <FontAwesomeIcon icon={faKey}/>
                </button>

                {/* Logout Button */}
                <button
                    onClick={() => {
                        localStorage.removeItem('jwtToken');
                        window.location.href = '/login';
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/60 transition-all hover:bg-red-500/20 hover:text-red-500"
                    title="Logout"
                >
                    <FontAwesomeIcon icon={faSignOutAlt}/>
                </button>
            </div>
            <ChangePasswordModal ref={changePwModalRef} />
        </div>
    );
};