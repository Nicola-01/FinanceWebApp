import { Fragment, useMemo } from "react";
import { DndContext, DragOverlay, MeasuringStrategy } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { LayoutGroup } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { TabLayoutApi } from "./useTabLayout.ts";
import type { WidgetDef } from "./widgetTypes.ts";
import { HiddenTray } from "./HiddenTray.tsx";
import { WidgetSlot } from "./WidgetSlot.tsx";
import { mergeAwareCollision } from "./mergeAwareCollision.ts";
import { useWidgetGridDnd } from "./useWidgetGridDnd.ts";

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
  const {
    sensors,
    gridRef,
    activeId,
    mergeTarget,
    memberPopIndex,
    slotDragHeight,
    displaySlots,
    activeSpan,
    activeMembers,
    activeMemberDef,
    handlers,
  } = useWidgetGridDnd(api, defMap);

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
      {...handlers}
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
