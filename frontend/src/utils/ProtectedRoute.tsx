import {Navigate, Outlet, useLocation} from 'react-router-dom';
import {isTokenValid} from './authHelper.ts';

const ProtectedRoute = () => {
    const location = useLocation();
    const isValid = isTokenValid();
    if (!isValid) return <Navigate to="/" state={{from: location}} replace/>;
    return <Outlet/>;
};

export default ProtectedRoute;