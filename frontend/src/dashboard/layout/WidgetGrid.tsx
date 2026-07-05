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
import { moveSlotToIndex, type TabLayout } from "../../utils/tabLayout";
import type { TabLayoutApi } from "./useTabLayout.ts";
import type { WidgetDef } from "./widgetTypes.ts";
import { HiddenTray } from "./HiddenTray.tsx";
import { WidgetSlot } from "./WidgetSlot.tsx";
import {
  MERGE_PREFIX,
  mergeAwareCollision,
  parseMemberId,
} from "./mergeAwareCollision.ts";
import { boxContains, popInsertionIndex, type Box } from "./popPlacement.ts";
import { slotInsertionIndex } from "./slotPlacement.ts";

interface WidgetGridProps<Ctx> {
  defs: WidgetDef<Ctx>[];
  ctx: Ctx;
  editing: boolean;
  api: TabLayoutApi;
  /** Wallet colour — accents merge highlights and tray chips. */
  accentColor: string;
}

/** Client pointer coords from a drag's activator event (mouse/touch), or null (keyboard). */
function eventPointer(e: Event): { x: number; y: number } | null {
  if ("clientX" in e && typeof (e as MouseEvent).clientX === "number") {
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  }
  const touch = (e as TouchEvent).touches?.[0];
  return touch ? { x: touch.clientX, y: touch.clientY } : null;
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
  // The grid container, read once at drag start to freeze slot geometry.
  const gridRef = useRef<HTMLDivElement>(null);
  // Resting slot rects (document coords) + the dragged member's group index,
  // captured at drag start. The pop-out index is computed against THIS, never
  // the live grid — so the placeholder can't feed back on its own reflow.
  const popSnapshot = useRef<{ boxes: Box[]; groupIndex: number } | null>(null);
  // Mirror of memberPopIndex, read synchronously on drop (state may lag).
  const memberPopIndexRef = useRef<number | null>(null);
  // Geometric insertion index for a whole-card (slot) drag: the position, in the
  // list WITHOUT the dragged card, where it will land. null = no reorder preview
  // (merge/dead-band, or not a slot drag). Drives the derived render + the drop.
  const [slotDropIndex, setSlotDropIndex] = useState<number | null>(null);
  const slotDropIndexRef = useRef<number | null>(null);
  // Frozen slot geometry for the reorder index (document coords), captured at
  // drag start with the dragged card's index + span + resting height.
  const slotSnapshot = useRef<{
    boxes: Box[];
    activeIndex: number;
    activeIsFull: boolean;
  } | null>(null);
  // Resting height (px) of the dragged card, for its placeholder — state (not a
  // ref) so it's read during render without tripping react-hooks/refs.
  const [slotDragHeight, setSlotDragHeight] = useState<number | undefined>(
    undefined,
  );
  // Document-coords pointer at drag start; + delta gives the live pointer used to
  // place a whole-card drag. A full card is too tall to key off its own lagging
  // centre, so we track where the cursor actually points. null on keyboard drags.
  const dragStartPointer = useRef<{ x: number; y: number } | null>(null);

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

  // A whole-card (slot) drag is active (vs a member-tile drag).
  const slotDragActive = dragActive && activeMemberParsed === null;

  // During a slot drag the grid renders in a DERIVED order — the dragged card
  // moved to its geometric insertion index — while the dragged card itself
  // renders as a dashed placeholder (its content rides the DragOverlay). CSS
  // grid flows the result (a full card always takes a whole row) and framer
  // `layout` animates the reflow. Nothing here reads the live grid, so the
  // placeholder can't feed back on its own reflow.
  const displaySlots =
    slotDragActive && slotDropIndex !== null && activeId
      ? moveSlotToIndex(api.layout, activeId, slotDropIndex).slots
      : api.layout.slots;

  const handleDragStart = ({ active, activatorEvent }: DragStartEvent) => {
    preDragLayout.current = api.layout;
    const id = String(active.id);
    setActiveId(id);
    setDragActive(true);
    const origin = parseMemberId(id);
    memberDragOrigin.current = origin;
    memberPopIndexRef.current = null;
    slotDropIndexRef.current = null;
    setSlotDropIndex(null);
    popSnapshot.current = null;
    slotSnapshot.current = null;
    const p = eventPointer(activatorEvent);
    dragStartPointer.current = p
      ? { x: p.x + window.scrollX, y: p.y + window.scrollY }
      : null;

    // Freeze the resting slot geometry (document coords, so it survives a
    // mid-drag scroll). Both the member pop-out and the slot reorder read ONLY
    // this snapshot — never the live grid — so the placeholder can't feed back.
    if (!gridRef.current) return;
    const sx = window.scrollX;
    const sy = window.scrollY;
    const boxes: Box[] = Array.from(gridRef.current.children).map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        left: rect.left + sx,
        top: rect.top + sy,
        right: rect.right + sx,
        bottom: rect.bottom + sy,
      };
    });
    if (origin) {
      popSnapshot.current = {
        boxes,
        groupIndex: api.layout.slots.findIndex((s) => s.id === origin.groupId),
      };
    } else {
      const activeIndex = api.layout.slots.findIndex((s) => s.id === id);
      const firstWidget = api.layout.slots[activeIndex]?.widgets[0];
      const box = boxes[activeIndex];
      slotSnapshot.current = {
        boxes,
        activeIndex,
        activeIsFull: firstWidget
          ? defMap.get(firstWidget)?.span === "full"
          : false,
      };
      setSlotDragHeight(box ? box.bottom - box.top : undefined);
    }
  };

  // The pop-out index is a PURE function of the dragged tile's centre against
  // the frozen snapshot (see popPlacement.ts). Reading the live grid here is
  // exactly what caused the flicker: inserting the placeholder reflows the
  // cards, re-measurement then moved `over`, which moved the placeholder — a
  // self-sustaining loop even with the pointer still. The snapshot cuts that
  // edge, so the index only changes when the pointer really crosses a slot
  // boundary. Computed in onDragMove (fires on movement) and mirrored to a ref
  // so the drop lands on exactly the previewed index.
  const handleDragMove = ({ active, over, delta }: DragMoveEvent) => {
    const r = active.rect.current.translated ?? active.rect.current.initial;
    if (!r) return;
    const x = r.left + r.width / 2 + window.scrollX;
    const y = r.top + r.height / 2 + window.scrollY;

    const origin = memberDragOrigin.current;
    if (origin) {
      const snap = popSnapshot.current;
      if (!snap) return;
      const groupBox = snap.boxes[snap.groupIndex];
      // Inside the group's resting area → keep it in the group (no placeholder).
      const next =
        groupBox && boxContains(groupBox, x, y)
          ? null
          : popInsertionIndex(snap.boxes, x, y);
      if (next !== memberPopIndexRef.current) {
        memberPopIndexRef.current = next;
        setMemberPopIndex(next);
      }
      return;
    }

    // --- Whole-card (slot) reorder: span-aware index vs the frozen snapshot,
    // keyed off the POINTER (start + delta) — a full card is too tall to place
    // by its own lagging centre. Falls back to the card centre for keyboard. ---
    const slotSnap = slotSnapshot.current;
    if (!slotSnap) return;
    const overId = over ? String(over.id) : null;
    // Merge mode → no reorder placeholder (the card stays, the target
    // highlights). Dead-band (over == null: inside a valid merge target but
    // off-centre) → freeze the reflow so the pointer can reach the centre.
    if (overId?.startsWith(MERGE_PREFIX)) {
      if (slotDropIndexRef.current !== null) {
        slotDropIndexRef.current = null;
        setSlotDropIndex(null);
      }
      return;
    }
    if (!overId) return;
    const start = dragStartPointer.current;
    const px = start ? start.x + delta.x : x;
    const py = start ? start.y + delta.y : y;
    const otherBoxes = slotSnap.boxes.filter(
      (_, i) => i !== slotSnap.activeIndex,
    );
    const next = slotInsertionIndex(otherBoxes, px, py, slotSnap.activeIsFull);
    if (next !== slotDropIndexRef.current) {
      slotDropIndexRef.current = next;
      setSlotDropIndex(next);
    }
  };

  const handleDragOver = ({ over }: DragOverEvent) => {
    if (memberDragOrigin.current) {
      // Member drags never merge; the pop-out placeholder is handled in
      // onDragMove so re-measurement can't drive a feedback loop here.
      setMergeTarget(null);
      return;
    }
    const overId = over ? String(over.id) : null;
    if (overId?.startsWith(MERGE_PREFIX)) {
      setMergeTarget(overId.slice(MERGE_PREFIX.length));
      // Merge mode wins over reorder: drop the placeholder immediately (even if
      // the pointer is momentarily still), so the two previews never co-exist.
      if (slotDropIndexRef.current !== null) {
        slotDropIndexRef.current = null;
        setSlotDropIndex(null);
      }
      return;
    }
    setMergeTarget(null);
  };

  /** Member released inside its own group: reorder onto a sibling, else move to the end. */
  const handleInGroupMemberDrop = (
    origin: { groupId: string; widgetId: string },
    over: Over | null,
  ) => {
    const { groupId: g, widgetId: w } = origin;
    const overMember = over ? parseMemberId(String(over.id)) : null;
    if (overMember && overMember.groupId === g) {
      // Dropped onto a sibling tile → reorder within the group.
      api.reorderMember(g, w, overMember.widgetId);
      return;
    }
    // Elsewhere inside the group → move to the end (no-op if already last).
    const group = api.layout.slots.find((s) => s.id === g);
    const last = group?.widgets[group.widgets.length - 1];
    if (last && last !== w) api.reorderMember(g, w, last);
    else api.persist();
  };

  const resetDragState = () => {
    setActiveId(null);
    setMergeTarget(null);
    setDragActive(false);
    setMemberPopIndex(null);
    memberPopIndexRef.current = null;
    popSnapshot.current = null;
    setSlotDropIndex(null);
    slotDropIndexRef.current = null;
    slotSnapshot.current = null;
    setSlotDragHeight(undefined);
    dragStartPointer.current = null;
    preDragLayout.current = null;
    memberDragOrigin.current = null;
  };

  const handleDragEnd = ({ over }: DragEndEvent) => {
    const origin = memberDragOrigin.current;
    if (origin) {
      const popIndex = memberPopIndexRef.current;
      if (popIndex !== null) {
        // Pop out to the previewed index — preview and drop share it, so the
        // card lands exactly where the dashed placeholder showed.
        api.popTo(origin.groupId, origin.widgetId, popIndex);
      } else {
        // Released inside the group → reorder among siblings / move to the end.
        handleInGroupMemberDrop(origin, over);
      }
    } else if (activeId && mergeTarget) {
      api.merge(activeId, mergeTarget);
    } else if (activeId && slotDropIndexRef.current !== null) {
      // Slot reorder → commit the previewed geometric index (preview == drop).
      api.reorderSlotToIndex(activeId, slotDropIndexRef.current);
    } else {
      api.persist();
    }
    resetDragState();
  };

  const handleDragCancel = () => {
    if (preDragLayout.current) api.restore(preDragLayout.current);
    resetDragState();
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
        items={displaySlots.map((s) => s.id)}
        strategy={rectSortingStrategy}
      >
        <LayoutGroup>
          <div ref={gridRef} className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            {displaySlots.map((slot, i) => (
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
                  placeholderHeight={slotDragHeight}
                  isMergeTarget={mergeTarget === slot.id}
                  onHide={api.hide}
                  onSetActive={api.setActive}
                />
              </Fragment>
            ))}
            {memberPopIndex === displaySlots.length && popPlaceholder}
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
