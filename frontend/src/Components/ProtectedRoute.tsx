// Components/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
    if (!token)
        return <Navigate to="/" replace />;

    return <Outlet />;
};

export default ProtectedRoute;