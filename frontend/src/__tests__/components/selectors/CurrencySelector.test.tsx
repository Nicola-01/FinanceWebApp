import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import { CurrencySelector } from "../../../components/selectors/CurrencySelector";
import { CURRENCY_META } from "../../../utils/currencies";

// Hydration adds a code (AED) that is NOT in the curated static set, so we can
// prove the long list is pulled in on open. Curated meta + MAIN codes stay real.
vi.mock("../../../utils/currencies", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../utils/currencies")>();
  return {
    ...actual,
    getCurrencies: vi.fn(async () => ({
      ...actual.CURRENCY_META,
      AED: { name: "United Arab Emirates Dirham", symbol: "د.إ" },
    })),
  };
});

/** Open the dropdown and flush the async hydration inside act(). */
const openDropdown = async () => {
  const trigger = screen.getByRole("button");
  await act(async () => {
    fireEvent.click(trigger);
  });
};

describe("CurrencySelector", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("shows the initial currency in the trigger", () => {
    render(<CurrencySelector value="USD" onChange={vi.fn()} />);
    expect(screen.getByText("Currency")).toBeInTheDocument();
    expect(screen.getByText("United States Dollar")).toBeInTheDocument();
    expect(screen.getByText("(USD)")).toBeInTheDocument();
  });

  it("lists nothing until it is opened", () => {
    render(<CurrencySelector value="USD" onChange={vi.fn()} />);
    expect(screen.queryByText("Euro")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Search currency")).not.toBeInTheDocument();
  });

  it("shows the Main and Others sections when opened", async () => {
    render(<CurrencySelector value="USD" onChange={vi.fn()} />);
    await openDropdown();

    expect(screen.getByText("Main currencies")).toBeInTheDocument();
    expect(screen.getByText("Others")).toBeInTheDocument();
    // A curated main currency and a curated "other" currency.
    expect(screen.getByText("Euro")).toBeInTheDocument();
    expect(screen.getByText("(SEK)")).toBeInTheDocument();
  });

  it("hydrates the long list from getCurrencies on first open", async () => {
    render(<CurrencySelector value="USD" onChange={vi.fn()} />);
    await openDropdown();

    // AED is not in the curated set; it only shows up after hydration.
    expect(await screen.findByText("(AED)")).toBeInTheDocument();
  });

  it("filters by name and drops the section headers while searching", async () => {
    render(<CurrencySelector value="USD" onChange={vi.fn()} />);
    await openDropdown();

    fireEvent.change(screen.getByLabelText("Search currency"), {
      target: { value: "pound" },
    });

    // Scope to the listbox: the trigger always shows the selected "(USD)".
    // `hidden: true` because jsdom can't show the popover (top-layer) subtree.
    const list = within(screen.getByRole("listbox", { hidden: true }));
    expect(list.getByText("(GBP)")).toBeInTheDocument(); // "British Pound"
    expect(list.queryByText("(USD)")).not.toBeInTheDocument();
    expect(screen.queryByText("Main currencies")).not.toBeInTheDocument();
  });

  it("matches on the ISO code too", async () => {
    render(<CurrencySelector value="USD" onChange={vi.fn()} />);
    await openDropdown();

    fireEvent.change(screen.getByLabelText("Search currency"), {
      target: { value: "chf" },
    });

    expect(screen.getByText("(CHF)")).toBeInTheDocument();
    expect(screen.queryByText("(GBP)")).not.toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    render(<CurrencySelector value="USD" onChange={vi.fn()} />);
    await openDropdown();

    fireEvent.change(screen.getByLabelText("Search currency"), {
      target: { value: "zzzzz" },
    });

    expect(screen.getByText(/No currencies match/)).toBeInTheDocument();
  });

  it("fires onChange with the selected code and closes the dropdown", async () => {
    const onChange = vi.fn();
    render(<CurrencySelector value="USD" onChange={onChange} />);
    await openDropdown();

    // Selection is on mouseDown (fires before the search input blurs).
    fireEvent.mouseDown(screen.getByText("Euro"));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("EUR");
    expect(screen.queryByLabelText("Search currency")).not.toBeInTheDocument();
  });

  it("hides the excluded currency from the list", async () => {
    render(
      <CurrencySelector value="USD" onChange={vi.fn()} excludeCurrency="EUR" />,
    );
    await openDropdown();

    expect(screen.queryByText("Euro")).not.toBeInTheDocument();
    expect(screen.getByText("Japanese Yen")).toBeInTheDocument();
    // Sanity check: EUR really is part of the source data.
    expect(CURRENCY_META.EUR.name).toBe("Euro");
  });

  it("falls back to an Unknown label for an unmapped code", async () => {
    await act(async () => {
      render(<CurrencySelector value="XXX" onChange={vi.fn()} />);
    });
    expect(screen.getByText("Unknown (XXX)")).toBeInTheDocument();
  });

  it("shows no star affordance without onToggleStar", async () => {
    render(<CurrencySelector value="USD" onChange={vi.fn()} />);
    await openDropdown();
    expect(
      screen.queryByLabelText(/as default currency/i),
    ).not.toBeInTheDocument();
  });

  it("stars a row and also selects it", async () => {
    const onChange = vi.fn();
    const onToggleStar = vi.fn();
    render(
      <CurrencySelector
        value="USD"
        onChange={onChange}
        onToggleStar={onToggleStar}
      />,
    );
    await openDropdown();

    fireEvent.mouseDown(screen.getByLabelText("Set GBP as default currency"));

    expect(onToggleStar).toHaveBeenCalledWith("GBP");
    expect(onChange).toHaveBeenCalledWith("GBP"); // the star also picks the row
  });

  it("marks the currently starred currency", async () => {
    render(
      <CurrencySelector
        value="USD"
        onChange={vi.fn()}
        onToggleStar={vi.fn()}
        starredCurrency="GBP"
      />,
    );
    await openDropdown();

    expect(
      screen.getByLabelText("Remove GBP as default currency"),
    ).toBeInTheDocument();
  });
});
