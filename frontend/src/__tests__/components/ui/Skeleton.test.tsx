import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Skeleton } from "../../../components/ui/Skeleton";

describe("Skeleton", () => {
  it("renders a hidden pulsing block with the shared surface", () => {
    const { container } = render(<Skeleton className="h-8 w-48" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe("DIV");
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).toHaveClass(
      "animate-pulse",
      "rounded-md",
      "bg-app-raised",
      "motion-reduce:animate-none",
      "h-8",
      "w-48",
    );
  });

  it("lets a passed radius override the default", () => {
    const { container } = render(<Skeleton className="rounded-[11px]" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveClass("rounded-[11px]");
    expect(el).not.toHaveClass("rounded-md");
  });

  it("forwards extra props such as data attributes", () => {
    const { container } = render(<Skeleton data-testid="sk" />);
    expect(container.querySelector('[data-testid="sk"]')).not.toBeNull();
  });
});
