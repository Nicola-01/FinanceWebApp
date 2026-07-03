import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { TransactionPieChart } from "./CategoryCharts.tsx";
import { CategoryRanking } from "./CategoryRanking.tsx";
import { CategoryTrendChart } from "./CategoryTrendChart.tsx";
// import { CategoryHeatmapChart } from "./CategoryHeatmapChart.tsx";
import { CashFlowSankey } from "../statistics/CashFlowSankey.tsx";
import { CURRENCY_META, type CurrencyCode } from "../../utils/currencies.ts";
import { DateRangeBanner } from "../statistics/DateRangeBanner.tsx";
import { useTheme } from "../../utils/ThemeContext.tsx";
import Button from "../../components/ui/Button.tsx";
import { CategoryManagerDrawer } from "./CategoryManagerDrawer.tsx";

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

  const currencySymbol =
    CURRENCY_META[wallet.currency as CurrencyCode]?.symbol ?? wallet.currency;

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

          <Button variant="secondary" onClick={() => setManagerOpen(true)}>
            <FontAwesomeIcon icon={faLayerGroup} />
            Manage Categories
          </Button>
        </div>

        {/* Pie Charts */}
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <TransactionPieChart
            transactions={filteredTransactions}
            type="INCOME"
            title="Income Distribution"
            currency={wallet.currency}
          />
          <TransactionPieChart
            transactions={filteredTransactions}
            type="EXPENSE"
            title="Expense Distribution"
            currency={wallet.currency}
          />
        </div>

        {/* Top Categories ranking (bar-list), mirrors the two-donut layout */}
        <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-2">
          <CategoryRanking
            transactions={filteredTransactions}
            type="INCOME"
            title="Top Income Categories"
            currency={currencySymbol}
          />
          <CategoryRanking
            transactions={filteredTransactions}
            type="EXPENSE"
            title="Top Expense Categories"
            currency={currencySymbol}
          />
        </div>

        {/* Category trend over time (stacked by month, income/expense toggle) */}
        <div className="mt-8">
          <CategoryTrendChart
            transactions={filteredTransactions}
            currency={currencySymbol}
          />
        </div>

        {/* Category × month heatmap (intensity = amount, income/expense toggle) */}
        {/* <div className="mt-8">
          <CategoryHeatmapChart
            transactions={filteredTransactions}
            currency={currencySymbol}
          />
        </div> */}

        <div className="mt-8">
          <CashFlowSankey
            transactions={filteredTransactions}
            currency={wallet.currency}
          />
        </div>

        <CategoryManagerDrawer
          open={managerOpen}
          onClose={() => setManagerOpen(false)}
        />
      </div>
    </ThemeProvider>
  );
};
