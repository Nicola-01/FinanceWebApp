import { describe, it, expect, vi } from "vitest";
import { useRef, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { TagDropdownPanel } from "../../../components/tags/TagDropdownPanel";

// Mirrors the callers: the panel mounts only after the anchor wrapper exists,
// which is what lets the Popover portal resolve its container.
const Harness = ({ onClose }: { onClose: () => void }) => {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <div ref={anchorRef} data-testid="anchor">
      <button type="button" onClick={() => setOpen(true)}>
        Trigger
      </button>
      {open && (
        <TagDropdownPanel anchorRef={anchorRef} onClose={onClose}>
          <div>Panel row</div>
        </TagDropdownPanel>
      )}
    </div>
  );
};

describe("TagDropdownPanel", () => {
  it("renders its content inside the anchor and closes on Escape", async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    fireEvent.click(screen.getByText("Trigger"));

    const row = await screen.findByText("Panel row");
    expect(screen.getByTestId("anchor")).toContainElement(row);

    fireEvent.keyDown(row, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
