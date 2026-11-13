import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Menu } from "../../../components/ui/Menu";
import { setUiVersion } from "../../../utils/uiVersion";

const Demo = ({ onDelete }: { onDelete: () => void }) => (
  <Menu>
    <Menu.Trigger>
      {({ toggle, open }) => (
        <button type="button" onClick={toggle} aria-expanded={open}>
          Open
        </button>
      )}
    </Menu.Trigger>
    <Menu.Content>
      <Menu.Item tone="danger" onClick={onDelete}>
        Delete
      </Menu.Item>
    </Menu.Content>
  </Menu>
);

describe("Menu", () => {
  beforeEach(() => setUiVersion("v2"));
  afterEach(() => setUiVersion("v1"));

  it("renders a borderless card panel with a soft neutral shadow", () => {
    render(<Demo onDelete={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    const panel = screen.getByRole("menu");
    expect(panel).toHaveClass(
      "bg-app-card",
      "shadow-[0_8px_24px_rgb(0_0_0/0.25)]",
    );
    expect(panel.classList.contains("border")).toBe(false);
  });

  it("colours a danger item with the danger status token", () => {
    render(<Demo onDelete={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveClass(
      "text-app-danger",
    );
  });

  it("still runs the item action and closes the menu", () => {
    const onDelete = vi.fn();
    render(<Demo onDelete={onDelete} />);
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
