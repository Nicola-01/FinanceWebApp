import React from "react";
import { useUiVersion } from "../hooks/useUiVersion";

interface AdminPageHeaderProps {
  /** Left-aligned page title (e.g. "Users"). */
  title: string;
  /** One-line description under the title. Present on every admin tab so the
   *  tabs read consistently (fixes Backups-has-a-description-but-Users-doesn't). */
  description: string;
  /** Right-aligned actions slot (e.g. the Backups toolbar). */
  actions?: React.ReactNode;
}

/**
 * Shared header for the admin tabs: a title + description on the left and an
 * optional actions slot on the right. Keeps the three tabs visually consistent.
 */
export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  title,
  description,
  actions,
}) => {
  const [ui] = useUiVersion();
  // ui-v2-switch: display title + 13px muted subtitle.
  const isV2 = ui === "v2";
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h2
          className={
            isV2
              ? "m-0 font-display text-[22px] font-semibold tracking-[-0.02em] text-app-text"
              : "m-0 text-xl font-bold text-app-text"
          }
        >
          {title}
        </h2>
        <p
          className={
            isV2
              ? "m-0 mt-1 text-[13px] text-app-muted"
              : "m-0 mt-1 text-sm text-app-muted"
          }
        >
          {description}
        </p>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
};

export default AdminPageHeader;
