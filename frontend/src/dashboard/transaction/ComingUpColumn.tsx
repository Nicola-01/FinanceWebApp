import React from "react";
import { CategoryIcon } from "../../components/ui/CategoryIcon.tsx";
import { formatAmount } from "../../utils/format.ts";
import { CURRENCY_META } from "../../utils/currencies/meta.ts";
import type { CurrencyCode } from "../../utils/currencies/meta.ts";
import { COMING_UP_DAYS, type ComingUpItem } from "./comingUp.ts";

interface ComingUpColumnProps {
  items: ComingUpItem[];
  currency: CurrencyCode;
}

export const ComingUpColumn: React.FC<ComingUpColumnProps> = ({
  items,
  currency,
}) => {
  const symbol = CURRENCY_META[currency]?.symbol;
  return (
    <section>
      <h2 className="mb-2.5 font-display text-[19px] font-semibold tracking-[-0.02em] text-app-text">
        Coming up{" "}
        <small className="text-[13px] font-normal text-app-muted">
          next {COMING_UP_DAYS} days
        </small>
      </h2>
      {items.length === 0 ? (
        <p className="rounded-[var(--r-card)] bg-app-card p-4 text-[13px] text-app-muted shadow-[var(--box-ring)]">
          Nothing due in the next {COMING_UP_DAYS} days
        </p>
      ) : (
        <ul className="flex flex-col rounded-[var(--r-card)] bg-app-card px-3.5 py-1 shadow-[var(--box-ring)]">
          {items.map(({ sub, label, soon }) => (
            <li
              key={sub.id}
              className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 border-b border-app-border py-2.5 last:border-0"
            >
              <CategoryIcon
                icon={sub.tag.icon}
                color={sub.tag.colorHex}
                size="sm"
              />
              <div className="min-w-0">
                <div className="truncate font-semibold text-app-text">
                  {sub.name}
                </div>
                <div
                  className={`tabular-nums text-[13px] ${sub.type === "INCOME" ? "text-app-income" : "text-app-muted"}`}
                >
                  {formatAmount(
                    sub.type === "INCOME" ? sub.amount : -sub.amount,
                    { signed: true },
                  )}
                  {symbol && ` ${symbol}`}
                </div>
              </div>
              <span
                className={`text-[13px] tabular-nums ${soon ? "font-semibold text-app-warn" : "text-app-muted"}`}
              >
                {label}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
