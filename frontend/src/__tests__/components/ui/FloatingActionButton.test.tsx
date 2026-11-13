import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setUiVersion } from "../../../utils/uiVersion";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FloatingActionButton } from "../../../components/ui/FloatingActionButton";
import type { Wallet } from "../../../types/domain";

const wallet: Wallet = {
  id: "w1",
  name: "Wallet One",
  icon: "",
  color: "#8b5cf6",
  currency: "EUR",
  createdAt: "2026-01-01",
  userRole: "OWNER",
};

describe("FloatingActionButton", () => {
  it("renders the default desktop and mobile labels", () => {
    render(<FloatingActionButton wallet={wallet} onClick={() => {}} />);
    expect(screen.getByText("New Transaction")).toBeInTheDocument();
    expect(screen.getByText("Add")).toBeInTheDocument();
  });

  it("renders custom labels when provided", () => {
    render(
      <FloatingActionButton
        wallet={wallet}
        onClick={() => {}}
        label="Create"
        mobileLabel="Go"
      />,
    );
    expect(screen.getByText("Create")).toBeInTheDocument();
    expect(screen.getByText("Go")).toBeInTheDocument();
  });

  it("renders the plus icon", () => {
    const { container } = render(
      <FloatingActionButton wallet={wallet} onClick={() => {}} />,
    );
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("fires onClick when pressed", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<FloatingActionButton wallet={wallet} onClick={onClick} />);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("FloatingActionButton v2", () => {
  beforeEach(() => setUiVersion("v2"));
  afterEach(() => setUiVersion("v1"));

  it("uses a solid wallet fill with no glass, border or glow", () => {
    render(<FloatingActionButton wallet={wallet} onClick={() => {}} />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("bg-wallet", "text-on-wallet");
    expect(btn.className).not.toContain("backdrop-blur");
    expect(btn.classList.contains("border")).toBe(false);
    expect(btn.style.getPropertyValue("--wallet")).toBe(wallet.color);
    expect(btn.style.boxShadow).toBe("");
    expect(btn.style.backgroundColor).toBe("");
  });

  it("still fires onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<FloatingActionButton wallet={wallet} onClick={onClick} />);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
