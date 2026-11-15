import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SegmentedControl } from "../../../components/ui/SegmentedControl";

const options = [
  { value: "a" as const, label: "Alpha" },
  { value: "b" as const, label: "Beta", activeClassName: "text-app-income" },
];

describe("SegmentedControl", () => {
  beforeEach(() => {
    // jsdom has no ResizeObserver; the MotionHighlight observes its items.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the options as tabs in a labelled tablist", () => {
    render(
      <SegmentedControl
        aria-label="Sample"
        value="a"
        onChange={vi.fn()}
        options={options}
      />,
    );
    const list = screen.getByRole("tablist", { name: "Sample" });
    expect(list).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Alpha" }).closest('[role="tablist"]'),
    ).toBe(list);
    expect(screen.getByRole("tab", { name: "Beta" })).toBeInTheDocument();
  });

  it("marks the chosen option as selected", () => {
    render(
      <SegmentedControl
        aria-label="Sample"
        value="b"
        onChange={vi.fn()}
        options={options}
      />,
    );
    expect(screen.getByRole("tab", { name: "Beta" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("calls onChange with the clicked option's value", async () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        aria-label="Sample"
        value="a"
        onChange={onChange}
        options={options}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Beta" }));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith("b"));
  });

  it("selects nothing when value is empty and does not call onChange on mount", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        aria-label="Sample"
        value=""
        onChange={onChange}
        options={options}
      />,
    );
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(screen.getByRole("tab", { name: "Beta" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it("applies activeClassName to the chosen option only", () => {
    render(
      <SegmentedControl
        aria-label="Sample"
        value="b"
        onChange={vi.fn()}
        options={options}
      />,
    );
    expect(screen.getByRole("tab", { name: "Beta" }).className).toContain(
      "text-app-income",
    );
    expect(screen.getByRole("tab", { name: "Alpha" }).className).not.toContain(
      "text-app-income",
    );
  });

  it("does not choose a disabled option on click", async () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        aria-label="Sample"
        value="a"
        onChange={onChange}
        options={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta", disabled: true },
        ]}
      />,
    );
    const disabled = screen.getByRole("tab", { name: "Beta" });
    expect(disabled).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(disabled);
    await new Promise((r) => setTimeout(r, 0));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("uses title as the accessible name of an icon-only option", () => {
    render(
      <SegmentedControl
        aria-label="Sample"
        value="a"
        onChange={vi.fn()}
        options={[
          { value: "a", title: "Viewer", icon: <span aria-hidden>👁</span> },
          { value: "b", label: "Beta", title: "Ignored tooltip" },
        ]}
      />,
    );
    expect(screen.getByRole("tab", { name: "Viewer" })).toHaveAttribute(
      "title",
      "Viewer",
    );
    // A labelled option keeps its label as the accessible name.
    expect(screen.getByRole("tab", { name: "Beta" })).not.toHaveAttribute(
      "aria-label",
    );
  });

  it("applies the sm size classes", () => {
    render(
      <SegmentedControl
        aria-label="Sample"
        value="a"
        onChange={vi.fn()}
        size="sm"
        options={options}
      />,
    );
    const tab = screen.getByRole("tab", { name: "Alpha" });
    expect(tab).toHaveClass("h-8", "px-2", "text-[11px]");
  });

  it("fills the highlight with the accent and turns the chosen text on-wallet", () => {
    render(
      <SegmentedControl
        aria-label="Sample"
        value="a"
        onChange={vi.fn()}
        options={options}
        accentColor="#f2cc2f"
      />,
    );
    expect(
      document.querySelector('[data-slot="motion-highlight-indicator"]'),
    ).toHaveClass("bg-wallet");
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveClass(
      "text-on-wallet",
    );
    expect(screen.getByRole("tab", { name: "Beta" })).toHaveClass(
      "text-app-muted",
    );
  });

  it("keeps a per-option activeClassName over the accent text", () => {
    render(
      <SegmentedControl
        aria-label="Sample"
        value="b"
        onChange={vi.fn()}
        options={options}
        accentColor="#f2cc2f"
      />,
    );
    expect(screen.getByRole("tab", { name: "Beta" })).toHaveClass(
      "text-app-income",
    );
    expect(screen.getByRole("tab", { name: "Beta" })).not.toHaveClass(
      "text-on-wallet",
    );
  });

  it("supports numeric values", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        aria-label="Sample"
        value={1}
        onChange={onChange}
        options={[
          { value: 1, label: "One" },
          { value: 2, label: "Two" },
        ]}
      />,
    );
    expect(screen.getByRole("tab", { name: "One" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    fireEvent.click(screen.getByRole("tab", { name: "Two" }));
    return waitFor(() => expect(onChange).toHaveBeenCalledWith(2));
  });
});
