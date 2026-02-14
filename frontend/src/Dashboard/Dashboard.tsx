import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import api from '../api/axiosConfig'; // La tua istanza axios configurata
import Sphere from '../assets/Sphere'; // Riutilizziamo le sfere per lo stile
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faWallet, faArrowUp, faArrowDown, faSignOutAlt} from '@fortawesome/free-solid-svg-icons';
import './Dashboard.css';

// Definiamo i tipi dei dati che ci aspettiamo dal backend
interface Transaction {
    id: number;
    description: string;
    amount: number;
    date: string;
    type: 'INCOME' | 'EXPENSE';
}

interface DashboardData {
    username: string;
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpense: number;
    recentTransactions: Transaction[];
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    // Funzione di Logout
    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        sessionStorage.removeItem('jwtToken');
        navigate('/login');
    };

    // Caricamento Dati
    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                // Chiamata all'endpoint Java che abbiamo creato
                const response = await api.get('/dashboard');
                setData(response.data);
            } catch (error) {
                console.error("Errore nel caricamento dashboard", error);
                // Se il token è scaduto o invalido, l'interceptor potrebbe aver già gestito l'errore,
                // ma per sicurezza possiamo reindirizzare
                // navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    if (loading) return <div className="loading-screen">Caricamento...</div>;

    return (
        <div className="dashboard-container">
            {/* Sfondo animato (opzionale, riusa quello del login se ti piace) */}
            <div className="background-dashboard">
                <Sphere
                    style={{
                        height: "300px", width: "300px", background: "#4d22ff", top: "-50px", right: "-50px"
                    }}
                    animate={{x: [0, 20, 0], y: [0, -20, 0]}}/>
            </div>

            {/* Sidebar / Topbar Semplificata */}
            <header className="glass-header">
                <h2>Finance<span className="accent">App</span></h2>
                <div className="user-info">
                    <span>Ciao, <strong>{data?.username}</strong></span>
                    <button onClick={handleLogout} className="logout-btn">
                        <FontAwesomeIcon icon={faSignOutAlt}/>
                    </button>
                </div>
            </header>

            <main className="dashboard-content">

                {/* 1. Card Principale: Bilancio */}
                <div className="glass-card balance-card">
                    <h3>Total Balance</h3>
                    <div className="balance-amount">
                        € {data?.totalBalance.toFixed(2)}
                    </div>
                    <div className="balance-icon">
                        <FontAwesomeIcon icon={faWallet}/>
                    </div>
                </div>

                {/* 2. Statistiche Rapide */}
                <div className="stats-grid">
                    <div className="glass-card income-card">
                        <div className="stat-icon income"><FontAwesomeIcon icon={faArrowUp}/></div>
                        <div>
                            <p>Income</p>
                            <h4>+€ {data?.monthlyIncome.toFixed(2)}</h4>
                        </div>
                    </div>
                    <div className="glass-card expense-card">
                        <div className="stat-icon expense"><FontAwesomeIcon icon={faArrowDown}/></div>
                        <div>
                            <p>Expense</p>
                            <h4>-€ {data?.monthlyExpense.toFixed(2)}</h4>
                        </div>
                    </div>
                </div>

                {/* 3. Lista Transazioni Recenti */}
                <div className="glass-card transactions-section">
                    <h3>Recent Transactions</h3>
                    <ul className="transaction-list">
                        {data?.recentTransactions.length === 0 ? (
                            <li className="no-data">Nessuna transazione recente</li>
                        ) : (
                            data?.recentTransactions.map((tx) => (
                                <li key={tx.id} className="transaction-item">
                                    <div className="tx-info">
                                        <span className="tx-desc">{tx.description}</span>
                                        <span className="tx-date">{tx.date}</span>
                                    </div>
                                    <span className={`tx-amount ${tx.type === 'INCOME' ? 'positive' : 'negative'}`}>
                                        {tx.type === 'INCOME' ? '+' : '-'} € {Math.abs(tx.amount).toFixed(2)}
                                    </span>
                                </li>
                            ))
                        )}
                    </ul>
                </div>

            </main>
        </div>
    );
};

export default Dashboard;