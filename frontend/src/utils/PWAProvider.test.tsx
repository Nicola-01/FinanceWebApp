import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { PWAProvider } from "./PWAProvider";
import { usePWA } from "./PWAContext";
import type { BeforeInstallPromptEvent } from "../types/pwa";

// Builds a fake `beforeinstallprompt` event with a resolvable userChoice.
const makePromptEvent = (
  outcome: "accepted" | "dismissed",
  promptImpl?: () => Promise<void>,
): BeforeInstallPromptEvent => {
  const event = new Event("beforeinstallprompt");
  return Object.assign(event, {
    platforms: ["web"],
    userChoice: Promise.resolve({ outcome, platform: "web" }),
    prompt: promptImpl ?? (() => Promise.resolve()),
  }) as unknown as BeforeInstallPromptEvent;
};

const Consumer = () => {
  const { installPrompt, installApp } = usePWA();
  return (
    <div>
      <span data-testid="has-prompt">{installPrompt ? "yes" : "no"}</span>
      <button onClick={() => void installApp()}>install</button>
    </div>
  );
};

// Clicks the install button and flushes the userChoice microtask chain.
const clickInstall = async () => {
  await act(async () => {
    fireEvent.click(screen.getByText("install"));
    await Promise.resolve();
  });
};

describe("PWAProvider", () => {
  beforeEach(() => {
    window._pwaInstallPrompt = null;
  });

  afterEach(() => {
    window._pwaInstallPrompt = null;
    vi.restoreAllMocks();
  });

  it("exposes a null install prompt by default", () => {
    render(
      <PWAProvider>
        <Consumer />
      </PWAProvider>,
    );
    expect(screen.getByTestId("has-prompt").textContent).toBe("no");
  });

  it("initialises from a pre-captured window._pwaInstallPrompt", () => {
    window._pwaInstallPrompt = makePromptEvent("accepted");
    render(
      <PWAProvider>
        <Consumer />
      </PWAProvider>,
    );
    expect(screen.getByTestId("has-prompt").textContent).toBe("yes");
  });

  it("captures a beforeinstallprompt event fired on window", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    render(
      <PWAProvider>
        <Consumer />
      </PWAProvider>,
    );
    expect(screen.getByTestId("has-prompt").textContent).toBe("no");

    act(() => {
      window.dispatchEvent(makePromptEvent("accepted"));
    });
    expect(screen.getByTestId("has-prompt").textContent).toBe("yes");
    expect(window._pwaInstallPrompt).not.toBeNull();
  });

  it("prompts and clears the install prompt when the user accepts", async () => {
    const prompt = vi.fn(() => Promise.resolve());
    window._pwaInstallPrompt = makePromptEvent("accepted", prompt);
    render(
      <PWAProvider>
        <Consumer />
      </PWAProvider>,
    );
    expect(screen.getByTestId("has-prompt").textContent).toBe("yes");

    await clickInstall();
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("has-prompt").textContent).toBe("no");
  });

  it("keeps the prompt when the user dismisses the install", async () => {
    const prompt = vi.fn(() => Promise.resolve());
    window._pwaInstallPrompt = makePromptEvent("dismissed", prompt);
    render(
      <PWAProvider>
        <Consumer />
      </PWAProvider>,
    );

    await clickInstall();
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("has-prompt").textContent).toBe("yes");
  });

  it("does nothing when installApp is called without a prompt", async () => {
    render(
      <PWAProvider>
        <Consumer />
      </PWAProvider>,
    );
    expect(screen.getByTestId("has-prompt").textContent).toBe("no");

    await clickInstall();
    expect(screen.getByTestId("has-prompt").textContent).toBe("no");
  });
});
