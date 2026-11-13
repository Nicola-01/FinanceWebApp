import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getUiVersion,
  setUiVersion,
  applyUiVersion,
  subscribeUiVersion,
} from "../../utils/uiVersion";

describe("uiVersion", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.ui;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("defaults to v1 with empty storage", () => {
    expect(getUiVersion()).toBe("v1");
  });

  it("treats an unknown stored value as v1", () => {
    localStorage.setItem("ui-version", "v9");
    expect(getUiVersion()).toBe("v1");
  });

  it("setUiVersion persists, sets data-ui and notifies subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeUiVersion(listener);

    setUiVersion("v2");

    expect(localStorage.getItem("ui-version")).toBe("v2");
    expect(getUiVersion()).toBe("v2");
    expect(document.documentElement.dataset.ui).toBe("v2");
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    setUiVersion("v1");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("does not throw when storage throws and falls back to v1", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(getUiVersion()).toBe("v1");
    expect(() => setUiVersion("v2")).not.toThrow();
    expect(document.documentElement.dataset.ui).toBe("v2");
  });

  it("applyUiVersion sets the attribute from storage", () => {
    localStorage.setItem("ui-version", "v2");
    applyUiVersion();
    expect(document.documentElement.dataset.ui).toBe("v2");
  });
});
