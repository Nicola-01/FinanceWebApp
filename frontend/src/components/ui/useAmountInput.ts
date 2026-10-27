import React, { useEffect, useRef, useState } from "react";
import { evaluateMathExpression } from "../../utils/mathEvaluator.ts";
import { formatAmountString, hasOperators } from "../../utils/amountFormat.ts";

type AmountType = "EXPENSE" | "INCOME" | "";

interface UseAmountInputArgs {
  value?: string;
  type: AmountType;
  setType: (type: AmountType) => void;
  onAmountChange: (value: string) => void;
  autoFocus: boolean;
}

/**
 * State + handlers behind `AmountInput`: keeps the uncontrolled <input> in sync
 * with `value`/`type`, normalises keystrokes (sign, decimals, formulas), drives
 * the colour / text size / live formula preview, and resolves formulas.
 */
export function useAmountInput({
  value,
  type,
  setType,
  onAmountChange,
  autoFocus,
}: UseAmountInputArgs) {
  const internalRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const [color, setColor] = useState<string>("");
  const [textSize, setTextSize] = useState<
    "text-6xl" | "text-5xl" | "text-4xl"
  >("text-6xl");
  const [liveResult, setLiveResult] = useState<number | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const adjustTextSize = (text: string) => {
    const length = text.length;
    if (length > 12) setTextSize("text-4xl");
    else if (length > 8) setTextSize("text-5xl");
    else setTextSize("text-6xl");
  };

  // Sync the initial value, resets and EXTERNAL changes into the uncontrolled
  // <input>. The input reports only the unsigned magnitude to the parent; when
  // that value comes back from outside (e.g. the exchange-rate section changing
  // the amount) it is rewritten here, preserving the sign. While the user types
  // the magnitude already matches, so we skip the rewrite and keep the caret.
  useEffect(() => {
    if (internalRef.current && value !== undefined) {
      if (value === "") {
        internalRef.current.value = "";
        // Sync the display state with the uncontrolled <input> reset.
        setColor("text-app-muted opacity-40");
        setTextSize("text-6xl");
        setLiveResult(null);
      } else {
        const current = internalRef.current.value;
        const domMagnitude = current.replace(/^[+-]/, "");
        // Rewrite only on external changes (during our own typing the
        // magnitude and `value` already match).
        if (domMagnitude !== value) {
          const sign = current.startsWith("+")
            ? "+"
            : current.startsWith("-")
              ? "-"
              : type === "INCOME"
                ? "+"
                : type === "EXPENSE"
                  ? "-"
                  : "";
          internalRef.current.value = sign + value;
          adjustTextSize(sign + value);
        }
      }
    }
  }, [value, type]);

  // Colour + programmatic sign change
  useEffect(() => {
    if (type === "") {
      // Colour derived from the type, kept in sync with the uncontrolled <input>.
      setColor("text-app-muted opacity-40");
      return;
    }
    setColor(type === "EXPENSE" ? "text-app-red" : "text-app-green");

    if (internalRef.current) {
      let currentValue = internalRef.current.value;
      if (!currentValue) return;

      currentValue = currentValue.replace(/^[+-]/, "");
      internalRef.current.value =
        (type === "EXPENSE" ? "-" : "+") + currentValue;
    }
  }, [type]);

  // On mount, focus the field and select any pre-filled value (edit mode) so the
  // amount is ready to type/overwrite without an extra click. The overlay no
  // longer steals this focus (see ResponsiveOverlay).
  useEffect(() => {
    if (!autoFocus) return;
    const input = internalRef.current;
    if (!input) return;
    input.focus();
    input.select();
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Single entry point for state updates.
  const updateAmountState = (rawVal: string, selectionStart?: number) => {
    const input = internalRef.current;
    if (!input) return;

    const defaultSign = type === "INCOME" ? "+" : "-";
    const cleanedValue = formatAmountString(rawVal, defaultSign);

    const originalValue = input.value;
    if (originalValue !== cleanedValue) {
      input.value = cleanedValue;
      if (selectionStart !== undefined) {
        const newCursorPos = Math.max(
          0,
          selectionStart + (cleanedValue.length - originalValue.length),
        );
        input.setSelectionRange(newCursorPos, newCursorPos);
      }
    }

    const isNegative = cleanedValue.startsWith("-");
    const isPositive = cleanedValue.startsWith("+");
    // A value with no digits (empty, or just a lingering sign/operator) means
    // "no amount" — clear the Expense/Income selection instead of keeping it lit.
    const hasDigits = /\d/.test(cleanedValue);
    const currentSignType = !hasDigits
      ? ""
      : isNegative
        ? "EXPENSE"
        : isPositive
          ? "INCOME"
          : "";
    setType(currentSignType);
    adjustTextSize(cleanedValue);

    if (
      cleanedValue.length === 0 ||
      cleanedValue === "+" ||
      cleanedValue === "-"
    ) {
      setColor("text-app-muted opacity-40");
      setLiveResult(null);
    } else {
      setColor(
        currentSignType === "EXPENSE" ? "text-app-red" : "text-app-green",
      );

      // Live preview when the value contains math operators
      if (hasOperators(cleanedValue)) {
        const res = evaluateMathExpression(cleanedValue);
        setLiveResult(res);
      } else {
        setLiveResult(null);
      }
    }

    const magnitude = cleanedValue.replace(/^[+-]/, "");
    onAmountChange(magnitude);
  };

  // Resolve the math expression
  const handleResolve = () => {
    const input = internalRef.current;
    if (!input) return;

    const val = input.value;
    const result = evaluateMathExpression(val);
    if (result !== null) {
      const formattedResult = Math.abs(result).toFixed(2);
      const newSign = result < 0 ? "-" : "+";
      const newVal = newSign + formattedResult;

      updateAmountState(newVal, newVal.length);
    }
  };

  // Special keys + block letters
  const handleOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key.length > 1 ||
      e.ctrlKey ||
      e.metaKey ||
      e.key === "Unidentified"
    ) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleResolve();
      }
      return;
    }

    // Typing +/- at the start swaps the sign
    if (["-", "+"].includes(e.key)) {
      const input = e.currentTarget;
      const start = input.selectionStart || 0;

      if (start === 0) {
        e.preventDefault();
        const currentValue = input.value;
        const hadSign = /^[+-]/.test(currentValue);
        const newVal = e.key + currentValue.replace(/^[+-]/, "");

        updateAmountState(newVal, hadSign ? 1 : 1);
        setType(e.key === "-" ? "EXPENSE" : "INCOME");
        return;
      }
    }

    if (e.key === "=") {
      e.preventDefault();
      handleResolve();
      return;
    }

    // Block disallowed characters
    if (!/[0-9.,+\-*/%()]/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateAmountState(e.target.value, e.target.selectionStart || 0);
  };

  const handleOnBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Don't close if clicking on toolbar buttons
    if (toolbarRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsFocused(false);
    handleResolve();
  };

  const handleOnFocus = () => {
    setIsFocused(true);
  };

  const handleToolbarPress = (char: string) => {
    const input = internalRef.current;
    if (!input) return;

    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const val = input.value;

    const newVal = val.substring(0, start) + char + val.substring(end);
    updateAmountState(newVal, start + char.length);
    input.focus();
  };

  return {
    internalRef,
    toolbarRef,
    color,
    textSize,
    liveResult,
    isFocused,
    handleResolve,
    handleOnKeyDown,
    handleOnChange,
    handleOnBlur,
    handleOnFocus,
    handleToolbarPress,
  };
}
