import { describe, it, expect, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { setUiVersion } from "../../../utils/uiVersion";
import { SettingsBox } from "../../../dashboard/settings/SettingsBox";

afterEach(() => setUiVersion("v1"));

describe("SettingsBox", () => {
  it("v1 renders the legacy Card header (h2 + subtitle)", () => {
    setUiVersion("v1");
    render(
      <SettingsBox title="General Settings" description="Rename it">
        <p>body</p>
      </SettingsBox>,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "General Settings" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 3 })).not.toBeInTheDocument();
  });

  it("v2 renders a flat box with an h3 title and muted description", () => {
    setUiVersion("v2");
    render(
      <SettingsBox title="General" description="Rename it">
        <p>body</p>
      </SettingsBox>,
    );
    const title = screen.getByRole("heading", { level: 3, name: "General" });
    expect(title).toHaveClass("font-display", "text-app-text");
    expect(screen.getByText("Rename it")).toHaveClass("text-app-muted");
    expect(screen.getByText("body")).toBeInTheDocument();
  });

  it("v2 danger tone colours the title with the danger token", () => {
    setUiVersion("v2");
    render(<SettingsBox title="Danger zone" tone="danger" />);
    expect(
      screen.getByRole("heading", { level: 3, name: "Danger zone" }),
    ).toHaveClass("text-app-danger");
  });
});
