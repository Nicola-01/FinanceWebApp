import { forwardRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendDown,
  faArrowTrendUp,
} from "@fortawesome/free-solid-svg-icons";
import { Input, type InputProps } from "./Input.tsx";
import { Selector, type SelectorOption } from "./Selector.tsx";

/** Direction of a signed amount (`""` = not yet chosen). */
export type AmountType = "INCOME" | "EXPENSE" | "";

export interface NumberInputProps extends Omit<
  InputProps,
  "type" | "value" | "onChange"
> {
  /** Current value (controlled), kept as a string so the field can be empty. */
  value: string;
  /** Called with the raw string value on every change. */
  onChange: (value: string) => void;
  /** Called when Enter is pressed (e.g. to submit an inline edit). */
  onEnter?: () => void;
  /**
   * Signed-amount mode. When both `type` and `onTypeChange` are provided, an
   * Expense/Income `Selector` is shown to the right of the field (money-out /
   * money-in icons) and the number is tinted red/green like `AmountInput`.
   * Omit them for a plain numeric field.
   */
  type?: AmountType;
  onTypeChange?: (type: AmountType) => void;
}

// Strip the native up/down spinners (keeps the decimal soft-keyboard) and adopt
// the monospaced amount look.
const FIELD_CLASS =
  "font-app-mono [appearance:textfield] [&::-webkit-outer-spin-button]:m-0 " +
  "[&::-webkit-outer-spin-button]:appearance-none " +
  "[&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none";

const TYPE_OPTIONS: SelectorOption<"EXPENSE" | "INCOME">[] = [
  {
    value: "EXPENSE",
    title: "Expense — money out",
    icon: <FontAwesomeIcon icon={faArrowTrendDown} />, // money leaving the wallet
    activeBgClass: "bg-app-red/15",
    activeColorClass: "text-app-red",
  },
  {
    value: "INCOME",
    title: "Income — money in",
    icon: <FontAwesomeIcon icon={faArrowTrendUp} />, // money coming into the wallet
    activeBgClass: "bg-app-green/15",
    activeColorClass: "text-app-green",
  },
];

/**
 * Shared numeric input primitive. Wraps the boxed `Input` with number-field
 * semantics (`type="number"`, decimal soft-keyboard, no native spinners) and a
 * controlled string value so the field can be cleared. Optional `onEnter` for
 * inline submit, and an optional Expense/Income `Selector` (signed-amount mode).
 * Use this instead of a hand-rolled `<Input type="number">`.
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      onChange,
      onEnter,
      type,
      onTypeChange,
      inputMode = "decimal",
      onKeyDown,
      className = "",
      ...props
    },
    ref,
  ) => {
    const signed = type !== undefined && onTypeChange !== undefined;
    const tint =
      type === "EXPENSE"
        ? "text-app-red"
        : type === "INCOME"
          ? "text-app-green"
          : "";

    const field = (
      <Input
        ref={ref}
        type="number"
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onEnter?.();
          onKeyDown?.(e);
        }}
        className={`${FIELD_CLASS} ${signed ? "h-full min-h-0" : ""} ${tint} ${className}`.trim()}
        {...props}
      />
    );

    if (!signed) return field;

    return (
      <div className="flex h-10 items-stretch gap-2">
        <div className="flex min-w-0 flex-1">{field}</div>
        <Selector
          options={TYPE_OPTIONS}
          // `""` (unset) matches no segment, so nothing is highlighted.
          value={type as "EXPENSE" | "INCOME"}
          onChange={onTypeChange}
          fullWidth={false}
          className="shrink-0"
        />
      </div>
    );
  },
);

NumberInput.displayName = "NumberInput";

export default NumberInput;
