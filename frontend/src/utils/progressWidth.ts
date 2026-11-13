/** Ratio (1 = 100%) to a fill percentage clamped to 0..100. NaN becomes 0. */
export const progressWidth = (value: number): number => {
  if (Number.isNaN(value)) return 0;
  return Math.min(Math.max(value, 0), 1) * 100;
};
