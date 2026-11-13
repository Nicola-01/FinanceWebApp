import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WalletMiniCard } from "../../../components/ui/WalletMiniCard";

describe("WalletMiniCard", () => {
  it("renders the name and meta", () => {
    render(<WalletMiniCard name="Household" color="#f2cc2f" meta="€1,204" />);
    expect(screen.getByText("Household")).toBeInTheDocument();
    expect(screen.getByText("€1,204")).toBeInTheDocument();
  });

  it("omits the meta span when no meta is given", () => {
    const { container } = render(
      <WalletMiniCard name="Travel" color="#f2cc2f" />,
    );
    expect(container.querySelectorAll("span")).toHaveLength(1);
  });

  it("sets the wallet colour and a readable on-colour", () => {
    const { container, rerender } = render(
      <WalletMiniCard name="Dark" color="#5b7cfa" active />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue("--wallet")).toBe("#5b7cfa");
    expect(root.style.getPropertyValue("--on-wallet")).toBe("#ffffff");
    expect(root).toHaveClass("bg-wallet", "text-on-wallet");

    rerender(<WalletMiniCard name="Light" color="#f2cc2f" active />);
    expect(root.style.getPropertyValue("--on-wallet")).toBe("#1d1a10");
  });

  it("is solid only when active; inactive is a neutral row with a colour edge", () => {
    const { container, rerender } = render(
      <WalletMiniCard name="Main" color="#f2cc2f" />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("bg-app-raised", "text-app-text");
    expect(root).not.toHaveClass("bg-wallet");
    expect(root).not.toHaveAttribute("data-active");

    rerender(<WalletMiniCard name="Main" color="#f2cc2f" active />);
    expect(root).toHaveClass("bg-wallet", "text-on-wallet");
    expect(root).not.toHaveClass("bg-app-raised");
    expect(root).toHaveAttribute("data-active", "true");
  });

  it("appends a custom className", () => {
    const { container } = render(
      <WalletMiniCard name="Main" color="#f2cc2f" className="extra" />,
    );
    expect(container.firstElementChild).toHaveClass("extra");
  });

  it("shows the wallet icon before the name when given", () => {
    const { container } = render(
      <WalletMiniCard name="Home" color="#f2cc2f" icon="piggyBank" />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("data-icon", "piggy-bank");
    expect(screen.getByText("Home")).toBeInTheDocument();
  });
});
