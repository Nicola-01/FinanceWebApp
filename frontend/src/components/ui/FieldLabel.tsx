import React from "react";
import { useUiVersion } from "../../hooks/useUiVersion";

const LABEL_V1 =
  "mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted";
// ui-v2-switch: sentence case, no tracking, a tighter gap to the field.
const LABEL_V2 = "mb-1.5 block text-[13px] text-app-muted";

/** Small caption above a form field (uppercase in v1, sentence case in v2). */
export const FieldLabel: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [ui] = useUiVersion();
  return (
    <label className={ui === "v2" ? LABEL_V2 : LABEL_V1}>{children}</label>
  );
};
