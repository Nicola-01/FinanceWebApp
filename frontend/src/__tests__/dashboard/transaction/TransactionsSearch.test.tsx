import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TransactionsSearch from "../../../dashboard/transaction/TransactionsSearch";

describe("TransactionsSearch", () => {
  it("renders the current value", () => {
    render(<TransactionsSearch value="coffee" onChange={() => {}} />);
    expect(screen.getByLabelText("Search transactions")).toHaveValue("coffee");
  });

  it("calls onChange on each keystroke", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TransactionsSearch value="" onChange={onChange} />);

    await user.type(screen.getByLabelText("Search transactions"), "ab");

    // value is controlled and never updated here, so each key reports one char.
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenNthCalledWith(1, "a");
    expect(onChange).toHaveBeenNthCalledWith(2, "b");
  });

  it("applies the accent colour on focus without crashing", () => {
    render(<TransactionsSearch value="" onChange={() => {}} color="#ff0000" />);
    const input = screen.getByLabelText("Search transactions");
    input.focus();
    expect(input).toHaveFocus();
  });
});
