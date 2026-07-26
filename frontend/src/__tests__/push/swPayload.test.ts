import { describe, it, expect } from "vitest";
import { notificationTargetUrl } from "../../push/swPayload";

describe("notificationTargetUrl", () => {
  it("appends notif with & when the url already has a query", () => {
    expect(
      notificationTargetUrl({
        url: "/dashboard/w1?tab=transactions",
        notificationId: "abc",
      }),
    ).toBe("/dashboard/w1?tab=transactions&notif=abc");
  });

  it("appends notif with ? when the url has no query", () => {
    expect(
      notificationTargetUrl({ url: "/dashboard", notificationId: "xyz" }),
    ).toBe("/dashboard?notif=xyz");
  });

  it("falls back to /dashboard when the url is missing", () => {
    expect(notificationTargetUrl({ url: "", notificationId: "id1" })).toBe(
      "/dashboard?notif=id1",
    );
  });

  it("returns the base url unchanged when there is no notificationId", () => {
    expect(
      notificationTargetUrl({ url: "/dashboard/w1", notificationId: "" }),
    ).toBe("/dashboard/w1");
  });
});
