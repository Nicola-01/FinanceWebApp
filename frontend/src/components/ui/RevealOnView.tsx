import { useEffect, useRef, useState, type ReactNode } from "react";

interface RevealOnViewProps {
  children: ReactNode;
  /** Placeholder height (px) reserved until the first reveal, so layout doesn't jump. */
  minHeight?: number;
  className?: string;
}

/**
 * Mounts its children only once the wrapper first scrolls into view. Chart
 * kits animate on mount, so mounting off-screen would play the entrance before
 * the user can see it. Renders children immediately where IntersectionObserver
 * is unavailable (jsdom, old browsers).
 */
export const RevealOnView: React.FC<RevealOnViewProps> = ({
  children,
  minHeight = 260,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const el = ref.current;
    if (seen || !el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setSeen(true);
        observer.disconnect();
      },
      { threshold: 0.25, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [seen]);

  return (
    <div
      ref={ref}
      className={className}
      style={seen ? undefined : { minHeight }}
    >
      {seen ? children : null}
    </div>
  );
};
