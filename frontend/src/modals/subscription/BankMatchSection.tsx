import { useState } from "react";
import { faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import { CustomSelect } from "../../components/ui/CustomSelect.tsx";
import { DropdownManageButton } from "../../components/ui/DropdownManageButton.tsx";
import { ResponsiveOverlay } from "../../components/ui/ResponsiveOverlay.tsx";
import { BankRulesSection } from "../../dashboard/settings/BankRulesSection.tsx";
import { FieldLabel } from "../../components/ui/FieldLabel";
import type { BankRule } from "../../types/domain";
import type { BankMatchFields } from "./subscriptionPayload";

interface Props {
  value: BankMatchFields;
  onChange: (next: BankMatchFields) => void;
  /** The wallet's bank rules (managed in wallet settings → Data). */
  rules: BankRule[];
  /** Called when the rules manager closes, so the caller can reload `rules`. */
  onRulesChanged?: () => void;
  accentColor?: string;
}

/** Open Banking part of the subscription form: pick a wallet bank rule (fully controlled). */
export function BankMatchSection({
  value,
  onChange,
  rules,
  onRulesChanged,
  accentColor,
}: Props) {
  const [managerOpen, setManagerOpen] = useState(false);
  return (
    <div className="bg-app-input/50 border border-app-border rounded-xl p-4 flex flex-col gap-4">
      <h4 className="text-sm font-bold text-app-text">Open Banking</h4>
      <div>
        <FieldLabel>Bank rule</FieldLabel>
        <div className="flex bg-app-input border border-app-border rounded-xl shadow-inner h-12">
          <CustomSelect
            value={value.ruleId ?? ""}
            onChange={(id) => onChange({ ruleId: id || null })}
            className="w-full bg-transparent px-3 py-2 text-sm font-bold text-app-text cursor-pointer"
            activeColor={accentColor}
            options={[
              { value: "", label: "None" },
              ...rules.map((r) => ({ value: r.id, label: r.name })),
            ]}
            footer={(close) => (
              <DropdownManageButton
                icon={faWandMagicSparkles}
                label="Manage bank rules"
                onClick={() => {
                  close();
                  setManagerOpen(true);
                }}
              />
            )}
          />
        </div>
      </div>
      <ResponsiveOverlay
        open={managerOpen}
        onClose={() => {
          setManagerOpen(false);
          onRulesChanged?.();
        }}
        title="Bank rules"
        subtitle="Tag and rename imported transactions automatically"
        accentColor={accentColor}
      >
        <BankRulesSection embedded />
      </ResponsiveOverlay>
    </div>
  );
}
