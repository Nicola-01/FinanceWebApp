import React from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faTrash} from '@fortawesome/free-solid-svg-icons';
import type {User} from './AdminDashboard';

interface UserRowProps {
    user: User;
    onDelete: (user: User) => void;
}

const UserRow: React.FC<UserRowProps> = ({user, onDelete}) => {
    return (
        <tr className="user-row-animation">
            <td>{user.username}</td>
            <td>{user.wallets}</td>
            <td>{user.transactions}</td>
            <td>
                <button className="delete-btn" onClick={() => onDelete(user)}>
                    <FontAwesomeIcon icon={faTrash}/>
                </button>
            </td>
        </tr>
    );
};

export default UserRow;