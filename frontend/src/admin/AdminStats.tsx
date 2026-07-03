import React from "react";
import {
  faExchangeAlt,
  faEnvelopeOpenText,
  faUsers,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";
import { StatCard } from "./StatCard.tsx";
import type { User } from "../utils/types.ts";

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
