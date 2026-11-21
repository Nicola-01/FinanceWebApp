import React from "react";
import { Badge as UiBadge } from "../../components/ui/Badge";
import { useUiVersion } from "../../hooks/useUiVersion";

export const TokenTypeBadge: React.FC<{ mcp: boolean }> = ({ mcp }) => {
  const [ui] = useUiVersion();
  // ui-v2-switch: sentence case, flat raised chip.
  if (ui === "v2") {
    return (
      <span className="shrink-0 rounded-[var(--r-sm)] bg-app-raised px-2 py-0.5 text-[13px] text-app-muted">
        {mcp ? "MCP" : "Manual"}
      </span>
    );
  }
  return mcp ? (
    <UiBadge variant="subtle" tone="purple" uppercase className="shrink-0">
      MCP
    </UiBadge>
  ) : (
    <UiBadge variant="subtle" tone="neutral" uppercase className="shrink-0">
      Manual
    </UiBadge>
  );
};
