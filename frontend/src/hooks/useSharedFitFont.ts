import { useLayoutEffect, type DependencyList, type RefObject } from "react";

/** Largest px size between min and max at which the narrowest value still fits its box. */
export function fitSize(max: number, min: number, ratios: number[]): number {
  const smallest = Math.min(1, ...ratios);
  return Math.min(max, Math.max(min, Math.floor(max * smallest)));
}

/**
 * Gives every [data-stat-value] in a group one shared font size (--stat-value-size on the group):
 * the largest that fits the narrowest value. Runs before paint and re-runs on resize.
 */
export function useSharedFitFont(
  ref: RefObject<HTMLElement | null>,
  { max = 22, min = 14 }: { max?: number; min?: number } = {},
  deps: DependencyList = [],
) {
  useLayoutEffect(() => {
    const group = ref.current;
    if (!group) return;
    const fit = () => {
      group.style.setProperty("--stat-value-size", `${max}px`);
      const ratios = [
        ...group.querySelectorAll<HTMLElement>("[data-stat-value]"),
      ]
        .filter((el) => el.scrollWidth > 0) // not laid out (jsdom): keep max
        .map((el) => el.clientWidth / el.scrollWidth);
      group.style.setProperty(
        "--stat-value-size",
        `${fitSize(max, min, ratios)}px`,
      );
    };
    fit();
    // Also watch the value's child: NumberFlow tweens its width without resizing the value box.
    const ro = new ResizeObserver(fit);
    ro.observe(group);
    group
      .querySelectorAll("[data-stat-value], [data-stat-value] > *")
      .forEach((el) => ro.observe(el));
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller-supplied deps (formatted values)
  }, [ref, max, min, ...deps]);
}
