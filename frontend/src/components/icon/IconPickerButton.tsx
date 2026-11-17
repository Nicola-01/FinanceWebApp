import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type IconKey, ICONS } from "../../utils/icons.ts";
import { faTags } from "@fortawesome/free-solid-svg-icons";
import { IconColorSelector } from "./IconColorSelector.tsx";
import { useUiVersion } from "../../hooks/useUiVersion.ts";
import Toggle from "../ui/Toggle.tsx";

interface IconPickerButtonProps {
  icon: IconKey;
  color: string;
  onIconChange: (icon: IconKey) => void;
  onColorChange: (color: string) => void;
  size?: "sm" | "md";
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  /** Adds a "Counts as investment" switch to the popover (omit to hide it). */
  investment?: {
    checked: boolean;
    /** Set when a parent flags the tag: the switch is then on and locked. */
    inheritedFrom?: string;
    onChange: (v: boolean) => void;
  };
}

export const IconPickerButton: React.FC<IconPickerButtonProps> = ({
  icon,
  color,
  onIconChange,
  onColorChange,
  size = "md",
  isOpen,
  onToggle,
  investment,
}) => {
  const [ui] = useUiVersion();
  const v2 = ui === "v2"; // ui-v2-switch
  const buttonRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null); // ref to the popup container
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    openUpward: boolean;
  }>({ top: 0, left: 0, openUpward: false });

  const sizeClasses =
    size === "sm"
      ? "h-6 w-6 rounded-[var(--r-sm)] text-xs"
      : "h-10 w-10 rounded-[var(--r-input)] text-lg";
  // The switch row adds height below the icon/colour card.
  const POPUP_HEIGHT = investment ? 440 : 340;
  const POPUP_WIDTH = 280;

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();

      let leftPos = rect.left;
      if (leftPos + POPUP_WIDTH > window.innerWidth) {
        leftPos = window.innerWidth - POPUP_WIDTH;
      }

      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward =
        spaceBelow < POPUP_HEIGHT + 8 && rect.top > POPUP_HEIGHT + 8;

      // Positioning needs the button's measured rect (getBoundingClientRect),
      // which is only available in a post-render effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCoords({
        top: openUpward ? rect.top - POPUP_HEIGHT + 40 : rect.bottom + 8,
        left: leftPos,
        openUpward,
      });
    }
  }, [isOpen, POPUP_HEIGHT]);

  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = (e: Event) => {
      // Ignore scroll events originating from inside the popup itself.
      if (
        popupRef.current &&
        e.target instanceof Node &&
        popupRef.current.contains(e.target)
      ) {
        return;
      }
      onToggle(false);
    };

    window.addEventListener("scroll", handleScroll, {
      capture: true,
      passive: true,
    });
    return () =>
      window.removeEventListener("scroll", handleScroll, { capture: true });
  }, [isOpen, onToggle]);

  return (
    <>
      <div
        ref={buttonRef}
        onClick={() => onToggle(!isOpen)}
        className={`shrink-0 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform ${
          v2
            ? "bg-app-raised"
            : "border border-app-border bg-app-surface shadow-sm"
        } ${sizeClasses}`}
        // ui-v2-switch: the category colour sits on an 18% tint tile, as CategoryIcon does.
        style={
          v2
            ? {
                color,
                backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)`,
              }
            : { color }
        }
        title="Change Icon & Color"
      >
        <FontAwesomeIcon icon={ICONS[icon] || faTags} />
      </div>

      {isOpen &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[100]"
              onClick={() => onToggle(false)}
            />
            <div
              ref={popupRef}
              className="fixed z-[110]"
              style={{ top: coords.top, left: coords.left }}
            >
              <IconColorSelector
                iconValue={icon}
                onChangeIcon={onIconChange}
                colorValue={color}
                onChangeColor={onColorChange}
              />
              {investment && (
                <div className="mt-2 w-[260px] rounded-[var(--r-card)] border border-app-border bg-app-card p-4 shadow-2xl">
                  <Toggle
                    className="w-full"
                    aria-label="Counts as investment"
                    checked={
                      investment.inheritedFrom ? true : investment.checked
                    }
                    disabled={!!investment.inheritedFrom}
                    onChange={investment.onChange}
                    label={
                      <span className="flex flex-col">
                        <span>Counts as investment</span>
                        <span className="text-xs text-app-muted">
                          {investment.inheritedFrom
                            ? `Inherited from ${investment.inheritedFrom}`
                            : "Covers its subtags too"}
                        </span>
                      </span>
                    }
                  />
                </div>
              )}
            </div>
          </>,
          document.body,
        )}
    </>
  );
};
