import React from "react";
import { Card } from "../../components/ui/Card";
import Toggle from "../../components/ui/Toggle";
import { useUiVersion } from "../../hooks/useUiVersion";

/** Settings → Appearance: per-device switch for the new (beta) interface. */
export const AppearanceSection: React.FC = () => {
  const [version, setVersion] = useUiVersion();

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-app-text">
            New interface (beta)
          </div>
          <div className="text-sm text-app-muted">
            Try the redesigned interface. Saved on this device only.
          </div>
        </div>
        <Toggle
          variant="switch"
          checked={version === "v2"}
          onChange={(on) => setVersion(on ? "v2" : "v1")}
          aria-label="New interface (beta)"
        />
      </div>
    </Card>
  );
};
