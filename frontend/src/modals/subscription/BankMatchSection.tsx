import { useState } from "react";
import {
  faBuildingColumns,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { CustomSelect } from "../../components/ui/CustomSelect.tsx";
import { TagBadge } from "../../components/ui/TagBadge.tsx";
import { DropdownManageButton } from "../../components/ui/DropdownManageButton.tsx";
import { ResponsiveOverlay } from "../../components/ui/ResponsiveOverlay.tsx";
import { BankRulesSection } from "../../dashboard/settings/BankRulesSection.tsx";
import { FieldLabel } from "../../components/ui/FieldLabel";
import { FormRow } from "../../components/ui/FormRow";
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
  /** "boxed": v1 box with a label. "rows": v2 FormRow for a `divide-y` card. */
  variant?: "boxed" | "rows";
}

/** Open Banking part of the subscription form: pick a wallet bank rule (fully controlled). */
export function BankMatchSection({
  value,
  onChange,
  rules,
  onRulesChanged,
  accentColor,
  variant = "boxed",
}: Props) {
  const [managerOpen, setManagerOpen] = useState(false);
  const select = (
    <CustomSelect
      value={value.ruleId ?? ""}
      onChange={(id) => onChange({ ruleId: id || null })}
      className={
        variant === "rows"
          ? "min-w-0 bg-transparent px-1 py-1 text-sm text-app-text cursor-pointer"
          : "w-full bg-transparent px-3 py-2 text-sm font-bold text-app-text cursor-pointer"
      }
      activeColor={accentColor}
      options={[
        { value: "", label: "None" },
        ...rules.map((r) => ({
          value: r.id,
          label: (
            <span className="flex w-full min-w-0 items-center justify-between gap-3">
              <span className="truncate">{r.name}</span>
              {r.tag && <TagBadge tag={r.tag} showParent={false} />}
            </span>
          ),
        })),
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
  );

  const manager = (
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
  );

  if (variant === "rows") {
    return (
      <>
        <FormRow icon={faBuildingColumns} label="Bank rule">
          {select}
        </FormRow>
        {manager}
      </>
    );
  }

  return (
    <div className="bg-app-input/50 border border-app-border rounded-xl p-4 flex flex-col gap-4">
      <h4 className="text-sm font-bold text-app-text">Open Banking</h4>
      <div>
        <FieldLabel>Bank rule</FieldLabel>
        <div className="flex bg-app-input border border-app-border rounded-xl shadow-inner h-12">
          {select}
        </div>
      </div>
      {manager}
    </div>
  );
}
