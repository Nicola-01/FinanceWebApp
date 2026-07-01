/**
 * Safely evaluates a basic mathematical expression.
 * Supports percentages (converting '%' to '/100') and basic arithmetic operators.
 * Returns the numeric result or null if the expression is invalid.
 */
export const evaluateMathExpression = (expr: string): number | null => {
  try {
    // 1. Pre-process percentages: e.g., "20%" becomes "/100".
    const sanitized = expr.replace(/%/g, "/100");

    // 2. Strict character safety check.
    // We only allow digits, dots, basic operators (+, -, *, /), parentheses, and spaces.
    // This prevents any arbitrary JS execution (no letters, brackets, quotes, equals, etc.)
    if (/[^0-9.+\-*/()\s]/.test(sanitized)) {
      return null;
    }

    // 3. Evaluate using the Function constructor on the strictly validated string
    const cleanExpr = sanitized.replace(/\s+/g, "");
    if (!cleanExpr) return null;

    const result = new Function(`return (${cleanExpr})`)();

    if (typeof result === "number" && !isNaN(result) && isFinite(result)) {
      return result;
    }
  } catch {
    return null;
  }
  return null;
};
