import { describe, it, expect, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PasswordRequirements } from "../../../components/password/PasswordRequirements";
import { setUiVersion } from "../../../utils/uiVersion";

const row = (label: string) => screen.getByText(label).parentElement!;

describe("PasswordRequirements", () => {
  afterEach(() => setUiVersion("v1"));

  it("uses the v2 status tokens for met, failed and pending rows", () => {
    setUiVersion("v2");
    render(<PasswordRequirements password="Aa1!aaaa" />);
    expect(row("At least 8 characters")).toHaveClass("text-app-income");
    expect(row("At least 8 characters")).toHaveClass("text-[13px]");
    expect(row("At least 8 characters")).not.toHaveClass("font-app-mono");
  });

  it("marks a typed but unmet requirement as failed in v2", () => {
    setUiVersion("v2");
    render(<PasswordRequirements password="abc" />);
    expect(row("At least 8 characters")).toHaveClass("text-app-danger");
    expect(row("At least 8 characters")).not.toHaveClass("text-app-green");
  });

  it("marks requirements as pending (muted) before anything is typed in v2", () => {
    setUiVersion("v2");
    render(<PasswordRequirements password="" />);
    expect(row("One uppercase letter")).toHaveClass("text-app-muted");
  });

  it("keeps the v1 colour classes", () => {
    setUiVersion("v1");
    render(<PasswordRequirements password="Aa1!aaaa" />);
    expect(row("At least 8 characters")).toHaveClass("text-app-green");
    expect(row("At least 8 characters")).not.toHaveClass("text-app-income");
  });
});
