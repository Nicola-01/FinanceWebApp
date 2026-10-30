// Pure helpers behind `AmountInput`: detect a math formula and normalise the raw
// keystrokes into a signed amount string (pairs with `mathEvaluator`).

/** True when the value (ignoring a leading sign) contains a math operator. */
export const hasOperators = (val: string): boolean => {
  const withoutSign = val.replace(/^[+-]/, "");
  return /[+\-*/%()]/.test(withoutSign);
};

/**
 * Normalises raw input: comma → dot, strips disallowed characters, prepends
 * `defaultSign` when unsigned and, for a plain number, keeps one dot and at
 * most two decimals. Formulas are left as typed.
 */
export const formatAmountString = (
  rawValue: string,
  defaultSign: "-" | "+",
): string => {
  // 1. Comma → dot
  let val = rawValue.replace(/,/g, ".");

  // 2. Keep only digits, dots, parentheses and math operators
  val = val.replace(/[^0-9.+-/*%()]/g, "");

  // 3. Prepend the default sign when there's text but no sign
  if (val.length > 0 && !/^[+-]/.test(val)) {
    val = defaultSign + val;
  }

  // 4. Plain number (not a formula): apply standard formatting
  if (!hasOperators(val)) {
    const sign = val.startsWith("-") ? "-" : val.startsWith("+") ? "+" : "";
    let numPart = val.replace(/^[+-]/, "");

    // Keep only the first dot
    const dotParts = numPart.split(".");
    if (dotParts.length > 2) {
      numPart = dotParts[0] + "." + dotParts.slice(1).join("");
    }

    // Max two decimals
    if (numPart.includes(".")) {
      const [intPart, decPart] = numPart.split(".");
      numPart = intPart + "." + decPart.slice(0, 2);
    }

    val = sign + numPart;
  } else if (/^[+-][\d.]/.test(val)) {
    val = val[0] + "(" + val.slice(1);
  }

  return val;
};
