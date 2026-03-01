import React, {useRef} from 'react';
import {Navigate, Route, Routes} from 'react-router-dom';
import Login from './auth/Login';
import UserDashboard from './dashboard/UserDashboard.tsx';
import AdminDashboard from './admin/AdminDashboard'; // Importa la pagina Admin
import ProtectedRoute from './utils/ProtectedRoute.tsx';
import {ToastNotification} from "./components/ToastNotification.tsx";
import {DeleteModal, type DeleteModalHandle} from "./modals/DeleteModal.tsx";
import {DeleteModalProvider} from "./modals/DeleteModalContext.tsx";
import Register from "./register/Register.tsx";

const App: React.FC = () => {

    const deleteModalRef = useRef<DeleteModalHandle>(null);
    return (
        <>
            <ToastNotification/>
            <DeleteModalProvider deleteModalRef={deleteModalRef}>
                <DeleteModal ref={deleteModalRef}/>
                <Routes>
                    <Route path="/login" element={<Login/>}/>
                    <Route path="/register" element={<Register/>}/>

                    <Route element={<ProtectedRoute/>}>

                        <Route path="/" element={<Navigate to="/dashboard" replace />} />

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

                    {/* CATCH-ALL: Se l'utente digita un URL che non esiste, mandalo alla root
            (che a sua volta lo manderà alla dashboard o al login a seconda del token) */}
                    <Route path="*" element={<Navigate to="/" replace/>}/>
                </Routes>
            </DeleteModalProvider>
        </>
    );
};

export default App;