import React from "react";
import { Outlet } from "react-router-dom";
import { AnimateBackground } from "./AnimateBackground.tsx";

/**
 * Shared shell for the auth screens (login / register / forgot / reset).
 *
 * The animated sphere background is rendered ONCE here and only the form swaps
 * via <Outlet/>. Because this layout element stays mounted across the child
 * routes, navigating between auth pages no longer remounts/restarts the
 * background — only the inner card changes.
 *
 * `dark` forces the dark token palette regardless of the user's theme: the auth
 * screens are always dark (the sphere background is dark).
 */
const AuthLayout: React.FC = () => {
  return (
    <div className="dark relative flex min-h-[100dvh] items-start justify-center overflow-x-hidden overflow-y-auto bg-app-bg px-4 pt-[8dvh] pb-8 sm:items-center sm:px-0 sm:pt-0 sm:pb-0">
      <AnimateBackground />
      <Outlet />
    </div>
  );
};

export default AuthLayout;
