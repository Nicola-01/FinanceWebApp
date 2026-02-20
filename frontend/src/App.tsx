import React, {useRef} from 'react';
import {Routes, Route, Navigate} from 'react-router-dom';
import Login from './Login/Login';
import Dashboard from './UserDashboard/UserDashboard.tsx';
import AdminDashboard from './AdminDashboard/AdminDashboard'; // Importa la pagina Admin
import ProtectedRoute from './Components/ProtectedRoute';
import {ToastNotification} from "./Components/ToastNotification.tsx";
import {DeleteConfirmationModal, type DeleteModalHandle} from "./modals/DeleteConfirmationModal.tsx";

const App: React.FC = () => {

    const deleteModalRef = useRef<DeleteModalHandle>(null);
    return (
        <>
            <ToastNotification/>
            <DeleteConfirmationModal ref={deleteModalRef}/>
            <Routes>
                {/* 1. Rotta Pubblica (Login) */}
                <Route path="/" element={<Login/>}/>

                {/* 2. Rotte Protette (Serve il Token) */}
                <Route element={<ProtectedRoute/>}>
                    <Route path="/dashboard" element={<Dashboard/>}/>

                    {/* TODO Qui potresti fare un controllo extra per il ruolo ADMIN */}
                    <Route
                        path="/admin/dashboard"
                        element={<AdminDashboard deleteModalRef={deleteModalRef}/>}
                    />
                </Route>

                {/* 3. Gestione 404: Qualsiasi altra rotta rimanda al login */}
                <Route path="*" element={<Navigate to="/" replace/>}/>
            </Routes>
        </>
    );
};

export default App;