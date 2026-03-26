import React from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faTrash} from '@fortawesome/free-solid-svg-icons';
import type {User} from "../utils/types.ts";

interface UserRowProps {
    user: User;
    onDelete: (user: User) => void;
}

const UserRow: React.FC<UserRowProps> = ({user, onDelete}) => {
    // Funzione helper per formattare la data
    const formatDate = (dateString?: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        // Formatta come "Oct 25, 2023" (o usa 'it-IT' per formato italiano)
        return date.toLocaleDateString('en-UK', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <tr className="border-b border-app-border transition-colors duration-200 hover:bg-white/[0.02] animate-[fadeIn_0.3s_ease-out]">
            <td className="p-4.5 font-bold text-white"> {user.name} </td>
            <td className="p-4.5 text-[0.9rem] text-[#aaa]"> {formatDate(user.createdAt)} </td>
            <td className="p-4.5 text-white/90"> {user.wallets} </td>
            <td className="p-4.5 text-white/90"> {user.transactions} </td>
            <td className="p-4.5">
                <button
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-transparent text-app-muted transition-all duration-200 hover:bg-[#e74c3c]/10 hover:text-[#e74c3c]"
                    onClick={() => onDelete(user)}
                    title="Delete User"
                >
                    <FontAwesomeIcon icon={faTrash}/>
                </button>
            </td>
        </tr>
    );
};

export default UserRow;