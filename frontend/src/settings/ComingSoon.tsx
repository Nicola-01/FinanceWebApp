import React from "react";
import { faClock } from "@fortawesome/free-solid-svg-icons";
import { Badge } from "../components/ui/Badge";
import { useUiVersion } from "../hooks/useUiVersion";

/** Small pill marking a feature whose backend isn't wired up yet. */
export const ComingSoonBadge: React.FC<{ label?: string }> = ({
  label = "Coming soon",
}) => {
  const [ui] = useUiVersion();
  // ui-v2-switch: sentence case, flat subtle chip.
  const isV2 = ui === "v2";
  return (
    <Badge
      tone="neutral"
      uppercase={!isV2}
      variant={isV2 ? "subtle" : undefined}
      icon={faClock}
    >
      {label}
    </Badge>
  );
};
