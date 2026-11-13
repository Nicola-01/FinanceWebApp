import { afterEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TagPickerTrigger } from "../../../components/tags/TagPickerTrigger";
import type { Tag } from "../../../types/domain";
import { setUiVersion } from "../../../utils/uiVersion";

const props = (over: Partial<Parameters<typeof TagPickerTrigger>[0]> = {}) => ({
  isOpen: false,
  color: "red",
  searchQuery: "",
  onSearchChange: vi.fn(),
  onOpen: vi.fn(),
  onToggle: vi.fn(),
  ...over,
});

describe("TagPickerTrigger", () => {
  it("shows the placeholder when closed with no selection and opens on click", () => {
    const p = props();
    render(<TagPickerTrigger {...p} />);
    fireEvent.click(screen.getByText("Select a category..."));
    expect(p.onOpen).toHaveBeenCalled();
  });

  it("shows the selected tag name when closed", () => {
    render(
      <TagPickerTrigger
        {...props({ selectedTag: { name: "Food", icon: "x" } as Tag })}
      />,
    );
    expect(screen.getByText("Food")).toBeInTheDocument();
  });

  it("renders the search input while open and forwards typing", () => {
    const p = props({ isOpen: true });
    render(<TagPickerTrigger {...p} />);
    fireEvent.change(screen.getByPlaceholderText("Tap to search..."), {
      target: { value: "fo" },
    });
    expect(p.onSearchChange).toHaveBeenCalledWith("fo");
  });

  it("toggles via the chevron without triggering onOpen", () => {
    const p = props();
    render(<TagPickerTrigger {...p} />);
    fireEvent.click(screen.getByRole("button"));
    expect(p.onToggle).toHaveBeenCalled();
    expect(p.onOpen).not.toHaveBeenCalled();
  });
});

describe("TagPickerTrigger (v2)", () => {
  afterEach(() => setUiVersion("v1"));

  it("drops the border and sits on the raised input surface", () => {
    setUiVersion("v2");
    const { container } = render(<TagPickerTrigger {...props()} />);
    const root = container.firstElementChild;
    expect(root).toHaveClass(
      "h-9",
      "bg-app-raised",
      "rounded-[var(--r-input)]",
    );
    expect(root).not.toHaveClass("border", "bg-app-card");
  });
});

describe("TagPickerTrigger (v2 open state)", () => {
  afterEach(() => setUiVersion("v1"));

  it("marks the open state with the wallet ring and no inline colour", () => {
    setUiVersion("v2");
    const { container } = render(
      <TagPickerTrigger {...props({ isOpen: true })} />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("ring-2", "ring-wallet/40");
    expect(root.style.boxShadow).toBe("");
    expect(root.style.borderColor).toBe("");
  });

  it("keeps no ring when closed", () => {
    setUiVersion("v2");
    const { container } = render(<TagPickerTrigger {...props()} />);
    expect(container.firstElementChild).not.toHaveClass("ring-2");
  });
});
