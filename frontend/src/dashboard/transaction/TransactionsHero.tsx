import React, { useMemo } from "react";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { filterTransactions } from "../wallet/useTransactionFilters.ts";
import { WalletHeroCard } from "../../components/ui/WalletHeroCard.tsx";
import { StatTile } from "../../components/ui/StatTile.tsx";
import { CategoryIcon } from "../../components/ui/CategoryIcon.tsx";
import { periodLabel, sumByType } from "../../utils/period.ts";
import { getCurrencySymbol } from "../../utils/currencies/index.ts";

const countLabel = (n: number): string =>
  n === 0 ? "Nothing yet" : n === 1 ? "1 transaction" : `${n} transactions`;

/** Top of the Transactions tab: this period's net plus Income and Spent. */
export const TransactionsHero: React.FC = () => {
  const { wallet, transactions, tags, dateRange, datePreset } =
    useWalletContext();

  const periodTx = useMemo(
    () =>
      filterTransactions(transactions, tags, {
        selectedTags: null,
        dateRange,
        query: "",
      }),
    [transactions, tags, dateRange],
  );

  const { income, expense } = sumByType(periodTx);
  const incomeCount = periodTx.filter((tx) => tx.type === "INCOME").length;
  const expenseCount = periodTx.length - incomeCount;
  const net = income - expense;
  const symbol = getCurrencySymbol(wallet.currency);
  const label = periodLabel(dateRange, datePreset);

  return (
    <div className="grid gap-3.5 lg:grid-cols-[1.5fr_1fr] mb-6">
      <WalletHeroCard
        color={wallet.color}
        label={label ? `Net in ${label}` : "Net in this period"}
        value={net}
        currency={symbol}
        signed
      />
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-1">
        <StatTile
          label="Income"
          tone="income"
          value={income}
          currency={symbol}
          signed
          sub={countLabel(incomeCount)}
          icon={<CategoryIcon icon="invest" color="var(--color-app-income)" />}
        />
        <StatTile
          label="Spent"
          value={expense}
          currency={symbol}
          sub={
            income > 0
              ? `${Math.round((expense / income) * 100)}% of income`
              : countLabel(expenseCount)
          }
          icon={
            <CategoryIcon icon="cart" color="var(--color-app-expense-mark)" />
          }
        />
      </div>
    </div>
  );
};
