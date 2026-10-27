import React from "react";
import { Input } from "../../components/ui/Input";

/** Labelled 6-digit code field (non-digits stripped, capped at 6). */
export const OtpInput: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  onEnter?: () => void;
}> = ({ label, value, onChange, disabled, autoFocus, onEnter }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-semibold uppercase tracking-wider text-app-muted">
      {label}
    </label>
    <Input
      inputMode="numeric"
      maxLength={6}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      placeholder="000000"
      className="text-sm tracking-[0.3em]"
      autoFocus={autoFocus}
      disabled={disabled}
      onKeyDown={onEnter && ((e) => e.key === "Enter" && onEnter())}
    />
  </div>
);
