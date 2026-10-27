import type { RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
          className="bg-app-surface/90 backdrop-blur-md border-t border-app-border px-2 py-1.5 flex items-center justify-between gap-1"
        >
          {["(", ")", "/", "*", "-", "+", "%"].map((char) => (
            <button
              key={char}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
              onClick={() => onPress(char)}
              className="bg-app-input hover:bg-app-hover border border-app-border text-app-text font-app-mono font-medium text-base rounded-lg h-10 flex-1 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            >
              {char}
            </button>
          ))}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={onResolve}
            className="bg-gradient-to-r theme-gradient-success-from theme-gradient-success-to hover:theme-gradient-success-from hover:theme-gradient-success-to border theme-border-success theme-text-default font-bold font-app-mono text-base rounded-lg h-10 flex-1 flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            =
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
