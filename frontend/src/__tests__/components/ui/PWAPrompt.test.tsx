import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PWAPrompt } from "../../../components/ui/PWAPrompt";
import { setUiVersion } from "../../../utils/uiVersion";

const pwa = vi.hoisted(() => ({
  needRefresh: false,
  setNeedRefresh: vi.fn(),
  updateServiceWorker: vi.fn(),
}));

vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: () => ({
    needRefresh: [pwa.needRefresh, pwa.setNeedRefresh],
    updateServiceWorker: pwa.updateServiceWorker,
  }),
}));

describe("PWAPrompt", () => {
  beforeEach(() => {
    pwa.needRefresh = true;
    pwa.setNeedRefresh.mockClear();
    pwa.updateServiceWorker.mockClear();
  });

  afterEach(() => {
    setUiVersion("v1");
    localStorage.clear();
  });

  describe("v2 (bottom-sheet drawer)", () => {
    beforeEach(() => setUiVersion("v2"));

    it("shows the App update dialog when a refresh is ready", async () => {
      render(<PWAPrompt />);
      expect(
        await screen.findByRole("dialog", { name: "App update" }),
      ).toBeInTheDocument();
    });

    it("shows nothing when no refresh is pending", () => {
      pwa.needRefresh = false;
      render(<PWAPrompt />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("Reload applies the update", async () => {
      const user = userEvent.setup();
      render(<PWAPrompt />);
      await user.click(await screen.findByRole("button", { name: "Reload" }));
      expect(pwa.updateServiceWorker).toHaveBeenCalledWith(true);
    });

    it("Later dismisses via the setter", async () => {
      const user = userEvent.setup();
      render(<PWAPrompt />);
      await user.click(await screen.findByRole("button", { name: "Later" }));
      expect(pwa.setNeedRefresh).toHaveBeenCalledWith(false);
    });
  });

  describe("v1 (floating card)", () => {
    beforeEach(() => setUiVersion("v1"));

    it("keeps the status card with Reload and Later", async () => {
      const user = userEvent.setup();
      render(<PWAPrompt />);
      expect(screen.getByRole("status")).toHaveTextContent("App update");
      await user.click(screen.getByRole("button", { name: "Reload" }));
      expect(pwa.updateServiceWorker).toHaveBeenCalledWith(true);
      await user.click(screen.getByRole("button", { name: "Later" }));
      expect(pwa.setNeedRefresh).toHaveBeenCalledWith(false);
    });

    it("renders nothing when no refresh is pending", () => {
      pwa.needRefresh = false;
      const { container } = render(<PWAPrompt />);
      expect(container).toBeEmptyDOMElement();
    });
  });
});
