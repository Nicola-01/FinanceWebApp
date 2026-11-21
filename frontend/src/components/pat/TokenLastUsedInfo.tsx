import React from "react";
import { format } from "date-fns";
import type { PatToken } from "../../types/domain";
import { useUiVersion } from "../../hooks/useUiVersion";

interface TokenLastUsedInfoProps {
  token: PatToken;
}

/**
 * Concise, single-line activity date for the token's secondary row.
 * Prefers the last-used date when available, otherwise the creation date.
 */
export const TokenLastUsedInfo: React.FC<TokenLastUsedInfoProps> = ({
  token,
}) => {
  const [ui] = useUiVersion();
  const label = token.lastUsedAt
    ? `Last used ${format(new Date(token.lastUsedAt), "MMM d, yyyy")}`
    : `Created ${format(new Date(token.createdAt), "MMM d, yyyy")}`;

  // ui-v2-switch: 13px with tabular figures for the dates.
  return (
    <span
      className={
        ui === "v2"
          ? "text-[13px] tabular-nums text-app-muted"
          : "text-xs text-app-muted"
      }
    >
      {label}
    </span>
  );
};
