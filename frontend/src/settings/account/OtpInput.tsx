import React from "react";
import { Input } from "../../components/ui/Input";
import { useUiVersion } from "../../hooks/useUiVersion";

/** Labelled 6-digit code field (non-digits stripped, capped at 6). */
export const OtpInput: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  onEnter?: () => void;
}> = ({ label, value, onChange, disabled, autoFocus, onEnter }) => {
  const [ui] = useUiVersion();
  const isV2 = ui === "v2"; // ui-v2-switch
  return (
    <div className="flex flex-col gap-1">
      <label
        className={
          isV2
            ? "text-[13px] text-app-muted"
            : "text-[11px] font-semibold uppercase tracking-wider text-app-muted"
        }
      >
        {label}
      </label>
      <Input
        inputMode="numeric"
        maxLength={6}
        value={value}
        onChange={(e) =>
          onChange(e.target.value.replace(/\D/g, "").slice(0, 6))
        }
        placeholder="000000"
        className={
          isV2
            ? "text-[22px] tabular-nums tracking-[0.3em]"
            : "text-sm tracking-[0.3em]"
        }
        autoFocus={autoFocus}
        disabled={disabled}
        onKeyDown={onEnter && ((e) => e.key === "Enter" && onEnter())}
      />
    </div>
  );
};
