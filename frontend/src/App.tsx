import React from 'react';
import {Routes, Route, Navigate} from 'react-router-dom';
import Login from './Login/Login';
import Dashboard from './UserDashboard/UserDashboard.tsx';
import AdminDashboard from './AdminDashboard/AdminDashboard'; // Importa la pagina Admin
import ProtectedRoute from './Components/ProtectedRoute'; // Importa il buttafuori

const App: React.FC = () => {
    return (
        // Assicurati che in main.tsx NON ci sia un altro BrowserRouter
        <Routes>
            {/* 1. Rotta Pubblica (Login) */}
            <Route path="/" element={<Login/>}/>

            {/* 2. Rotte Protette (Serve il Token) */}
            <Route element={<ProtectedRoute/>}>
                <Route path="/dashboard" element={<Dashboard/>}/>

                {/* Qui potresti fare un controllo extra per il ruolo ADMIN */}
                <Route path="/admin/dashboard" element={<AdminDashboard/>}/>
            </Route>

            {/* 3. Gestione 404: Qualsiasi altra rotta rimanda al login */}
            <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
    );
};

export default App;