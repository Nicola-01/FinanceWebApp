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

    it("renders the animated SegmentedControl as a labelled tablist", () => {
      render(<Selector options={options} value="a" onChange={() => {}} />);
      expect(
        screen.getByRole("tablist", { name: "Options" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Alpha" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    it("uses ariaLabel as the group's accessible name", () => {
      render(
        <Selector
          options={options}
          value="a"
          onChange={() => {}}
          ariaLabel="Transaction type"
        />,
      );
      expect(
        screen.getByRole("tablist", { name: "Transaction type" }),
      ).toBeInTheDocument();
    });

    it("fills the sliding highlight with accentColor and turns the chosen text on-wallet", () => {
      render(
        <Selector
          options={options}
          value="a"
          onChange={() => {}}
          accentColor="#f2cc2f"
        />,
      );
      expect(
        document.querySelector('[data-slot="motion-highlight-indicator"]'),
      ).toHaveClass("bg-wallet");
      expect(screen.getByRole("tab", { name: "Alpha" })).toHaveClass(
        "text-on-wallet",
      );
    });

    it("keeps the default neutral highlight without accentColor", () => {
      render(<Selector options={options} value="a" onChange={() => {}} />);
      expect(
        document.querySelector('[data-slot="motion-highlight-indicator"]'),
      ).toHaveClass("bg-app-card");
      expect(screen.getByRole("tab", { name: "Alpha" })).toHaveClass(
        "text-app-text",
      );
    });

    it("recolours the active icon through the on-wallet svg rule with accentColor", () => {
      render(
        <Selector
          options={iconOptions}
          value="a"
          onChange={() => {}}
          accentColor="#f2cc2f"
        />,
      );
      expect(screen.getByRole("tab", { name: "Alpha" })).toHaveClass(
        "[&[data-active]_svg]:text-on-wallet",
      );
    });

    it("darkens the active icon in light and keeps the wallet colour in dark", () => {
      render(<Selector options={iconOptions} value="a" onChange={() => {}} />);
      expect(screen.getByRole("tab", { name: "Alpha" })).toHaveClass(
        "[&[data-active]_svg]:text-[color-mix(in_srgb,var(--wallet),#000_30%)]",
      );
    });

    it("applies activeColorClass to the chosen tab text", () => {
      render(
        <Selector
          options={[
            { value: "a", label: "Alpha", activeColorClass: "text-app-income" },
            { value: "b", label: "Beta" },
          ]}
          value="a"
          onChange={() => {}}
        />,
      );
      expect(screen.getByRole("tab", { name: "Alpha" })).toHaveClass(
        "text-app-income",
      );
    });

    it("marks inactive segments muted with a hover to text", () => {
      render(<Selector options={options} value="a" onChange={() => {}} />);
      const inactive = screen.getByRole("tab", { name: "Beta" });
      expect(inactive.className).toContain("text-app-muted");
      expect(inactive.className).toContain("hover:text-app-text");
    });

    it("lets a per-option className replace the muted inactive colour", () => {
      const tinted: SelectorOption<string>[] = [
        { value: "a", label: "Alpha", className: "text-app-income opacity-70" },
        { value: "b", label: "Beta" },
      ];
      render(<Selector options={tinted} value="b" onChange={() => {}} />);
      const inactive = screen.getByRole("tab", { name: "Alpha" });
      expect(inactive).toHaveClass("text-app-income", "opacity-70");
      expect(inactive.className).not.toContain("text-app-muted");
    });

    it("disables the tab and uses disabledTitle as its tooltip", () => {
      render(
        <Selector
          options={[
            { value: "a", label: "Alpha" },
            {
              value: "b",
              label: "Beta",
              disabled: true,
              disabledTitle: "Nope",
            },
          ]}
          value="a"
          onChange={() => {}}
        />,
      );
      const disabled = screen.getByRole("tab", { name: "Beta" });
      expect(disabled).toHaveAttribute("title", "Nope");
      expect(disabled).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("v2 active icon", () => {
    beforeEach(() => setUiVersion("v2"));
    afterEach(() => setUiVersion("v1"));

    it("darkens the active icon in light and keeps the wallet colour in dark", () => {
      render(
        <Selector
          ariaLabel="Tabs"
          value="a"
          onChange={() => {}}
          options={[
            { value: "a", icon: <svg data-testid="icon-a" /> },
            { value: "b", icon: <svg data-testid="icon-b" /> },
          ]}
        />,
      );
      const active = screen.getByTestId("icon-a").closest("[role=tab]")!;
      expect(active.className).toContain(
        "[&[data-active]_svg]:text-[color-mix(in_srgb,var(--wallet),#000_30%)]",
      );
    });
  });
});
