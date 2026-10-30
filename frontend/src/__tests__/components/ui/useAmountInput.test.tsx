import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useAmountInput } from "../../../components/ui/useAmountInput";

type AmountType = "EXPENSE" | "INCOME" | "";

function Harness(props: {
  value?: string;
  type: AmountType;
  setType: (t: AmountType) => void;
  onAmountChange: (v: string) => void;
}) {
  const {
    internalRef,
    color,
    textSize,
    liveResult,
    isFocused,
    handleOnKeyDown,
    handleOnChange,
    handleOnFocus,
    handleOnBlur,
    handleToolbarPress,
  } = useAmountInput({ ...props, autoFocus: false });
  return (
    <>
      <input
        ref={internalRef}
        onKeyDown={handleOnKeyDown}
        onChange={handleOnChange}
        onFocus={handleOnFocus}
        onBlur={handleOnBlur}
      />
      <output data-testid="state">
        {`${color}|${textSize}|${liveResult}|${isFocused}`}
      </output>
      <button onClick={() => handleToolbarPress("+")}>plus</button>
    </>
  );
}

const setup = (type: AmountType = "", value?: string) => {
  const setType = vi.fn();
  const onAmountChange = vi.fn();
  const utils = render(
    <Harness
      value={value}
      type={type}
      setType={setType}
      onAmountChange={onAmountChange}
    />,
  );
  const input = screen.getByRole("textbox") as HTMLInputElement;
  const state = () => screen.getByTestId("state").textContent;
  return { ...utils, input, state, setType, onAmountChange };
};

describe("useAmountInput", () => {
  it("defaults an unsigned typed amount to expense and reports the magnitude", () => {
    const { input, state, setType, onAmountChange } = setup();
    fireEvent.change(input, { target: { value: "12" } });
    expect(input.value).toBe("-12");
    expect(setType).toHaveBeenLastCalledWith("EXPENSE");
    expect(onAmountChange).toHaveBeenLastCalledWith("12");
    expect(state()).toBe("text-app-red|text-6xl|null|false");
  });

  it("shows a live preview for formulas and resolves them on blur", () => {
    const { input, state, onAmountChange } = setup("INCOME");
    fireEvent.change(input, { target: { value: "+2*3" } });
    expect(state()).toContain("|6|");
    fireEvent.blur(input);
    expect(input.value).toBe("+6.00");
    expect(onAmountChange).toHaveBeenLastCalledWith("6.00");
    expect(state()).toBe("text-app-green|text-6xl|null|false");
  });

  it("tracks focus", () => {
    const { input, state } = setup();
    fireEvent.focus(input);
    expect(state()).toMatch(/\|true$/);
  });

  it("shrinks the text size for long values", () => {
    const { input, state } = setup();
    fireEvent.change(input, { target: { value: "123456789" } });
    expect(state()).toContain("text-5xl");
    fireEvent.change(input, { target: { value: "-1234567890123" } });
    expect(state()).toContain("text-4xl");
  });

  it("inserts toolbar characters at the caret", () => {
    const { input, onAmountChange } = setup();
    fireEvent.change(input, { target: { value: "5" } });
    input.setSelectionRange(2, 2);
    fireEvent.click(screen.getByText("plus"));
    expect(input.value).toBe("-(5+");
    expect(onAmountChange).toHaveBeenLastCalledWith("(5+");
  });

  it("rewrites the input on external value changes, keeping the sign", () => {
    const { input, rerender, setType, onAmountChange } = setup("INCOME", "1");
    expect(input.value).toBe("+1");
    rerender(
      <Harness
        value="42"
        type="INCOME"
        setType={setType}
        onAmountChange={onAmountChange}
      />,
    );
    expect(input.value).toBe("+42");
    rerender(
      <Harness
        value=""
        type="INCOME"
        setType={setType}
        onAmountChange={onAmountChange}
      />,
    );
    expect(input.value).toBe("");
  });
});
