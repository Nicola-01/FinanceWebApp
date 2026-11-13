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
import {
  BottomNavigation,
  BottomNavigationAction,
  Menu,
  MenuItem,
  Paper,
} from "@mui/material";
import { Selector } from "../../components/ui/Selector";

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

    const v2ActionSx = {
      color: "var(--color-app-muted)",
      minWidth: 0,
      fontFamily: "var(--font-sans)",
      "& .MuiBottomNavigationAction-label": { fontSize: 11 },
      "&.Mui-selected": { color: "var(--color-app-text)" },
      "&.Mui-selected svg": { color: "var(--wallet)" },
    };

    return (
      <>
        <div className="hidden lg:block mb-6">
          <Selector
            size="lg"
            fullWidth={false}
            value={activeTab}
            onChange={setActiveTab}
            options={tabs.map((t) => ({
              value: t.id,
              label: t.label,
              icon: <FontAwesomeIcon icon={t.icon} />,
            }))}
          />
        </div>

        <Paper
          elevation={0}
          sx={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1100,
            bgcolor: "var(--color-app-card)",
            boxShadow: "var(--box-ring)",
            borderTop: "1px solid var(--color-app-border)",
            borderRadius: 0,
            pb: "env(safe-area-inset-bottom)",
          }}
          className="lg:hidden"
        >
          <BottomNavigation
            showLabels
            value={bottomValue}
            onChange={(_, value: string) => {
              if (value !== "more") setActiveTab(value as TabType);
            }}
            sx={{ bgcolor: "transparent", height: 64 }}
          >
            {bottomTabs.map((t) => (
              <BottomNavigationAction
                key={t.id}
                value={t.id}
                label={t.label}
                icon={<FontAwesomeIcon icon={t.icon} />}
                sx={v2ActionSx}
              />
            ))}
            <BottomNavigationAction
              value="more"
              label="More"
              icon={<FontAwesomeIcon icon={faEllipsis} />}
              onClick={(e) => setMoreAnchor(e.currentTarget)}
              sx={v2ActionSx}
            />
          </BottomNavigation>
        </Paper>

        <Menu
          anchorEl={moreAnchor}
          open={Boolean(moreAnchor)}
          onClose={() => setMoreAnchor(null)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "bottom", horizontal: "right" }}
          slotProps={{
            paper: {
              sx: {
                bgcolor: "var(--color-app-card)",
                color: "var(--color-app-text)",
                borderRadius: "12px",
                boxShadow: "var(--box-ring)",
              },
            },
          }}
        >
          {moreTabs.map((t) => (
            <MenuItem
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
                setMoreAnchor(null);
              }}
              sx={{ gap: 1.5 }}
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
