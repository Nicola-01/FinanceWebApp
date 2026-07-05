import { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faXmark } from "@fortawesome/free-solid-svg-icons";
import Button from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/Checkbox";
import { parseAndValidateCsv } from "../../../dashboard/settings/csvValidation";
import type { TagRequest } from "../../../dashboard/settings/csvImport";

export interface TagsStepProps {
  value: TagRequest[];
  onChange: (next: TagRequest[]) => void;
  accentColor?: string;
}

/**
 * Wizard step 2 — tags (MINIMAL base). Recommended presets + CSV upload,
 * accumulating into one staged list. Phase 6 expands this into the full
 * four-mode version (custom form, import-from-other-wallets, etc.).
 */

const RECOMMENDED_TAGS: { name: string; colorHex: string }[] = [
  { name: "Food", colorHex: "#f59e0b" },
  { name: "Groceries", colorHex: "#10b981" },
  { name: "Transport", colorHex: "#3b82f6" },
  { name: "Rent", colorHex: "#ef4444" },
  { name: "Utilities", colorHex: "#eab308" },
  { name: "Entertainment", colorHex: "#8b5cf6" },
  { name: "Health", colorHex: "#ec4899" },
  { name: "Salary", colorHex: "#22c55e" },
];

const keyOf = (name: string) => name.trim().toLowerCase();

export function TagsStep({ value, onChange, accentColor }: TagsStepProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rowErrors, setRowErrors] = useState<
    { row: number; message: string }[]
  >([]);

  const staged = new Set(value.map((t) => keyOf(t.name)));

  const toggleRecommended = (name: string, colorHex: string) => {
    if (staged.has(keyOf(name)))
      onChange(value.filter((t) => keyOf(t.name) !== keyOf(name)));
    else onChange([...value, { name, icon: "tag", colorHex }]);
  };

  const removeTag = (name: string) =>
    onChange(value.filter((t) => keyOf(t.name) !== keyOf(name)));

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const { dtos, rowErrors: errs } = parseAndValidateCsv(
      "tags",
      await file.text(),
    );
    if (errs.length) {
      setRowErrors(errs);
      return;
    }
    setRowErrors([]);
    // Merge, de-duplicating by name (last wins).
    const merged = new Map(value.map((t) => [keyOf(t.name), t]));
    dtos.forEach((t) => merged.set(keyOf(t.name), t));
    onChange([...merged.values()]);
  };

  return (
    <div className="space-y-6 text-left">
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-app-muted">
          Recommended
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {RECOMMENDED_TAGS.map((t) => (
            <div
              key={t.name}
              className={`rounded-[var(--r-input)] border border-app-border px-3 py-2 transition-colors ${
                staged.has(keyOf(t.name)) ? "bg-app-input" : "bg-app-surface"
              }`}
            >
              <Checkbox
                state={staged.has(keyOf(t.name))}
                onChange={() => toggleRecommended(t.name, t.colorHex)}
                color={t.colorHex}
                size="sm"
                className="w-full"
                label={
                  <span className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: t.colorHex }}
                    />
                    {t.name}
                  </span>
                }
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-app-muted">
          Or import from CSV
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={onFile}
        />
        <Button
          variant="secondary"
          accentColor={accentColor}
          onClick={() => fileRef.current?.click()}
        >
          <FontAwesomeIcon icon={faUpload} />
          Upload tags (.csv)
        </Button>
        {rowErrors.length > 0 && (
          <ul className="mt-3 space-y-1 rounded-[var(--r-input)] border border-app-red/40 bg-app-red/10 p-3 text-sm text-app-red">
            {rowErrors.slice(0, 6).map((e, i) => (
              <li key={i}>
                Row {e.row}: {e.message}
              </li>
            ))}
            {rowErrors.length > 6 && <li>+{rowErrors.length - 6} more</li>}
          </ul>
        )}
      </section>

      {value.length > 0 && (
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-app-muted">
            {value.length} tag{value.length === 1 ? "" : "s"} staged
          </p>
          <div className="flex flex-wrap gap-2">
            {value.map((t) => (
              <span
                key={keyOf(t.name)}
                className="inline-flex items-center gap-1.5 rounded-[var(--r-sm)] border border-app-border bg-app-input py-1 pl-2 pr-1 text-sm text-app-text"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: t.colorHex }}
                />
                {t.name}
                <button
                  type="button"
                  aria-label={`Remove ${t.name}`}
                  onClick={() => removeTag(t.name)}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-app-muted hover:bg-app-hover hover:text-app-text"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-xs" />
                </button>
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default TagsStep;
