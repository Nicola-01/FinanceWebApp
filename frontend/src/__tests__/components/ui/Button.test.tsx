import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Button from "../../../components/ui/Button";
import { setUiVersion } from "../../../utils/uiVersion";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole("button", { name: "Click me" }),
    ).toBeInTheDocument();
  });

  it("applies the default primary + md classes", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    // primary variant → brand gradient; md size → CTA radius token.
    expect(button.className).toContain("from-[var(--brand-1)]");
    expect(button.className).toContain("rounded-[var(--r-cta)]");
  });

  it.each([
    ["secondary", "bg-app-input"],
    ["ghost", "text-app-muted"],
    ["danger", "bg-app-red"],
  ] as const)("applies the %s variant classes", (variant, expected) => {
    render(<Button variant={variant}>Label</Button>);
    expect(screen.getByRole("button", { name: "Label" }).className).toContain(
      expected,
    );
  });

  it("applies the sm size radius token", () => {
    render(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button", { name: "Small" }).className).toContain(
      "rounded-[var(--r-sm)]",
    );
  });

  it("renders a square icon button with no label padding", () => {
    render(
      <Button size="icon" aria-label="Close">
        <span>x</span>
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Close" });
    expect(button).toHaveClass("h-9", "w-9", "p-0", "rounded-[var(--r-input)]");
    expect(button).not.toHaveClass("px-4", "py-2.5");
  });

  it("keeps the icon button square in v2 too", () => {
    setUiVersion("v2");
    render(
      <Button variant="ghost" size="icon" aria-label="Close">
        <span>x</span>
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Close" });
    expect(button).toHaveClass("h-9", "w-9", "hover:bg-app-raised");
    setUiVersion("v1");
  });

  it("adds w-full when fullWidth is set", () => {
    render(<Button fullWidth>Wide</Button>);
    expect(screen.getByRole("button", { name: "Wide" }).className).toContain(
      "w-full",
    );
  });

  it("fires onClick when enabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await user.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire onClick when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Off
      </Button>,
    );
    await user.click(screen.getByRole("button", { name: "Off" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("spawns a ripple element on pointer down when ripple is enabled", () => {
    const { container } = render(<Button ripple>Ripple</Button>);
    const button = screen.getByRole("button", { name: "Ripple" });
    expect(container.querySelector('span[aria-hidden="true"]')).toBeNull();
    fireEvent.pointerDown(button, { clientX: 5, clientY: 5 });
    expect(container.querySelector('span[aria-hidden="true"]')).not.toBeNull();
  });

  it("does not spawn a ripple when disabled", () => {
    const { container } = render(
      <Button ripple disabled>
        Ripple
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Ripple" });
    fireEvent.pointerDown(button, { clientX: 5, clientY: 5 });
    expect(container.querySelector('span[aria-hidden="true"]')).toBeNull();
  });

  it("keeps the v1 gradient primary when the v1 UI is active", () => {
    setUiVersion("v1");
    render(<Button>Legacy</Button>);
    const button = screen.getByRole("button", { name: "Legacy" });
    expect(button.className).toContain("from-[var(--brand-1)]");
    expect(button.className).not.toContain("bg-wallet");
  });

  describe("v2 UI", () => {
    beforeEach(() => {
      setUiVersion("v2");
    });

    afterEach(() => {
      setUiVersion("v1");
      localStorage.clear();
    });

    it("renders the primary as a solid wallet fill, not the gradient", () => {
      render(<Button>Save</Button>);
      const button = screen.getByRole("button", { name: "Save" });
      expect(button.className).toContain("bg-wallet");
      expect(button.className).toContain("text-on-wallet");
      expect(button.className).not.toContain("from-[var(--brand-1)]");
    });

    it("sets the wallet and on-wallet vars for accentColor without an inline background", () => {
      render(<Button accentColor="#f2cc2f">Pay</Button>);
      const button = screen.getByRole("button", { name: "Pay" });
      expect(button.style.getPropertyValue("--wallet")).toBe("#f2cc2f");
      expect(button.style.getPropertyValue("--on-wallet")).toBe("#1d1a10");
      expect(button.style.backgroundColor).toBe("");
    });

    it("applies the flat secondary surface with the box ring", () => {
      render(<Button variant="secondary">Cancel</Button>);
      const button = screen.getByRole("button", { name: "Cancel" });
      expect(button.className).toContain("bg-app-card");
      expect(button.className).toContain("shadow-[var(--box-ring)]");
      expect(button.className).not.toContain("bg-app-input");
    });

    it("uses the 2px text-coloured outline focus instead of the ring", () => {
      render(<Button>Focus</Button>);
      const button = screen.getByRole("button", { name: "Focus" });
      expect(button.className).toContain("focus-visible:outline-app-text");
      expect(button.className).not.toContain("focus-visible:ring-2");
      expect(button.className).not.toContain("tracking-wide");
    });
  });
});
