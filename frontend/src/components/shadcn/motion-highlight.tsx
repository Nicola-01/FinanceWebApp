"use client";

import type React from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { createPolymorphic } from "@/lib/as-child";

const ark = {
  div: createPolymorphic("div"),
};

const ITEM = '[data-slot="motion-highlight-item"]';

interface MotionHighlightContextValue {
  current: string | null;
  hover: boolean;
  select: (value: string) => void;
  setHovered: (value: string | null) => void;
  value: string | null;
}

const MotionHighlightContext = createContext<MotionHighlightContextValue>({
  current: null,
  hover: false,
  select: () => undefined,
  setHovered: () => undefined,
  value: null,
});

/** The highlight's own items: never a nested highlight's. */
const itemsOf = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>(ITEM)).filter(
    (item) => item.closest('[data-slot="motion-highlight"]') === root,
  );

/** Where `node` sits inside `root`, by layout (transforms don't move it). */
const offsetIn = (node: HTMLElement, root: HTMLElement) => {
  let left = 0;
  let top = 0;
  let current: HTMLElement | null = node;
  while (current && current !== root) {
    left += current.offsetLeft;
    top += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  return { height: node.offsetHeight, left, top, width: node.offsetWidth };
};

/**
 * Fits the highlight over the item whose value is `current`, sliding from
 * the item it was on. Where it had gone out it appears in place and fades
 * in; the first time it's simply there. With no item it fades out, after a
 * moment, so crossing the gap between two items doesn't blink.
 */
const place = (root: HTMLElement, current: string | null) => {
  const highlight = root.querySelector<HTMLElement>(
    '[data-slot="motion-highlight-indicator"]',
  );
  if (!highlight) {
    return;
  }
  const item =
    current === null
      ? undefined
      : itemsOf(root).find(
          (node) => node.getAttribute("data-value") === current,
        );
  if (!item) {
    highlight.removeAttribute("data-visible");
    return;
  }
  const first = !highlight.hasAttribute("data-placed");
  const out =
    !highlight.hasAttribute("data-visible") &&
    getComputedStyle(highlight).opacity === "0";
  const box = offsetIn(item, root);
  if (first || out) {
    highlight.style.transitionProperty = "none";
  }
  highlight.style.setProperty("--motion-highlight-x", `${box.left}px`);
  highlight.style.setProperty("--motion-highlight-y", `${box.top}px`);
  highlight.style.setProperty("--motion-highlight-width", `${box.width}px`);
  highlight.style.setProperty("--motion-highlight-height", `${box.height}px`);
  if (first) {
    highlight.setAttribute("data-visible", "");
  }
  if (first || out) {
    highlight.getBoundingClientRect();
    highlight.style.transitionProperty = "";
  }
  highlight.setAttribute("data-placed", "");
  highlight.setAttribute("data-visible", "");
};

export interface MotionHighlightProps extends Omit<
  React.ComponentProps<"div">,
  "defaultValue"
> {
  /** The item highlighted at rest, at first, when uncontrolled. */
  defaultValue?: string;
  /** Classes for the highlight itself (`rounded-md bg-muted` by default). */
  highlightClassName?: string;
  /**
   * Whether the highlight follows the pointer and keyboard focus. Without
   * it the highlight marks the chosen item only, and moves on a click.
   *
   * @default false
   */
  hover?: boolean;
  /** Called with an item's value when it's chosen (clicked). */
  onValueChange?: (value: string) => void;
  /** The item highlighted at rest, when controlled. */
  value?: string;
}

/**
 * One background that slides between items: to the hovered or focused one
 * with `hover`, else to the chosen one, back to the chosen one when the
 * pointer leaves. Each item is measured, so items of any size and layout
 * work: a row, a column, a grid. With reduced motion it jumps.
 *
 * @cssvar --motion-highlight-x The highlight's place, set from its item.
 */
export const MotionHighlight = (props: MotionHighlightProps) => {
  const {
    defaultValue,
    highlightClassName,
    hover = false,
    onValueChange,
    value: valueProp,
    className,
    children,
    ...rest
  } = props;

  const ref = useRef<HTMLDivElement>(null);
  const [uncontrolled, setUncontrolled] = useState<string | null>(
    defaultValue ?? null,
  );
  const [hovered, setHovered] = useState<string | null>(null);
  const value = valueProp === undefined ? uncontrolled : valueProp;
  const current = hovered ?? value;

  const select = (next: string) => {
    if (valueProp === undefined) {
      setUncontrolled(next);
    }
    onValueChange?.(next);
  };

  useEffect(() => {
    const root = ref.current;
    if (!root) {
      return;
    }
    place(root, current);
    const observer = new ResizeObserver(() => place(root, current));
    observer.observe(root);
    for (const item of itemsOf(root)) {
      observer.observe(item);
    }
    return () => observer.disconnect();
  }, [current]);

  return (
    <MotionHighlightContext.Provider
      value={{ current, hover, select, setHovered, value }}
    >
      <div
        className={cn("relative isolate", className)}
        data-slot="motion-highlight"
        ref={ref}
        {...rest}
      >
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-0 left-0 -z-10",
            "h-(--motion-highlight-height) w-(--motion-highlight-width) [translate:var(--motion-highlight-x)_var(--motion-highlight-y)]",
            "rounded-md bg-muted",
            "opacity-0 delay-150 data-visible:opacity-100 data-visible:delay-0",
            "transition-[translate,width,height,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            "motion-reduce:transition-none!",
            highlightClassName,
          )}
          data-slot="motion-highlight-indicator"
        />
        {children}
      </div>
    </MotionHighlightContext.Provider>
  );
};

export interface MotionHighlightItemProps extends React.ComponentProps<
  typeof ark.div
> {
  /**
   * Whether the item is skipped: never highlighted or chosen.
   *
   * @default false
   */
  disabled?: boolean;
  /** The item's value: the highlight's `value` when it's chosen. */
  value: string;
}

export const MotionHighlightItem = (props: MotionHighlightItemProps) => {
  const {
    disabled = false,
    value,
    onBlur,
    onClick,
    onFocus,
    onPointerEnter,
    onPointerLeave,
    ...rest
  } = props;
  const {
    current,
    hover,
    select,
    setHovered,
    value: chosen,
  } = useContext(MotionHighlightContext);

  return (
    <ark.div
      data-active={chosen === value ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      data-highlighted={current === value ? "" : undefined}
      data-slot="motion-highlight-item"
      data-value={value}
      onBlur={(event: React.FocusEvent<HTMLDivElement>) => {
        onBlur?.(event);
        if (hover) {
          setHovered(null);
        }
      }}
      onClick={(event: React.MouseEvent<HTMLDivElement>) => {
        onClick?.(event);
        if (!disabled) {
          select(value);
        }
      }}
      onFocus={(event: React.FocusEvent<HTMLDivElement>) => {
        onFocus?.(event);
        if (
          hover &&
          !disabled &&
          (event.target as HTMLElement).matches(":focus-visible")
        ) {
          setHovered(value);
        }
      }}
      onPointerEnter={(event: React.PointerEvent<HTMLDivElement>) => {
        onPointerEnter?.(event);
        if (hover && !disabled) {
          setHovered(value);
        }
      }}
      onPointerLeave={(event: React.PointerEvent<HTMLDivElement>) => {
        onPointerLeave?.(event);
        if (hover) {
          setHovered(null);
        }
      }}
      {...rest}
    />
  );
};
