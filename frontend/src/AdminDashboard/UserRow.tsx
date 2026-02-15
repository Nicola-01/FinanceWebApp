import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import type { User } from './AdminDashboard';

interface UserRowProps {
    user: User;
    onDelete: (user: User) => void;
}

const UserRow: React.FC<UserRowProps> = ({ user, onDelete }) => {
    // Funzione helper per formattare la data
    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        // Formatta come "Oct 25, 2023" (o usa 'it-IT' per formato italiano)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <tr className="user-row-animation">
            <td style={{fontWeight: 'bold', color: 'white'}}>{user.username}</td>
            <td style={{color: '#aaa', fontSize: '0.9rem'}}>
                {formatDate(user.createdAt)}
            </td>
            <td>{user.wallets}</td>
            <td>{user.transactions}</td>
            <td>
                <button className="delete-btn" onClick={() => onDelete(user)}>
                    <FontAwesomeIcon icon={faTrash} />
                </button>
            </td>
        </tr>
    );
};

export default UserRow;