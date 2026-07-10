# Categories Widget-Grid v2 — Group mini-tiles, internal reorder, merge-hitbox bug

Frontend-only. Run all npm/npx from `frontend/`. English-only copy/comments. `app-*` colour
tokens only. Reuse shared `ui/` primitives. NEVER kill the Vite dev server on :5173. NEVER
`git commit`/`git add`. Gate per task: `npx eslint --fix <files> && npx tsc -b && npx vitest run`.

Feature files (current, committed): `src/dashboard/layout/{WidgetGrid,WidgetSlot,HiddenTray,
mergeAwareCollision,useTabLayout,widgetTypes}.tsx?`, `src/dashboard/tag/categoriesWidgets.tsx`,
`src/utils/tabLayout.ts`; tests in `src/__tests__/utils/tabLayout.test.ts` and
`src/__tests__/dashboard/layout/WidgetGrid.test.tsx`.

## Locked behaviour (from grilling)

- **Bug:** the merge/group drop-hitbox must follow a slot to its NEW position the instant a
  live reorder swap happens mid-drag. Fix by **suspending slot position-animation while a drag
  is active** (reorders snap; framer `layout` animation still plays for hide/show/group/reset
  when no drag is active). The user accepts snap-during-drag.
- **Group edit mode:** replace the group's big tabbed chart with a grid of **live mini-chart
  tiles** (the existing `bare` render, CSS-scaled down, plus the widget icon+label). Adaptive
  columns: 2 per row in a half-span group, more in a full-span group; wrap to rows. **Remove
  the old label+× chip block.** Non-edit groups and standalone cards are visually unchanged.
- **Drag a tile OUT of the group → grid:** pop the widget to a standalone card **at the drop
  position** among the grid slots (append if dropped in empty space). A 2-member group
  dissolves when one is popped. Best-effort framer enlargement animation.
- **Drag a tile WITHIN the group:** reorder `slot.widgets` → reorders the SwitchableCard tabs.
  `activeWidget` preserved (unless the active member is popped out → falls to first remaining).
- **Whole-group drag:** from the ⠿ handle only. **Tiles:** drag from anywhere on the tile.

---

## Task 1 — Bug fix: suspend slot animation during drag

Files: `WidgetGrid.tsx`, `WidgetSlot.tsx`.

- `WidgetGrid`: add `const [dragActive, setDragActive] = useState(false);`. Set `true` in
  `handleDragStart`, `false` in both `handleDragEnd` and `handleDragCancel`. Pass
  `suspendLayout={dragActive}` to every `<WidgetSlot>`.
- `WidgetSlot`: add prop `suspendLayout?: boolean`. Change `<motion.div layout ...>` to
  `<motion.div layout={!suspendLayout} ...>`. Nothing else changes.

Why it works: with no framer transform mid-drag, the reordered slot's real DOM rect is correct
immediately, and `MeasuringStrategy.Always` re-measures the `merge:<slotId>` droppable at the
new position — so the hitbox tracks the swap. Manual-verify on :5173 (jsdom can't test drag
geometry); no new unit test required. Keep the existing WidgetGrid tests green.

---

## Task 2 — tabLayout mutations (TDD) + useTabLayout API

Files: `src/utils/tabLayout.ts`, `src/__tests__/utils/tabLayout.test.ts`, `useTabLayout.ts`.

Add two PURE mutations (same no-op-returns-same-reference convention as the existing ones):

```ts
/** Reorder a member within a group (Feature 3). No-op for standalone slots or unknown ids. */
export function reorderMember(
  layout: TabLayout, slotId: string, fromWidgetId: string, toWidgetId: string,
): TabLayout {
  const gi = layout.slots.findIndex((s) => s.id === slotId);
  const slot = layout.slots[gi];
  if (!slot || slot.widgets.length < 2 || fromWidgetId === toWidgetId) return layout;
  const from = slot.widgets.indexOf(fromWidgetId);
  const to = slot.widgets.indexOf(toWidgetId);
  if (from === -1 || to === -1) return layout;
  const widgets = [...slot.widgets];
  const [m] = widgets.splice(from, 1);
  widgets.splice(to, 0, m);
  const slots = [...layout.slots];
  slots[gi] = { ...slot, widgets };
  return { ...layout, slots };
}

/**
 * Pop a member out of a group into a standalone slot inserted at grid index `atIndex`
 * (Feature 2 drop-at-position). A 2-member group dissolves; activeWidget heals if the
 * popped member was active. No-op for standalone slots or a missing member.
 */
export function popWidgetTo(
  layout: TabLayout, slotId: string, widgetId: string, atIndex: number,
): TabLayout {
  const gi = layout.slots.findIndex((s) => s.id === slotId);
  const slot = layout.slots[gi];
  if (!slot || slot.widgets.length < 2 || !slot.widgets.includes(widgetId)) return layout;
  const remaining = slot.widgets.filter((w) => w !== widgetId);
  if (remaining.length === 0) return layout; // defensive
  const reduced: LayoutSlot =
    remaining.length === 1
      ? { id: remaining[0], widgets: remaining }
      : {
          id: slot.id,
          widgets: remaining,
          activeWidget:
            slot.activeWidget === widgetId ? remaining[0] : slot.activeWidget,
        };
  const slots = [...layout.slots];
  slots[gi] = reduced;
  const idx = Math.max(0, Math.min(atIndex, slots.length));
  slots.splice(idx, 0, { id: widgetId, widgets: [widgetId] });
  return { ...layout, slots };
}
```

Tests (add to the existing describe blocks, mirror existing style):
- `reorderMember`: moves a member (e.g. group `[a,b,c]`, reorder a→c index ⇒ `[b,c,a]` or the
  arrayMove result — assert exact order); preserves `activeWidget`; no-op on standalone; no-op
  when `from`/`to` not members; no-op when `from===to`.
- `popWidgetTo`: from group `[a,b,c]` at a valid index → group `[a,c]`-style reduced in place +
  freed `b` standalone at that index; 2-member group `[a,b]` → both become standalone (dissolve),
  freed at index; `activeWidget` heals when the popped member was active; `atIndex` clamps; no-op
  on standalone or missing member.

`useTabLayout.ts`: extend `TabLayoutApi` and the returned object:
```ts
reorderMember: (slotId: string, fromWidgetId: string, toWidgetId: string) => void;
popTo: (slotId: string, widgetId: string, atIndex: number) => void;
```
implemented as `commit(reorderMember(layout, ...))` / `commit(popWidgetTo(layout, ...))`, and
import the two new functions. Keep existing `pop` (used by keyboard/fallback).

---

## Task 3 — GroupEditGrid mini-tiles + shared DnD (depends on 1 & 2)

New file `src/dashboard/layout/GroupEditGrid.tsx`; edits to `WidgetSlot.tsx`, `WidgetGrid.tsx`,
`mergeAwareCollision.ts`.

### DnD id scheme (one shared DndContext)
- Slot ids: `slot.id` (unchanged, top-level SortableContext, rectSortingStrategy).
- Member tile ids: **`member:<groupId>:<widgetId>`** (parse with `id.split(":")` →
  `["member", groupId, widgetId]`; groupId is `group-N`, widgetId has no colon).
- Group body droppable id: **`groupbody:<groupId>`** (marks "pointer still inside this group").
- Merge zone ids: `merge:<slotId>` (unchanged).

### GroupEditGrid.tsx
Renders a group's members as sortable mini-tiles. Wrap in `useDroppable({ id: 'groupbody:'+groupId })`
and a nested `<SortableContext items={memberIds} strategy={rectSortingStrategy}>`.
- Container: adaptive grid — `grid grid-cols-2 gap-2` for a half-span group,
  `grid-cols-2 sm:grid-cols-3 xl:grid-cols-4` for a full-span group (pass the span in).
- Each tile = `MemberTile`: `useSortable({ id: 'member:'+groupId+':'+widgetId })`. **Apply the
  sortable transform/transition here** (uniform tiles → strategy math is correct, unlike slots).
  The tile shows the widget icon+label header and the mini chart below:
  - mini chart = `def.render(ctx, true)` inside a fixed-height box (`h-28` ish),
    `overflow-hidden pointer-events-none`, wrapped so it is CSS-scaled down
    (`transform: scale(...)`, `transform-origin: top left`, width `1/scale * 100%`) to read as a
    faithful miniature. `pointer-events-none` so the chart never captures the drag.
  - the whole tile carries the sortable `attributes`+`listeners` (drag from anywhere), `cursor-grab`.
  - subtle border; `opacity-40` while that tile `isDragging`.
- Best-effort enlargement: give the tile's inner card `layoutId={widgetId}` and the standalone
  card the same, inside the existing `<LayoutGroup>`, so a pop-out morphs. If a case looks janky,
  fall back to a plain fade/scale-in — do not block the feature on pixel-perfect morphing.

### WidgetSlot.tsx
- When `editing && isGroup` → render `<GroupEditGrid .../>` **instead of** the `SwitchableCard`,
  inside the same card chrome (keep a header row with the group title + the ⠿ handle + hide
  button). **Remove the old bottom label+× chip block entirely.**
- The ⠿ handle stays the whole-group drag activator (already `setActivatorNodeRef`+`attributes`).
  The full-card `listeners` overlay must NOT cover the tiles: in group edit mode, restrict the
  group's pointer-drag to the handle only (don't spread `listeners` over the tile area), so tiles
  get their own drag. (Standalone cards keep the current full-card overlay drag.)
- Non-edit groups: unchanged (SwitchableCard + big chart + tabs).

### WidgetGrid.tsx — drag orchestration
- `activeId` may now be a slot id or `member:*`. Derive `activeKind`.
- Keep slot-drag behaviour exactly as today (merge-aware, live reorder, snap via Task 1).
- Member drag:
  - `onDragStart`: record origin `{ groupId, widgetId }` from the id.
  - Within-group reorder uses the nested SortableContext's own transforms for live preview; apply
    the model change on drop.
  - `onDragEnd` for a `member:<g>:<w>` active id, by `over`:
    - `over.id === 'member:'+g+':'+w2'` (same group g) → `api.reorderMember(g, w, w2)`.
    - `over.id === 'groupbody:'+g` (same group) → reorder to end (reorderMember to last member) or no-op.
    - otherwise (over a slot id, a foreign member/body, or null) → **pop out**:
      compute `atIndex` = index of the over slot in `api.layout.slots` (+1 if the pointer is past
      that slot's centre; append length if `over` is null), then `api.popTo(g, w, atIndex)`.
  - A member is NOT chain-merged into another group; dropping outside its group always pops to a
    standalone slot at the target position.

### mergeAwareCollision.ts — branch on active id
Add member handling (keep the existing slot logic untouched for slot drags):
- If `active.id` starts with `member:` (parse its group `g`):
  - `zones = pointerWithin` filtered to `member:<g>:*` tiles → return them (reorder among siblings).
  - else if pointer within `groupbody:<g>` → return that groupbody.
  - else → `closestCenter` over SLOT ids only (the pop-out target). Never return merge zones for a
    member drag.
- Slot drags: unchanged (current merge-vs-reorder logic).

### Tests
Extend `WidgetGrid.test.tsx` (dummy registry, no MUI): with a stored 3-member group in edit mode,
assert the mini-tiles render (one per member, each with its label), and — since jsdom can't do
pointer geometry — cover the model via `reorderMember`/`popWidgetTo` unit tests (Task 2). Add at
least: edit-mode group renders N tiles and NO ×-chip buttons; non-edit group still renders the
SwitchableCard. Keep all existing tests green.

Manual (user, on :5173): drag a tile within a group reorders tabs; drag a tile out drops it as a
standalone card at the release position; 2-member group dissolves on pop; whole-group drag only
from the handle; the merge-hitbox bug is gone.
