import { Navigate, Outlet, useLocation } from "react-router-dom";
import {
  clearMustChangePWD,
  getMustChangePWD,
  getToken,
} from "./authHelper.ts";

const ProtectedRoute = () => {
  const location = useLocation();
  // Only checks that a token exists in storage. Expiry is handled by the Axios
  // interceptor: on a 401 it calls /auth/refresh automatically.
  const hasToken = !!getToken();
  if (!hasToken) {
    clearMustChangePWD();
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Forced password change: pin the user to the Security settings until done.
  const mustChange = getMustChangePWD();
  if (mustChange && location.pathname !== "/settings") {
    return <Navigate to="/settings#security" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
