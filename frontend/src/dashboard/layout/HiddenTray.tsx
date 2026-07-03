import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEyeSlash, faPlus } from "@fortawesome/free-solid-svg-icons";
import type { WidgetDef } from "./widgetTypes.ts";
import type { LayoutSlot } from "../../utils/tabLayout";

interface TrayChipProps {
  label: string;
  icon: WidgetDef<unknown>["icon"];
  accentColor: string;
  onShow: () => void;
}

/** One restorable chip; hovering tints it with the wallet colour. */
const TrayChip: React.FC<TrayChipProps> = ({
  label,
  icon,
  accentColor,
  onShow,
}) => {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Show ${label}`}
      onClick={onShow}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex items-center gap-2 rounded-xl border border-app-border bg-app-surface px-3 py-2 text-sm font-medium text-app-text shadow-sm transition-colors"
      style={
        hover
          ? {
              borderColor: accentColor,
              backgroundColor: `${accentColor}14`,
            }
          : undefined
      }
    >
      <FontAwesomeIcon icon={icon} className="text-xs text-app-muted" />
      {label}
      <FontAwesomeIcon
        icon={faPlus}
        className="text-[10px]"
        style={{ color: hover ? accentColor : "var(--color-app-muted)" }}
      />
    </button>
  );
};

interface HiddenTrayProps<Ctx> {
  hiddenSlots: LayoutSlot[];
  defs: Map<string, WidgetDef<Ctx>>;
  accentColor: string;
  onShow: (slotId: string) => void;
}

/** Edit-mode strip listing hidden widgets/groups; clicking a chip restores it. */
export function HiddenTray<Ctx>({
  hiddenSlots,
  defs,
  accentColor,
  onShow,
}: HiddenTrayProps<Ctx>) {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-app-border bg-app-input/20 p-4">
      <div className="mb-3 flex items-center gap-2 text-app-muted">
        <FontAwesomeIcon icon={faEyeSlash} className="text-xs" />
        <span className="text-xs font-bold uppercase tracking-wider">
          Hidden widgets
        </span>
      </div>
      {hiddenSlots.length === 0 ? (
        <p className="text-sm text-app-muted/70">
          Nothing hidden — use the eye button on a card to hide it.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {hiddenSlots.map((slot) => {
            const members = slot.widgets
              .map((id) => defs.get(id))
              .filter((d): d is WidgetDef<Ctx> => d !== undefined);
            if (members.length === 0) return null;
            return (
              <TrayChip
                key={slot.id}
                label={members.map((m) => m.label).join(" + ")}
                icon={members[0].icon}
                accentColor={accentColor}
                onShow={() => onShow(slot.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
