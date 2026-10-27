import { useEffect, useState } from "react";

/**
 * Scroll-spy: returns the id of the section currently crossing the viewport
 * (IntersectionObserver on a band around the middle), or null when disabled.
 * Unlike settings/useScrollSpy (activation line near the top, never null).
 */
export const useActiveSection = (
  ids: string[],
  enabled: boolean,
): string | null => {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [enabled, ids]);

  // Derive (rather than setState in the effect) so a disabled spy reads null.
  return enabled ? active : null;
};
