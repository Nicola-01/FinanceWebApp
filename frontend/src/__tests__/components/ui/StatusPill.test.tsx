import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { StatusPill } from "../../../components/ui/StatusPill";

describe("StatusPill", () => {
  it("renders its text", () => {
    render(<StatusPill status="ok">On track</StatusPill>);
    expect(screen.getByText("On track")).toBeInTheDocument();
  });

  it.each([
    ["ok", "text-app-income", "circle-check"],
    ["warn", "text-app-warn", "triangle-exclamation"],
    ["danger", "text-app-danger", "circle-exclamation"],
  ] as const)(
    "applies the colour class and default icon for %s",
    (status, colourClass, iconName) => {
      const { container } = render(
        <StatusPill status={status}>Label</StatusPill>,
      );
      const pill = container.firstElementChild as HTMLElement;
      expect(pill).toHaveClass(colourClass);
      expect(pill.querySelector("svg")).toHaveAttribute("data-icon", iconName);
      expect(pill.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    },
  );

  it("replaces the default icon with a custom one", () => {
    const { container } = render(
      <StatusPill status="ok" icon={faStar}>
        Starred
      </StatusPill>,
    );
    expect(container.querySelector("svg")).toHaveAttribute("data-icon", "star");
  });
});
