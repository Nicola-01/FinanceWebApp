import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExchangeAlt,
  faEnvelopeOpenText,
  faUsers,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";
import { StatCard } from "./StatCard.tsx";
import { StatTile } from "../components/ui/StatTile.tsx";
import { useUiVersion } from "../hooks/useUiVersion";
import type { User } from "../types/domain.ts";

interface AdminStatsProps {
  users: User[];
  /** Number of still-pending invitations (shown as the 4th stat). */
  pendingInvites: number;
}

export const AdminStats: React.FC<AdminStatsProps> = ({
  users,
  pendingInvites,
}) => {
  // Calculate totals from the user array
  const totalWallets = users.reduce(
    (acc, user) => acc + (user.wallets || 0),
    0,
  );
  const totalTransactions = users.reduce(
    (acc, user) => acc + (user.transactions || 0),
    0,
  );

  const [ui] = useUiVersion();
  if (ui === "v2") {
    // ui-v2-switch: StatTile strip (2×2 on phone, 4-up on desktop).
    const tileIcon = (icon: typeof faUsers) => (
      <span className="flex items-center justify-center rounded-[11px] bg-app-raised text-app-muted">
        <FontAwesomeIcon icon={icon} />
      </span>
    );
    return (
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatTile
          label="Total users"
          value={users.length}
          icon={tileIcon(faUsers)}
        />
        <StatTile
          label="Wallets"
          value={totalWallets}
          icon={tileIcon(faWallet)}
        />
        <StatTile
          label="Transactions"
          value={totalTransactions}
          icon={tileIcon(faExchangeAlt)}
        />
        <StatTile
          label="Pending invites"
          value={pendingInvites}
          icon={tileIcon(faEnvelopeOpenText)}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard title="Total Users" value={users.length} icon={faUsers} />
      <StatCard title="Active Wallets" value={totalWallets} icon={faWallet} />
      <StatCard
        title="Transactions"
        value={totalTransactions}
        icon={faExchangeAlt}
      />
      <StatCard
        title="Pending Invites"
        value={pendingInvites}
        icon={faEnvelopeOpenText}
      />
    </div>
  );
};
