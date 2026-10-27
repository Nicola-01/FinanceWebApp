import React, { useState } from "react";

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
  ...props
}) => {
  const [hover, setHover] = useState(false);
  return (
    <button
      type={type}
      {...props}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={
        hover
          ? {
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
