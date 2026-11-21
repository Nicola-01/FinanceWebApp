import React from "react";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDatabase, faGear, faUsers } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faChartPie,
  faEnvelopeOpenText,
} from "@fortawesome/free-solid-svg-icons";
import { useUiVersion } from "../hooks/useUiVersion";

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

export interface AdminTabsProps {
  /** v2 sub-nav counts. Omitted = no count shown for that item. */
  counts?: { users?: number; pendingInvites?: number };
}

/**
 * Secondary navigation bar under the app header, mirroring the dashboard's
 * WalletTabs: icon + label per section, active tab marked by a brand-gradient
 * underline (accent outside a wallet = brand gradient).
 */
export const AdminTabs: React.FC<AdminTabsProps> = ({ counts = {} }) => {
  const [ui] = useUiVersion();
  if (ui === "v2") return <AdminSubNav counts={counts} />; // ui-v2-switch
  return <AdminTopTabs />;
};

const AdminTopTabs: React.FC = () => (
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

// ui-v2-switch: same routes, rendered as a sub-nav. Desktop = left column with
// counts; phone = a horizontally scrollable row of the same links (no section list).
const AdminSubNav: React.FC<Required<AdminTabsProps>> = ({ counts }) => {
  const items: (AdminTab & { count?: number; warn?: boolean })[] = [
    { label: "Overview", to: "/admin/dashboard/overview", icon: faChartPie },
    { ...TABS[0], count: counts.users },
    {
      label: "Invites",
      to: "/admin/dashboard/invites",
      icon: faEnvelopeOpenText,
      count: counts.pendingInvites,
      warn: (counts.pendingInvites ?? 0) > 0,
    },
    TABS[1],
    TABS[2],
  ];
  return (
    <nav
      aria-label="Admin sections"
      className="flex gap-1 overflow-x-auto px-4 pt-4 lg:sticky lg:top-0 lg:w-[216px] lg:shrink-0 lg:flex-col lg:self-start lg:overflow-visible lg:px-4 lg:py-8"
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-[var(--r-input)] px-3 py-2 text-[14px] font-medium transition-colors ${
              isActive
                ? "bg-app-raised text-app-text"
                : "text-app-muted hover:text-app-text"
            }`
          }
        >
          <span className="flex w-4 justify-center">
            <FontAwesomeIcon icon={item.icon} />
          </span>
          {item.label}
          {item.count !== undefined && (
            <span
              className={`ml-auto pl-2 text-[13px] tabular-nums ${
                item.warn ? "text-app-warn" : "text-app-faint"
              }`}
            >
              {item.count}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default AdminTabs;
