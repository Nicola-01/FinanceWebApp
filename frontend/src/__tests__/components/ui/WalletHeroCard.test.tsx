import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WalletHeroCard } from "../../../components/ui/WalletHeroCard";

describe("WalletHeroCard", () => {
  it("renders the name as heading and the section label", () => {
    render(
      <WalletHeroCard
        name="Household"
        color="#f2cc2f"
        label="Balance"
        value="€1,204"
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Household" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Household" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Balance")).toBeInTheDocument();
    expect(screen.getByText("€1,204")).toBeInTheDocument();
  });

  it("renders meta only when given", () => {
    const { rerender } = render(
      <WalletHeroCard name="Main" color="#f2cc2f" label="Balance" value="1" />,
    );
    expect(screen.queryByText("meta-text")).not.toBeInTheDocument();

    rerender(
      <WalletHeroCard
        name="Main"
        color="#f2cc2f"
        label="Balance"
        value="1"
        meta="meta-text"
      />,
    );
    expect(screen.getByText("meta-text")).toBeInTheDocument();
  });

  it("uses the compact or normal value size", () => {
    const { rerender } = render(
      <WalletHeroCard
        name="Main"
        color="#f2cc2f"
        label="Balance"
        value="42"
        compact
      />,
    );
    expect(screen.getByText("42")).toHaveClass("text-[34px]");
    expect(screen.getByText("42")).not.toHaveClass("text-[46px]");

    rerender(
      <WalletHeroCard name="Main" color="#f2cc2f" label="Balance" value="42" />,
    );
    expect(screen.getByText("42")).toHaveClass(
      "text-[46px]",
      "max-sm:text-[36px]",
    );
    expect(screen.getByRole("region", { name: "Main" })).toHaveClass(
      "min-h-[196px]",
    );
  });

  it("sets the wallet colour and computed on-colour", () => {
    render(
      <WalletHeroCard name="Main" color="#5b7cfa" label="Balance" value="1" />,
    );
    const root = screen.getByRole("region", { name: "Main" });
    expect(root.style.getPropertyValue("--wallet")).toBe("#5b7cfa");
    expect(root.style.getPropertyValue("--on-wallet")).toBe("#ffffff");
    expect(root).toHaveClass("bg-wallet", "text-on-wallet");
  });

  it("renders the emblem with an empty alt", () => {
    const { container } = render(
      <WalletHeroCard name="Main" color="#f2cc2f" label="Balance" value="1" />,
    );
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "/icon.svg");
    expect(img).toHaveAttribute("alt", "");
    expect(img).toHaveAttribute("aria-hidden", "true");
  });

  it("shows the wallet icon in the heading when given", () => {
    render(
      <WalletHeroCard
        name="Home"
        color="#f2cc2f"
        icon="piggyBank"
        label="Net"
        value="0"
      />,
    );
    const heading = screen.getByRole("heading", { name: "Home" });
    expect(heading.querySelector("svg")).toHaveAttribute(
      "data-icon",
      "piggy-bank",
    );
  });

  it("omits the name block when no name is given (title row names the wallet)", () => {
    render(<WalletHeroCard color="#f2cc2f" label="Net this month" value="0" />);
    expect(screen.queryByRole("heading")).toBeNull();
    expect(
      screen.getByRole("region", { name: "Net this month" }),
    ).toBeInTheDocument();
  });
});

describe("WalletHeroCard with a number value", () => {
  it("formats the number as an amount with the currency symbol (v1)", () => {
    render(
      <WalletHeroCard
        name="Main"
        color="#f2cc2f"
        label="Net"
        value={1204}
        currency="€"
        signed
      />,
    );
    expect(screen.getByText("+1204,00 €")).toBeInTheDocument();
  });
});
