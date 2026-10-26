/** Formats a number with grouped thousands and exactly 2 decimals; `zeroAsDash` renders 0 as "—". */
export const formatAmount = (
  value: number,
  { zeroAsDash = false }: { zeroAsDash?: boolean } = {},
): string => {
  if (zeroAsDash && value === 0) return "—";
  return value.toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
