import { Fragment, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Active,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
  type Over,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { LayoutGroup } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { TabLayout } from "../../utils/tabLayout";
import type { TabLayoutApi } from "./useTabLayout.ts";
import type { WidgetDef } from "./widgetTypes.ts";
import { HiddenTray } from "./HiddenTray.tsx";
import { WidgetSlot } from "./WidgetSlot.tsx";
import {
  groupBodyId,
  isSlotId,
  MERGE_PREFIX,
  mergeAwareCollision,
  parseMemberId,
} from "./mergeAwareCollision.ts";

interface WidgetGridProps<Ctx> {
  defs: WidgetDef<Ctx>[];
  ctx: Ctx;
  editing: boolean;
  api: TabLayoutApi;
  /** Wallet colour — accents merge highlights and tray chips. */
  accentColor: string;
}

/** Pointer travel (px) required to switch the pop-out target — kills boundary flicker. */
const POP_HYSTERESIS_PX = 28;

/** True when the dragged tile's centre sits past the `over` slot's centre. */
function insertAfterOver(active: Active, over: Over): boolean {
  const dragged = active.rect.current.translated ?? active.rect.current.initial;
  const target = over.rect;
  if (!dragged) return false;
  const dx = dragged.left + dragged.width / 2;
  const dy = dragged.top + dragged.height / 2;
  const tx = target.left + target.width / 2;
  // Below the target's row → after; above it → before; same row → past its x-centre.
  if (dy > target.bottom) return true;
  if (dy < target.top) return false;
  return dx > tx;
}

/**
 * The customizable widget grid: fixed-span slots flowing in a 2-column grid
 * (1 column below xl), drag-to-reorder / drop-on-center-to-group in edit
 * mode, plus the hidden-widgets tray. Pure view over a TabLayoutApi.
 *
 * One shared DndContext drives two drag kinds:
 * - **slot drags** reorder/merge whole cards (active id = slot id), and
 * - **member drags** reorder a group's mini-tiles or pop one out to a
 *   standalone card (active id = `member:<groupId>:<widgetId>`).
 */
export function WidgetGrid<Ctx>({
  defs,
  ctx,
  editing,
  api,
  accentColor,
}: WidgetGridProps<Ctx>) {
  const defMap = useMemo(() => new Map(defs.map((d) => [d.id, d])), [defs]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [mergeTarget, setMergeTarget] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  // Grid index a dragged member tile would pop into (null = still inside its
  // group / not a member drag). Drives the live pop-out placeholder + reflow.
  const [memberPopIndex, setMemberPopIndex] = useState<number | null>(null);
  const preDragLayout = useRef<TabLayout | null>(null);
  // Origin of an in-progress member-tile drag (null for slot drags).
  const memberDragOrigin = useRef<{ groupId: string; widgetId: string } | null>(
    null,
  );
  // Anchor for pop-out hysteresis: the pointer position + index last committed,
  // so a switch only happens after the pointer travels past the threshold.
  const memberPopAnchor = useRef<{
    x: number;
    y: number;
    index: number;
  } | null>(null);

  const activeSlot = activeId
    ? (api.layout.slots.find((s) => s.id === activeId) ?? null)
    : null;
  const activeMembers = activeSlot
    ? activeSlot.widgets
        .map((id) => defMap.get(id))
        .filter((d): d is WidgetDef<Ctx> => d !== undefined)
    : [];
  const activeSpan = activeMembers[0]?.span ?? null;

  // The widget being dragged as a group mini-tile (drives the DragOverlay).
  const activeMemberParsed = activeId ? parseMemberId(activeId) : null;
  const activeMemberDef = activeMemberParsed
    ? (defMap.get(activeMemberParsed.widgetId) ?? null)
    : null;

  // Slot drags suspend framer layout (native sortable transforms drive the
  // reorder preview and keep merge hitboxes truthful); member drags keep framer
  // layout ON so the grid reflows smoothly around the pop-out placeholder.
  const slotDragActive = dragActive && activeMemberParsed === null;

  const handleDragStart = ({ active }: DragStartEvent) => {
    preDragLayout.current = api.layout;
    const id = String(active.id);
    setActiveId(id);
    setDragActive(true);
    memberDragOrigin.current = parseMemberId(id);
    memberPopAnchor.current = null;
  };

  // The pop-out placeholder index is computed HERE (onDragMove), not in
  // onDragOver: onDragOver also fires when re-measurement changes the collision
  // while the pointer is still, and — because inserting the placeholder reflows
  // the grid, which triggers re-measurement — that made a standing oscillation.
  // onDragMove only fires on real pointer movement, so the loop can't run.
  const handleDragMove = ({ active, over }: DragMoveEvent) => {
    const memberOrigin = memberDragOrigin.current;
    if (!memberOrigin) return;
    const overId = over ? String(over.id) : null;
    const overMember = overId ? parseMemberId(overId) : null;
    const stillInGroup =
      !overId ||
      overMember?.groupId === memberOrigin.groupId ||
      overId === groupBodyId(memberOrigin.groupId) ||
      overId === memberOrigin.groupId;
    if (stillInGroup) {
      if (memberPopAnchor.current !== null) {
        memberPopAnchor.current = null;
        setMemberPopIndex(null);
      }
      return;
    }
    const slots = api.layout.slots;
    const overIdx = slots.findIndex((s) => s.id === overId);
    const candidate =
      overIdx === -1
        ? slots.length
        : overIdx + (over && insertAfterOver(active, over) ? 1 : 0);

    // Hysteresis: keep the current target unless the pointer has travelled past
    // the threshold since it was set. Without this, re-measurement shifts the
    // reflowed cards under a slowly-moving cursor and the placeholder flips
    // between two indices at the boundary (scatta).
    const r = active.rect.current.translated ?? active.rect.current.initial;
    const cx = r ? r.left + r.width / 2 : 0;
    const cy = r ? r.top + r.height / 2 : 0;
    const anchor = memberPopAnchor.current;
    if (anchor && candidate === anchor.index) return;
    if (
      anchor &&
      Math.hypot(cx - anchor.x, cy - anchor.y) < POP_HYSTERESIS_PX
    ) {
      return;
    }
    memberPopAnchor.current = { x: cx, y: cy, index: candidate };
    setMemberPopIndex(candidate);
  };

  const handleDragOver = ({ over }: DragOverEvent) => {
    if (memberDragOrigin.current) {
      // Member drags never merge; the pop-out placeholder is handled in
      // onDragMove so re-measurement can't drive a feedback loop here.
      setMergeTarget(null);
      return;
    }
    if (!over) {
      setMergeTarget(null);
      return;
    }
    const overId = String(over.id);
    if (overId.startsWith(MERGE_PREFIX)) {
      setMergeTarget(overId.slice(MERGE_PREFIX.length));
      return;
    }
    setMergeTarget(null);
    // No live model reorder: dnd-kit's own sortable transforms preview the
    // reorder (so it animates and merge hitboxes stay truthful), and the move
    // is committed once on drop in handleDragEnd.
  };

  /** Apply a member-tile drop: reorder within the group, or pop it out. */
  const handleMemberDrop = (
    origin: { groupId: string; widgetId: string },
    active: Active,
    over: Over | null,
  ) => {
    const { groupId: g, widgetId: w } = origin;
    const overId = over ? String(over.id) : null;

    if (overId) {
      const overMember = parseMemberId(overId);
      if (overMember && overMember.groupId === g) {
        // Dropped onto a sibling tile → reorder within the group.
        api.reorderMember(g, w, overMember.widgetId);
        return;
      }
      if (overId === groupBodyId(g) || overId === g) {
        // Still inside the same group → move to the end (no-op if already last).
        const group = api.layout.slots.find((s) => s.id === g);
        const last = group?.widgets[group.widgets.length - 1];
        if (last) api.reorderMember(g, w, last);
        return;
      }
    }

    // Otherwise pop the member out to a standalone slot at the drop position.
    const slots = api.layout.slots;
    let atIndex: number;
    if (!over || !overId) {
      atIndex = slots.length;
    } else {
      const overIdx = slots.findIndex((s) => s.id === overId);
      atIndex =
        overIdx === -1
          ? slots.length
          : overIdx + (insertAfterOver(active, over) ? 1 : 0);
    }
    api.popTo(g, w, atIndex);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const origin = memberDragOrigin.current;
    if (origin) {
      handleMemberDrop(origin, active, over);
    } else if (activeId && mergeTarget) {
      api.merge(activeId, mergeTarget);
    } else if (
      activeId &&
      over &&
      isSlotId(String(over.id)) &&
      String(over.id) !== activeId
    ) {
      // Slot reorder: commit the move to the drop target's position.
      api.reorderSlot(activeId, String(over.id));
    } else {
      api.persist();
    }
    setActiveId(null);
    setMergeTarget(null);
    setDragActive(false);
    setMemberPopIndex(null);
    preDragLayout.current = null;
    memberDragOrigin.current = null;
    memberPopAnchor.current = null;
  };

  const handleDragCancel = () => {
    if (preDragLayout.current) api.restore(preDragLayout.current);
    setActiveId(null);
    setMergeTarget(null);
    setDragActive(false);
    setMemberPopIndex(null);
    preDragLayout.current = null;
    memberDragOrigin.current = null;
    memberPopAnchor.current = null;
  };

  // Live pop-out target: a dashed slot the size of the dragged member's span,
  // inserted into the grid at `memberPopIndex` so the other cards reflow.
  const popPlaceholder = activeMemberDef ? (
    <div
      className={`min-h-[160px] rounded-2xl border-2 border-dashed border-app-border bg-app-input/20 ${activeMemberDef.span === "full" ? "xl:col-span-2" : ""}`}
    />
  ) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={mergeAwareCollision}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={api.layout.slots.map((s) => s.id)}
        strategy={rectSortingStrategy}
      >
        <LayoutGroup>
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            {api.layout.slots.map((slot, i) => (
              <Fragment key={slot.id}>
                {memberPopIndex === i && popPlaceholder}
                <WidgetSlot
                  slot={slot}
                  defs={defMap}
                  ctx={ctx}
                  editing={editing}
                  accentColor={accentColor}
                  activeSpan={activeSpan}
                  activeId={activeId}
                  suspendLayout={slotDragActive}
                  isMergeTarget={mergeTarget === slot.id}
                  onHide={api.hide}
                  onSetActive={api.setActive}
                />
              </Fragment>
            ))}
            {memberPopIndex === api.layout.slots.length && popPlaceholder}
          </div>
        </LayoutGroup>
      </SortableContext>

      {editing && (
        <HiddenTray
          hiddenSlots={api.layout.hiddenSlots}
          defs={defMap}
          accentColor={accentColor}
          onShow={api.show}
        />
      )}

      <DragOverlay dropAnimation={null}>
        {activeMembers.length > 0 ? (
          <div className="flex h-full w-full items-center justify-center gap-2.5 rounded-2xl border border-app-border bg-app-card/50 opacity-70 shadow-2xl backdrop-blur-sm">
            <FontAwesomeIcon
              icon={activeMembers[0].icon}
              className="text-app-muted"
            />
            <span className="font-bold text-app-text">
              {activeMembers.length > 1
                ? activeMembers.map((m) => m.label).join(" + ")
                : activeMembers[0].title}
            </span>
          </div>
        ) : activeMemberDef ? (
          <div className="flex items-center gap-2 rounded-xl border border-app-border bg-app-card/50 px-3 py-2 opacity-70 shadow-2xl backdrop-blur-sm">
            <FontAwesomeIcon
              icon={activeMemberDef.icon}
              className="text-xs text-app-muted"
            />
            <span className="text-xs font-bold text-app-text">
              {activeMemberDef.label}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
