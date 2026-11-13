import React, { type ReactNode } from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Card } from "../../components/ui/Card.tsx";
import { useUiVersion } from "../../hooks/useUiVersion.ts";

interface SettingsBoxProps {
  title: string;
  /** One muted line under the title (v1 subtitle). */
  description?: string;
  /** v1 header icon; v2 boxes are icon-less. */
  icon?: IconDefinition;
  iconColor?: string;
  tone?: "default" | "danger";
  footer?: ReactNode;
  footerAlign?: "start" | "center" | "end";
  children?: ReactNode;
}

const JUSTIFY = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
} as const;

/**
 * One settings surface. v1 delegates to {@link Card} unchanged; v2 renders a
 * flat box with a display-face h3 and a muted description.
 */
export const SettingsBox: React.FC<SettingsBoxProps> = ({
  title,
  description,
  icon,
  iconColor,
  tone = "default",
  footer,
  footerAlign = "end",
  children,
}) => {
  const [ui] = useUiVersion();
  // ui-v2-switch
  if (ui !== "v2") {
    return (
      <Card
        tone={tone}
        title={title}
        subtitle={description}
        icon={icon}
        iconColor={iconColor}
        footer={footer}
        footerAlign={footerAlign}
      >
        {children}
      </Card>
    );
  }

  return (
    <section className="relative flex flex-col gap-4 rounded-[var(--r-card)] bg-app-card p-5 shadow-[var(--box-ring)] sm:p-6">
      <div className="flex flex-col gap-1">
        <h3
          className={`font-display text-[17px] font-semibold tracking-[-0.02em] ${
            tone === "danger" ? "text-app-danger" : "text-app-text"
          }`}
        >
          {title}
        </h3>
        {description && (
          <p className="text-[13px] text-app-muted">{description}</p>
        )}
      </div>
      {children && <div>{children}</div>}
      {footer && <div className={`flex ${JUSTIFY[footerAlign]}`}>{footer}</div>}
    </section>
  );
};

export default SettingsBox;
