import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Collapse } from "../../../components/ui/Collapse";

describe("Collapse", () => {
  it("renders the title but hides children when closed by default", () => {
    render(
      <Collapse title="Settings">
        <p>Secret content</p>
      </Collapse>,
    );
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.queryByText("Secret content")).not.toBeInTheDocument();
  });

  it("shows children when defaultOpen is set", () => {
    render(
      <Collapse title="Settings" defaultOpen>
        <p>Secret content</p>
      </Collapse>,
    );
    expect(screen.getByText("Secret content")).toBeInTheDocument();
  });

  it("toggles children visibility when the header is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Collapse title="Settings">
        <p>Secret content</p>
      </Collapse>,
    );
    expect(screen.queryByText("Secret content")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /settings/i }));
    expect(screen.getByText("Secret content")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /settings/i }));
    expect(screen.queryByText("Secret content")).not.toBeInTheDocument();
  });
});
