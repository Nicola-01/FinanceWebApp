import React from 'react';
import { faUsers, faWallet, faExchangeAlt } from '@fortawesome/free-solid-svg-icons';
import { StatCard } from "./StatCard.tsx";
import type { User } from "../utils/types.ts";

interface AdminStatsProps {
    users: User[];
}

export const AdminStats: React.FC<AdminStatsProps> = ({ users }) => {
    // Calculate totals from the user array
    const totalWallets = users.reduce((acc, user) => acc + (user.wallets || 0), 0);
    const totalTransactions = users.reduce((acc, user) => acc + (user.transactions || 0), 0);

    return (
        <div className="mb-2.5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Total Users" value={users.length} icon={faUsers} color="#3333ff" />
            <StatCard title="Active Wallets" value={totalWallets} icon={faWallet} color="#3333ff" />
            <StatCard title="Transactions" value={totalTransactions} icon={faExchangeAlt} color="#ff00cc" />
        </div>
    );
};