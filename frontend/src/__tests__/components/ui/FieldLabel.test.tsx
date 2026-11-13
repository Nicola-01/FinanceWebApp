import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FieldLabel } from "../../../components/ui/FieldLabel";
import { setUiVersion } from "../../../utils/uiVersion";

describe("FieldLabel", () => {
  it("renders its children in a <label> with the shared field-label classes", () => {
    render(<FieldLabel>Name</FieldLabel>);
    const label = screen.getByText("Name");
    expect(label.tagName).toBe("LABEL");
    expect(label).toHaveClass(
      "mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted",
    );
  });

  describe("v2 UI", () => {
    beforeEach(() => {
      setUiVersion("v2");
    });

    afterEach(() => {
      setUiVersion("v1");
      localStorage.clear();
    });

    it("renders sentence-case 13px muted text without uppercase or tracking", () => {
      render(<FieldLabel>Name</FieldLabel>);
      const label = screen.getByText("Name");
      expect(label.tagName).toBe("LABEL");
      expect(label).toHaveClass("text-[13px] text-app-muted");
      expect(label.className).not.toContain("uppercase");
      expect(label.className).not.toContain("tracking-wider");
    });
  });
});
