import { motion, AnimatePresence } from "framer-motion";
import { useMobileMath } from "../../hooks/useMobileMath.ts";
import { useAmountInput } from "./useAmountInput.ts";
import { AmountMathToolbar } from "./AmountMathToolbar.tsx";

interface AmountInputProps {
  value?: string;
  placeholder?: string;
  currencySymbol: string;
  type: "EXPENSE" | "INCOME" | "";
  setType: (type: "EXPENSE" | "INCOME" | "") => void;
  onAmountChange: (value: string) => void;
  autoFocus?: boolean;
}

export const AmountInput = ({
  value,
  placeholder,
  currencySymbol,
  type,
  setType,
  onAmountChange,
  autoFocus = true,
}: AmountInputProps) => {
  const { isMobile, keyboardHeight } = useMobileMath();
  const {
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
  } = useAmountInput({ value, type, setType, onAmountChange, autoFocus });

  return (
    <div className="relative flex flex-col items-center justify-center w-full">
      {/* Live Preview Bubble */}
      <AnimatePresence>
        {liveResult !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 bg-app-surface/95 backdrop-blur-md border border-app-border rounded-full px-4 py-1 text-sm font-app-mono shadow-2xl flex items-center gap-1.5 z-50 whitespace-nowrap"
          >
            <span className="text-app-muted text-xs">Preview:</span>
            <span
              className={`${liveResult < 0 ? "text-app-red" : "text-app-green"} font-semibold`}
            >
              {liveResult < 0 ? "-" : "+"}
              {Math.abs(liveResult).toFixed(2)} {currencySymbol}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-18.75 items-center justify-center gap-2">
        <input
          ref={internalRef}
          className={`font-amount font-app-mono w-[280px] theme-bg-transparent text-center outline-none transition-all duration-200 placeholder:text-app-muted/30 ${textSize} ${color || "text-app-muted opacity-40"}`}
          type="text"
          inputMode="decimal"
          placeholder={placeholder || "0.00"}
          onKeyDown={handleOnKeyDown}
          onChange={handleOnChange}
          onFocus={handleOnFocus}
          onBlur={handleOnBlur}
          onDrop={(e) => e.preventDefault()}
          autoFocus={autoFocus}
          required
        />
        <span className="font-app-mono pb-2 text-4xl text-app-muted opacity-40">
          {currencySymbol}
        </span>
      </div>

      {/* Floating math toolbar — mobile only */}
      <AmountMathToolbar
        open={isMobile && isFocused}
        toolbarRef={toolbarRef}
        keyboardHeight={keyboardHeight}
        onPress={handleToolbarPress}
        onResolve={handleResolve}
      />
    </div>
  );
};
