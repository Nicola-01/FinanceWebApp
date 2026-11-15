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

  it("keeps the v1 sticky centred wrapper and no aria-label", () => {
    const { container } = render(
      <FloatingActionButton wallet={wallet} onClick={() => {}} />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass("sticky", "bottom-8", "mx-auto", "z-100");
    expect(wrapper).not.toHaveClass("fixed");
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-label");
    expect(screen.getByRole("button").className).toContain("sm:min-w-60");
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

  it("pins to the bottom-right of the viewport", () => {
    const { container } = render(
      <FloatingActionButton wallet={wallet} onClick={() => {}} />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass(
      "fixed",
      "bottom-6",
      "right-6",
      "z-[90]",
      "max-md:bottom-[calc(5rem+env(safe-area-inset-bottom,0px))]",
      "max-sm:right-4",
      "pointer-events-none",
    );
    expect(wrapper).not.toHaveClass("sticky");
  });

  it("shows the label in sentence case on wide screens", () => {
    render(
      <FloatingActionButton
        wallet={wallet}
        onClick={() => {}}
        label="New Transaction"
      />,
    );
    expect(screen.getByText("New transaction")).toHaveClass(
      "hidden",
      "sm:inline",
    );
    expect(screen.queryByText("New Transaction")).toBeNull();
    expect(screen.queryByText("Add")).toBeNull();
  });

  it("is an icon-only round button on small screens with an accessible name", () => {
    render(<FloatingActionButton wallet={wallet} onClick={() => {}} />);
    const btn = screen.getByRole("button", { name: "New transaction" });
    expect(btn).toHaveAttribute("aria-label", "New transaction");
    expect(btn).toHaveClass(
      "max-sm:h-14",
      "max-sm:w-14",
      "max-sm:rounded-full",
      "max-sm:p-0",
      "max-sm:justify-center",
    );
    expect(btn.className).not.toContain("sm:min-w-60");
  });

  it("sentence-cases a custom label for the aria-label", () => {
    render(
      <FloatingActionButton
        wallet={wallet}
        onClick={() => {}}
        label="New Subscription"
      />,
    );
    expect(
      screen.getByRole("button", { name: "New subscription" }),
    ).toBeInTheDocument();
  });
});
