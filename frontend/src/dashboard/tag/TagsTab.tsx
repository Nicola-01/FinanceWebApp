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
import { CURRENCY_META, type CurrencyCode } from "../../utils/currencies.ts";
import { DateRangeBanner } from "../statistics/DateRangeBanner.tsx";
import { useTheme } from "../../utils/ThemeContext.tsx";
import Button from "../../components/ui/Button.tsx";
import { CategoryManagerDrawer } from "./CategoryManagerDrawer.tsx";
import { useTabLayout } from "../layout/useTabLayout.ts";
import { WidgetGrid } from "../layout/WidgetGrid.tsx";
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
  const { filteredTransactions, wallet } = useWalletContext();
  const { resolvedTheme } = useTheme();
  const [managerOpen, setManagerOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const currencySymbol =
    CURRENCY_META[wallet.currency as CurrencyCode]?.symbol ?? wallet.currency;

  const layoutApi = useTabLayout(
    CATEGORIES_TAB_ID,
    wallet.id,
    CATEGORIES_WIDGETS,
  );

  const ctx: CategoriesWidgetCtx = {
    transactions: filteredTransactions,
    currencyCode: wallet.currency,
    currencySymbol,
  };

  return (
    <ThemeProvider theme={resolvedTheme === "dark" ? darkTheme : lightTheme}>
      <div className="relative flex flex-1 flex-col pb-10 animate-[fadeIn_0.3s_ease-out]">
        <DateRangeBanner />

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

        <WidgetGrid
          defs={CATEGORIES_WIDGETS}
          ctx={ctx}
          editing={editing}
          api={layoutApi}
          accentColor={wallet.color}
        />

        <CategoryManagerDrawer
          open={managerOpen}
          onClose={() => setManagerOpen(false)}
        />
      </div>
    </ThemeProvider>
  );
};
