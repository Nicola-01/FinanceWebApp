import { describe, it, expect } from "vitest";
import {
  addTagToDraft,
  DEFAULT_TAG_ICON,
  DEFAULT_TAG_COLOR,
} from "../../../../modals/wallet/wizardSteps/tagDraft";
import type { TagRequest } from "../../../../dashboard/settings/csvImport";

const tag = (name: string, parentName?: string): TagRequest => ({
  name,
  icon: "tag",
  colorHex: "#000",
  ...(parentName ? { parentName } : {}),
});

describe("addTagToDraft", () => {
  it("appends a custom tag with the generic icon and the wallet accent colour", () => {
    const next = addTagToDraft("My Custom", [], "#123456");
    expect(next).toEqual([
      { name: "My Custom", icon: DEFAULT_TAG_ICON, colorHex: "#123456" },
    ]);
  });

  it("falls back to the default colour when no accent is given", () => {
    expect(addTagToDraft("My Custom", [])).toEqual([
      {
        name: "My Custom",
        icon: DEFAULT_TAG_ICON,
        colorHex: DEFAULT_TAG_COLOR,
      },
    ]);
  });

  it("recreates the Recommended hierarchy for a known leaf (parent + child)", () => {
    // "Netflix" is a curated leaf under "Subscriptions".
    const next = addTagToDraft("Netflix", []);
    expect(next).toEqual([
      expect.objectContaining({ name: "Subscriptions" }),
      expect.objectContaining({ name: "Netflix", parentName: "Subscriptions" }),
    ]);
  });

  it("does not duplicate the parent when it is already staged", () => {
    const next = addTagToDraft("Netflix", [tag("Subscriptions")]);
    expect(next.filter((t) => t.name === "Subscriptions")).toHaveLength(1);
    expect(next).toContainEqual(
      expect.objectContaining({ name: "Netflix", parentName: "Subscriptions" }),
    );
  });

  it("is a no-op returning the same reference when the tag already exists", () => {
    const tags = [tag("Groceries")];
    // Case-insensitive match.
    expect(addTagToDraft("groceries", tags)).toBe(tags);
  });

  it("returns the same reference for a blank name", () => {
    const tags = [tag("Groceries")];
    expect(addTagToDraft("   ", tags)).toBe(tags);
  });
});
