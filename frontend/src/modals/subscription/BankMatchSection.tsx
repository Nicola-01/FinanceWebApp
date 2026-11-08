import Toggle from "../../components/ui/Toggle.tsx";
import { Input } from "../../components/ui/Input.tsx";
import { FieldLabel } from "../../components/ui/FieldLabel";
import type { BankMatchFields } from "./subscriptionPayload";

interface Props {
  value: BankMatchFields;
  onChange: (next: BankMatchFields) => void;
  error?: string;
  accentColor?: string;
}

/** Open Banking rule editor of the subscription form (fully controlled). */
export function BankMatchSection({
  value,
  onChange,
  error,
  accentColor,
}: Props) {
  const set = (patch: Partial<BankMatchFields>) =>
    onChange({ ...value, ...patch });
  return (
    <div className="bg-app-input/50 border border-app-border rounded-xl p-4 flex flex-col gap-4">
      <h4 className="text-sm font-bold text-app-text">Open Banking</h4>
      <div>
        <FieldLabel>Bank text</FieldLabel>
        <Input
          type="text"
          placeholder="Text in the bank transaction name (Optional)"
          value={value.text}
          onChange={(e) => set({ text: e.target.value })}
          aria-invalid={!!error}
        />
        {error && <p className="mt-1 text-xs text-app-red">{error}</p>}
      </div>
      <div className="flex flex-wrap gap-4">
        <Toggle
          checked={value.regex}
          onChange={(regex) => set({ regex })}
          accentColor={accentColor}
          size="sm"
          label="Use regex"
          aria-label="Use regex"
        />
        <Toggle
          checked={value.ignoreCase}
          onChange={(ignoreCase) => set({ ignoreCase })}
          accentColor={accentColor}
          size="sm"
          label="Ignore case"
          aria-label="Ignore case"
        />
      </div>
      <div>
        <Toggle
          checked={value.bankDriven}
          onChange={(bankDriven) => set({ bankDriven })}
          accentColor={accentColor}
          size="sm"
          disabled={!value.text.trim()}
          label="Date from bank"
          aria-label="Date from bank"
        />
        <p className="mt-1 text-xs text-app-muted">
          Each matching bank transaction becomes an execution, on the bank's
          date.
        </p>
      </div>
    </div>
  );
}
