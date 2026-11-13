import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { Input } from "../../../components/ui/Input";
import { setUiVersion } from "../../../utils/uiVersion";

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

  describe("v2 UI", () => {
    beforeEach(() => {
      setUiVersion("v2");
    });

    afterEach(() => {
      setUiVersion("v1");
      localStorage.clear();
    });

    it("renders a borderless raised field with a wallet focus ring", () => {
      render(<Input placeholder="Amount" />);
      const field = screen.getByPlaceholderText("Amount");
      const wrapper = field.parentElement as HTMLElement;
      expect(wrapper.className).toContain("bg-app-raised");
      expect(wrapper.className).toContain("focus-within:ring-wallet/40");
      expect(wrapper.className).not.toContain("border-app-border");
      expect(field.className).toContain("placeholder:text-app-faint");
    });

    it("shows a danger ring instead of a border when invalid", () => {
      const { container } = render(<Input placeholder="Name" invalid />);
      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper.className).toContain("ring-app-danger");
      expect(wrapper.className).not.toContain("border-app-red");
    });

    it("still forwards changes to onChange", () => {
      const onChange = vi.fn();
      render(<Input placeholder="Amount" onChange={onChange} />);
      fireEvent.change(screen.getByPlaceholderText("Amount"), {
        target: { value: "42" },
      });
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });
});
