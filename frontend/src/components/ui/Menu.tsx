import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

/**
 * Anchored dropdown menu primitive — the shared "click-outside popover" pattern
 * previously hand-rolled in `AppHeader` and `WalletMenu`.
 *
 * Compound API:
 *   <Menu align="right" width={192}>
 *     <Menu.Trigger>
 *       {({ open, toggle }) => <button onClick={toggle} aria-expanded={open}>…</button>}
 *     </Menu.Trigger>
 *     <Menu.Content>
 *       <Menu.Item icon={faPen} onClick={…}>Edit</Menu.Item>
 *       <Menu.Divider />
 *       <Menu.Item icon={faTrash} tone="danger" onClick={…}>Delete</Menu.Item>
 *     </Menu.Content>
 *   </Menu>
 *
 * Closes on outside-click (mousedown), Escape, and — for `Menu.Item` — after the click
 * (unless `closeOnClick={false}`). `Menu.Content` also accepts arbitrary children (headers,
 * nested controls) alongside items; use the `close` from context to dismiss from custom UI.
 */

interface MenuContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  close: () => void;
  align: "left" | "right";
  width: number;
}

const MenuContext = createContext<MenuContextValue | null>(null);

const useMenu = (): MenuContextValue => {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("Menu.* must be used within <Menu>");
  return ctx;
};

export interface MenuProps {
  /** Which edge of the trigger the panel aligns to. Default `right`. */
  align?: "left" | "right";
  /** Panel width in px. Default 208. */
  width?: number;
  className?: string;
  children: React.ReactNode;
}

const MenuRoot: React.FC<MenuProps> = ({
  align = "right",
  width = 208,
  className,
  children,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <MenuContext.Provider value={{ open, setOpen, close, align, width }}>
      <div ref={ref} className={`relative ${className ?? ""}`}>
        {children}
      </div>
    </MenuContext.Provider>
  );
};

export interface MenuTriggerProps {
  children: (state: { open: boolean; toggle: () => void }) => React.ReactNode;
}

const MenuTrigger: React.FC<MenuTriggerProps> = ({ children }) => {
  const { open, setOpen } = useMenu();
  return <>{children({ open, toggle: () => setOpen(!open) })}</>;
};

export interface MenuContentProps {
  children: React.ReactNode;
  className?: string;
}

const MenuContent: React.FC<MenuContentProps> = ({ children, className }) => {
  const { open, align, width } = useMenu();
  if (!open) return null;
  return (
    <div
      role="menu"
      className={`absolute top-full z-50 mt-2 rounded-xl border border-app-border bg-app-card p-2 shadow-2xl animate-[fadeIn_0.1s_ease-out] ${
        align === "right" ? "right-0" : "left-0"
      } ${className ?? ""}`}
      style={{ width }}
    >
      {children}
    </div>
  );
};

type MenuItemTone = "default" | "danger" | "warning" | "success";

const TONE_CLASSES: Record<MenuItemTone, string> = {
  default: "text-app-muted hover:bg-app-input hover:text-app-text",
  danger: "text-app-red/70 hover:bg-app-red/20 hover:text-app-red",
  warning: "text-app-muted hover:bg-app-yellow/15 hover:text-app-yellow",
  success: "text-app-green hover:bg-app-input",
};

export interface MenuItemProps {
  icon?: IconDefinition;
  /** Extra classes on the icon (e.g. `animate-spin text-app-green`). */
  iconClassName?: string;
  tone?: MenuItemTone;
  onClick?: () => void;
  disabled?: boolean;
  /** Dismiss the menu after the click. Default true. */
  closeOnClick?: boolean;
  /** Right-aligned slot (e.g. a count badge). */
  trailing?: React.ReactNode;
  className?: string;
  title?: string;
  children: React.ReactNode;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  iconClassName,
  tone = "default",
  onClick,
  disabled,
  closeOnClick = true,
  trailing,
  className,
  title,
  children,
}) => {
  const { close } = useMenu();
  return (
    <button
      type="button"
      role="menuitem"
      title={title}
      disabled={disabled}
      onClick={() => {
        onClick?.();
        if (closeOnClick) close();
      }}
      className={`flex w-full items-center gap-3 rounded-lg p-2.5 text-left text-sm font-semibold transition-colors disabled:opacity-50 ${TONE_CLASSES[tone]} ${className ?? ""}`}
    >
      {icon && (
        <FontAwesomeIcon icon={icon} className={`w-4 ${iconClassName ?? ""}`} />
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing}
    </button>
  );
};

const MenuDivider: React.FC = () => (
  <div role="separator" className="my-1 h-px w-full bg-app-border" />
);

export const Menu = Object.assign(MenuRoot, {
  Trigger: MenuTrigger,
  Content: MenuContent,
  Item: MenuItem,
  Divider: MenuDivider,
});
