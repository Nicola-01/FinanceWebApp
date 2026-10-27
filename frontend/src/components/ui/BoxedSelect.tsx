import React from "react";
import { CustomSelect } from "./CustomSelect.tsx";

/** CustomSelect in a compact bordered input box (inline schedule editors). */
export const BoxedSelect: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  width?: string;
}> = ({ value, onChange, options, width = "w-20" }) => (
  <CustomSelect
    value={value}
    onChange={onChange}
    options={options}
    className={`${width} rounded-[var(--r-input)] border border-app-border bg-app-input px-3 py-2 text-sm text-app-text`}
  />
);
