import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TagPickerTrigger } from "../../../components/tags/TagPickerTrigger";
import type { Tag } from "../../../types/domain";

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
