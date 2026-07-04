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
