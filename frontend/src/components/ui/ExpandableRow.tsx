import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import Button from "./Button";

const EASE = [0.65, 0, 0.35, 1] as const;

interface ExpandableRowProps {
  /** ui-v2-switch: v2 row + raised nested panel, v1 bordered panel. */
  isV2: boolean;
  label: string;
  sub?: string;
  /** Whether the nested panel is shown (animated open and close). */
  open: boolean;
  /** Adds a chevron button that toggles `open`; omit for rows opened by their control. */
  onToggleOpen?: () => void;
  chevronLabel?: string;
  /** The toggle shown at the right edge of the row. */
  control: React.ReactNode;
  children: React.ReactNode;
}

/** A settings row with a right-hand control and a nested panel that expands beneath it. */
export const ExpandableRow: React.FC<ExpandableRowProps> = ({
  isV2,
  label,
  sub,
  open,
  onToggleOpen,
  chevronLabel,
  control,
  children,
}) => {
  const reduceMotion = useReducedMotion();
  const transition = { duration: reduceMotion ? 0 : 0.25, ease: EASE };

  return (
    <div className={isV2 ? "" : "py-3 last:pb-0"}>
      <div
        className={
          isV2
            ? "flex min-h-14 items-center justify-between gap-4 px-4 py-3"
            : "flex items-center justify-between gap-4"
        }
      >
        <div className="min-w-0 flex-1">
          <span
            className={
              isV2
                ? "block truncate text-[15px] text-app-text"
                : "block truncate text-sm font-medium text-app-text"
            }
          >
            {label}
          </span>
          {sub && (
            <span
              className={
                isV2
                  ? "block text-[13px] text-app-muted"
                  : "block text-xs text-app-muted"
              }
            >
              {sub}
            </span>
          )}
        </div>
        {onToggleOpen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleOpen}
            aria-expanded={open}
            aria-label={chevronLabel}
          >
            <motion.span
              animate={{ rotate: open ? 180 : 0 }}
              transition={transition}
              className="inline-flex"
            >
              <FontAwesomeIcon icon={faChevronDown} />
            </motion.span>
          </Button>
        )}
        {control}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transition}
            className="overflow-hidden"
          >
            <div
              className={
                isV2
                  ? "bg-app-raised px-4 py-2 [&_[role=switch][data-unchecked]]:bg-app-faint"
                  : "mt-3 rounded-[var(--r-input)] border border-app-border bg-app-surface px-4 py-3"
              }
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExpandableRow;
