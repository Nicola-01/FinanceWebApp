import React from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faSignOutAlt,
  faUserCircle,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
import { getUserAuth } from "../utils/authHelper.ts";
import api from "../api/axiosConfig.ts";
import { ThemeSelector } from "../components/selectors/ThemeSelector";
import { usePWA } from "../utils/PWAContext.tsx";
import { Menu } from "../components/ui/Menu.tsx";
import { SETTINGS_SECTIONS } from "../settings/sections.ts";

interface AppHeaderProps {
  page: {
    text: string;
    accent: string;
  };
  /** Kept for call-site compatibility (admin shell). No longer gates the menu. */
  isAdmin?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ page }) => {
  const navigate = useNavigate();
  const user = getUserAuth();
  const { installPrompt, installApp } = usePWA();

  // Immediate, single-device logout — no confirmation modal. "Sign out from all
  // devices" lives in Settings → Security.
  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Log out locally even if the network call fails.
    }
    localStorage.removeItem("jwtToken");
    sessionStorage.removeItem("jwtToken");
    localStorage.removeItem("mustChangePWD");
    window.location.href = "/login";
  };

  return (
    <header className="top-0 z-[120] flex h-16 w-full items-center justify-between border-b border-app-border bg-app-bg/80 px-6 backdrop-blur-md">
      {/* Logo & app name */}
      <div className="flex items-center gap-3">
        <img
          src="/icon.svg"
          alt="Finance App Logo"
          className="h-10 w-10 object-contain"
        />
        <h2 className="m-0 text-2xl font-bold capitalize tracking-wide text-app-text">
          {page.text}
          <span className="ml-1 bg-gradient-to-r from-[var(--brand-1)] to-[var(--brand-2)] bg-clip-text text-transparent">
            {page.accent}
          </span>
        </h2>
      </div>

      {/* User dropdown — quick links only */}
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
                className={`text-2xl transition-colors ${open ? "text-[var(--brand-1)]" : "text-app-muted"}`}
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
              <Menu.Item icon={faDownload} tone="success" onClick={installApp}>
                Install App (PWA)
              </Menu.Item>
              <Menu.Divider />
            </>
          )}

          {/* <div className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-app-muted">
            Settings
          </div> */}
          {SETTINGS_SECTIONS.filter((s) => !s.danger).map((s) => (
            <Menu.Item
              key={s.id}
              icon={s.icon}
              onClick={() => navigate(`/settings#${s.id}`)}
            >
              {s.label}
            </Menu.Item>
          ))}

          <Menu.Divider />

          <ThemeSelector />

          <Menu.Divider />

          <Menu.Item icon={faSignOutAlt} tone="danger" onClick={handleLogout}>
            Logout
          </Menu.Item>
        </Menu.Content>
      </Menu>
    </header>
  );
};
