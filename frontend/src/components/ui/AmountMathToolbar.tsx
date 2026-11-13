import type { RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUiVersion } from "../../hooks/useUiVersion";

interface AmountMathToolbarProps {
  open: boolean;
  toolbarRef: RefObject<HTMLDivElement | null>;
  keyboardHeight: number;
  onPress: (char: string) => void;
  onResolve: () => void;
}

/** Floating operator toolbar pinned above the mobile keyboard. */
export function AmountMathToolbar({
  open,
  toolbarRef,
  keyboardHeight,
  onPress,
  onResolve,
}: AmountMathToolbarProps) {
  const [ui] = useUiVersion();
  // ui-v2-switch
  const isV2 = ui === "v2";
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={toolbarRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: `${keyboardHeight}px`,
            zIndex: 9999,
          }}
          className={`px-2 py-1.5 flex items-center justify-between gap-1 ${
            // ui-v2-switch
            isV2
              ? "bg-app-card shadow-[0_-8px_24px_rgb(0_0_0/0.25),var(--box-ring)]"
              : "bg-app-surface/90 backdrop-blur-md border-t border-app-border"
          }`}
        >
          {["(", ")", "/", "*", "-", "+", "%"].map((char) => (
            <button
              key={char}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
              onClick={() => onPress(char)}
              className={`text-base h-10 flex-1 flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
                // ui-v2-switch
                isV2
                  ? "bg-app-raised hover:bg-app-hover text-app-text tabular-nums font-medium rounded-[var(--r-sm)]"
                  : "bg-app-input hover:bg-app-hover border border-app-border text-app-text font-app-mono font-medium rounded-lg"
              }`}
            >
              {char}
            </button>
          ))}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={onResolve}
            className={`text-base h-10 flex-1 flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
              // ui-v2-switch
              isV2
                ? "bg-wallet text-on-wallet font-semibold tabular-nums rounded-[var(--r-sm)]"
                : "bg-gradient-to-r theme-gradient-success-from theme-gradient-success-to hover:theme-gradient-success-from hover:theme-gradient-success-to border theme-border-success theme-text-default font-bold font-app-mono rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            }`}
          >
            =
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
