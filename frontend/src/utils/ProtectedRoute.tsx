import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken } from "./authHelper.ts";

const ProtectedRoute = () => {
  const location = useLocation();
  // Solo check se il token esiste nello storage.
  // La validità (scadenza) viene gestita dall'interceptor Axios:
  // quando un'API ritorna 401, l'interceptor chiama /auth/refresh automaticamente.
  const hasToken = !!getToken();
  if (!hasToken) {
    localStorage.removeItem("mustChangePWD");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
