import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken } from "./authHelper.ts";

const ProtectedRoute = () => {
  const location = useLocation();
  // Only checks that a token exists in storage. Expiry is handled by the Axios
  // interceptor: on a 401 it calls /auth/refresh automatically.
  const hasToken = !!getToken();
  if (!hasToken) {
    localStorage.removeItem("mustChangePWD");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Forced password change: pin the user to the Security settings until done.
  let mustChange = false;
  try {
    mustChange =
      JSON.parse(localStorage.getItem("mustChangePWD") || "false") === true;
  } catch {
    mustChange = false;
  }
  if (mustChange && location.pathname !== "/settings") {
    return <Navigate to="/settings#security" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
