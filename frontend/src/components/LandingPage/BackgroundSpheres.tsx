import React from "react";
import Sphere from "../../assets/Sphere";
import { useTheme } from "../../utils/ThemeContext";

/**
 * Signature animated background spheres for the landing page.
 *
 * Fixed to the viewport (ambient, doesn't scroll away) and theme-aware: on dark
 * they lighten via `screen`; on light `screen` would wash them out, so they
 * render as soft normal-blend tints on the off-white surface. Each sphere both
 * drifts (x/y) and breathes (scale) so the backdrop feels alive, not empty.
 */

interface SphereConfig {
  rgb: string;
  size: number;
  /** CSS position (top/left/right in %). */
  pos: React.CSSProperties;
  /** Drift path. */
  x: number[];
  y: number[];
  duration: number;
  delay: number;
}

const SPHERES: SphereConfig[] = [
  {
    rgb: "139, 92, 246", // violet — top-left
    size: 560,
    pos: { top: "-6%", left: "-6%" },
    x: [0, 60, -20, 0],
    y: [0, 30, -25, 0],
    duration: 22,
    delay: 0,
  },
  {
    rgb: "224, 51, 154", // magenta — top-right
    size: 620,
    pos: { top: "-10%", right: "-6%" },
    x: [0, -50, 30, 0],
    y: [0, 40, -20, 0],
    duration: 26,
    delay: 1.5,
  },
  {
    rgb: "244, 114, 182", // pink — upper-center
    size: 440,
    pos: { top: "26%", left: "32%" },
    x: [0, 40, -45, 0],
    y: [0, -30, 35, 0],
    duration: 24,
    delay: 0.8,
  },
  {
    rgb: "96, 165, 250", // blue — center-right
    size: 480,
    pos: { top: "42%", right: "6%" },
    x: [0, -40, 25, 0],
    y: [0, 35, -30, 0],
    duration: 28,
    delay: 2.2,
  },
  {
    rgb: "139, 92, 246", // violet — lower-left
    size: 520,
    pos: { top: "62%", left: "-8%" },
    x: [0, 55, -25, 0],
    y: [0, -35, 25, 0],
    duration: 25,
    delay: 1,
  },
  {
    rgb: "224, 51, 154", // magenta — lower-center
    size: 460,
    pos: { top: "72%", left: "42%" },
    x: [0, -35, 45, 0],
    y: [0, 30, -25, 0],
    duration: 27,
    delay: 3,
  },
];

const BackgroundSpheres: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Dark: brighter + screen blend (adds light). Light: softer tint, normal blend.
  const baseAlpha = isDark ? 0.32 : 0.24;
  const blendMode: React.CSSProperties["mixBlendMode"] = isDark
    ? "screen"
    : "normal";
  const baseOpacity = isDark ? 0.85 : 0.6;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {SPHERES.map((s, i) => (
        <Sphere
          key={i}
          style={{
            height: `${s.size}px`,
            width: `${s.size}px`,
            background: `rgba(${s.rgb}, ${baseAlpha})`,
            mixBlendMode: blendMode,
            filter: "blur(120px)",
            opacity: baseOpacity,
            ...s.pos,
          }}
          animate={{
            x: s.x,
            y: s.y,
            scale: [1, 1.12, 0.96, 1],
            opacity: [
              baseOpacity - 0.15,
              baseOpacity,
              baseOpacity - 0.1,
              baseOpacity - 0.15,
            ],
          }}
          transition={{
            duration: s.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: s.delay,
          }}
        />
      ))}
    </div>
  );
};

export default BackgroundSpheres;
