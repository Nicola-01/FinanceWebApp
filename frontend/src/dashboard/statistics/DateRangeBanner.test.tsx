import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { format } from "date-fns";
import { it as itLocale } from "date-fns/locale";
import type { Transaction } from "../../utils/types.ts";

const { ctx } = vi.hoisted(() => ({
  ctx: { filteredTransactions: [] as Transaction[] },
}));

// DateRangeBanner reads only `filteredTransactions` from the wallet context.
vi.mock("../wallet/WalletContext.tsx", () => ({
  useWalletContext: () => ctx,
}));

import { DateRangeBanner } from "./DateRangeBanner.tsx";

const tag = { name: "General", icon: "tag", colorHex: "#fff" };

const tx = (date: string): Transaction => ({
  id: Math.random().toString(36).slice(2),
  name: "tx",
  tag,
  amount: 0,
  transactionDate: date,
  type: "EXPENSE",
});

// Recreate the component's own start/end derivation for locale-safe assertions.
const dateStr = (iso: string): string => {
  const d = new Date(new Date(iso).getTime());
  d.setHours(0, 0, 0, 0);
  return format(d, "dd MMM yyyy", { locale: itLocale });
};

describe("DateRangeBanner", () => {
  beforeEach(() => {
    ctx.filteredTransactions = [];
  });

  it("renders nothing when there are no filtered transactions", () => {
    const { container } = render(<DateRangeBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows 'same day' and a singular count for a single transaction", () => {
    ctx.filteredTransactions = [tx("2024-03-15T12:00:00")];
    render(<DateRangeBanner />);

    expect(screen.getByText("same day")).toBeInTheDocument();
    expect(screen.getByText("1 transaction")).toBeInTheDocument();
    // start == end for a single transaction, so the date appears twice.
    expect(screen.getAllByText(dateStr("2024-03-15T12:00:00"))).toHaveLength(2);
  });

  it("renders the start/end dates, duration and plural count for a range", () => {
    ctx.filteredTransactions = [
      tx("2024-01-10T12:00:00"),
      tx("2024-02-01T12:00:00"),
      tx("2024-03-15T12:00:00"),
    ];
    render(<DateRangeBanner />);

    expect(
      screen.getByText(dateStr("2024-01-10T12:00:00")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dateStr("2024-03-15T12:00:00")),
    ).toBeInTheDocument();
    expect(screen.getByText("2 months and 5 days")).toBeInTheDocument();
    expect(screen.getByText("3 transactions")).toBeInTheDocument();
    expect(screen.getByText("→")).toBeInTheDocument();
  });
});
