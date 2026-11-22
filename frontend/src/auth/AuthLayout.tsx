import React from "react";
import { Outlet } from "react-router-dom";
import { AnimateBackground } from "./AnimateBackground.tsx";
import { AuthBackdrop } from "./AuthBackdrop.tsx";
import { useUiVersion } from "../hooks/useUiVersion";

/**
 * Shared shell for the auth screens (login / register / forgot / reset).
 *
 * The animated sphere background is rendered ONCE here and only the form swaps
 * via <Outlet/>. Because this layout element stays mounted across the child
 * routes, navigating between auth pages no longer remounts/restarts the
 * background — only the inner card changes.
 *
 * v1: `dark` forces the dark token palette regardless of the user's theme.
 * v2: no forced dark and no sphere background — the auth screens follow the theme
 * and sit on the flat dot-grid backdrop, top-aligned on phone, centred on desktop.
 */
const AuthLayout: React.FC = () => {
  const [ui] = useUiVersion();
  // ui-v2-switch
  if (ui === "v2") {
    return (
      <div className="flex min-h-dvh flex-col items-center bg-app-bg px-4 pt-6 pb-10 sm:justify-center sm:px-6 sm:py-16">
        <AuthBackdrop />
        <div className="relative z-10 flex w-full flex-col items-center">
          <Outlet />
        </div>
      </div>
    );
  }
  return (
    <div className="dark relative flex min-h-[100dvh] items-start justify-center overflow-x-hidden overflow-y-auto bg-app-bg px-4 pt-[8dvh] pb-8 sm:items-center sm:px-0 sm:pt-0 sm:pb-0">
      <AnimateBackground />
      <Outlet />
    </div>
  );
};

export default AuthLayout;
