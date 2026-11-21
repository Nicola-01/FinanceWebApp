import React, { useMemo, useRef } from "react";
import { useSharedFitFont } from "../../hooks/useSharedFitFont.ts";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { filterTransactions } from "../wallet/useTransactionFilters.ts";
import { WalletHeroCard } from "../../components/ui/WalletHeroCard.tsx";
import { StatTile } from "../../components/ui/StatTile.tsx";
import { CategoryIcon } from "../../components/ui/CategoryIcon.tsx";
import { dailyNetSeries, periodLabel } from "../../utils/period.ts";
import { isInvestmentTx, sumFlows } from "../../utils/investments.ts";
import { useInvestmentTags } from "../wallet/useInvestmentTags.ts";
import { getCurrencySymbol } from "../../utils/currencies/index.ts";
import { onColor, toHex } from "../../utils/color.ts";
import { formatAmount } from "../../utils/format.ts";
import { LazyHeroTrend } from "../../components/ui/LazyHeroTrend.tsx";

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

  const invest = useInvestmentTags();
  // Invested and Liquidity tiles only once a tag is flagged as investment.
  const hasInvestments = invest.size > 0;
  const flows = useMemo(() => sumFlows(periodTx, invest), [periodTx, invest]);
  // Income and Spent rows only: the trend and counts leave investment rows out.
  const regular = useMemo(
    () => periodTx.filter((tx) => !isInvestmentTx(tx, invest)),
    [periodTx, invest],
  );

  const trend = useMemo(
    () => dailyNetSeries(regular, dateRange.start, dateRange.end),
    [regular, dateRange.start, dateRange.end],
  );

  const { income, spent, investedNet, liquidityLeft, bought, cashedOut, net } =
    flows;
  const incomeCount = regular.filter((tx) => tx.type === "INCOME").length;
  const expenseCount = regular.length - incomeCount;
  const symbol = getCurrencySymbol(wallet.currency);
  const tilesRef = useRef<HTMLDivElement>(null);
  useSharedFitFont(tilesRef, { max: 22, min: 14 }, [
    income,
    spent,
    investedNet,
    liquidityLeft,
    symbol,
  ]);
  const label = periodLabel(dateRange, datePreset);

  return (
    <div className="grid gap-3.5 lg:grid-cols-[1.5fr_1fr] mb-6">
      <WalletHeroCard
        color={wallet.color}
        label={label ? `Net in ${label}` : "Net in this period"}
        value={net}
        currency={symbol}
        signed
        footer={
          trend.length >= 2 && trend.some((r) => r.v !== 0) ? (
            <LazyHeroTrend rows={trend} color={onColor(toHex(wallet.color))} />
          ) : undefined
        }
      />
      <div
        ref={tilesRef}
        className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3.5"
      >
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
          value={spent}
          currency={symbol}
          sub={
            income > 0
              ? `${Math.round((spent / income) * 100)}% of income`
              : countLabel(expenseCount)
          }
          icon={
            <CategoryIcon icon="cart" color="var(--color-app-expense-mark)" />
          }
        />
        {hasInvestments && (
          <>
            <StatTile
              label="Invested"
              value={investedNet}
              currency={symbol}
              sub={`${formatAmount(bought)} in · ${formatAmount(cashedOut)} out`}
              icon={
                <CategoryIcon icon="invest" color="var(--color-app-invest)" />
              }
            />
            <StatTile
              label="Liquidity left"
              value={liquidityLeft}
              currency={symbol}
              sub="Net − Invested"
              icon={
                <CategoryIcon icon="wallet" color="var(--color-app-muted)" />
              }
            />
          </>
        )}
      </div>
    </div>
  );
};
