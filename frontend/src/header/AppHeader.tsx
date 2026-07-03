import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faCode,
  faEnvelope,
  faKey,
  faSignOutAlt,
  faUser,
  faUserCircle,
  faInfoCircle,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";

// Importiamo i modali che creeremo nel passaggio successivo
import {
  ProfileModal,
  type ProfileModalHandle,
} from "../modals/auth/ProfileModal";
import {
  InvitationsModal,
  type InvitationsModalHandle,
} from "../modals/invitations/InvitationsModal.tsx";
import {
  ChangePasswordModal,
  type ChangePasswordModalHandle,
} from "../modals/auth/ChangePasswordModal";
import { PatModal, type PatModalHandle } from "../modals/pat/PatModal.tsx";
import {
  AboutAppModal,
  type AboutAppModalHandle,
} from "../modals/app/AboutAppModal";
import {
  LogoutModal,
  type LogoutModalHandle,
} from "../modals/auth/LogoutModal";
import { getUserAuth } from "../utils/authHelper.ts";
import api from "../api/axiosConfig.ts";
import type { Invitation } from "../utils/types.ts";
import { ThemeSelector } from "../components/selectors/ThemeSelector";
import { usePWA } from "../utils/PWAContext.tsx";
import { Menu } from "../components/ui/Menu.tsx";

interface AppHeaderProps {
  page: {
    text: string;
    accent: string;
  };
  isAdmin?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ page, isAdmin }) => {
  const changePwModalRef = useRef<ChangePasswordModalHandle>(null);
  const profileModalRef = useRef<ProfileModalHandle>(null);
  const invitationsModalRef = useRef<InvitationsModalHandle>(null);
  const aboutModalRef = useRef<AboutAppModalHandle>(null);
  const patModalRef = useRef<PatModalHandle>(null);
  const logoutModalRef = useRef<LogoutModalHandle>(null);

  const [invitations, setInvitations] = useState<Invitation[]>([]);

  const user = getUserAuth();
  const { installPrompt, installApp } = usePWA();

  // const [invitations, setInvitations] = useState<Invitation>()

  const handleLogout = () => {
    logoutModalRef.current?.openModal();
  };

  useEffect(() => {
    const mustChangeValue = localStorage.getItem("mustChangePWD");

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
        const invitesResp = await api.get("/invitations");
        setInvitations(invitesResp.data);
      } catch (error) {
        console.error("Failed to fetch invites:", error);
      }
    };

    fetchInvites();
  }, []);

  return (
    <>
      {" "}
      {/* 1. Aggiungiamo questo Fragment per racchiudere tutto */}
      <header className="top-0 z-[120] flex h-16 w-full items-center justify-between border-b border-app-border bg-app-bg/80 px-6 backdrop-blur-md">
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
            <span className="ml-1 bg-gradient-to-r from-[var(--brand-1)] to-[var(--brand-2)] bg-clip-text text-transparent">
              {page.accent}
            </span>
          </h2>
        </div>

        {/* User dropdown */}
        <Menu align="right" width={224} className="z-[120]">
          <Menu.Trigger>
            {({ open, toggle }) => (
              <button
                onClick={toggle}
                aria-expanded={open}
                aria-haspopup="menu"
                className={`flex items-center gap-2.5 rounded-full border px-3 py-1.5 transition-all duration-300 ${
                  open
                    ? "border-app-border bg-app-input shadow-sm"
                    : "border-transparent hover:bg-app-input"
                }`}
              >
                <FontAwesomeIcon
                  icon={faUserCircle}
                  className={`text-2xl transition-colors ${open ? "text-app-green" : "text-app-muted"}`}
                />
                <span
                  className={`text-sm font-semibold tracking-wide transition-colors ${
                    open ? "text-app-text" : "text-app-muted"
                  }`}
                >
                  {user?.username || "Profile"}
                </span>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`ml-1 text-[10px] transition-transform duration-300 ${
                    open ? "rotate-180 text-app-text" : "text-app-muted"
                  }`}
                />
              </button>
            )}
          </Menu.Trigger>

          <Menu.Content>
            {/* Identity header */}
            <div className="mb-1 flex flex-col border-b border-app-border px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-bold text-app-text">
                  {user?.username || "User"}
                </p>
                {user?.role === "ADMIN" && (
                  <span className="shrink-0 rounded bg-app-yellow/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-app-yellow">
                    Admin
                  </span>
                )}
              </div>
            </div>

            {installPrompt && (
              <>
                <Menu.Item
                  icon={faDownload}
                  tone="success"
                  onClick={installApp}
                >
                  Install App (PWA)
                </Menu.Item>
                <Menu.Divider />
              </>
            )}

            {!isAdmin && (
              <Menu.Item
                icon={faUser}
                onClick={() => profileModalRef.current?.openModal()}
              >
                Profile Settings
              </Menu.Item>
            )}

            <Menu.Item
              icon={faKey}
              title="Change Password"
              onClick={() => changePwModalRef.current?.openModal()}
            >
              Change Password
            </Menu.Item>

            {!isAdmin && (
              <Menu.Item
                icon={faEnvelope}
                onClick={() =>
                  invitationsModalRef.current?.openModal(invitations)
                }
                trailing={
                  invitations.filter((i) => i.status === "PENDING").length >
                    0 && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-app-sky text-[10px] font-bold text-white">
                      {invitations.length}
                    </span>
                  )
                }
              >
                Invitations
              </Menu.Item>
            )}

            {!isAdmin && (
              <Menu.Item
                icon={faCode}
                onClick={() => patModalRef.current?.openModal()}
              >
                API Tokens
              </Menu.Item>
            )}

            <Menu.Divider />

            <Menu.Item
              icon={faInfoCircle}
              onClick={() => aboutModalRef.current?.openModal()}
            >
              About this app
            </Menu.Item>

            <ThemeSelector />

            <Menu.Divider />

            <Menu.Item icon={faSignOutAlt} tone="danger" onClick={handleLogout}>
              Logout
            </Menu.Item>
          </Menu.Content>
        </Menu>
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
