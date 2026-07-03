import { describe, it, expect } from "vitest";
import { ICONS, ICON_CATEGORIES } from "./icons";

describe("ICONS", () => {
  it("resolves a known icon key to a FontAwesome definition", () => {
    const icon = ICONS.wallet;
    expect(icon).toBeDefined();
    expect(icon.iconName).toBe("wallet");
    expect(icon.prefix).toBe("fas");
    expect(Array.isArray(icon.icon)).toBe(true);
  });

  it("returns undefined for an unknown icon key (graceful lookup)", () => {
    const lookup = ICONS as Record<string, unknown>;
    expect(lookup["not-a-real-icon"]).toBeUndefined();
    expect(lookup[""]).toBeUndefined();
  });

  it("exposes a non-empty icon map", () => {
    expect(Object.keys(ICONS).length).toBeGreaterThan(0);
  });
});

describe("ICON_CATEGORIES", () => {
  it("references only keys that exist in ICONS", () => {
    for (const [category, keys] of Object.entries(ICON_CATEGORIES)) {
      for (const key of keys) {
        expect(ICONS[key], `${category} -> ${key}`).toBeDefined();
      }
    }
  });

  it("has at least one category, each with at least one entry", () => {
    const categories = Object.values(ICON_CATEGORIES);
    expect(categories.length).toBeGreaterThan(0);
    expect(categories.every((keys) => keys.length > 0)).toBe(true);
  });
});
