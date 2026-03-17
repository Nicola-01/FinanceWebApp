import React, {useEffect, useRef, useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronDown, faEnvelope, faKey, faSignOutAlt, faUser, faUserCircle} from '@fortawesome/free-solid-svg-icons';

// Importiamo i modali che creeremo nel passaggio successivo
import {ProfileModal, type ProfileModalHandle} from '../modals/ProfileModal';
import {InvitationsModal, type InvitationsModalHandle} from '../modals/InvitationsModal';
import {ChangePasswordModal, type ChangePasswordModalHandle} from "../modals/ChangePasswordModal.tsx";
import {getUserAuth} from "../utils/authHelper.ts";
import api from "../api/axiosConfig.ts";
import type {Invitation} from "../utils/types.ts";
// import type {Invitation} from "../utils/types.ts";
// import api from "../api/axiosConfig.ts";

interface AppHeaderProps {
    page: {
        text: string;
        accent: string;
    };
}

export const AppHeader: React.FC<AppHeaderProps> = ({page}) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const changePwModalRef = useRef<ChangePasswordModalHandle>(null);
    const profileModalRef = useRef<ProfileModalHandle>(null);
    const invitationsModalRef = useRef<InvitationsModalHandle>(null);

    const [invitations, setInvitations] = useState<Invitation[]>([])

    const user = getUserAuth();

    // const [invitations, setInvitations] = useState<Invitation>()

    // Chiude il menu se si clicca fuori
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        if (showMenu) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        sessionStorage.removeItem('jwtToken');
        localStorage.removeItem('mustChangePWD');
        window.location.href = '/login';
    };

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

        const fetchInvites = async () => {
            try {
                const invitesResp = await api.get('/invitations');
                setInvitations(invitesResp.data);
            } catch (error) {
                console.error("Failed to fetch invites:", error);
            }
        };

        fetchInvites();
    }, []);

    return (
        <> {/* 1. Aggiungiamo questo Fragment per racchiudere tutto */}

            <header
                className=" top-0 z-40 flex h-16 w-full items-center justify-between border-b border-white/10 bg-[#0d0d12]/80 px-6 backdrop-blur-md">
                {/* Logo e Nome App */}
                <h2 className="m-0 text-2xl font-bold tracking-wide text-white capitalize">
                    {page.text}
                    <span
                        className="ml-1 animate-gradient-x bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        {page.accent}
                    </span>
                </h2>

                {/* Menu Utente Dropdown */}
                <div className="relative z-40 " ref={menuRef}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className={`flex items-center gap-2.5 rounded-full border px-3 py-1.5 transition-all duration-300 ${
                            showMenu
                                ? 'bg-white/10 border-white/10 shadow-sm'
                                : 'border-transparent hover:bg-white/5'
                        }`}
                    >
                        {/* Icona Profilo */}
                        <FontAwesomeIcon
                            icon={faUserCircle}
                            className={`text-2xl transition-colors ${showMenu ? 'text-[#00ff7f]' : 'text-white/70 group-hover:text-white'}`}
                        />

                        {/* Nome Utente */}
                        <span className={`text-sm font-semibold tracking-wide transition-colors ${
                            showMenu ? 'text-white' : 'text-white/70'
                        }`}>
                            {user?.username || 'Profile'}
                        </span>

                        {/* Freccetta indicatore Dropdown */}
                        <FontAwesomeIcon
                            icon={faChevronDown}
                            className={`ml-1 text-[10px] transition-transform duration-300 ${
                                showMenu ? 'rotate-180 text-white' : 'text-white/40'
                            }`}
                        />
                    </button>

                    {showMenu && (
                        <div
                            className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-white/10 bg-[#1a1a1a] p-2 shadow-2xl animate-[fadeIn_0.1s_ease-out]">

                            <div className="px-3 py-2 border-b border-white/5 mb-1 flex flex-col">
                                <div className="flex items-center justify-between gap-2">
                                    {/* Username */}
                                    <p className="text-sm font-bold text-white truncate">
                                        {user?.username || 'User'}
                                    </p>

                                    {/* Badge ADMIN (visibile solo se il ruolo è ADMIN) */}
                                    {user?.role === 'ADMIN' && (
                                        <span
                                            className="shrink-0 rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                                        Admin
                                    </span>
                                    )}
                                </div>

                                {/* Email */}
                                <p className="mt-0.5 text-xs text-white/50 truncate">
                                    {/*{user?.email}*/}
                                    email@placeholder.com
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setShowMenu(false);
                                    profileModalRef.current?.openModal();
                                }}
                                className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                            >
                                <FontAwesomeIcon icon={faUser} className="w-4"/>
                                Profile Settings
                            </button>


                            <button
                                onClick={() => changePwModalRef.current?.openModal()}
                                className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                                title="Change Password"
                            >
                                <FontAwesomeIcon icon={faKey} className="w-/"/>
                                Change Password
                            </button>


                            <button
                                onClick={() => {
                                    setShowMenu(false);
                                    invitationsModalRef.current?.openModal(invitations);
                                }}
                                className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                            >
                                <FontAwesomeIcon icon={faEnvelope} className="w-4"/>
                                Invitations
                                {
                                    invitations.filter(i => i.status === 'PENDING').length > 0 &&
                                    <span
                                        className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#00bfff] text-[10px] font-bold text-black">
                                        {invitations.length}
                                    </span>
                                }
                            </button>

                            <div className="my-1 h-px w-full bg-white/5"/>

                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left text-sm font-semibold text-[#ff4d4d]/70 transition-colors hover:bg-[#ff4d4d]/20 hover:text-[#ff4d4d]"
                            >
                                <FontAwesomeIcon icon={faSignOutAlt} className="w-4"/>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* 2. I Modali sono stati spostati QUI, fuori dal tag <header> */}
            <ChangePasswordModal ref={changePwModalRef}/>
            <ProfileModal ref={profileModalRef}/>
            <InvitationsModal ref={invitationsModalRef}/>

        </>
    );
};