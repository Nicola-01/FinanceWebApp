import React from "react";
import Sphere from "../assets/Sphere";

/**
 * Ambient animated spheres behind the dashboard. Same signature `Sphere` used
 * on the auth screens, but dialed way down: brand hues at low opacity so it
 * reads as a warm tint, not the vivid auth backdrop. A touch richer in dark.
 *
 * Sits at `-z-10` (above the root's solid `bg-app-bg`, below the in-flow
 * dashboard content), so transparent regions of the layout let it show through.
 */
export const DashboardBackground: React.FC = () => {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-70 dark:opacity-100">
      {/* Violet — top right */}
      <Sphere
        style={{
          height: "520px",
          width: "520px",
          background: "var(--brand-1)",
          top: "-160px",
          right: "-80px",
          opacity: 0.16,
        }}
        animate={{
          x: [0, -40, 20, 0],
          y: [0, 40, -20, 0],
          scale: [1, 1.05, 0.97, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />

      {/* Magenta — bottom left */}
      <Sphere
        style={{
          height: "460px",
          width: "460px",
          background: "var(--brand-2)",
          bottom: "-140px",
          left: "-60px",
          opacity: 0.13,
        }}
        animate={{
          x: [0, 50, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 0.96, 1.05, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
    </div>
  );
};
