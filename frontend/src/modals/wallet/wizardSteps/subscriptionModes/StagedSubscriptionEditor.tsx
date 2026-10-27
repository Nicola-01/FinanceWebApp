import { TagTreePicker } from "../../../../components/tags/TagTreePicker";
import { AmountInput } from "../../../../components/ui/AmountInput";
import CustomDatePicker from "../../../../components/datePicker/CustomDatePicker";
import { SchedulingRules } from "../../../common/SchedulingRules";
import { durationChangePatch, parseIsoDate } from "./stagedSubscriptionEdits";
import type { Tag } from "../../../../types/domain";
import { toLocalIsoDate } from "../../../../utils/localDate";
import type { SubscriptionRequest } from "../../../../dashboard/settings/csvImport";

export interface StagedSubscriptionEditorProps {
  sub: SubscriptionRequest;
  /** Tag colour (or wallet accent) for the border and pickers. */
  accent?: string;
  currencySymbol: string;
  /** Staged tags in `Tag` shape — the only re-categorisation targets. */
  contextTags: Tag[];
  onEdit: (patch: Partial<SubscriptionRequest>) => void;
}

/** Inline editor of a staged subscription: amount, tag, start date, recurrence. */
export function StagedSubscriptionEditor({
  sub,
  accent,
  currencySymbol,
  contextTags,
  onEdit,
}: StagedSubscriptionEditorProps) {
  return (
    <div
      className="mt-2 flex flex-col gap-3 rounded-[var(--r-input)] border p-3"
      style={{ borderColor: `${accent ?? "#8b5cf6"}33` }}
    >
      <div className="flex justify-center">
        <AmountInput
          value={String(sub.amount)}
          currencySymbol={currencySymbol}
          type={sub.type}
          setType={(t) => t && onEdit({ type: t })}
          onAmountChange={(magnitude) =>
            onEdit({
              amount: magnitude === "" ? 0 : Number(magnitude),
            })
          }
          autoFocus={false}
        />
      </div>

      {/* Tag (left) + start date (right). The user may re-categorise the
          subscription; the picker only offers tags staged in this wallet. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TagTreePicker
          tags={contextTags}
          color={accent}
          selectedTagName={sub.tag}
          onSelectTag={(name) => onEdit({ tag: name })}
        />

        <div>
          <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
            Start date
          </label>
          <div className="flex h-12 rounded-xl border border-app-border bg-app-input shadow-inner transition-colors focus-within:border-[var(--brand-1)]">
            <CustomDatePicker
              isRange={false}
              color={accent}
              initialPreset="custom"
              initialStartDate={parseIsoDate(sub.startDate) ?? new Date()}
              onChange={(val) => {
                if (val instanceof Date)
                  onEdit({ startDate: toLocalIsoDate(val) });
              }}
              triggerClassName="w-full h-full border-0 bg-transparent shadow-none px-3 py-2 text-app-text font-bold focus:outline-none"
            />
          </div>
        </div>
      </div>

      <SchedulingRules
        showStatus={false}
        accentColor={accent}
        frequencyInterval={sub.frequencyInterval}
        onFrequencyIntervalChange={(v) => onEdit({ frequencyInterval: v })}
        frequencyType={sub.frequencyType}
        onFrequencyTypeChange={(v) => onEdit({ frequencyType: v })}
        duration={sub.duration}
        onDurationChange={(d) => onEdit(durationChangePatch(sub, d))}
        durationTimes={sub.durationTimes ?? 1}
        onDurationTimesChange={(v) => onEdit({ durationTimes: v })}
        durationUntil={parseIsoDate(sub.durationUntil)}
        onDurationUntilChange={(d) =>
          onEdit({ durationUntil: toLocalIsoDate(d) })
        }
      />
    </div>
  );
}
