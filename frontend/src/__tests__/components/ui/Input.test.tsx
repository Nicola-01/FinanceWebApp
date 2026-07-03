import { describe, it, expect } from "vitest";
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { Input } from "../../../components/ui/Input";

describe("Input", () => {
  it("passes through native props like placeholder and type", () => {
    render(<Input placeholder="Email" type="email" />);
    const input = screen.getByPlaceholderText("Email");
    expect(input).toHaveAttribute("type", "email");
  });

  it("applies the neutral border by default", () => {
    const { container } = render(<Input placeholder="Name" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("border-app-border");
    expect(wrapper.className).not.toContain("border-app-red");
  });

  it("applies the red border when invalid", () => {
    const { container } = render(<Input placeholder="Name" invalid />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("border-app-red");
  });

  it("renders the leading icon and right slot", () => {
    render(
      <Input
        placeholder="Password"
        leadingIcon={<span data-testid="lead">L</span>}
        rightSlot={<button type="button">show</button>}
      />,
    );
    expect(screen.getByTestId("lead")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "show" })).toBeInTheDocument();
  });

  it("forwards the ref to the underlying input element", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} placeholder="Ref" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toBe(screen.getByPlaceholderText("Ref"));
  });
});
