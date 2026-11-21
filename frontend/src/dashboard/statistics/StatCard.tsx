import React, { type ReactNode } from "react";

interface StatCardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Controls pinned to the right of the header row (selectors, toggles, info tips). */
  action?: ReactNode;
  /** Drop the surface and header, keep the controls and body (the parent group card provides the chrome). */
  bare?: boolean;
  /** Stretch to the row height (grid siblings, widget slots). */
  className?: string;
  children: ReactNode;
}

/**
 * The one shell every v2 Statistics card uses: surface, padding, title + muted
 * subtitle, controls right-aligned in the header row, and one 16px gap between
 * every block. Body children fill the remaining height (`flex-1`) so a
 * `mt-auto` child can pin to the bottom of a stretched card.
 */
export const StatCard: React.FC<StatCardProps> = ({
  title,
  subtitle,
  action,
  bare = false,
  className = "",
  children,
}) => (
  <section
    className={`flex h-full min-w-0 flex-col gap-4 ${
      bare
        ? ""
        : "rounded-[var(--r-card)] bg-app-card p-5 shadow-[var(--box-ring)] sm:p-6"
    } ${className}`}
  >
    {bare ? (
      action && <div className="flex justify-end gap-1">{action}</div>
    ) : (
      <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold tracking-[-0.02em] text-app-text">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-[13px] text-app-muted">{subtitle}</p>
          )}
        </div>
        {action && (
          <div className="ml-auto flex items-center gap-1 whitespace-nowrap">
            {action}
          </div>
        )}
      </header>
    )}
    <div className="flex min-h-0 flex-1 flex-col gap-4">{children}</div>
  </section>
);
