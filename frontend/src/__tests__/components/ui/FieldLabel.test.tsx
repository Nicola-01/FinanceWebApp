import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FieldLabel } from "../../../components/ui/FieldLabel";

describe("FieldLabel", () => {
  it("renders its children in a <label> with the shared field-label classes", () => {
    render(<FieldLabel>Name</FieldLabel>);
    const label = screen.getByText("Name");
    expect(label.tagName).toBe("LABEL");
    expect(label).toHaveClass(
      "mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted",
    );
  });
});
