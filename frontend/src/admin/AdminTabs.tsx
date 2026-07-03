import React from "react";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDatabase, faGear, faUsers } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface AdminTab {
  label: string;
  to: string;
  icon: IconDefinition;
}

const TABS: AdminTab[] = [
  { label: "Users", to: "/admin/dashboard/users", icon: faUsers },
  { label: "Backups", to: "/admin/dashboard/backups", icon: faDatabase },
  { label: "System", to: "/admin/dashboard/system", icon: faGear },
];

/**
 * Secondary navigation bar under the app header, mirroring the dashboard's
 * WalletTabs: icon + label per section, active tab marked by a brand-gradient
 * underline (accent outside a wallet = brand gradient).
 */
export const AdminTabs: React.FC = () => (
  <nav className="relative z-10 flex w-full items-center justify-center gap-1 border-b border-app-border bg-app-bg/60 px-6 backdrop-blur-xl">
    {TABS.map((tab) => (
      <NavLink
        key={tab.to}
        to={tab.to}
        className={({ isActive }) =>
          `relative flex w-32 items-center justify-center gap-2 whitespace-nowrap py-3.5 text-sm font-bold uppercase tracking-wider transition-colors duration-300 ${
            isActive ? "text-app-text" : "text-app-muted hover:text-app-text"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <FontAwesomeIcon
              icon={tab.icon}
              className={`text-base ${isActive ? "" : "opacity-60"}`}
            />
            {tab.label}
            {isActive && (
              <span className="absolute -bottom-px left-0 h-0.5 w-full rounded-full bg-gradient-to-r from-[var(--brand-1)] to-[var(--brand-2)]" />
            )}
          </>
        )}
      </NavLink>
    ))}
  </nav>
);

export default AdminTabs;
