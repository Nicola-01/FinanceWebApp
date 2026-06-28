import React, {useMemo, useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faSearch, faSort, faSortDown, faSortUp} from '@fortawesome/free-solid-svg-icons';
import UserRow from "./UserRow";
import type {User} from "../utils/types.ts";

type SortConfig = {
    key: keyof User;
    direction: 'ascending' | 'descending';
} | null;

interface UserDirectoryProps {
    users: User[];
    onDeleteClick: (user: User) => void; // Triggered when the trash icon is clicked
}

export const UserDirectory: React.FC<UserDirectoryProps> = ({ users, onDeleteClick }) => {
    // Local state for searching and sorting
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);

    // Sorting logic handler
    const requestSort = (key: keyof User) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Filter and sort the users memoized
    const processedUsers = useMemo(() => {
        let sortableUsers = [...users];

        if (searchTerm) {
            sortableUsers = sortableUsers.filter(user =>
                user.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (sortConfig !== null) {
            const { key, direction } = sortConfig;
            sortableUsers.sort((a, b) => {
                const valA = a[key] ?? (key === 'wallets' || key === 'transactions' ? 0 : '');
                const valB = b[key] ?? (key === 'wallets' || key === 'transactions' ? 0 : '');
                if (valA < valB) return direction === 'ascending' ? -1 : 1;
                if (valA > valB) return direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableUsers;
    }, [users, sortConfig, searchTerm]);

    // Helper for table headers icon
    const getSortIcon = (name: keyof User) =>
        (!sortConfig || sortConfig.key !== name) ? faSort : (sortConfig.direction === 'ascending' ? faSortUp : faSortDown);

    return (
        <div>
            {/* Header & Search Bar */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-[15px]">
                <h4 className="m-0 flex items-center gap-2.5 text-[1.1rem] font-semibold text-app-green">
                    User Directory
                </h4>
                <div className="relative w-full sm:w-[300px]">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
                    <input
                        type="text"
                        placeholder="Search by name..."
                        className="w-full rounded-lg border border-app-border theme-bg-overlay p-[12px] pl-10 theme-text-default outline-none focus:theme-border-focus"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Scrollable Table */}
            <div className="max-h-[600px] overflow-y-auto rounded-xl border border-app-border">
                <table className="w-full border-collapse text-left">
                    <thead>
                    <tr>
                        <th className="sticky top-0 z-10 cursor-pointer border-b border-app-border bg-[#151515] p-[18px] font-semibold text-app-muted transition-colors hover:bg-app-card hover:theme-text-default" onClick={() => requestSort('name')}>
                            User <FontAwesomeIcon icon={getSortIcon('name')} className="ml-1 opacity-70" />
                        </th>
                        <th className="sticky top-0 z-10 cursor-pointer border-b border-app-border bg-[#151515] p-[18px] font-semibold text-app-muted transition-colors hover:bg-app-card hover:theme-text-default" onClick={() => requestSort('createdAt')}>
                            Joined <FontAwesomeIcon icon={getSortIcon('createdAt')} className="ml-1 opacity-70" />
                        </th>
                        <th className="sticky top-0 z-10 cursor-pointer border-b border-app-border bg-[#151515] p-[18px] font-semibold text-app-muted transition-colors hover:bg-app-card hover:theme-text-default" onClick={() => requestSort('wallets')}>
                            Wallets <FontAwesomeIcon icon={getSortIcon('wallets')} className="ml-1 opacity-70" />
                        </th>
                        <th className="sticky top-0 z-10 cursor-pointer border-b border-app-border bg-[#151515] p-[18px] font-semibold text-app-muted transition-colors hover:bg-app-card hover:theme-text-default" onClick={() => requestSort('transactions')}>
                            Transactions <FontAwesomeIcon icon={getSortIcon('transactions')} className="ml-1 opacity-70" />
                        </th>
                        <th className="sticky top-0 z-10 border-b border-app-border bg-[#151515] p-[18px] font-semibold text-app-muted">
                            Action
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {processedUsers.length > 0 ? (
                        processedUsers.map(user => (
                            <UserRow
                                key={user.id}
                                user={user}
                                onDelete={onDeleteClick}
                            />
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className="p-5 text-center text-[#666]">
                                No users found.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};