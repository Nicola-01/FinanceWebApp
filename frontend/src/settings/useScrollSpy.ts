import { useEffect, useRef, useState } from "react";

/**
 * Scroll-spy for an in-page section list. Returns the id of the section the
 * reader is currently on: the LAST section whose top has scrolled up past an
 * activation line near the top of the viewport (just below the sticky header +
 * section nav).
 *
 * The activation line is anchored to the SAME offset the sections use for
 * `scroll-margin-top`, so the highlighted item always matches the one a nav
 * click scrolls to — even for short or empty sections (which never reach the
 * viewport centre and used to be skipped or highlight their neighbour).
 *
 * @param ids      STABLE array of section element ids, in document order.
 * @param offsetFor Returns the activation-line distance (px) from the top of the
 *                  viewport; may depend on the current breakpoint. Called live on
 *                  every scroll/resize, so it always reflects the current layout.
 */
export function useScrollSpy(
  ids: string[],
  offsetFor: () => number = () => 0,
): string {
  const [activeId, setActiveId] = useState<string>(ids[0] ?? "");

  // Keep the latest offset getter without re-subscribing the scroll listeners.
  const offsetRef = useRef(offsetFor);
  useEffect(() => {
    offsetRef.current = offsetFor;
  }, [offsetFor]);

  useEffect(() => {
    if (ids.length === 0) return;
    let frame = 0;

    const compute = () => {
      frame = 0;

      // At (or near) the bottom of the page the last section is active even if
      // it is too short to ever reach the activation line.
      const doc = document.documentElement;
      if (window.innerHeight + window.scrollY >= doc.scrollHeight - 2) {
        setActiveId(ids[ids.length - 1]);
        return;
      }

      // Sections are in document order: the active one is the last whose top has
      // scrolled up to (or past) the activation line. A small tolerance absorbs
      // sub-pixel rounding from scrollIntoView so a freshly-clicked section — the
      // one whose top lands exactly on the line — reliably wins.
      const line = offsetRef.current();
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - line <= 4) current = id;
        else break;
      }
      setActiveId(current);
    };

    const onScrollOrResize = () => {
      if (frame) return;
      frame = requestAnimationFrame(compute);
    };

    compute(); // initial state, before any scroll
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [ids]);

  return activeId;
}
