import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Selector, type SelectorOption } from "../../../components/ui/Selector";
import { setUiVersion } from "../../../utils/uiVersion";

const options: SelectorOption<string>[] = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
  { value: "c", label: "Gamma", disabled: true },
];

describe("Selector", () => {
  it("renders one button per option", () => {
    render(<Selector options={options} value="a" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Alpha" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Beta" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gamma" })).toBeInTheDocument();
  });

  it("uses `title` as the accessible name for an icon-only option", () => {
    render(
      <Selector
        value="v"
        onChange={() => {}}
        options={[
          { value: "v", title: "Viewer", icon: <span aria-hidden>👁</span> },
          { value: "e", title: "Editor", icon: <span aria-hidden>✏️</span> },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "Viewer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editor" })).toBeInTheDocument();
  });

  it("fires onChange with the selected option value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Selector options={options} value="a" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Beta" }));
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("marks the active option as bold and does not re-fire for it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Selector options={options} value="a" onChange={onChange} />);
    const active = screen.getByRole("button", { name: "Alpha" });
    expect(active.className).toContain("font-bold");
    await user.click(active);
    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("does not fire onChange for a disabled option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Selector options={options} value="a" onChange={onChange} />);
    const disabled = screen.getByRole("button", { name: "Gamma" });
    expect(disabled).toBeDisabled();
    await user.click(disabled);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps the v1 accent fill on the active segment", () => {
    render(
      <Selector
        options={options}
        value="a"
        onChange={() => {}}
        accentColor="#f2cc2f"
      />,
    );
    expect(screen.getByRole("button", { name: "Alpha" })).toHaveStyle({
      backgroundColor: "#f2cc2f",
    });
  });

  describe("v2 UI", () => {
    const iconOptions: SelectorOption<string>[] = [
      { value: "a", title: "Alpha", icon: <i data-testid="icon-a" /> },
      { value: "b", title: "Beta", icon: <i data-testid="icon-b" /> },
    ];

    beforeEach(() => {
      setUiVersion("v2");
    });

    afterEach(() => {
      setUiVersion("v1");
      localStorage.clear();
    });

    it("uses a raised neutral active segment with no inline fill, even with accentColor", () => {
      render(
        <Selector
          options={options}
          value="a"
          onChange={() => {}}
          accentColor="#f2cc2f"
        />,
      );
      const active = screen.getByRole("button", { name: "Alpha" });
      expect(active.className).toContain("bg-app-raised");
      expect(active.className).not.toContain("shadow-sm");
      expect(active.style.backgroundColor).toBe("");
    });

    it("colours the active icon with accentColor inline", () => {
      render(
        <Selector
          options={iconOptions}
          value="a"
          onChange={() => {}}
          accentColor="#f2cc2f"
        />,
      );
      const iconWrapper = screen.getByTestId("icon-a").parentElement!;
      expect(iconWrapper.style.color).toBe("rgb(242, 204, 47)");
      expect(iconWrapper.className).not.toContain("text-wallet");
    });

    it("falls back to the text-wallet class for the active icon without accentColor", () => {
      render(<Selector options={iconOptions} value="a" onChange={() => {}} />);
      const iconWrapper = screen.getByTestId("icon-a").parentElement!;
      expect(iconWrapper.className).toContain("text-wallet");
      expect(iconWrapper.style.color).toBe("");
      // Inactive icons stay unstyled.
      const inactiveWrapper = screen.getByTestId("icon-b").parentElement!;
      expect(inactiveWrapper.className).not.toContain("text-wallet");
    });

    it("lets a per-option activeBgClass win over the raised default", () => {
      render(
        <Selector
          options={[
            { value: "a", label: "Alpha", activeBgClass: "bg-red-500" },
            { value: "b", label: "Beta" },
          ]}
          value="a"
          onChange={() => {}}
        />,
      );
      const active = screen.getByRole("button", { name: "Alpha" });
      expect(active.className).toContain("bg-red-500");
      expect(active.className).not.toContain("bg-app-raised");
    });

    it("marks inactive segments muted with a hover to text", () => {
      render(<Selector options={options} value="a" onChange={() => {}} />);
      const inactive = screen.getByRole("button", { name: "Beta" });
      expect(inactive.className).toContain("text-app-muted");
      expect(inactive.className).toContain("hover:text-app-text");
    });

    it("lets a per-option className replace the muted inactive colour", () => {
      const tinted: SelectorOption<string>[] = [
        { value: "a", label: "Alpha", className: "text-app-income opacity-70" },
        { value: "b", label: "Beta" },
      ];
      render(<Selector options={tinted} value="b" onChange={() => {}} />);
      const inactive = screen.getByRole("button", { name: "Alpha" });
      expect(inactive).toHaveClass("text-app-income", "opacity-70");
      expect(inactive.className).not.toContain("text-app-muted");
    });
  });
});
