import React, {useEffect, useState, useMemo} from 'react';
import api from '../api/axiosConfig';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
    faUserPlus, faSignOutAlt, faLock, faUserCheck, faEye, faEyeSlash,
    faSearch, faSort, faSortUp, faSortDown, faUsers, faWallet, faExchangeAlt
} from '@fortawesome/free-solid-svg-icons';
import Sphere from '../assets/Sphere';
import './AdminDashboard.css';
import UserRow from "./UserRow";
import {ToastNotification} from '../assets/ToastNotification';
import {DeleteConfirmationModal} from "../modals/DeleteConfirmationModal.tsx";

// ... (Interfaces remain the same) ...
export interface User {
    id: string;
    username: string;
    createdAt: string;
    wallets: number;
    transactions: number;
}

type SortConfig = {
    key: keyof User;
    direction: 'ascending' | 'descending';
} | null;

const AdminDashboard: React.FC = () => {
    // ... (States remain the same) ...
    const [users, setUsers] = useState<User[]>([]);
    const [newUser, setNewUser] = useState({username: '', password: ''});
    const [showPassword, setShowPassword] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const [toast, setToast] = useState({show: false, message: ''});
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    // ... (useEffect and API functions remain the same) ...
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const res = await api.get('/admin/management/users');
            setUsers(res.data);
        } catch (err) {
            console.error("Error loading users", err);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newUser.username.trim().length < 3) {
            triggerToast("Username must be at least 3 characters.");
            return;
        }
        try {
            const response = await api.post('admin/management/newuser', {username: newUser.username});
            setNewUser({username: newUser.username, password: response.data.tempPassword});
            triggerToast("User created!");
            loadUsers();
        } catch (err) {
            triggerToast("User creation failed.");
        }
    };

    // ... (Delete and Copy helper functions remain the same) ...
    const triggerToast = (msg: string) => {
        setToast({show: true, message: msg});
        setTimeout(() => setToast(prev => ({...prev, show: false})), 3000);
    };
    const copyToClipboard = () => {
        if (newUser.password) {
            navigator.clipboard.writeText(newUser.password);
            triggerToast('Copied!');
        }
    };
    const resetForm = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        setNewUser({username: '', password: ''});
        setShowPassword(false);
    };
    const initiateDelete = (user: User) => setUserToDelete(user);
    const closeDeleteModal = () => setUserToDelete(null);
    const handleConfirmDelete = async (userId: string) => {
        try {
            await api.delete(`/admin/management/${userId}`);
            setUsers(prev => prev.filter(u => u.id !== userId));
            closeDeleteModal();
            triggerToast("Deleted!");
        } catch (err) {
            triggerToast("Error deleting.");
        }
    };

    // --- CALCULATED STATS FOR THE DASHBOARD ---
    const totalWallets = users.reduce((acc, user) => acc + (user.wallets || 0), 0);
    const totalTransactions = users.reduce((acc, user) => acc + (user.transactions || 0), 0);

    // --- SORTING & FILTERING ---
    const requestSort = (key: keyof User) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({key, direction});
    };

    const processedUsers = useMemo(() => {
        let sortableUsers = [...users];
        if (searchTerm) sortableUsers = sortableUsers.filter(user => user.username.toLowerCase().includes(searchTerm.toLowerCase()));
        if (sortConfig !== null) {
            sortableUsers.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableUsers;
    }, [users, sortConfig, searchTerm]);

    const getSortIcon = (name: keyof User) => (!sortConfig || sortConfig.key !== name) ? faSort : (sortConfig.direction === 'ascending' ? faSortUp : faSortDown);

    return (
        <div className="admin-container">
            <div className="background-dashboard">
                <Sphere style={{height: "400px", width: "400px", background: "#ff2299", top: "-100px", right: "-100px"}}
                        animate={{x: [0, 0], y: [0, 0]}}/>
            </div>

            <header className="glass-header">
                <h2>Admin<span className="accent">Panel</span></h2>
                <button className="logout-btn" onClick={() => window.location.href = '/login'} title="Logout">
                    <FontAwesomeIcon icon={faSignOutAlt}/>
                </button>
            </header>

            <ToastNotification show={toast.show} message={toast.message}/>
            <DeleteConfirmationModal isOpen={!!userToDelete} user={userToDelete} onClose={closeDeleteModal}
                                     onConfirm={handleConfirmDelete}/>

            <main className="admin-content">

                {/* 1. STATS CARDS (Top Section) */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon-wrapper"><FontAwesomeIcon icon={faUsers}/></div>
                        <div className="stat-info">
                            <h4>Total Users</h4>
                            <p>{users.length}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon-wrapper" style={{color: '#3333ff'}}><FontAwesomeIcon icon={faWallet}/>
                        </div>
                        <div className="stat-info">
                            <h4>Active Wallets</h4>
                            <p>{totalWallets}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon-wrapper" style={{color: '#ff00cc'}}><FontAwesomeIcon
                            icon={faExchangeAlt}/></div>
                        <div className="stat-info">
                            <h4>Transactions</h4>
                            <p>{totalTransactions}</p>
                        </div>
                    </div>
                </div>

                <div className="glass-card main-card">

                    {/* 2. CREATE USER SECTION (Clearly separated) */}
                    <div className="create-section">
                        <h4 className="section-title"><FontAwesomeIcon icon={faUserPlus}/> Create New User</h4>

                        <form className="create-user-form" onSubmit={handleCreate}>
                            {/* Input Name */}
                            <div className="form-group">
                                <input
                                    placeholder="Enter username..."
                                    value={newUser.username}
                                    onChange={e => setNewUser({...newUser, username: e.target.value})}
                                    disabled={!!newUser.password}
                                />
                            </div>

                            {/* Password Area */}
                            <div className="form-group">
                                {!newUser.password ? (
                                    <div className="auto-password-field">
                                        <FontAwesomeIcon icon={faLock}/>
                                        <span>Password Auto-generated</span>
                                    </div>
                                ) : (
                                    <div className="generated-password-display">
                                        <input type={showPassword ? "text" : "password"} value={newUser.password}
                                               readOnly className="password-input-ro" onClick={copyToClipboard}/>
                                        <div className="action-buttons">
                                            {/*<button type="button" className="icon-action-btn" onClick={copyToClipboard}>*/}
                                            {/*    <FontAwesomeIcon icon={faCopy}/></button>*/}
                                            <button type="button" className="icon-action-btn transparent-background"
                                                    onClick={() => setShowPassword(!showPassword)}><FontAwesomeIcon
                                                icon={showPassword ? faEyeSlash : faEye}/></button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Button */}
                            <div className="form-group">
                                {!newUser.password ? (
                                    <button type="submit" className="add-btn" disabled={newUser.username.length < 3}>
                                        <FontAwesomeIcon icon={faUserPlus}/>
                                    </button>
                                ) : (
                                    <button type="button" className="reset-btn" onClick={resetForm}>
                                        <FontAwesomeIcon icon={faUserCheck}/>
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* 3. LIST & FILTER SECTION */}
                    <div className="list-section">
                        <div className="table-toolbar">
                            <h4 className="section-title" style={{marginBottom: 0}}>User Directory</h4>

                            <div className="search-bar">
                                <FontAwesomeIcon icon={faSearch} className="search-icon"/>
                                <input
                                    type="text"
                                    placeholder="Search by name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="table-scroll-container">
                            <table className="glass-table">
                                <thead>
                                <tr>
                                    <th onClick={() => requestSort('username')}>User <FontAwesomeIcon
                                        icon={getSortIcon('username')} className="sort-icon"/></th>
                                    <th onClick={() => requestSort('createdAt')}>
                                        Joined <FontAwesomeIcon icon={getSortIcon('createdAt')} className="sort-icon"/>
                                    </th>
                                    <th onClick={() => requestSort('wallets')}>Wallets <FontAwesomeIcon
                                        icon={getSortIcon('wallets')} className="sort-icon"/></th>
                                    <th onClick={() => requestSort('transactions')}>Transactions <FontAwesomeIcon
                                        icon={getSortIcon('transactions')} className="sort-icon"/></th>
                                    <th>Action</th>
                                </tr>
                                </thead>
                                <tbody>
                                {processedUsers.length > 0 ? (
                                    processedUsers.map(user => (
                                        <UserRow key={user.username} user={user} onDelete={initiateDelete}/>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="no-data"
                                            style={{textAlign: 'center', padding: '20px', color: '#666'}}>No users
                                            found.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;