import React from "react";
import { faClock } from "@fortawesome/free-solid-svg-icons";
import { Badge } from "../components/ui/Badge";

/** Small pill marking a feature whose backend isn't wired up yet. */
export const ComingSoonBadge: React.FC<{ label?: string }> = ({
  label = "Coming soon",
}) => (
  <Badge tone="neutral" uppercase icon={faClock}>
    {label}
  </Badge>
);
