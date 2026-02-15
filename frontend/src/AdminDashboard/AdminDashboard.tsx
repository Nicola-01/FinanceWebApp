import React, {useEffect, useState} from 'react';
import api from '../api/axiosConfig';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
    faUserPlus,
    faSignOutAlt,
    faLock,
    // faCheck,
    faUserCheck, faEye,
    faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import Sphere from '../assets/Sphere';
import './AdminDashboard.css';
import UserRow from "./UserRow.tsx";

import {ToastNotification} from '../assets/ToastNotification';
import {DeleteConfirmationModal} from "../assets/DeleteConfirmationModal.tsx"; // Aggiusta i path
// import {DeleteConfirmationModal} from '../assets/DeleteConfirmationModal';

export interface User {
    id: string;
    username: string;
    createdAt: string;
    wallets: number;
    transactions: number;
}

const AdminDashboard: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [newUser, setNewUser] = useState({username: '', password: ''});
    const [showPassword, setShowPassword] = useState(false);
    const [toast, setToast] = useState({show: false, message: ''});
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);


    const loadUsers = async () => {
        try {
            const res = await api.get('/admin/management/users');
            setUsers(res.data);
        } catch (err) {
            console.error("Errore caricamento utenti", err);
        }
    };

    const triggerToast = (message: string) => {
        setToast({ show: true, message });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };


    const initiateDelete = (user: User) => {
        setUserToDelete(user);
    };

    const closeDeleteModal = () => {
        setUserToDelete(null);
    };

    const handleConfirmDelete = async (userId: string) => {
        try {
            await api.delete(`/admin/management/${userId}`);
            setUsers(users.filter(u => u.id !== userId));
            closeDeleteModal();
            triggerToast("User successfully deleted!");
        } catch (err) {
            console.error(err);
            alert("Error during deletion");
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post('admin/management/newuser', {username: newUser.username});

            const generatedPassword = response.data.tempPassword;
            setNewUser({username: newUser.username, password: generatedPassword});
            loadUsers(); // Ricarica la lista
        } catch (err) {
            alert("User creation error");
        }
    };

    const copyToClipboard = () => {
        if (newUser.password) {
            navigator.clipboard.writeText(newUser.password);
            triggerToast('Password copied!')
        }
    };

    const resetForm = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setNewUser({username: '', password: ''});
        setShowPassword(false);
    };

    return (
        <div className="admin-container">
            <div className="background-dashboard">
                <Sphere
                    style={{
                        height: "400px", width: "400px", background: "#ff2299", top: "-100px", right: "-100px"
                    }}
                    animate={{x: [0, 0], y: [0, 0]}}/>
            </div>

            <header className=" glass-header">
                <h2>Admin<span className=" accent">Panel</span></h2>
                <button className=" logout-btn" onClick={() => window.location.href = '/login'}>
                    <FontAwesomeIcon icon={faSignOutAlt}/>
                </button>
            </header>

            <ToastNotification show={toast.show} message={toast.message}/>

            <DeleteConfirmationModal
                isOpen={!!userToDelete}
                user={userToDelete}
                onClose={closeDeleteModal}
                onConfirm={handleConfirmDelete}
            />

            <main className=" admin-content">

                <div className=" glass-card table-container">
                    <div className=" card-header">
                        <h3>User Management</h3>
                    </div>

                    <form className=" create-user-form" onSubmit={handleCreate}>
                        <input
                            placeholder=" Name"
                            value={newUser.username}
                            onChange={e => setNewUser({...newUser, username: e.target.value})}
                            disabled={!!newUser.password}
                        />

                        {!newUser.password ? (
                            <div className="auto-password-field">
                                <FontAwesomeIcon icon={faLock} className="lock-icon"/>
                                <span>Password Auto-generata</span>
                            </div>
                        ) : (
                            <div className="generated-password-group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={newUser.password}
                                    readOnly
                                    className="password-input"
                                    onClick={copyToClipboard}
                                />

                                <button
                                    type="button"
                                    className="icon-action-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    title="Show/Hide"
                                >
                                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye}/>
                                </button>

                            </div>
                        )}

                        {!newUser.password ? (
                            <button type="submit" className="add-btn">
                                <FontAwesomeIcon icon={faUserPlus}/>
                            </button>
                        ) : (
                            <button type="button" className="reset-btn" onClick={resetForm}>
                                <FontAwesomeIcon icon={faUserCheck}/>
                            </button>
                        )}
                    </form>

                    {/* TABELLA */}
                    <table className=" glass-table">
                        <thead>
                        <tr>
                            <th>User</th>
                            <th>Wallets</th>
                            <th>Transactions</th>
                            <th>Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {users.map(user => (
                            <UserRow key={user.username} user={user} onDelete={initiateDelete}/>
                        ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;