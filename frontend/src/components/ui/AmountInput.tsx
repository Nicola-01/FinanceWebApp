import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMobileMath } from "../../hooks/useMobileMath.ts";
import { evaluateMathExpression } from "../../utils/mathEvaluator.ts";

interface AmountInputProps {
  value?: string;
  placeholder?: string;
  currencySymbol: string;
  type: "EXPENSE" | "INCOME" | "";
  setType: (type: "EXPENSE" | "INCOME" | "") => void;
  onAmountChange: (value: string) => void;
  autoFocus?: boolean;
}

// ============================================================================
// METODI DI SUPPORTO ED EVALUATION
// ============================================================================
const hasOperators = (val: string): boolean => {
  const withoutSign = val.replace(/^[+-]/, "");
  return /[+\-*/%()]/.test(withoutSign);
};

const formatAmountString = (
  rawValue: string,
  defaultSign: "-" | "+",
): string => {
  // 1. Sostituisce la virgola con il punto
  let val = rawValue.replace(/,/g, ".");

  // 2. Rimuove tutto ciò che non è consentito (numeri, punti, parentesi e operatori matematici)
  val = val.replace(/[^0-9.+-/*%()]/g, "");

  // 3. Aggiunge il segno di default se manca e c'è del testo
  if (val.length > 0 && !/^[+-]/.test(val)) {
    val = defaultSign + val;
  }

  // 4. Se NON è una formula matematica complessa, applichiamo la formattazione standard
  if (!hasOperators(val)) {
    const sign = val.startsWith("-") ? "-" : val.startsWith("+") ? "+" : "";
    let numPart = val.replace(/^[+-]/, "");

    // Evita i punti multipli (tiene solo il primo)
    const dotParts = numPart.split(".");
    if (dotParts.length > 2) {
      numPart = dotParts[0] + "." + dotParts.slice(1).join("");
    }

    // Limita a due cifre decimali
    if (numPart.includes(".")) {
      const [intPart, decPart] = numPart.split(".");
      numPart = intPart + "." + decPart.slice(0, 2);
    }

    val = sign + numPart;
  }

  return val;
};

// ============================================================================
// COMPONENTE PRINCIPALE
// ============================================================================
export const AmountInput = ({
  value,
  placeholder,
  currencySymbol,
  type,
  setType,
  onAmountChange,
  autoFocus = true,
}: AmountInputProps) => {
  const internalRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const { isMobile, keyboardHeight } = useMobileMath();

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

  // Sincronizza il valore iniziale, i reset e le modifiche ESTERNE con l'input
  // fisico (non-controllato). L'input riporta al parent la sola magnitudine
  // (senza segno); quando quel valore rientra dall'esterno — es. la sezione del
  // tasso di cambio che modifica l'importo — va riscritto qui, preservando il
  // segno. Durante la digitazione dell'utente la magnitudine coincide già, così
  // saltiamo la riscrittura e non spostiamo il cursore.
  useEffect(() => {
    if (internalRef.current && value !== undefined) {
      if (value === "") {
        internalRef.current.value = "";
        // Sincronizza lo stato di visualizzazione col reset dell'<input> non-controllato.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setColor("text-app-muted opacity-40");
        setTextSize("text-6xl");
        setLiveResult(null);
      } else {
        const current = internalRef.current.value;
        const domMagnitude = current.replace(/^[+-]/, "");
        // Riscrivi solo se il valore è cambiato dall'esterno (non è la nostra
        // stessa digitazione, in cui magnitudine e `value` coincidono).
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

  // Gestione colori e cambio segno programmatico
  useEffect(() => {
    if (type === "") {
      // Colore derivato dal tipo, sincronizzato con l'<input> non-controllato.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // Centralizziamo gli aggiornamenti di stato
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

      // Calcolo Live Preview se contiene operatori matematici
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

  // Risoluzione dell'espressione matematica
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

  // Gestione tasti speciali e blocco lettere
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

    // Scambio rapido del segno solo all'inizio
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

    // Se preme '=', risolve
    if (e.key === "=") {
      e.preventDefault();
      handleResolve();
      return;
    }

    // Blocca caratteri non ammessi
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

      {/* Toolbar Matematica Fluttuante — Solo Mobile */}
      <AnimatePresence>
        {isMobile && isFocused && (
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
                onClick={() => handleToolbarPress(char)}
                className="bg-app-input hover:bg-app-hover border border-app-border text-app-text font-app-mono font-medium text-base rounded-lg h-10 flex-1 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
              >
                {char}
              </button>
            ))}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
              onClick={handleResolve}
              className="bg-gradient-to-r theme-gradient-success-from theme-gradient-success-to hover:theme-gradient-success-from hover:theme-gradient-success-to border theme-border-success theme-text-default font-bold font-app-mono text-base rounded-lg h-10 flex-1 flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              =
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
