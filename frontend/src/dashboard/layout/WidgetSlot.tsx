import type { KeyboardEventHandler } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEyeSlash,
  faUpDownLeftRight,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { SwitchableCard } from "../statistics/SwitchableCard.tsx";
import type { WidgetDef } from "./widgetTypes.ts";
import type { LayoutSlot, WidgetSpan } from "../../utils/tabLayout";

const mergeZoneId = (slotId: string) => `merge:${slotId}`;

interface WidgetSlotProps<Ctx> {
  slot: LayoutSlot;
  defs: Map<string, WidgetDef<Ctx>>;
  ctx: Ctx;
  editing: boolean;
  /** Wallet colour — accents the merge-target highlight. */
  accentColor: string;
  /** Span of the slot currently being dragged (null = no drag in progress). */
  activeSpan: WidgetSpan | null;
  /** Id of the slot currently being dragged. */
  activeId: string | null;
  /** True while a dragged slot hovers this slot's merge zone. */
  isMergeTarget: boolean;
  onHide: (slotId: string) => void;
  onPop: (slotId: string, widgetId: string) => void;
  onSetActive: (slotId: string, widgetId: string) => void;
}

/**
 * One grid slot: a standalone widget card, or a group rendered as a
 * SwitchableCard whose tabs are the member widgets (members render `bare`).
 * In edit mode an overlay turns the whole card into the drag surface and
 * exposes hide / pop-out controls; a central droppable appears on valid
 * (same-span) merge targets while a sibling is dragged.
 */
export function WidgetSlot<Ctx>({
  slot,
  defs,
  ctx,
  editing,
  accentColor,
  activeSpan,
  activeId,
  isMergeTarget,
  onHide,
  onPop,
  onSetActive,
}: WidgetSlotProps<Ctx>) {
  const members = slot.widgets
    .map((id) => defs.get(id))
    .filter((d): d is WidgetDef<Ctx> => d !== undefined);
  const first = members[0];
  const isGroup = members.length > 1;
  const activeWidgetId =
    isGroup && slot.activeWidget && slot.widgets.includes(slot.activeWidget)
      ? slot.activeWidget
      : slot.widgets[0];
  const activeDef = defs.get(activeWidgetId) ?? first;

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } =
    useSortable({
      id: slot.id,
      disabled: !editing,
    });
  // Sortable transforms are unused on purpose: onDragOver live-reorders the
  // slots and the framer `layout` prop animates the resulting reflow, which
  // stays correct for mixed half/full spans where strategy math does not.

  const canMerge =
    editing &&
    activeSpan !== null &&
    activeId !== null &&
    activeId !== slot.id &&
    activeSpan === first.span;
  const { setNodeRef: setMergeRef } = useDroppable({
    id: mergeZoneId(slot.id),
    disabled: !canMerge,
  });

  const hideLabel = isGroup
    ? members.map((m) => m.label).join(" + ")
    : first.title;

  return (
    <motion.div
      layout
      ref={setNodeRef}
      transition={{ layout: { duration: 0.25, ease: "easeOut" } }}
      className={`relative h-full min-w-0 ${first.span === "full" ? "xl:col-span-2" : ""}`}
      style={{ opacity: isDragging ? 0.35 : 1 }}
    >
      {isGroup ? (
        <SwitchableCard
          className="h-full"
          tabs={members.map((m) => ({
            key: m.id,
            title: m.title,
            label: m.label,
          }))}
          activeTab={activeWidgetId}
          onTabChange={(key) => onSetActive(slot.id, key)}
          title={activeDef.title}
          subtitle={activeDef.subtitle}
        >
          {activeDef.render(ctx, true)}
        </SwitchableCard>
      ) : (
        first.render(ctx, false)
      )}

      {editing && (
        // No `touch-none` here: the whole card is the pointer drag surface, but
        // touch scrolling must keep working — the TouchSensor's 250ms delay
        // disambiguates scroll vs drag (same setup as the WalletsBar drag).
        <div
          className="absolute inset-0 z-10 cursor-grab rounded-2xl outline-dashed outline-1 -outline-offset-1 outline-app-border active:cursor-grabbing"
          {...listeners}
        >
          {/* Keyboard/AT drag affordance: the sortable role/tabindex live on
              this small handle, not the overlay, so the Hide/pop buttons are
              not nested inside an element with role="button". */}
          <span
            ref={setActivatorNodeRef}
            {...attributes}
            aria-label={`Move ${hideLabel}`}
            onKeyDown={
              listeners?.onKeyDown as
                | KeyboardEventHandler<HTMLSpanElement>
                | undefined
            }
            className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg border border-app-border bg-app-surface/90 text-app-muted shadow-sm"
          >
            <FontAwesomeIcon icon={faUpDownLeftRight} className="text-xs" />
          </span>

          <button
            type="button"
            aria-label={`Hide ${hideLabel}`}
            onClick={() => onHide(slot.id)}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg border border-app-border bg-app-surface/90 text-app-muted shadow-sm transition-colors hover:border-app-red/40 hover:text-app-red"
          >
            <FontAwesomeIcon icon={faEyeSlash} className="text-xs" />
          </button>

          {isGroup && (
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
              {members.map((m) => (
                <span
                  key={m.id}
                  className="flex items-center gap-1 rounded-full border border-app-border bg-app-surface/90 py-0.5 pl-2.5 pr-1 font-app-mono text-[11px] text-app-text shadow-sm"
                >
                  {m.label}
                  <button
                    type="button"
                    aria-label={`Remove ${m.label} from group`}
                    onClick={() => onPop(slot.id, m.id)}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-app-muted transition-colors hover:bg-app-red/10 hover:text-app-red"
                  >
                    <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {canMerge && (
        <div ref={setMergeRef} className="absolute inset-[18%] z-20" />
      )}

      {isMergeTarget && (
        <div
          className="pointer-events-none absolute inset-0 z-30 rounded-2xl"
          style={{
            backgroundColor: `${accentColor}14`,
            boxShadow: `inset 0 0 0 2px ${accentColor}`,
          }}
        />
      )}
    </motion.div>
  );
}
