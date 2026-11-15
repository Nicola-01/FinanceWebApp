import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InfoTip } from "../../../components/ui/InfoTip";

describe("InfoTip", () => {
  it("shows its explanation when the trigger is clicked", async () => {
    render(<InfoTip label="How it works">The range is the 80% band.</InfoTip>);
    expect(screen.queryByText("The range is the 80% band.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "How it works" }));
    expect(
      await screen.findByText("The range is the 80% band."),
    ).toBeInTheDocument();
  });
});
