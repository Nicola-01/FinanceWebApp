import { useDroppable } from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { WidgetDef } from "./widgetTypes.ts";
import type { WidgetSpan } from "../../utils/tabLayout";
import { groupBodyId, memberId } from "./mergeAwareCollision.ts";

/** How much the live `bare` chart is scaled down to read as a faithful miniature. */
const MINI_SCALE = 0.5;

interface MemberTileProps<Ctx> {
  groupId: string;
  def: WidgetDef<Ctx>;
  ctx: Ctx;
}

/**
 * One draggable member of a group in edit mode: the widget icon + label plus a
 * CSS-scaled-down live `bare` mini chart. The tile is a uniform sortable, so the
 * sortable transform/transition drives a correct live reorder preview. Drag from
 * anywhere on the tile; the mini chart is `pointer-events-none` so it never
 * captures the drag.
 */
function MemberTile<Ctx>({ groupId, def, ctx }: MemberTileProps<Ctx>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: memberId(groupId, def.id) });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      {...attributes}
      {...listeners}
      className="flex cursor-grab select-none flex-col overflow-hidden rounded-xl border border-app-border bg-app-surface/40 active:cursor-grabbing"
    >
      <div className="flex items-center gap-2 px-2.5 pb-1 pt-2">
        <FontAwesomeIcon
          icon={def.icon}
          className="shrink-0 text-xs text-app-muted"
        />
        <span className="min-w-0 truncate text-xs font-bold text-app-text">
          {def.label}
        </span>
      </div>
      {/*
        Square, fluid chart area: it fills the column width and stays square, so
        every tile keeps the same proportion whatever the group's width. The live
        `bare` chart is CSS-scaled to fill it and cropped to the square.
      */}
      <div className="relative aspect-square w-full overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 origin-top-left"
          style={{
            transform: `scale(${MINI_SCALE})`,
            width: `${100 / MINI_SCALE}%`,
            height: `${100 / MINI_SCALE}%`,
          }}
        >
          {def.render(ctx, true)}
        </div>
      </div>
    </div>
  );
}

interface GroupEditGridProps<Ctx> {
  groupId: string;
  members: WidgetDef<Ctx>[];
  ctx: Ctx;
  /** Group span drives the tile column count. */
  span: WidgetSpan;
}

/**
 * Group edit-mode body: the group's members rendered as sortable mini-tiles
 * inside a `groupbody:<groupId>` droppable and a nested SortableContext. Dragging
 * a tile reorders it within the group (this nested context previews it) or pops
 * it out to a standalone card — WidgetGrid orchestrates the drop against the
 * shared DndContext. Columns adapt to the span: 2 per row for a half-span group,
 * up to 4 for a full-span group.
 */
export function GroupEditGrid<Ctx>({
  groupId,
  members,
  ctx,
  span,
}: GroupEditGridProps<Ctx>) {
  const { setNodeRef } = useDroppable({ id: groupBodyId(groupId) });
  const memberIds = members.map((m) => memberId(groupId, m.id));
  const cols =
    span === "full"
      ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
      : "grid-cols-2";

  return (
    <div ref={setNodeRef} className="h-full">
      <SortableContext items={memberIds} strategy={rectSortingStrategy}>
        <div className={`grid ${cols} gap-2`}>
          {members.map((m) => (
            <MemberTile key={m.id} groupId={groupId} def={m} ctx={ctx} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
