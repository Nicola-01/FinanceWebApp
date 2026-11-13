import { describe, it, expect } from "vitest";
import { cn } from "../../lib/utils";

describe("cn", () => {
  it("merges conflicting tailwind classes, last one wins", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("drops falsy conditional classes", () => {
    const hidden = false;
    expect(cn("text-app-text", hidden && "hidden", null, undefined)).toBe(
      "text-app-text",
    );
  });
});
