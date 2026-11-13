import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CustomSelect } from "../../../components/ui/CustomSelect";
import { setUiVersion } from "../../../utils/uiVersion";

const OPTIONS = [
  { value: "eur", label: "Euro" },
  { value: "usd", label: "US Dollar" },
  { value: "gbp", label: "British Pound" },
];

describe("CustomSelect", () => {
  it("shows the label of the current value", () => {
    render(<CustomSelect value="usd" onChange={vi.fn()} options={OPTIONS} />);
    expect(
      screen.getByRole("button", { name: /US Dollar/i }),
    ).toBeInTheDocument();
  });

  it("is closed initially and opens the option list on click", async () => {
    const user = userEvent.setup();
    render(<CustomSelect value="eur" onChange={vi.fn()} options={OPTIONS} />);

    // Only the trigger button exists while closed.
    expect(screen.getAllByRole("button")).toHaveLength(1);

    await user.click(screen.getByRole("button"));

    // Trigger + one button per option once open.
    expect(screen.getAllByRole("button")).toHaveLength(OPTIONS.length + 1);
    expect(screen.getByRole("button", { name: "US Dollar" })).toBeVisible();
    expect(screen.getByRole("button", { name: "British Pound" })).toBeVisible();
  });

  it("fires onChange with the option value and closes after selecting", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CustomSelect value="eur" onChange={onChange} options={OPTIONS} />);

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByRole("button", { name: "British Pound" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("gbp");

    // Dropdown collapses again, leaving only the trigger.
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("falls back to the raw value when no matching option label exists", () => {
    render(
      <CustomSelect value="unknown" onChange={vi.fn()} options={OPTIONS} />,
    );
    expect(screen.getByRole("button", { name: "unknown" })).toBeInTheDocument();
  });

  it("closes when clicking outside without firing onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <div>
        <span data-testid="outside">outside</span>
        <CustomSelect value="eur" onChange={onChange} options={OPTIONS} />
      </div>,
    );

    await user.click(screen.getByRole("button"));
    expect(screen.getAllByRole("button")).toHaveLength(OPTIONS.length + 1);

    await user.click(screen.getByTestId("outside"));

    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders a footer under the options that can close the list", async () => {
    const user = userEvent.setup();
    render(
      <CustomSelect
        value="eur"
        onChange={vi.fn()}
        options={OPTIONS}
        footer={(close) => (
          <button type="button" onClick={close}>
            Manage
          </button>
        )}
      />,
    );
    expect(screen.queryByText("Manage")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Euro/i }));
    await user.click(screen.getByRole("button", { name: "Manage" }));
    expect(screen.queryByText("Manage")).not.toBeInTheDocument();
  });
});

describe("CustomSelect v2", () => {
  beforeEach(() => setUiVersion("v2"));
  afterEach(() => {
    setUiVersion("v1");
    localStorage.clear();
  });

  it("renders a borderless card panel with the selected row raised and checked", async () => {
    const user = userEvent.setup();
    render(<CustomSelect value="usd" onChange={vi.fn()} options={OPTIONS} />);
    await user.click(screen.getByRole("button", { name: "US Dollar" }));
    const panel = screen.getByRole("button", { name: "Euro" })
      .parentElement as HTMLElement;
    expect(panel.className).toContain("bg-app-card");
    expect(panel.className).toContain("rounded-[var(--r-card)]");
    expect(panel.className).not.toContain("border-app-border");
    const selected = within(panel).getByRole("button", { name: "US Dollar" });
    expect(selected.className).toContain("bg-app-raised");
    expect(selected.querySelector("svg")).not.toBeNull();
  });

  it("still selects an option on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CustomSelect value="usd" onChange={onChange} options={OPTIONS} />);
    await user.click(screen.getByRole("button", { name: "US Dollar" }));
    await user.click(screen.getByRole("button", { name: "Euro" }));
    expect(onChange).toHaveBeenCalledWith("eur");
  });
});
