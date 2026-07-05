import { describe, it, expect, beforeEach } from "vitest";
import { getRecentColors, pushRecentColor } from "../../utils/recentColors";

describe("recentColors", () => {
  beforeEach(() => localStorage.clear());

  it("returns an empty list when nothing is stored", () => {
    expect(getRecentColors()).toEqual([]);
  });

  it("pushes the most recent colour to the front", () => {
    pushRecentColor("#111111");
    pushRecentColor("#222222");
    expect(getRecentColors()).toEqual(["#222222", "#111111"]);
  });

  it("deduplicates case-insensitively, moving the colour to the front", () => {
    pushRecentColor("#abcabc");
    pushRecentColor("#111111");
    pushRecentColor("#ABCABC"); // same as the first, different case

    const recents = getRecentColors();
    expect(recents).toEqual(["#ABCABC", "#111111"]);
    expect(recents).toHaveLength(2);
  });

  it("caps the list at 6 entries", () => {
    for (let i = 0; i < 10; i++) {
      pushRecentColor(`#00000${i}`);
    }
    expect(getRecentColors()).toHaveLength(6);
    // Most recent first.
    expect(getRecentColors()[0]).toBe("#000009");
  });

  it("ignores empty / whitespace input", () => {
    pushRecentColor("#111111");
    pushRecentColor("   ");
    expect(getRecentColors()).toEqual(["#111111"]);
  });

  it("recovers gracefully from malformed stored data", () => {
    localStorage.setItem("recent_tag_colors", "not json");
    expect(getRecentColors()).toEqual([]);
  });
});
