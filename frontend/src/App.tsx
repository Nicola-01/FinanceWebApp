import React, { useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './auth/Login';
import UserDashboard from './dashboard/UserDashboard.tsx';
import AdminDashboard from './admin/AdminDashboard'; // Importa la pagina Admin
import ProtectedRoute from './utils/ProtectedRoute.tsx';
import { ToastNotification } from "./components/ToastNotification.tsx";
import { DeleteConfirmationModal, type DeleteModalHandle } from "./modals/DeleteConfirmationModal.tsx";

const App: React.FC = () => {

    const deleteModalRef = useRef<DeleteModalHandle>(null);
    return (
        <>
            <ToastNotification />
            <DeleteConfirmationModal ref={deleteModalRef} />
            <Routes>
                {/* 1. Rotta Pubblica (Login) */}
                <Route path="/" element={<Login />} />

                {/* 2. Rotte Protette (Serve il Token) */}
                <Route element={<ProtectedRoute />}>
                    <Route
                        path="/dashboard/:walletId?"
                        element={<UserDashboard deleteModalRef={deleteModalRef} />}
                    />

                    {/* TODO Qui potresti fare un controllo extra per il ruolo ADMIN */}
                    <Route
                        path="/admin/dashboard"
                        element={<AdminDashboard deleteModalRef={deleteModalRef} />}
                    />
                </Route>

                {/* 3. Gestione 404: Qualsiasi altra rotta rimanda al login */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
};

export default App;