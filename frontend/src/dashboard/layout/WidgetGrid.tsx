import { useMemo, useRef, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { LayoutGroup } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { TabLayout } from "../../utils/tabLayout";
import type { TabLayoutApi } from "./useTabLayout.ts";
import type { WidgetDef } from "./widgetTypes.ts";
import { HiddenTray } from "./HiddenTray.tsx";
import { WidgetSlot } from "./WidgetSlot.tsx";

const MERGE_PREFIX = "merge:";

/**
 * Merge zones win when the pointer is inside one (drop-on-center = group);
 * otherwise fall back to closest-center among the real slots (reorder).
 * Only valid targets render a merge zone, so span rules are enforced by
 * construction.
 */
const mergeAwareCollision: CollisionDetection = (args) => {
  const zones = pointerWithin(args).filter((c) =>
    String(c.id).startsWith(MERGE_PREFIX),
  );
  if (zones.length > 0) return zones;
  return closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter(
      (c) => !String(c.id).startsWith(MERGE_PREFIX),
    ),
  });
};

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
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [mergeTarget, setMergeTarget] = useState<string | null>(null);
  const preDragLayout = useRef<TabLayout | null>(null);

  const activeSlot = activeId
    ? (api.layout.slots.find((s) => s.id === activeId) ?? null)
    : null;
  const activeMembers = activeSlot
    ? activeSlot.widgets
        .map((id) => defMap.get(id))
        .filter((d): d is WidgetDef<Ctx> => d !== undefined)
    : [];
  const activeSpan = activeMembers[0]?.span ?? null;

  const handleDragStart = ({ active }: DragStartEvent) => {
    preDragLayout.current = api.layout;
    setActiveId(String(active.id));
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
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
    if (overId !== String(active.id)) api.move(String(active.id), overId);
  };

  const handleDragEnd = () => {
    if (activeId && mergeTarget) api.merge(activeId, mergeTarget);
    else api.persist();
    setActiveId(null);
    setMergeTarget(null);
    preDragLayout.current = null;
  };

  const handleDragCancel = () => {
    if (preDragLayout.current) api.restore(preDragLayout.current);
    setActiveId(null);
    setMergeTarget(null);
    preDragLayout.current = null;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={mergeAwareCollision}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
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
            {api.layout.slots.map((slot) => (
              <WidgetSlot
                key={slot.id}
                slot={slot}
                defs={defMap}
                ctx={ctx}
                editing={editing}
                accentColor={accentColor}
                activeSpan={activeSpan}
                activeId={activeId}
                isMergeTarget={mergeTarget === slot.id}
                onHide={api.hide}
                onPop={api.pop}
                onSetActive={api.setActive}
              />
            ))}
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
        {activeMembers.length > 0 && (
          <div className="flex h-full w-full items-center justify-center gap-2.5 rounded-2xl border border-app-border bg-app-card/80 shadow-2xl backdrop-blur-sm">
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
        )}
      </DragOverlay>
    </DndContext>
  );
}
