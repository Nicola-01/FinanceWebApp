import { useEffect, useState } from "react";

/**
 * Scroll-spy: returns the id of the section that currently crosses the vertical
 * MIDDLE of the viewport. The active id therefore flips to the next/previous
 * section as soon as that section reaches roughly half the screen. The page must
 * scroll on the window (observer root = viewport).
 *
 * Pass a STABLE `ids` array (define it at module scope) — the observer is torn
 * down and rebuilt whenever the array identity changes.
 */
export function useScrollSpy(ids: string[]): string {
  const [activeId, setActiveId] = useState<string>(ids[0] ?? "");

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    // Tracks which sections currently straddle the centre line.
    const visible = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });
        // Topmost (in document order) section crossing the centre wins.
        const current = ids.find((id) => visible.has(id));
        if (current) setActiveId(current);
      },
      {
        // Collapse the root to a zero-height line at the vertical centre of the
        // viewport: a section is "active" only while it spans the middle.
        rootMargin: "-50% 0px -50% 0px",
        threshold: 0,
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}
