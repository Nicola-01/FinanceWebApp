import React from "react";
import { CustomSelect } from "./CustomSelect.tsx";
import { useUiVersion } from "../../hooks/useUiVersion";

/** CustomSelect in a compact bordered input box (inline schedule editors). */
export const BoxedSelect: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  width?: string;
}> = ({ value, onChange, options, width = "w-20" }) => {
  const [ui] = useUiVersion();
  return (
    <CustomSelect
      value={value}
      onChange={onChange}
      options={options}
      className={`${width} rounded-[var(--r-input)] px-3 text-sm text-app-text ${
        // ui-v2-switch: borderless raised field, same as v2 `Input`.
        ui === "v2"
          ? "bg-app-raised py-2.5"
          : "border border-app-border bg-app-input py-2"
      }`}
    />
  );
};
