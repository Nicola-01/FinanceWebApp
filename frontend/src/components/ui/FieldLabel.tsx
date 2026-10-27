import React from "react";

/** Small uppercase caption above a form field (the modal/form label style). */
export const FieldLabel: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
    {children}
  </label>
);
