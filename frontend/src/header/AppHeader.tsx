import React, { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronDown,
    faCode,
    faEnvelope,
    faKey,
    faSignOutAlt,
    faUser,
    faUserCircle,
    faInfoCircle,
    faDownload
} from '@fortawesome/free-solid-svg-icons';

// Importiamo i modali che creeremo nel passaggio successivo
import { ProfileModal, type ProfileModalHandle } from '../modals/auth/ProfileModal';
import { InvitationsModal, type InvitationsModalHandle } from '../modals/invitations/InvitationsModal.tsx';
import { ChangePasswordModal, type ChangePasswordModalHandle } from "../modals/auth/ChangePasswordModal";
import { PatModal, type PatModalHandle } from "../modals/pat/PatModal.tsx";
import { AboutAppModal, type AboutAppModalHandle } from "../modals/app/AboutAppModal";
import { LogoutModal, type LogoutModalHandle } from "../modals/auth/LogoutModal";
import { getUserAuth } from "../utils/authHelper.ts";
import api from "../api/axiosConfig.ts";
import type { Invitation } from "../utils/types.ts";
import { ThemeSelector } from "../components/selectors/ThemeSelector";
import { usePWA } from "../utils/PWAContext.tsx";

export interface AppHeaderTab {
    label: string;
    to: string;
}

interface AppHeaderProps {
    page: {
        text: string;
        accent: string;
    },
    isAdmin?: boolean;
    tabs?: AppHeaderTab[];
}

export const AppHeader: React.FC<AppHeaderProps> = ({ page, isAdmin, tabs }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const changePwModalRef = useRef<ChangePasswordModalHandle>(null);
    const profileModalRef = useRef<ProfileModalHandle>(null);
    const invitationsModalRef = useRef<InvitationsModalHandle>(null);
    const aboutModalRef = useRef<AboutAppModalHandle>(null);
    const patModalRef = useRef<PatModalHandle>(null);
    const logoutModalRef = useRef<LogoutModalHandle>(null);

    const [invitations, setInvitations] = useState<Invitation[]>([])

    const user = getUserAuth();
    const { installPrompt, installApp } = usePWA();

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
        logoutModalRef.current?.openModal();
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
                className="top-0 z-[120] flex h-16 w-full items-center justify-between border-b border-app-border bg-app-bg/80 px-6 backdrop-blur-md">
                {/* Logo e Nome App */}
                <div className="flex items-center gap-3">
                    {/* Icona dell'app stilizzata come Logo */}
                    <img
                        src="/icon.svg"
                        alt="Finance App Logo"
                        className="h-10 w-10 object-contain"
                    />

                    {/* Titolo */}
                    <h2 className="m-0 text-2xl font-bold tracking-wide text-app-text capitalize">
                        {page.text}
                        <span
                            className="ml-1 animate-gradient-x bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            {page.accent}
                        </span>
                    </h2>
                </div>

                {/* Tab Navigation (facoltativa) */}
                {tabs && tabs.length > 0 && (
                    <nav className="flex items-center gap-1 rounded-xl border border-app-border bg-app-input/40 p-1">
                        {tabs.map(tab => (
                            <NavLink
                                key={tab.to}
                                to={tab.to}
                                className={({ isActive }) =>
                                    `relative px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 ${isActive
                                        ? 'bg-app-card text-app-text shadow-sm'
                                        : 'text-app-muted hover:text-app-text hover:bg-app-card/50'
                                    }`
                                }
                            >
                                {tab.label}
                            </NavLink>
                        ))}
                    </nav>
                )}

                {/* Menu Utente Dropdown */}
                <div className="relative z-[120]" ref={menuRef}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className={`flex items-center gap-2.5 rounded-full border px-3 py-1.5 transition-all duration-300 ${showMenu
                            ? 'bg-app-input border-app-border shadow-sm'
                            : 'border-transparent hover:bg-app-input'
                            }`}
                    >
                        {/* Icona Profilo */}
                        <FontAwesomeIcon
                            icon={faUserCircle}
                            className={`text-2xl transition-colors ${showMenu ? 'text-app-green' : 'text-app-muted group-hover:text-app-text'}`}
                        />

                        {/* Nome Utente */}
                        <span className={`text-sm font-semibold tracking-wide transition-colors ${showMenu ? 'text-app-text' : 'text-app-muted'
                            }`}>
                            {user?.username || 'Profile'}
                        </span>

                        {/* Freccetta indicatore Dropdown */}
                        <FontAwesomeIcon
                            icon={faChevronDown}
                            className={`ml-1 text-[10px] transition-transform duration-300 ${showMenu ? 'rotate-180 text-app-text' : 'text-app-muted'
                                }`}
                        />
                    </button>

                    {showMenu && (
                        <div
                            className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-app-border bg-app-card p-2 shadow-2xl animate-[fadeIn_0.1s_ease-out]">

                            <div className="px-3 py-2 border-b border-app-border mb-1 flex flex-col">
                                <div className="flex items-center justify-between gap-2">
                                    {/* Username */}
                                    <p className="text-sm font-bold text-app-text truncate">
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
                                {/* <p className="mt-0.5 text-xs text-app-muted truncate">
                                    email@placeholder.com
                                </p> */}
                            </div>

                            {installPrompt && (
                                <>
                                    <button
                                        onClick={() => {
                                            setShowMenu(false);
                                            installApp();
                                        }}
                                        className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left text-sm font-bold text-app-green transition-colors hover:bg-app-input"
                                    >
                                        <FontAwesomeIcon icon={faDownload} className="w-4" />
                                        Installa App (PWA)
                                    </button>
                                    <div className="my-1 h-px w-full bg-app-border" />
                                </>
                            )}

                            {!isAdmin &&
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        profileModalRef.current?.openModal();
                                    }}
                                    className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left text-sm font-semibold text-app-muted transition-colors hover:bg-app-input hover:text-app-text"
                                >
                                    <FontAwesomeIcon icon={faUser} className="w-4" />
                                    Profile Settings
                                </button>
                            }


                            <button
                                onClick={() => changePwModalRef.current?.openModal()}
                                className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left text-sm font-semibold text-app-muted transition-colors hover:bg-app-input hover:text-app-text"
                                title="Change Password"
                            >
                                <FontAwesomeIcon icon={faKey} className="w-/" />
                                Change Password
                            </button>

                            {!isAdmin &&
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        invitationsModalRef.current?.openModal(invitations);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left text-sm font-semibold text-app-muted transition-colors hover:bg-app-input hover:text-app-text"
                                >
                                    <FontAwesomeIcon icon={faEnvelope} className="w-4" />
                                    Invitations
                                    {
                                        invitations.filter(i => i.status === 'PENDING').length > 0 &&
                                        <span
                                            className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-app-sky)] text-[10px] font-bold text-black">
                                            {invitations.length}
                                        </span>
                                    }
                                </button>
                            }

                            {!isAdmin &&
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        patModalRef.current?.openModal();
                                    }}
                                    className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left text-sm font-semibold text-app-muted transition-colors hover:bg-app-input hover:text-app-text"
                                >
                                    <FontAwesomeIcon icon={faCode} className="w-4" />
                                    API Tokens
                                </button>
                            }

                            <div className="my-1 h-px w-full bg-app-border" />

                            <button
                                onClick={() => {
                                    setShowMenu(false);
                                    aboutModalRef.current?.openModal();
                                }}
                                className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left text-sm font-semibold text-app-muted transition-colors hover:bg-app-input hover:text-app-text"
                            >
                                <FontAwesomeIcon icon={faInfoCircle} className="w-4" />
                                About this app
                            </button>

                            <ThemeSelector />

                            <div className="my-1 h-px w-full bg-app-border" />

                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left text-sm font-semibold text-app-red/70 transition-colors hover:bg-app-red/20 hover:text-app-red"
                            >
                                <FontAwesomeIcon icon={faSignOutAlt} className="w-4" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* 2. I Modali sono stati spostati QUI, fuori dal tag <header> */}
            <ChangePasswordModal ref={changePwModalRef} />
            <ProfileModal ref={profileModalRef} />
            {!isAdmin && <InvitationsModal ref={invitationsModalRef} />}
            {!isAdmin && <PatModal ref={patModalRef} />}
            <AboutAppModal ref={aboutModalRef} />
            <LogoutModal ref={logoutModalRef} />

        </>
    );
};