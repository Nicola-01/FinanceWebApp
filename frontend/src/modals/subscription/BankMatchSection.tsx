import { CustomSelect } from "../../components/ui/CustomSelect.tsx";
import { FieldLabel } from "../../components/ui/FieldLabel";
import type { BankRule } from "../../types/domain";
import type { BankMatchFields } from "./subscriptionPayload";

interface Props {
  value: BankMatchFields;
  onChange: (next: BankMatchFields) => void;
  /** The wallet's bank rules (managed in wallet settings → Data). */
  rules: BankRule[];
  accentColor?: string;
}

/** Open Banking part of the subscription form: pick a wallet bank rule (fully controlled). */
export function BankMatchSection({
  value,
  onChange,
  rules,
  accentColor,
}: Props) {
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
          />
        </div>
        <p className="mt-1 text-xs text-app-muted">
          Rules are managed in the wallet settings, under Data.
        </p>
      </div>
    </div>
  );
}
