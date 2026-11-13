import React, { useState, useRef } from "react";
import { useClickAway } from "react-use";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useWalletContext } from "../../dashboard/wallet/WalletContext.tsx";
import { Selector } from "./Selector.tsx";
import { useUiVersion } from "../../hooks/useUiVersion";
import { toSentenceCase } from "../../utils/format";

export interface Tab {
  key: string;
  title: string;
  label: string;
}

interface SwitchableCardProps {
  tabs: Tab[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  title?: string;
  subtitle?: string;
  centerElement?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** If true, the card body uses no padding (e.g. for tables that need edge-to-edge layout) */
  noPadding?: boolean;
  /** Optional class or width for the tab selector (e.g., 'w-48') */
  selectorWidth?: string;
}

export const SwitchableCard: React.FC<SwitchableCardProps> = ({
  tabs,
  activeTab: controlledActiveTab,
  onTabChange,
  title,
  subtitle,
  centerElement,
  children,
  className = "",
  noPadding = false,
  selectorWidth = "",
}) => {
  const [internalTab, setInternalTab] = useState(tabs[0]?.key ?? "");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isMobile = useMediaQuery("(max-width: 639px)");
  const activeTab = controlledActiveTab ?? internalTab;

  const { wallet } = useWalletContext();
  const walletColor = wallet?.color || "var(--color-app-green)";
  const [ui] = useUiVersion();
  // ui-v2-switch: v2 keeps wallet colour off text; the active tab is marked by the raised fill.
  const isV2 = ui === "v2";
  const activeTextStyle = (key: string): React.CSSProperties | undefined =>
    isV2 ? undefined : { color: activeTab === key ? walletColor : "" };

  useClickAway(menuRef, () => setIsMenuOpen(false));

  const handleTabChange = (key: string) => {
    if (onTabChange) {
      onTabChange(key);
    } else {
      setInternalTab(key);
    }
    setIsMenuOpen(false);
  };

  return (
    <div
      className={`${
        isV2
          ? "bg-app-card rounded-[var(--r-card)] shadow-[var(--box-ring)]"
          : "bg-app-card/20 rounded-2xl border border-app-border"
      } overflow-hidden ${className}`.trim()}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 md:px-6 py-4 border-b border-app-border relative">
        {/* Left: Title + subtitle + center element — truncates if needed */}
        <div className="flex flex-row sm:items-center gap-2 min-w-0 flex-1">
          {(title || subtitle) && (
            <div className="flex flex-col min-w-0 relative" ref={menuRef}>
              {isMobile ? (
                <>
                  <button
                    onClick={() =>
                      tabs.length > 1 && setIsMenuOpen(!isMenuOpen)
                    }
                    className="flex items-center gap-2 text-left group transition-colors"
                    type="button"
                  >
                    <div className="flex flex-col min-w-0">
                      {title && (
                        <h3
                          className={
                            isV2
                              ? "font-display text-xl font-semibold text-app-text truncate transition-colors"
                              : "text-xl font-bold text-app-text uppercase tracking-wider truncate group-hover:text-app-text transition-colors"
                          }
                        >
                          {isV2 ? toSentenceCase(title) : title}
                        </h3>
                      )}
                    </div>
                    {tabs.length > 1 && (
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className={`text-app-muted text-sm transition-transform duration-300 ${isMenuOpen ? "rotate-180 text-app-text" : ""}`}
                      />
                    )}
                  </button>
                  {subtitle && (
                    <p className="text-app-muted text-xs mt-0.5 truncate">
                      {subtitle}
                    </p>
                  )}
                </>
              ) : (
                <div className="flex flex-col min-w-0">
                  {title && (
                    <h3
                      className={
                        isV2
                          ? "font-display text-xl font-semibold text-app-text truncate"
                          : "text-xl font-bold text-app-text uppercase tracking-wider truncate"
                      }
                    >
                      {isV2 ? toSentenceCase(title) : title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="text-app-muted text-xs mt-0.5 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
              )}

              {/* Mobile Dropdown Menu */}
              <AnimatePresence>
                {isMobile && isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`absolute top-full left-0 z-50 mt-2 w-48 overflow-hidden py-1 ${
                      isV2
                        ? "bg-app-card rounded-[var(--r-sm)] shadow-[0_8px_24px_rgb(0_0_0/0.25)]"
                        : "bg-app-card/95 backdrop-blur-xl border border-app-border rounded-xl shadow-2xl"
                    }`}
                  >
                    {tabs.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => handleTabChange(tab.key)}
                        className={`w-full text-left px-4 py-3 text-sm transition-all ${
                          activeTab === tab.key
                            ? isV2
                              ? "bg-app-raised font-semibold text-app-text"
                              : "bg-app-hover font-bold"
                            : isV2
                              ? "text-app-muted hover:text-app-text hover:bg-app-raised"
                              : "text-app-muted hover:text-app-text hover:bg-app-input"
                        }`}
                        style={activeTextStyle(tab.key)}
                      >
                        {tab.title}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Center element (e.g. year selector) */}
          {centerElement && (
            <div className="flex items-center flex-shrink-0 ml-auto sm:ml-0">
              {centerElement}
            </div>
          )}
        </div>

        {/* Toggle buttons — only on desktop, fixed width */}
        {tabs.length > 1 && !isMobile && (
          <Selector
            value={activeTab}
            onChange={handleTabChange}
            size="md"
            fullWidth={false}
            className={`flex-shrink-0 ${selectorWidth}`}
            options={tabs.map((tab) => ({
              value: tab.key,
              label: tab.label,
              style: activeTextStyle(tab.key),
            }))}
          />
        )}
      </div>

      {/* Body */}
      <div className={noPadding ? "" : "p-4"}>{children}</div>
    </div>
  );
};
