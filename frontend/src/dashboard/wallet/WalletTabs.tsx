import React, { useState } from "react";
import type { TabType } from "./walletTabs";
import { useWalletContext } from "./WalletContext.tsx";
import { useUiVersion } from "../../hooks/useUiVersion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBullseye,
  faCalendarDays,
  faChartLine,
  faChartPie,
  faEllipsis,
  faGear,
  faReceipt,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Menu, MenuItem } from "@mui/material";
import {
  BottomNavigation,
  BottomNavigationItem,
  BottomNavigationItemIcon,
  BottomNavigationItemLabel,
  BottomNavigationList,
} from "@/components/shadcn/bottom-navigation";
import {
  MotionHighlight,
  MotionHighlightItem,
} from "@/components/shadcn/motion-highlight";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

const bottomItemClass =
  "text-app-muted hover:text-app-text aria-selected:text-app-text aria-selected:[&_svg]:text-wallet";

export const WalletTabs: React.FC = () => {
  const { activeTab, setActiveTab, wallet } = useWalletContext();
  const walletColor = wallet.color;
  const [ui] = useUiVersion();
  const [moreAnchor, setMoreAnchor] = useState<HTMLElement | null>(null);

  const tabs: { id: TabType; label: string; icon: IconDefinition }[] = [
    { id: "transactions", label: "Transactions", icon: faReceipt },
    { id: "subscription", label: "Subscriptions", icon: faCalendarDays },
    { id: "category", label: "Categories", icon: faChartPie },
    { id: "statistics", label: "Statistics", icon: faChartLine },
    { id: "budget", label: "Budget", icon: faBullseye },
    { id: "settings", label: "Settings", icon: faGear },
  ];

  const getTabClass = (tabId: TabType) => {
    const isActive = activeTab === tabId;
    return `relative flex-1 flex items-center justify-center gap-2 whitespace-nowrap min-w-max px-2 md:px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
      isActive ? "text-app-text" : "text-app-muted hover:text-app-text"
    }`;
  };

  // ui-v2-switch
  if (ui === "v2") {
    // Phone bottom bar shows these four; Statistics and Settings live under "More".
    const bottomIds: TabType[] = [
      "transactions",
      "subscription",
      "category",
      "budget",
    ];
    const bottomTabs = tabs.filter((t) => bottomIds.includes(t.id));
    const moreTabs = tabs.filter((t) => !bottomIds.includes(t.id));
    const bottomValue = bottomIds.includes(activeTab as TabType)
      ? activeTab
      : "more";

    return (
      <>
        <div className="hidden md:block mb-6">
          <SegmentedControl
            size="lg"
            fullWidth
            aria-label="Wallet sections"
            value={activeTab}
            onChange={setActiveTab}
            options={tabs.map((t) => ({
              value: t.id,
              label: t.label,
              icon: <FontAwesomeIcon icon={t.icon} />,
            }))}
          />
        </div>

        <BottomNavigation
          value={bottomValue}
          onValueChange={({ value }) => {
            if (value !== "more") setActiveTab(value as TabType);
          }}
          className="md:hidden min-h-0"
        >
          <BottomNavigationList
            aria-label="Wallet sections"
            className="z-[1100] min-h-16 bg-app-card/90 backdrop-blur-md border-app-border shadow-[var(--box-ring)]"
          >
            {/* Inside the list: the highlight must paint above the list's background. */}
            <MotionHighlight
              value={bottomValue}
              highlightClassName="rounded-[var(--r-input)] bg-app-raised"
              className="flex w-full items-stretch justify-around px-2 py-1.5"
            >
              {bottomTabs.map((t) => (
                <MotionHighlightItem key={t.id} value={t.id} asChild>
                  <BottomNavigationItem
                    value={t.id}
                    className={bottomItemClass}
                  >
                    <BottomNavigationItemIcon>
                      <FontAwesomeIcon icon={t.icon} />
                    </BottomNavigationItemIcon>
                    <BottomNavigationItemLabel className="text-[11px]">
                      {t.label}
                    </BottomNavigationItemLabel>
                  </BottomNavigationItem>
                </MotionHighlightItem>
              ))}
              {/* onClick goes on the item, not the child: asChild clones the item's handlers over the child's. */}
              <MotionHighlightItem
                value="more"
                asChild
                onClick={(e) => setMoreAnchor(e.currentTarget)}
              >
                <BottomNavigationItem value="more" className={bottomItemClass}>
                  <BottomNavigationItemIcon>
                    <FontAwesomeIcon icon={faEllipsis} />
                  </BottomNavigationItemIcon>
                  <BottomNavigationItemLabel className="text-[11px]">
                    More
                  </BottomNavigationItemLabel>
                </BottomNavigationItem>
              </MotionHighlightItem>
            </MotionHighlight>
          </BottomNavigationList>
        </BottomNavigation>

        <Menu
          anchorEl={moreAnchor}
          open={Boolean(moreAnchor)}
          onClose={() => setMoreAnchor(null)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "bottom", horizontal: "right" }}
          // Above the dock (z-1100), with a gap and a raised, bordered surface:
          // --box-ring is transparent in dark, so the card colour alone vanished.
          sx={{ zIndex: 1150 }}
          slotProps={{
            paper: {
              sx: {
                mt: -1,
                minWidth: 200,
                bgcolor: "rgb(var(--bg-raised))",
                color: "rgb(var(--text-primary))",
                border: "1px solid rgb(var(--border-primary))",
                borderRadius: "var(--r-card)",
                boxShadow: "0 16px 40px -12px rgb(0 0 0 / 0.5)",
                backgroundImage: "none",
              },
            },
            list: { sx: { p: 0.75 } },
          }}
        >
          {moreTabs.map((t) => (
            <MenuItem
              key={t.id}
              selected={activeTab === t.id}
              onClick={() => {
                setActiveTab(t.id);
                setMoreAnchor(null);
              }}
              sx={{
                gap: 1.5,
                minHeight: 44,
                borderRadius: "var(--r-input)",
                fontFamily: "var(--font-sans)",
                fontSize: 15,
                fontWeight: 500,
                "& svg": { width: 18, color: "rgb(var(--text-muted))" },
                "&:hover, &.Mui-selected, &.Mui-selected:hover": {
                  bgcolor: "rgb(var(--bg-card))",
                },
                "&.Mui-selected svg": { color: "var(--wallet)" },
              }}
            >
              <FontAwesomeIcon icon={t.icon} />
              {t.label}
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  }

  return (
    <div className="flex shrink-0 w-full items-center gap-2 border-b border-app-border mb-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] sticky top-0 z-90 bg-app-bg/0 backdrop-blur-xl px-4 lg:px-8 pt-4 pb-0">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={getTabClass(tab.id)}
          style={{ color: activeTab === tab.id ? walletColor : "" }}
        >
          <FontAwesomeIcon
            icon={tab.icon}
            className={`text-lg ${activeTab === tab.id ? "" : "opacity-60 group-hover:opacity-100"}`}
          />

          {tab.label}

          {activeTab === tab.id && (
            <span
              className="absolute -bottom-px left-0 w-full h-0.5 transition-all duration-300"
              style={{
                backgroundColor: walletColor,
              }}
            />
          )}
        </button>
      ))}
    </div>
  );
};
