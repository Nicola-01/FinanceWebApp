import React, { useRef, useEffect } from 'react';
import {Navigate, Outlet, Route, Routes} from 'react-router-dom';
import Login from './auth/Login';
import UserDashboard from './dashboard/UserDashboard.tsx';
import AdminDashboard from './admin/AdminDashboard'; // Importa la pagina Admin
import ProtectedRoute from './utils/ProtectedRoute.tsx';
import { ToastNotification } from "./components/ToastNotification.tsx";
import { DeleteModal, type DeleteModalHandle } from "./modals/DeleteModal.tsx";
import { DeleteModalProvider } from "./modals/DeleteModalContext.tsx";
import Register from "./register/Register.tsx";
import { initSync } from './utils/syncService.ts';
import { ThemeProvider } from "./utils/ThemeContext.tsx";
import {getUserAuth} from "./utils/authHelper.ts";

const App: React.FC = () => {

    const deleteModalRef = useRef<DeleteModalHandle>(null);

    useEffect(() => {
        initSync();
    }, []);

    const RootRedirect = () => {
        const user = getUserAuth();
        if (user?.role === 'ADMIN')
            return <Navigate to="/admin/dashboard" replace />;
        return <Navigate to="/dashboard" replace />;
    };

    const AdminRoute = () => {
        const user = getUserAuth();
        if (user?.role !== 'ADMIN')
            return <Navigate to="/" replace />;
        return <Outlet />;
    };

    return (
        <ThemeProvider>
            <ToastNotification />
            <DeleteModalProvider deleteModalRef={deleteModalRef}>
                <DeleteModal ref={deleteModalRef} />
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Generic protected routes (user must be logged in) */}
                    <Route element={<ProtectedRoute />}>

                        {/* Replaced the static Navigate with our dynamic redirect */}
                        <Route path="/" element={<RootRedirect />} />

                        {/* User Dashboard */}
                        <Route
                            path="/dashboard/:walletId?"
                            element={<UserDashboard />}
                        />

                        {/* Specific protected routes for ADMIN */}
                        <Route element={<AdminRoute />}>
                            <Route
                                path="/admin/dashboard"
                                element={<AdminDashboard />}
                            />
                            {/* Any other admin routes will go here */}
                        </Route>

                    </Route>

                    {/* CATCH-ALL: If the user types a non-existent URL */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </DeleteModalProvider>
        </ThemeProvider>
    );
};

export default App;