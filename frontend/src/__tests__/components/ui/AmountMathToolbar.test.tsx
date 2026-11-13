import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRef, type ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AmountMathToolbar } from "../../../components/ui/AmountMathToolbar";
import { setUiVersion } from "../../../utils/uiVersion";

// Render framer-motion nodes as plain children (drop animation-only props).
vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get:
        () =>
        ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    },
  ),
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

const renderToolbar = () => {
  const onPress = vi.fn();
  const onResolve = vi.fn();
  render(
    <AmountMathToolbar
      open
      toolbarRef={createRef<HTMLDivElement>()}
      keyboardHeight={0}
      onPress={onPress}
      onResolve={onResolve}
    />,
  );
  return { onPress, onResolve };
};

describe("AmountMathToolbar v2", () => {
  beforeEach(() => setUiVersion("v2"));
  afterEach(() => {
    setUiVersion("v1");
    localStorage.clear();
  });

  it("renders flat raised keys and a wallet-filled equals button", () => {
    renderToolbar();
    const equals = screen.getByRole("button", { name: "=" });
    expect(equals.className).toContain("bg-wallet");
    expect(equals.className).toContain("text-on-wallet");
    expect(equals.className).not.toContain("bg-gradient-to-r");
    expect(screen.getByRole("button", { name: "+" }).className).toContain(
      "bg-app-raised",
    );
  });

  it("still forwards operator presses and the resolve action", async () => {
    const user = userEvent.setup();
    const { onPress, onResolve } = renderToolbar();
    await user.click(screen.getByRole("button", { name: "+" }));
    expect(onPress).toHaveBeenCalledWith("+");
    await user.click(screen.getByRole("button", { name: "=" }));
    expect(onResolve).toHaveBeenCalledTimes(1);
  });
});
