import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { NumberInput } from "../../../components/ui/NumberInput";
import { setUiVersion } from "../../../utils/uiVersion";

describe("NumberInput", () => {
  it("renders a number field with a decimal keypad by default", () => {
    render(<NumberInput aria-label="Amount" value="" onChange={() => {}} />);
    const input = screen.getByLabelText("Amount");
    expect(input).toHaveAttribute("type", "number");
    expect(input).toHaveAttribute("inputmode", "decimal");
  });

  it("calls onChange with the raw string value", () => {
    const onChange = vi.fn();
    render(<NumberInput aria-label="Amount" value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Amount"), {
      target: { value: "12.5" },
    });
    expect(onChange).toHaveBeenCalledWith("12.5");
  });

  it("calls onEnter when Enter is pressed", () => {
    const onEnter = vi.fn();
    render(
      <NumberInput
        aria-label="Amount"
        value="10"
        onChange={() => {}}
        onEnter={onEnter}
      />,
    );
    fireEvent.keyDown(screen.getByLabelText("Amount"), { key: "Enter" });
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it("does not call onEnter for other keys", () => {
    const onEnter = vi.fn();
    render(
      <NumberInput
        aria-label="Amount"
        value="10"
        onChange={() => {}}
        onEnter={onEnter}
      />,
    );
    fireEvent.keyDown(screen.getByLabelText("Amount"), { key: "a" });
    expect(onEnter).not.toHaveBeenCalled();
  });

  it("passes through native props like placeholder and disabled", () => {
    render(
      <NumberInput
        aria-label="Amount"
        value=""
        onChange={() => {}}
        placeholder="0.00 €"
        disabled
      />,
    );
    const input = screen.getByLabelText("Amount");
    expect(input).toHaveAttribute("placeholder", "0.00 €");
    expect(input).toBeDisabled();
  });

  it("forwards the ref to the underlying input element", () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <NumberInput
        ref={ref}
        aria-label="Amount"
        value=""
        onChange={() => {}}
      />,
    );
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toBe(screen.getByLabelText("Amount"));
  });

  it("strips the native number spinners", () => {
    render(<NumberInput aria-label="Amount" value="" onChange={() => {}} />);
    expect(screen.getByLabelText("Amount").className).toContain(
      "[appearance:textfield]",
    );
  });

  it("does not render the type selector in plain mode", () => {
    render(<NumberInput aria-label="Amount" value="" onChange={() => {}} />);
    expect(
      screen.queryByRole("button", { name: "Expense — money out" }),
    ).not.toBeInTheDocument();
  });

  describe("signed-amount mode", () => {
    it("shows the money-out / money-in selector when type + onTypeChange are given", () => {
      render(
        <NumberInput
          aria-label="Amount"
          value=""
          onChange={() => {}}
          type="INCOME"
          onTypeChange={() => {}}
        />,
      );
      expect(
        screen.getByRole("button", { name: "Expense — money out" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Income — money in" }),
      ).toBeInTheDocument();
    });

    it("highlights the active direction with its accent colour", () => {
      render(
        <NumberInput
          aria-label="Amount"
          value=""
          onChange={() => {}}
          type="EXPENSE"
          onTypeChange={() => {}}
        />,
      );
      expect(
        screen.getByRole("button", { name: "Expense — money out" }).className,
      ).toContain("text-app-red");
      expect(
        screen.getByRole("button", { name: "Income — money in" }).className,
      ).not.toContain("text-app-green");
    });

    it("calls onTypeChange when a direction is clicked", () => {
      const onTypeChange = vi.fn();
      render(
        <NumberInput
          aria-label="Amount"
          value=""
          onChange={() => {}}
          type="INCOME"
          onTypeChange={onTypeChange}
        />,
      );
      fireEvent.click(
        screen.getByRole("button", { name: "Expense — money out" }),
      );
      expect(onTypeChange).toHaveBeenCalledWith("EXPENSE");
    });

    it("tints the number by direction", () => {
      const { rerender } = render(
        <NumberInput
          aria-label="Amount"
          value="5"
          onChange={() => {}}
          type="EXPENSE"
          onTypeChange={() => {}}
        />,
      );
      expect(screen.getByLabelText("Amount").className).toContain(
        "text-app-red",
      );
      rerender(
        <NumberInput
          aria-label="Amount"
          value="5"
          onChange={() => {}}
          type="INCOME"
          onTypeChange={() => {}}
        />,
      );
      expect(screen.getByLabelText("Amount").className).toContain(
        "text-app-green",
      );
    });
  });

  describe("v2 UI", () => {
    beforeEach(() => {
      setUiVersion("v2");
    });

    afterEach(() => {
      setUiVersion("v1");
      localStorage.clear();
    });

    it("uses tabular figures in the UI font instead of monospace", () => {
      render(<NumberInput aria-label="Amount" value="" onChange={() => {}} />);
      const input = screen.getByLabelText("Amount");
      expect(input.className).toContain("tabular-nums");
      expect(input.className).not.toContain("font-app-mono");
    });

    it("tints only income green and keeps expenses in the text colour", () => {
      const { rerender } = render(
        <NumberInput
          aria-label="Amount"
          value="5"
          onChange={() => {}}
          type="EXPENSE"
          onTypeChange={() => {}}
        />,
      );
      expect(screen.getByLabelText("Amount").className).not.toContain(
        "text-app-red",
      );
      rerender(
        <NumberInput
          aria-label="Amount"
          value="5"
          onChange={() => {}}
          type="INCOME"
          onTypeChange={() => {}}
        />,
      );
      expect(screen.getByLabelText("Amount").className).toContain(
        "text-app-income",
      );
    });

    it("still reports changes and direction clicks", () => {
      const onChange = vi.fn();
      const onTypeChange = vi.fn();
      render(
        <NumberInput
          aria-label="Amount"
          value=""
          onChange={onChange}
          type="INCOME"
          onTypeChange={onTypeChange}
        />,
      );
      fireEvent.change(screen.getByLabelText("Amount"), {
        target: { value: "3" },
      });
      expect(onChange).toHaveBeenCalledWith("3");
      fireEvent.click(
        screen.getByRole("button", { name: "Expense — money out" }),
      );
      expect(onTypeChange).toHaveBeenCalledWith("EXPENSE");
    });
  });
});
