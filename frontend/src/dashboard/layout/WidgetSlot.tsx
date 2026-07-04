import type { KeyboardEventHandler } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEyeSlash,
  faUpDownLeftRight,
} from "@fortawesome/free-solid-svg-icons";
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SwitchableCard } from "../statistics/SwitchableCard.tsx";
import { GroupEditGrid } from "./GroupEditGrid.tsx";
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
  /** Suspend framer layout animation while a drag is active so reorders snap. */
  suspendLayout?: boolean;
  /** True while a dragged slot hovers this slot's merge zone. */
  isMergeTarget: boolean;
  onHide: (slotId: string) => void;
  onSetActive: (slotId: string, widgetId: string) => void;
}

/**
 * One grid slot: a standalone widget card, or a group. Outside edit mode a group
 * renders as a SwitchableCard whose tabs are the member widgets (members render
 * `bare`). In edit mode a standalone card gets a full-card drag overlay with
 * hide / drag controls, while a group instead shows its members as sortable
 * mini-tiles (`GroupEditGrid`) under a header whose ⠿ handle is the ONLY
 * whole-group drag surface — so the tiles keep their own drag. A central
 * droppable appears on valid (same-span) merge targets while a sibling slot is
 * dragged.
 */
export function WidgetSlot<Ctx>({
  slot,
  defs,
  ctx,
  editing,
  accentColor,
  activeSpan,
  activeId,
  suspendLayout,
  isMergeTarget,
  onHide,
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

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: slot.id,
    disabled: !editing,
  });
  // During a drag the sortable transform drives the reorder preview — dnd-kit
  // measures its OWN transforms, so merge hitboxes stay truthful as cards shift.
  // When idle, the framer `layout` prop animates hide/show/group/reset reflow.
  // The two never overlap: `suspendLayout` (true only while a drag is active)
  // turns framer layout off exactly when the sortable transform is in play.

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

  // In group edit mode the tiles own the pointer drag, so the whole-group drag
  // is restricted to the ⠿ handle (listeners live on the handle, not an overlay).
  const groupEditMode = editing && isGroup;

  return (
    <motion.div
      layout={!suspendLayout}
      ref={setNodeRef}
      transition={{ layout: { duration: 0.25, ease: "easeOut" } }}
      className={`relative h-full min-w-0 ${first.span === "full" ? "xl:col-span-2" : ""}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: suspendLayout ? transition : undefined,
        opacity: isDragging ? 0.35 : 1,
      }}
    >
      {groupEditMode ? (
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-app-border bg-app-card/20">
          <div
            {...listeners}
            className="flex cursor-grab items-center gap-2.5 border-b border-app-border px-4 py-3 active:cursor-grabbing"
          >
            {/* The whole header is the pointer drag surface (drag from the title
                too). The ⠿ handle carries only the keyboard/AT activator
                (role/tabindex) so the Hide button — a sibling, not its child —
                is not nested inside an element with role="button". */}
            <span
              ref={setActivatorNodeRef}
              {...attributes}
              onKeyDown={
                listeners?.onKeyDown as
                  KeyboardEventHandler<HTMLSpanElement> | undefined
              }
              aria-label={`Move ${hideLabel}`}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-app-border bg-app-surface/90 text-app-muted shadow-sm"
            >
              <FontAwesomeIcon icon={faUpDownLeftRight} className="text-xs" />
            </span>
            <h3 className="min-w-0 flex-1 truncate text-sm font-bold uppercase tracking-wider text-app-text">
              {hideLabel}
            </h3>
            <button
              type="button"
              aria-label={`Hide ${hideLabel}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onHide(slot.id)}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-app-border bg-app-surface/90 text-app-muted shadow-sm transition-colors hover:border-app-red/40 hover:text-app-red"
            >
              <FontAwesomeIcon icon={faEyeSlash} className="text-xs" />
            </button>
          </div>
          <div className="min-h-0 flex-1 p-3">
            <GroupEditGrid
              groupId={slot.id}
              members={members}
              ctx={ctx}
              span={first.span}
            />
          </div>
        </div>
      ) : (
        <>
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
            // No `touch-none` here: the whole card is the pointer drag surface,
            // but touch scrolling must keep working — the TouchSensor's 250ms
            // delay disambiguates scroll vs drag (same setup as the WalletsBar).
            <div
              className="absolute inset-0 z-10 cursor-grab rounded-2xl outline-dashed outline-1 -outline-offset-1 outline-app-border active:cursor-grabbing"
              {...listeners}
            >
              {/* Keyboard/AT drag affordance: the sortable role/tabindex live on
                  this small handle, not the overlay, so the Hide button is not
                  nested inside an element with role="button". */}
              <span
                ref={setActivatorNodeRef}
                {...attributes}
                aria-label={`Move ${hideLabel}`}
                onKeyDown={
                  listeners?.onKeyDown as
                    KeyboardEventHandler<HTMLSpanElement> | undefined
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
            </div>
          )}
        </>
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
