export type WidgetSpan = "half" | "full";

/** Minimal widget metadata the layout model needs (decoupled from React). */
export interface LayoutWidgetMeta {
  id: string;
  span: WidgetSpan;
  /** Ships hidden until the user enables it (e.g. the heatmap). */
  hiddenByDefault?: boolean;
}

export interface LayoutSlot {
  /** Stable dnd key — the widget id for standalone slots, `group-<n>` for groups. */
  id: string;
  /** Member widget ids; length 1 = standalone card, >1 = tabbed group. */
  widgets: string[];
  /** Which member tab is shown (groups only). */
  activeWidget?: string;
}

export interface TabLayout {
  /** Visible slots, in display order (grid auto-flow). */
  slots: LayoutSlot[];
  /** Hidden slots — groups survive hiding intact. */
  hiddenSlots: LayoutSlot[];
}
