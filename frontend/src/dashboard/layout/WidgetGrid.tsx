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
import type { TabLayout } from "../../utils/tabLayout";
import type { TabLayoutApi } from "./useTabLayout.ts";
import type { WidgetDef } from "./widgetTypes.ts";
import { HiddenTray } from "./HiddenTray.tsx";
import { WidgetSlot } from "./WidgetSlot.tsx";
import {
  isSlotId,
  MERGE_PREFIX,
  mergeAwareCollision,
  parseMemberId,
} from "./mergeAwareCollision.ts";
import { boxContains, popInsertionIndex, type Box } from "./popPlacement.ts";

interface WidgetGridProps<Ctx> {
  defs: WidgetDef<Ctx>[];
  ctx: Ctx;
  editing: boolean;
  api: TabLayoutApi;
  /** Wallet colour — accents merge highlights and tray chips. */
  accentColor: string;
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
    const origin = parseMemberId(id);
    memberDragOrigin.current = origin;
    memberPopIndexRef.current = null;

    // Freeze the resting slot geometry for a member drag (document coords, so it
    // survives a mid-drag scroll). The pop-out index reads ONLY this snapshot.
    if (origin && gridRef.current) {
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
      popSnapshot.current = {
        boxes,
        groupIndex: api.layout.slots.findIndex((s) => s.id === origin.groupId),
      };
    } else {
      popSnapshot.current = null;
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
  const handleDragMove = ({ active }: DragMoveEvent) => {
    const origin = memberDragOrigin.current;
    const snap = popSnapshot.current;
    if (!origin || !snap) return;
    const r = active.rect.current.translated ?? active.rect.current.initial;
    if (!r) return;
    const x = r.left + r.width / 2 + window.scrollX;
    const y = r.top + r.height / 2 + window.scrollY;
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
        items={api.layout.slots.map((s) => s.id)}
        strategy={rectSortingStrategy}
      >
        <LayoutGroup>
          <div ref={gridRef} className="grid grid-cols-1 gap-8 xl:grid-cols-2">
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
