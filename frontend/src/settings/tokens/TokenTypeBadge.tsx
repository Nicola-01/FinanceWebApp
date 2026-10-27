import React from "react";
import { Badge as UiBadge } from "../../components/ui/Badge";

export const TokenTypeBadge: React.FC<{ mcp: boolean }> = ({ mcp }) =>
  mcp ? (
    <UiBadge variant="subtle" tone="purple" uppercase className="shrink-0">
      MCP
    </UiBadge>
  ) : (
    <UiBadge variant="subtle" tone="neutral" uppercase className="shrink-0">
      Manual
    </UiBadge>
  );
