import React from "react";

interface ChartCardProps {
  title: string;
  subtitle: string;
  /** Render without the card shell + title (the parent group card provides them). */
  bare: boolean;
  /** Header controls, right-aligned (e.g. a FlowTypeToggle). */
  controls: React.ReactNode;
  /** Show the "No data available." placeholder instead of the children. */
  isEmpty: boolean;
  /** Min-height class of the empty placeholder (e.g. "min-h-[300px]"). */
  emptyMinHeightClass: string;
  children: React.ReactNode;
}

/**
 * Shared shell of the month-based category charts (trend / heatmap): optional
 * card + title/subtitle header with a controls slot, and the empty state.
 */
export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  bare,
  controls,
  isEmpty,
  emptyMinHeightClass,
  children,
}) => (
  <div
    className={
      bare
        ? "flex flex-col w-full text-app-text"
        : "flex flex-col w-full bg-app-card/20 backdrop-blur-sm rounded-2xl border border-app-border p-4 md:p-6 text-app-text"
    }
  >
    <div
      className={`mb-4 flex flex-wrap items-center gap-3 ${bare ? "justify-end" : "justify-between"}`}
    >
      {!bare && (
        <div>
          <h3 className="text-xl font-bold text-app-text uppercase tracking-wider">
            {title}
          </h3>
          <p className="text-sm text-app-muted">{subtitle}</p>
        </div>
      )}
      {controls}
    </div>

    {isEmpty ? (
      <div
        className={`w-full flex flex-col items-center justify-center ${emptyMinHeightClass} bg-app-input/30 rounded-xl border border-app-border border-dashed`}
      >
        <p className="text-app-muted">No data available.</p>
      </div>
    ) : (
      children
    )}
  </div>
);
