import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CurrencySelector } from "./CurrencySelector";
import { CURRENCY_META } from "../../utils/currencies";

describe("CurrencySelector", () => {
  it("shows the initial currency in the trigger", () => {
    render(<CurrencySelector value="USD" onChange={vi.fn()} />);
    expect(screen.getByText("Currency")).toBeInTheDocument();
    expect(screen.getByText("United States Dollar")).toBeInTheDocument();
    expect(screen.getByText("(USD)")).toBeInTheDocument();
  });

  it("opens and lists the available currencies", async () => {
    const user = userEvent.setup();
    render(<CurrencySelector value="USD" onChange={vi.fn()} />);

    // Closed initially: no other currency is listed.
    expect(screen.queryByText("Euro")).not.toBeInTheDocument();

    await user.click(screen.getByText("United States Dollar"));

    expect(screen.getByText("Euro")).toBeInTheDocument();
    expect(screen.getByText("Japanese Yen")).toBeInTheDocument();
    // One row per currency defined in the meta table.
    expect(screen.getByText("(EUR)")).toBeInTheDocument();
  });

  it("fires onChange with the selected currency code", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CurrencySelector value="USD" onChange={onChange} />);

    await user.click(screen.getByText("United States Dollar"));
    await user.click(screen.getByText("Euro"));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("EUR");
  });

  it("hides the excluded currency from the list", async () => {
    const user = userEvent.setup();
    render(
      <CurrencySelector value="USD" onChange={vi.fn()} excludeCurrency="EUR" />,
    );

    await user.click(screen.getByText("United States Dollar"));

    expect(screen.queryByText("Euro")).not.toBeInTheDocument();
    // Other currencies remain selectable.
    expect(screen.getByText("Japanese Yen")).toBeInTheDocument();
    // Sanity check: EUR really is part of the source data (so exclusion matters).
    expect(CURRENCY_META.EUR.name).toBe("Euro");
  });

  it("falls back to an Unknown label for an unmapped code", () => {
    render(<CurrencySelector value="XXX" onChange={vi.fn()} />);
    expect(screen.getByText("Unknown (XXX)")).toBeInTheDocument();
  });
});
