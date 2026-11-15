import React from "react";
import { AreaSparkline } from "@/components/ui/charts";

/** Running-balance trend drawn inside the Net hero card. Loaded lazily via `LazyHeroTrend`. */
export const HeroTrend: React.FC<{
  rows: { date: Date; v: number }[];
  color: string;
}> = ({ rows, color }) => (
  <AreaSparkline
    data={rows}
    dataKey="v"
    color={color}
    fill="gradient"
    height={56}
    curve="monotone"
    interactive={false}
    className="w-full"
    ariaLabel="Daily balance this period"
  />
);
