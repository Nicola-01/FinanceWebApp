import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AnimatedNumber } from "../../../components/ui/AnimatedNumber";
import { formatAmount } from "../../../utils/format";
import { setUiVersion } from "../../../utils/uiVersion";

vi.mock("@number-flow/react", () => import("../../../test/numberFlowStub"));

afterEach(() => {
  setUiVersion("v1");
});

describe("AnimatedNumber (v1)", () => {
  it.each([0, 1234.5, -1234.5, 1000, 12345.6])(
    "renders the formatAmount text for %s as plain text",
    (value) => {
      const { container } = render(
        <AnimatedNumber value={value} currency="€" />,
      );
      expect(container.textContent).toBe(`${formatAmount(value)} €`);
      expect(screen.queryByTestId("number-flow")).toBeNull();
    },
  );

  it("matches formatAmount with the signed prefix", () => {
    const { container, rerender } = render(
      <AnimatedNumber value={600} currency="€" signed />,
    );
    expect(container.textContent).toBe(
      `${formatAmount(600, { signed: true })} €`,
    );
    rerender(<AnimatedNumber value={-25.5} currency="€" signed />);
    expect(container.textContent).toBe("−25,50 €");
    rerender(<AnimatedNumber value={0} currency="€" signed />);
    expect(container.textContent).toBe("0,00 €");
  });

  it("renders whole percentages and fraction-free plain numbers", () => {
    const { container, rerender } = render(
      <AnimatedNumber value={42.4} kind="percent" />,
    );
    expect(container.textContent).toBe("42%");
    rerender(<AnimatedNumber value={1234} kind="plain" decimals={0} />);
    expect(container.textContent).toBe("1234");
  });
});

describe("AnimatedNumber (v2)", () => {
  it("hands NumberFlow the formatAmount text as its label and props", () => {
    setUiVersion("v2");
    render(<AnimatedNumber value={-1234.5} currency="€" signed />);
    const flow = screen.getByTestId("number-flow");
    expect(flow).toHaveAttribute(
      "aria-label",
      `${formatAmount(-1234.5, { signed: true })} €`,
    );
    expect(flow).toHaveTextContent("−1234,50 €");
  });

  it.each([
    [{ value: 1234.5 }, "1234,50"],
    [{ value: 12345.6, currency: "€" }, "12.345,60 €"],
    [{ value: 42.4, kind: "percent" as const }, "42%"],
    [{ value: 1234.5, decimals: 0, currency: "€" }, "1235 €"],
  ])("labels %o as %s", (props, label) => {
    setUiVersion("v2");
    render(<AnimatedNumber {...props} />);
    expect(screen.getByLabelText(label)).toBeInTheDocument();
  });

  it("starts from 0 on intro and rolls to the value", async () => {
    setUiVersion("v2");
    render(<AnimatedNumber value={1500} currency="€" intro />);
    expect(screen.getByTestId("number-flow")).toHaveTextContent("0,00 €");
    await waitFor(() =>
      expect(screen.getByTestId("number-flow")).toHaveTextContent("1500,00 €"),
    );
  });
});
