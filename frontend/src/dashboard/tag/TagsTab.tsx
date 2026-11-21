import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faLayerGroup,
  faRotateLeft,
  faUpDownLeftRight,
} from "@fortawesome/free-solid-svg-icons";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { useInvestmentTags } from "../wallet/useInvestmentTags.ts";
import { isCategorised } from "../wallet/toCategorize.ts";
import { getCurrencySymbol } from "../../utils/currencies/index.ts";
import { DateRangeBanner } from "../DateRangeBanner.tsx";
import { useTheme } from "../../utils/ThemeContext.tsx";
import { useUiVersion } from "../../hooks/useUiVersion.ts";
import Button from "../../components/ui/Button.tsx";
import { CategoryManagerDrawer } from "./CategoryManagerDrawer.tsx";
import { CategoryStrip } from "./CategoryStrip.tsx";
import { useTabLayout } from "../layout/useTabLayout.ts";
import { WidgetGrid } from "../layout/WidgetGrid.tsx";
import { CustomizePageButton } from "../layout/CustomizePageButton.tsx";
import { LayoutEditBar } from "../layout/LayoutEditBar.tsx";
import {
  CATEGORIES_TAB_ID,
  CATEGORIES_WIDGETS,
  type CategoriesWidgetCtx,
} from "./categoriesWidgets.tsx";

const lightTheme = createTheme({
  palette: { mode: "light", background: { paper: "#ffffff" } },
});

const darkTheme = createTheme({
  palette: { mode: "dark", background: { paper: "var(--color-app-card)" } },
});

export const TagsTab: React.FC = () => {
  const { filteredTransactions, wallet, tags } = useWalletContext();
  const { resolvedTheme } = useTheme();
  const [managerOpen, setManagerOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [ui] = useUiVersion(); // ui-v2-switch: v2 moves the range summary to the bottom

  const currencySymbol = getCurrencySymbol(wallet.currency);
  const investmentTags = useInvestmentTags();

  const layoutApi = useTabLayout(
    CATEGORIES_TAB_ID,
    wallet.id,
    CATEGORIES_WIDGETS,
  );

  const ctx: CategoriesWidgetCtx = {
    transactions: filteredTransactions.filter(isCategorised),
    currencyCode: wallet.currency,
    currencySymbol,
    investmentTags,
  };

  return (
    <ThemeProvider theme={resolvedTheme === "dark" ? darkTheme : lightTheme}>
      <div
        className={`relative flex flex-1 flex-col animate-[fadeIn_0.3s_ease-out] ${ui === "v2" ? "" : "pb-10"}`} // ui-v2-switch: main's pb-28 clears the dock; v1 keeps its own pb-10
      >
        {ui !== "v2" && <DateRangeBanner />}

        {ui === "v2" ? ( // ui-v2-switch: the strip replaces the title row and its buttons
          <div className="mb-6">
            <CategoryStrip
              transactions={ctx.transactions}
              tags={tags}
              invest={investmentTags}
              onManage={() => setManagerOpen(true)}
            />
          </div>
        ) : (
          <div className="mb-4 mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-app-text">
                Visual Distribution
              </h2>
              <p className="text-sm text-app-muted">
                Analyze your income and expenses by category and sub-category.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <Button variant="ghost" onClick={layoutApi.reset}>
                    <FontAwesomeIcon icon={faRotateLeft} />
                    Reset
                  </Button>
                  <Button variant="primary" onClick={() => setEditing(false)}>
                    <FontAwesomeIcon icon={faCheck} />
                    Done
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" onClick={() => setEditing(true)}>
                    <FontAwesomeIcon icon={faUpDownLeftRight} />
                    Edit Layout
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setManagerOpen(true)}
                  >
                    <FontAwesomeIcon icon={faLayerGroup} />
                    Manage Categories
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        <WidgetGrid
          defs={CATEGORIES_WIDGETS}
          ctx={ctx}
          editing={editing}
          api={layoutApi}
          accentColor={wallet.color}
        />

        {ui === "v2" && ( // ui-v2-switch
          <>
            {editing ? (
              <LayoutEditBar
                hiddenCount={layoutApi.layout.hiddenSlots.length}
                onReset={layoutApi.reset}
                onDone={() => setEditing(false)}
              />
            ) : (
              <CustomizePageButton onClick={() => setEditing(true)} />
            )}
            <DateRangeBanner />
          </>
        )}

        <CategoryManagerDrawer
          open={managerOpen}
          onClose={() => setManagerOpen(false)}
        />
      </div>
    </ThemeProvider>
  );
};
