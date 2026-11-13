import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BoxedSelect } from "../../../components/ui/BoxedSelect";
import { setUiVersion } from "../../../utils/uiVersion";

const OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

describe("BoxedSelect", () => {
  beforeEach(() => setUiVersion("v2"));
  afterEach(() => {
    setUiVersion("v1");
    localStorage.clear();
  });

  it("renders a borderless raised box in v2", () => {
    const { container } = render(
      <BoxedSelect value="monthly" onChange={vi.fn()} options={OPTIONS} />,
    );
    const box = container.firstElementChild as HTMLElement;
    expect(box.className).toContain("bg-app-raised");
    expect(box.className).not.toContain("border-app-border");
  });

  it("still changes the value on selection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <BoxedSelect value="monthly" onChange={onChange} options={OPTIONS} />,
    );
    await user.click(screen.getByRole("button", { name: "Monthly" }));
    await user.click(screen.getByRole("button", { name: "Yearly" }));
    expect(onChange).toHaveBeenCalledWith("yearly");
  });
});
