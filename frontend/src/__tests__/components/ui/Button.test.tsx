import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Button from "../../../components/ui/Button";

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
});
