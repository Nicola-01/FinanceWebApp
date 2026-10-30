import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import type { Transaction } from "../../../types/domain";
import { useTransactionDeepLink } from "../../../dashboard/transaction/useTransactionDeepLink";

const tx = (id: string) => ({ id, name: `Tx ${id}` }) as Transaction;

const setup = (url: string, transactions: Transaction[]) => {
  const open = vi.fn();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
  );
  const hook = renderHook(
    ({ list }) => {
      useTransactionDeepLink(list, open);
      return useLocation().search;
    },
    { wrapper, initialProps: { list: transactions } },
  );
  return { open, hook };
};

describe("useTransactionDeepLink", () => {
  it("opens the linked transaction and drops only the tx param", () => {
    const { open, hook } = setup("/dashboard/w1?tab=transactions&tx=2", [
      tx("1"),
      tx("2"),
    ]);
    expect(open).toHaveBeenCalledExactlyOnceWith(tx("2"));
    expect(hook.result.current).toBe("?tab=transactions");
  });

  it("waits until the transaction is loaded", () => {
    const { open, hook } = setup("/dashboard/w1?tab=transactions&tx=2", []);
    expect(open).not.toHaveBeenCalled();
    expect(hook.result.current).toContain("tx=2");

    hook.rerender({ list: [tx("2")] });
    expect(open).toHaveBeenCalledOnce();
  });

  it("does nothing without a tx param", () => {
    const { open } = setup("/dashboard/w1?tab=transactions", [tx("1")]);
    expect(open).not.toHaveBeenCalled();
  });
});
