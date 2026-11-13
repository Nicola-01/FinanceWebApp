import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SwitchableCard } from "../../../components/ui/SwitchableCard";
import { setUiVersion } from "../../../utils/uiVersion";

vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => ({ wallet: { color: "#ff0000" } }),
}));

const tabs = [
  { key: "monthly", title: "Monthly", label: "Monthly" },
  { key: "yearly", title: "Yearly", label: "Yearly" },
];

describe("SwitchableCard", () => {
  beforeEach(() => setUiVersion("v2"));
  afterEach(() => setUiVersion("v1"));

  it("renders a raised-free box with a display title, not uppercase", () => {
    const { container } = render(
      <SwitchableCard tabs={tabs} title="Overview">
        Body
      </SwitchableCard>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("bg-app-card", "shadow-[var(--box-ring)]");
    expect(root.classList.contains("border")).toBe(false);
    const title = screen.getByRole("heading", { name: "Overview" });
    expect(title).toHaveClass("font-display");
    expect(title.className).not.toContain("uppercase");
  });

  it("renders the title in sentence case", () => {
    render(
      <SwitchableCard tabs={tabs} title="Monthly Snapshot">
        Body
      </SwitchableCard>,
    );
    expect(
      screen.getByRole("heading", { name: "Monthly snapshot" }),
    ).toBeInTheDocument();
  });

  it("still switches tabs through onTabChange", () => {
    const onTabChange = vi.fn();
    render(
      <SwitchableCard tabs={tabs} title="Overview" onTabChange={onTabChange}>
        Body
      </SwitchableCard>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Yearly" }));
    expect(onTabChange).toHaveBeenCalledWith("yearly");
  });
});
