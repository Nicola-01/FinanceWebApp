import React, {useRef} from 'react';
import {Routes, Route, Navigate} from 'react-router-dom';
import Login from './auth/Login';
import UserDashboard from './dashboard/UserDashboard.tsx';
import AdminDashboard from './admin/AdminDashboard'; // Importa la pagina Admin
import ProtectedRoute from './utils/ProtectedRoute.tsx';
import {ToastNotification} from "./components/ToastNotification.tsx";
import {DeleteModal, type DeleteModalHandle} from "./modals/DeleteModal.tsx";
import {DeleteModalProvider} from "./modals/DeleteModalContext.tsx";

const App: React.FC = () => {

    const deleteModalRef = useRef<DeleteModalHandle>(null);
    return (
        <>
            <ToastNotification/>
            <DeleteModalProvider deleteModalRef={deleteModalRef}>
                <DeleteModal ref={deleteModalRef}/>
                <Routes>
                    {/* 1. Rotta Pubblica (Login) */}
                    <Route path="/" element={<Login/>}/>

                    {/* 2. Rotte Protette (Serve il Token) */}
                    <Route element={<ProtectedRoute/>}>

                        <Route
                            path="/dashboard/:walletId?"
                            element={<UserDashboard/>}
                        />

                        {/* TODO Qui potresti fare un controllo extra per il ruolo ADMIN */}
                        <Route
                            path="/admin/dashboard"
                            element={<AdminDashboard/>}
                        />
                    </Route>

                    {/* 3. Gestione 404: Qualsiasi altra rotta rimanda al login */}
                    <Route path="*" element={<Navigate to="/" replace/>}/>
                </Routes>
            </DeleteModalProvider>
        </>
    );
};

export default App;