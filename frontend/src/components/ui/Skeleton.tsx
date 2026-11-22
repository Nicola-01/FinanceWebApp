import React from "react";
import { cn } from "../../lib/utils";

/** Loading placeholder block. Pulses; the pulse is dropped under reduced motion. */
export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...rest
}) => (
  <div
    aria-hidden="true"
    {...rest}
    className={cn(
      "animate-pulse rounded-md bg-app-raised motion-reduce:animate-none",
      className,
    )}
  />
);
