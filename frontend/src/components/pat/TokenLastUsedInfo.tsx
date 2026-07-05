import React from "react";
import { format } from "date-fns";
import type { PatToken } from "../../utils/types";

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
  const label = token.lastUsedAt
    ? `Last used ${format(new Date(token.lastUsedAt), "MMM d, yyyy")}`
    : `Created ${format(new Date(token.createdAt), "MMM d, yyyy")}`;

  return <span className="text-xs text-app-muted">{label}</span>;
};
