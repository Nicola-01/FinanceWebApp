import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { ReactNode } from "react";
import { AmountInput } from "./AmountInput";

// Render framer-motion nodes as plain children (drop animation-only props).
vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get:
        () =>
        ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    },
  ),
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

type AmountType = "EXPENSE" | "INCOME" | "";

const setup = (type: AmountType = "") => {
  const onAmountChange = vi.fn();
  const setType = vi.fn();
  render(
    <AmountInput
      currencySymbol="€"
      type={type}
      setType={setType}
      onAmountChange={onAmountChange}
      autoFocus={false}
    />,
  );
  const input = screen.getByRole("textbox") as HTMLInputElement;
  return { input, onAmountChange, setType };
};

const lastAmount = (fn: ReturnType<typeof vi.fn>): string =>
  fn.mock.calls.at(-1)?.[0] as string;

describe("AmountInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies the default negative sign for an EXPENSE and reports the magnitude", () => {
    const { input, onAmountChange } = setup("EXPENSE");
    fireEvent.change(input, { target: { value: "50" } });
    expect(input.value).toBe("-50");
    expect(lastAmount(onAmountChange)).toBe("50");
  });

  it("applies the default positive sign for an INCOME", () => {
    const { input, onAmountChange } = setup("INCOME");
    fireEvent.change(input, { target: { value: "50" } });
    expect(input.value).toBe("+50");
    expect(lastAmount(onAmountChange)).toBe("50");
  });

  it("converts a comma to a dot", () => {
    const { input, onAmountChange } = setup("EXPENSE");
    fireEvent.change(input, { target: { value: "12,5" } });
    expect(input.value).toBe("-12.5");
    expect(lastAmount(onAmountChange)).toBe("12.5");
  });

  it("clamps to two decimal places", () => {
    const { input, onAmountChange } = setup("EXPENSE");
    fireEvent.change(input, { target: { value: "3.999" } });
    expect(input.value).toBe("-3.99");
    expect(lastAmount(onAmountChange)).toBe("3.99");
  });

  it("collapses multiple decimal points", () => {
    const { input } = setup("EXPENSE");
    fireEvent.change(input, { target: { value: "1.2.3" } });
    expect(input.value).toBe("-1.23");
  });

  it("shows a live preview for a math expression", () => {
    const { input } = setup("EXPENSE");
    fireEvent.change(input, { target: { value: "10+5" } });
    expect(screen.getByText("Preview:")).toBeInTheDocument();
    expect(screen.getByText(/-5\.00\s*€/)).toBeInTheDocument();
  });

  it("resolves the expression on Enter", () => {
    const { input, onAmountChange } = setup("EXPENSE");
    fireEvent.change(input, { target: { value: "10+5" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(input.value).toBe("-5.00");
    expect(lastAmount(onAmountChange)).toBe("5.00");
  });

  it("blocks letters but allows digits on key press", () => {
    const { input } = setup("EXPENSE");
    // fireEvent.keyDown returns false when the handler called preventDefault.
    expect(fireEvent.keyDown(input, { key: "a" })).toBe(false);
    expect(fireEvent.keyDown(input, { key: "5" })).toBe(true);
  });
});
