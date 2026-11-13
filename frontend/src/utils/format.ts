/**
 * Formats a number with grouped thousands and exactly 2 decimals; `zeroAsDash` renders 0 as "—";
 * `signed` prefixes "+" / "−" (U+2212, typographic minus) and formats the absolute value.
 */
export const formatAmount = (
  value: number,
  {
    zeroAsDash = false,
    signed = false,
  }: { zeroAsDash?: boolean; signed?: boolean } = {},
): string => {
  if (zeroAsDash && value === 0) return "—";
  const digits = (signed ? Math.abs(value) : value).toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (!signed || value === 0) return digits;
  return (value > 0 ? "+" : "−") + digits;
};

/**
 * Sentence case for a title: first word capitalised, later Title-case words lowercased.
 * All-caps acronyms ("CSV", "MCP") and mixed-case words are kept as written.
 */
export const toSentenceCase = (title: string): string =>
  title
    .split(" ")
    .map((word, i) =>
      i === 0
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : /^[A-Z][a-z]/.test(word)
          ? word.toLowerCase()
          : word,
    )
    .join(" ");
