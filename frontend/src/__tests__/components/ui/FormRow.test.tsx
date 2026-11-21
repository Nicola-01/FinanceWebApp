import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { faTag } from "@fortawesome/free-solid-svg-icons";
import { FormRow } from "../../../components/ui/FormRow";

describe("FormRow", () => {
  it("renders the label and the control", () => {
    render(
      <FormRow icon={faTag} label="Name">
        <input aria-label="name-control" />
      </FormRow>,
    );
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("name-control")).toBeInTheDocument();
  });

  it("shows a required marker only when required", () => {
    const { rerender } = render(
      <FormRow icon={faTag} label="Category" required>
        <span>x</span>
      </FormRow>,
    );
    expect(screen.getByText("*")).toBeInTheDocument();
    rerender(
      <FormRow icon={faTag} label="Category">
        <span>x</span>
      </FormRow>,
    );
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("renders the optional sub line", () => {
    render(
      <FormRow icon={faTag} label="Reminder" sub="fill it in each time">
        <span>x</span>
      </FormRow>,
    );
    expect(screen.getByText("fill it in each time")).toBeInTheDocument();
  });

  it("applies extra row and control classes", () => {
    const { container } = render(
      <FormRow
        icon={faTag}
        label="Name"
        className="extra-row"
        controlClassName="extra-control"
      >
        <span>x</span>
      </FormRow>,
    );
    expect(container.firstChild).toHaveClass("extra-row");
    expect(container.querySelector(".extra-control")).not.toBeNull();
  });
});
