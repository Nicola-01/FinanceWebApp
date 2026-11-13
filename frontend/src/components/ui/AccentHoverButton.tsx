import React, { useState } from "react";
import { useUiVersion } from "../../hooks/useUiVersion";

interface AccentHoverButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "style" | "onMouseEnter" | "onMouseLeave"
> {
  /** Dynamic (per-wallet) accent applied on hover. */
  accentColor: string;
  /** Extra inline style merged into the hover tint (e.g. a text colour). */
  hoverStyle?: React.CSSProperties;
  /** Content; may be a function of the hover state for hover-tinted children. */
  children: React.ReactNode | ((hover: boolean) => React.ReactNode);
}

/**
 * Button whose hover tint (border + 8%-alpha background) is a dynamic accent
 * colour. The colour is per wallet, so hover is tracked in JS and applied via
 * inline styles rather than static Tailwind hover classes.
 */
export const AccentHoverButton: React.FC<AccentHoverButtonProps> = ({
  accentColor,
  hoverStyle,
  children,
  type = "button",
  className,
  ...props
}) => {
  const [hover, setHover] = useState(false);
  const [ui] = useUiVersion();
  const isV2 = ui === "v2";
  return (
    <button
      type={type}
      {...props}
      className={isV2 ? `hover:bg-app-raised ${className ?? ""}` : className}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      // ui-v2-switch: no wallet-coloured border/tint on hover; the raised fill does it.
      style={
        hover
          ? isV2
            ? hoverStyle
            : {
                borderColor: accentColor,
                backgroundColor: `${accentColor}14`,
                ...hoverStyle,
              }
          : undefined
      }
    >
      {typeof children === "function" ? children(hover) : children}
    </button>
  );
};
