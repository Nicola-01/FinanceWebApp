import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  formatInvitedAt,
  roleCapability,
} from "../../../modals/wallet/inviteCopy";

const titleText = (role: string) =>
  render(<>{roleCapability(role).title}</>).container.textContent;

describe("roleCapability", () => {
  it("describes each role in plain language, case-insensitively", () => {
    expect(titleText("viewer")).toBe("You can view this wallet");
    expect(roleCapability("VIEWER").detail).toMatch(/read-only/);
    expect(titleText("OWNER")).toBe("You get full access to this wallet");
    expect(titleText("Editor")).toBe("You can view and edit this wallet");
  });

  it("falls back to the editor copy for unknown roles", () => {
    expect(roleCapability("SOMETHING").detail).toBe(
      roleCapability("EDITOR").detail,
    );
  });
});

describe("formatInvitedAt", () => {
  it("formats a valid ISO date with a long month", () => {
    const expected = new Date("2026-07-05T10:00:00").toLocaleDateString(
      undefined,
      { day: "numeric", month: "long", year: "numeric" },
    );
    expect(formatInvitedAt("2026-07-05T10:00:00")).toBe(expected);
  });

  it("returns the raw string when it is not a date", () => {
    expect(formatInvitedAt("not-a-date")).toBe("not-a-date");
  });
});
