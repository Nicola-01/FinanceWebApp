import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { faTag } from "@fortawesome/free-solid-svg-icons";
import { DetailRow } from "../../../modals/common/DetailRow";

describe("DetailRow", () => {
  it("renders label + value with the default muted label", () => {
    const { container } = render(
      <DetailRow icon={faTag} label="Name">
        <span>Coffee</span>
      </DetailRow>,
    );
    expect(screen.getByText("Name")).toHaveClass("text-app-muted");
    expect(screen.getByText("Coffee")).toBeInTheDocument();
    expect(container.firstElementChild?.className).toBe(
      "flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-5",
    );
  });

  it("applies a custom label colour and row classes", () => {
    const { container } = render(
      <DetailRow
        icon={faTag}
        label="Frequency"
        labelColorClass="text-app-sky"
        className="bg-app-input"
      >
        <span>Monthly</span>
      </DetailRow>,
    );
    expect(screen.getByText("Frequency")).toHaveClass("text-app-sky");
    expect(container.firstElementChild).toHaveClass("bg-app-input");
  });
});
