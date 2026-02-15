// Components/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const token = localStorage.getItem('jwtToken');
    if (!token)
        return <Navigate to="/" replace />;

    // Se c'è il token, mostra la pagina richiesta (Outlet)
    return <Outlet />;
};

export default ProtectedRoute;