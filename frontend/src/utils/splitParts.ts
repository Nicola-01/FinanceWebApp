// Pure share computation behind `components/ui/SplitBar`.

export interface SplitSegment {
  id: string;
  label: string;
  value: number;
  color: string;
}

export interface SplitPart {
  segment: SplitSegment;
  pct: number;
  pctLabel: string;
}

/** Drops non-positive/non-finite segments, sorts by value descending, computes shares. */
export function splitParts(segments: SplitSegment[]): SplitPart[] {
  const kept = segments
    .filter((s) => Number.isFinite(s.value) && s.value > 0)
    .sort((a, b) => b.value - a.value);
  const total = kept.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return [];
  return kept.map((segment) => {
    const pct = (segment.value / total) * 100;
    return {
      segment,
      pct,
      pctLabel: pct < 1 ? "<1%" : `${Math.round(pct)}%`,
    };
  });
}
