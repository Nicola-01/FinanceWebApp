import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PatShowTokenView } from "./PatShowTokenView";

const SECRET = "fin_pat_live_2b7f9c1d4e6a8b0c2d4e6f8a0b1c3d5e";

describe("PatShowTokenView", () => {
  let onCopy: ReturnType<typeof vi.fn>;
  let onDone: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onCopy = vi.fn();
    onDone = vi.fn();
  });

  it("renders the plaintext secret exactly once, inside the token <code> element", () => {
    render(
      <PatShowTokenView
        generatedToken={SECRET}
        copied={false}
        onCopy={onCopy}
        onDone={onDone}
      />,
    );
    const hits = screen.getAllByText(SECRET);
    expect(hits).toHaveLength(1);
    expect(hits[0].tagName.toLowerCase()).toBe("code");
    expect(hits[0]).toHaveAttribute("id", "pat-generated-token");
  });

  it("SECURITY: warns the secret is shown only once and will not be recoverable", () => {
    render(
      <PatShowTokenView
        generatedToken={SECRET}
        copied={false}
        onCopy={onCopy}
        onDone={onDone}
      />,
    );
    expect(screen.getByText(/copy your token now/i)).toBeInTheDocument();
    expect(
      screen.getByText(/only be shown once.*won't be able to see it again/i),
    ).toBeInTheDocument();
  });

  it("SECURITY: the secret is not leaked into control labels/attributes", () => {
    render(
      <PatShowTokenView
        generatedToken={SECRET}
        copied={false}
        onCopy={onCopy}
        onDone={onDone}
      />,
    );
    const copyBtn = screen.getByRole("button", { name: /copy to clipboard/i });
    const doneBtn = screen.getByRole("button", { name: /copied the token/i });
    // The raw secret must live only in the display node, never in a title/value
    // of the surrounding controls.
    expect(copyBtn.getAttribute("title")).not.toContain(SECRET);
    expect(copyBtn.textContent).not.toContain(SECRET);
    expect(doneBtn.textContent).not.toContain(SECRET);
  });

  it("invokes onCopy when the Copy button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <PatShowTokenView
        generatedToken={SECRET}
        copied={false}
        onCopy={onCopy}
        onDone={onDone}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: /copy to clipboard/i }),
    );
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it("invokes onDone when the confirm button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <PatShowTokenView
        generatedToken={SECRET}
        copied={false}
        onCopy={onCopy}
        onDone={onDone}
      />,
    );
    await user.click(screen.getByRole("button", { name: /copied the token/i }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("reflects the copied state on the Copy control", () => {
    const { rerender } = render(
      <PatShowTokenView
        generatedToken={SECRET}
        copied={false}
        onCopy={onCopy}
        onDone={onDone}
      />,
    );
    const before = screen.getByRole("button", { name: /copy to clipboard/i });
    expect(before.className).not.toContain("text-app-green");

    rerender(
      <PatShowTokenView
        generatedToken={SECRET}
        copied={true}
        onCopy={onCopy}
        onDone={onDone}
      />,
    );
    const after = screen.getByRole("button", { name: /copy to clipboard/i });
    expect(after.className).toContain("text-app-green");
  });
});
