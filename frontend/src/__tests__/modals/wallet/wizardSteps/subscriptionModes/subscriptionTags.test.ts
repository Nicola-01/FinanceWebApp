import { describe, it, expect } from "vitest";
import {
  subscriptionTagUnresolved,
  hasUnresolvedSubscriptionTags,
} from "../../../../../modals/wallet/wizardSteps/subscriptionModes/subscriptionTags";
import type {
  SubscriptionRequest,
  TagRequest,
} from "../../../../../dashboard/settings/csvImport";

const sub = (tag: string): SubscriptionRequest =>
  ({ name: "S", tag }) as SubscriptionRequest;

const tag = (name: string): TagRequest => ({
  name,
  icon: "tag",
  colorHex: "#000",
});

describe("subscriptionTagUnresolved", () => {
  it("is true when the tag isn't among the staged tags", () => {
    expect(subscriptionTagUnresolved(sub("Netflix"), [tag("Rent")])).toBe(true);
  });

  it("matches tag names case-insensitively and trimmed", () => {
    expect(subscriptionTagUnresolved(sub("  netflix "), [tag("Netflix")])).toBe(
      false,
    );
  });

  it("treats an empty (or missing) tag as uncategorised, not unresolved", () => {
    expect(subscriptionTagUnresolved(sub(""), [])).toBe(false);
    expect(
      subscriptionTagUnresolved({ name: "S" } as SubscriptionRequest, []),
    ).toBe(false);
  });
});

describe("hasUnresolvedSubscriptionTags", () => {
  it("is true when any staged subscription has an unresolved tag", () => {
    const subs = [sub("Rent"), sub("Netflix")];
    expect(hasUnresolvedSubscriptionTags(subs, [tag("Rent")])).toBe(true);
  });

  it("is false when every tag resolves (or the list is empty)", () => {
    expect(hasUnresolvedSubscriptionTags([], [])).toBe(false);
    expect(
      hasUnresolvedSubscriptionTags(
        [sub("Rent"), sub("Netflix")],
        [tag("Rent"), tag("Netflix")],
      ),
    ).toBe(false);
  });
});
