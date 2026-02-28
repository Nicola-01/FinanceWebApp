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
                const valA = a[key] ?? '';
                const valB = b[key] ?? '';
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
                <h4 className="m-0 flex items-center gap-2.5 text-[1.1rem] font-semibold text-[#00ff7f]">
                    User Directory
                </h4>
                <div className="relative w-full sm:w-[300px]">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                        type="text"
                        placeholder="Search by name..."
                        className="w-full rounded-lg border border-white/10 bg-black/30 p-[12px] pl-10 text-white outline-none focus:border-white/30"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Scrollable Table */}
            <div className="max-h-[600px] overflow-y-auto rounded-xl border border-white/5">
                <table className="w-full border-collapse text-left">
                    <thead>
                    <tr>
                        <th className="sticky top-0 z-10 cursor-pointer border-b border-white/10 bg-[#151515] p-[18px] font-semibold text-white/60 transition-colors hover:bg-[#1a1a1a] hover:text-white" onClick={() => requestSort('name')}>
                            User <FontAwesomeIcon icon={getSortIcon('name')} className="ml-1 opacity-70" />
                        </th>
                        <th className="sticky top-0 z-10 cursor-pointer border-b border-white/10 bg-[#151515] p-[18px] font-semibold text-white/60 transition-colors hover:bg-[#1a1a1a] hover:text-white" onClick={() => requestSort('createdAt')}>
                            Joined <FontAwesomeIcon icon={getSortIcon('createdAt')} className="ml-1 opacity-70" />
                        </th>
                        <th className="sticky top-0 z-10 cursor-pointer border-b border-white/10 bg-[#151515] p-[18px] font-semibold text-white/60 transition-colors hover:bg-[#1a1a1a] hover:text-white" onClick={() => requestSort('wallets')}>
                            Wallets <FontAwesomeIcon icon={getSortIcon('wallets')} className="ml-1 opacity-70" />
                        </th>
                        <th className="sticky top-0 z-10 cursor-pointer border-b border-white/10 bg-[#151515] p-[18px] font-semibold text-white/60 transition-colors hover:bg-[#1a1a1a] hover:text-white" onClick={() => requestSort('transactions')}>
                            Transactions <FontAwesomeIcon icon={getSortIcon('transactions')} className="ml-1 opacity-70" />
                        </th>
                        <th className="sticky top-0 z-10 border-b border-white/10 bg-[#151515] p-[18px] font-semibold text-white/60">
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