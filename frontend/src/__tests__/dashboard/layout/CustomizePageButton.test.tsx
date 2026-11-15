import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CustomizePageButton } from "../../../dashboard/layout/CustomizePageButton";

describe("CustomizePageButton", () => {
  it("renders a centred ghost button that calls onClick", () => {
    const onClick = vi.fn();
    const { container } = render(<CustomizePageButton onClick={onClick} />);

    expect(container.firstElementChild).toHaveClass("flex", "justify-center");
    fireEvent.click(
      screen.getByRole("button", { name: "Customize this page" }),
    );
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
