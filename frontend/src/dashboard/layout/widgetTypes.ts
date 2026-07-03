import type React from "react";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import type { LayoutWidgetMeta } from "../../utils/tabLayout";

/**
 * One widget a customizable tab can display. `render` receives the tab's data
 * context plus `bare`: true when the widget is shown inside a group's
 * SwitchableCard, which provides the card chrome and title itself.
 */
export interface WidgetDef<Ctx> extends LayoutWidgetMeta {
  /** Full title — group-card header and accessibility labels. */
  title: string;
  /** One-line description shown under the title in a group-card header. */
  subtitle: string;
  /** Short label for group tabs and hidden-tray chips. */
  label: string;
  icon: IconDefinition;
  render: (ctx: Ctx, bare: boolean) => React.ReactNode;
}
