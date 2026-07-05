import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WalletCardUI } from "../../../dashboard/wallet/WalletCard";
import type { Wallet } from "../../../utils/types";

const wallet: Wallet = {
  id: "abcde12345",
  name: "Groceries",
  icon: "wallet",
  color: "#8b5cf6",
  currency: "EUR",
  createdAt: "2026-01-01",
  userRole: "OWNER",
};

describe("WalletCardUI click vs drag", () => {
  it("navigates (calls onClick) on a genuine click that did not move", () => {
    const onClick = vi.fn();
    render(
      <WalletCardUI wallet={wallet} isSelected={false} onClick={onClick} />,
    );
    const link = screen.getByRole("link");

    fireEvent.pointerDown(link, {
      clientX: 50,
      clientY: 50,
      pointerType: "mouse",
      button: 0,
    });
    // Native anchor navigation is suppressed for SPA, so the event is cancelled…
    const notPrevented = fireEvent.click(link, {
      clientX: 50,
      clientY: 50,
      button: 0,
    });
    expect(notPrevented).toBe(false);
    // …and the SPA select handler fires.
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does NOT navigate on the click that ends a drag-reorder gesture", () => {
    const onClick = vi.fn();
    render(
      <WalletCardUI wallet={wallet} isSelected={false} onClick={onClick} />,
    );
    const link = screen.getByRole("link");

    // Press, then release far away: this is the trailing click dnd-kit leaves
    // behind after a reorder. It must not trigger navigation.
    fireEvent.pointerDown(link, {
      clientX: 10,
      clientY: 10,
      pointerType: "mouse",
      button: 0,
    });
    const notPrevented = fireEvent.click(link, {
      clientX: 150,
      clientY: 90,
      button: 0,
    });
    expect(notPrevented).toBe(false); // default prevented → no full reload
    expect(onClick).not.toHaveBeenCalled();
  });
});
