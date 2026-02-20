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
import type {DeleteModalHandle} from "../modals/DeleteConfirmationModal.tsx";
import {triggerToast} from '../Components/ToastNotification.tsx';
import {StatCard} from "./StatCard.tsx";
import type {User} from "../types";

type SortConfig = {
    key: keyof User;
    direction: 'ascending' | 'descending';
} | null;

interface AdminDashboardProps {
    deleteModalRef: React.RefObject<DeleteModalHandle | null>,
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({deleteModalRef}) => {
    // ... (States remain the same) ...
    const [users, setUsers] = useState<User[]>([]);
    const [newUser, setNewUser] = useState({username: '', password: ''});
    const [showPassword, setShowPassword] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);

    // ... (useEffect and API functions remain the same) ...
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const res = await api.get('/admin/management/users');
            setUsers(res.data);
        } catch (err: any) {
            triggerToast(err.response.data.title || 'Error loading users"', false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newUser.username.trim().length < 3) {
            triggerToast("Username must be at least 3 characters.", false);
            return;
        }
        try {
            const response = await api.post('admin/management/newuser', {username: newUser.username});
            setNewUser({username: newUser.username, password: response.data.tempPassword});
            triggerToast("User created!", true);
            loadUsers();
        } catch (err: any) {
            triggerToast(err.response.data.title || 'User creation failed', false);
        }
    };


    const copyToClipboard = () => {
        if (newUser.password) {
            navigator.clipboard.writeText(newUser.password);
            triggerToast('Copied!', true);
        }
    };
    const resetForm = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        setNewUser({username: '', password: ''});
        setShowPassword(false);
    };

    const handleConfirmDelete = async (userId: string) => {
        try {
            await api.delete(`/admin/management/${userId}`);
            setUsers(prev => prev.filter(u => u.id !== userId));
            triggerToast("Deleted!", true);
        } catch (err: any) {
            triggerToast(err.response.data.title || 'Error deleting."', false);
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

        if (searchTerm)
            sortableUsers = sortableUsers.filter(user =>
                user.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );

        if (sortConfig !== null) {
            const {key, direction} = sortConfig;

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

    const getSortIcon = (name: keyof User) => (!sortConfig || sortConfig.key !== name) ? faSort : (sortConfig.direction === 'ascending' ? faSortUp : faSortDown);

    return (
        <div className="admin-container">
            <div className="background-dashboard">
                <Sphere style={{height: "400px", width: "400px", background: "#ff2299", top: "-100px", right: "-100px"}}
                        animate={{x: [0, 0], y: [0, 0]}}/>
            </div>

            <header className="glass-header">
                <h2>Admin<span className="accent text-gradient-neon animate-gradient-x ml-1">Panel</span></h2>
                <button className="logout-btn" onClick={() => window.location.href = '/login'} title="Logout">
                    <FontAwesomeIcon icon={faSignOutAlt}/>
                </button>
            </header>

            <main className="admin-content">

                {/* 1. STATS CARDS (Top Section) */}
                <div className="stats-grid">
                    <StatCard
                        title="Total Users"
                        value={users.length}
                        icon={faUsers}
                        color="#3333ff"
                    />
                    <StatCard
                        title="Active Wallets"
                        value={totalWallets}
                        icon={faWallet}
                        color="#3333ff"
                    />
                    <StatCard
                        title="Transactions"
                        value={totalTransactions}
                        icon={faExchangeAlt}
                        color="#ff00cc"
                    />
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
                                    <th onClick={() => requestSort('name')}>User <FontAwesomeIcon
                                        icon={getSortIcon('name')} className="sort-icon"/></th>
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
                                        <UserRow key={user.name} user={user}
                                                 onDelete={(userToDelete: User) => {
                                                     deleteModalRef.current?.deleteObject(userToDelete, 'user', () => handleConfirmDelete(userToDelete.id));
                                                 }}
                                        />
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