import React, { useRef, useEffect } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import Login from "./auth/Login";
import UserDashboard from "./dashboard/UserDashboard.tsx";
import AdminDashboard from "./admin/AdminDashboard"; // Importa la pagina Admin
import ProtectedRoute from "./utils/ProtectedRoute.tsx";
import { ToastNotification } from "./components/ui/ToastNotification.tsx";
import {
  DeleteModal,
  type DeleteModalHandle,
} from "./modals/common/DeleteModal";
import { DeleteModalProvider } from "./modals/common/DeleteModalContext";
import Register from "./register/Register.tsx";
import ForgotPassword from "./auth/ForgotPassword.tsx";
import ResetPassword from "./auth/ResetPassword.tsx";
import { initSync } from "./utils/syncService.ts";
import { ThemeProvider } from "./utils/ThemeContext.tsx";
import { getUserAuth } from "./utils/authHelper.ts";
import { PWAProvider } from "./utils/PWAContext.tsx";
import { PWAPrompt } from "./components/ui/PWAPrompt.tsx";
import LandingPage from "./components/LandingPage/LandingPage.tsx";
import ToDoPage from "./components/ToDoPage/ToDoPage.tsx";
import OAuthConsent from "./auth/OAuthConsent.tsx";

const App: React.FC = () => {
  const deleteModalRef = useRef<DeleteModalHandle>(null);

  useEffect(() => {
    initSync();
  }, []);

  const RootRedirect = () => {
    const user = getUserAuth();
    if (user) {
      if (user.role === "ADMIN")
        return <Navigate to="/admin/dashboard" replace />;
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/about" replace />;
  };

  const AdminRoute = () => {
    const user = getUserAuth();
    if (user?.role !== "ADMIN") return <Navigate to="/" replace />;
    return <Outlet />;
  };

  return (
    <ThemeProvider>
      <PWAProvider>
        <PWAPrompt />
        <ToastNotification />
        <DeleteModalProvider deleteModalRef={deleteModalRef}>
          <DeleteModal ref={deleteModalRef} />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/about" element={<LandingPage />} />
            <Route path="/ToDo" element={<ToDoPage />} />
            <Route path="/oauth/authorize" element={<OAuthConsent />} />

            {/* Root Route serves the Landing Page or Redirects based on auth */}
            <Route path="/" element={<RootRedirect />} />

            {/* Generic protected routes (user must be logged in) */}
            <Route element={<ProtectedRoute />}>
              {/* User Dashboard */}
              <Route path="/dashboard/:walletId?" element={<UserDashboard />} />

              {/* Specific protected routes for ADMIN */}
              <Route element={<AdminRoute />}>
                <Route path="/admin/dashboard/*" element={<AdminDashboard />} />
                {/* Any other admin routes will go here */}
              </Route>
            </Route>

            {/* CATCH-ALL: If the user types a non-existent URL */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DeleteModalProvider>
      </PWAProvider>
    </ThemeProvider>
  );
};

export default App;
