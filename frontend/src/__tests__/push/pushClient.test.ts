import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../api/axiosConfig", () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

import api from "../../api/axiosConfig";
import {
  urlBase64ToUint8Array,
  keyToBase64,
  subscribeThisDevice,
} from "../../push/pushClient";

const mockedGet = api.get as unknown as ReturnType<typeof vi.fn>;
const mockedPost = api.post as unknown as ReturnType<typeof vi.fn>;

// A real VAPID public key (base64url) so urlBase64ToUint8Array decodes cleanly.
const VAPID_KEY =
  "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";

function stubBrowserPush(subscribeImpl: ReturnType<typeof vi.fn>): {
  getSubscription: ReturnType<typeof vi.fn>;
} {
  vi.stubGlobal("PushManager", class {});
  vi.stubGlobal("Notification", {
    permission: "default",
    requestPermission: vi.fn().mockResolvedValue("granted"),
  });
  const getSubscription = vi.fn().mockResolvedValue(null);
  const registration = {
    pushManager: { subscribe: subscribeImpl, getSubscription },
  };
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { ready: Promise.resolve(registration) },
  });
  Object.defineProperty(navigator, "userAgent", {
    configurable: true,
    value: "test-agent",
  });
  return { getSubscription };
}

describe("pushClient encoding helpers", () => {
  it("urlBase64ToUint8Array decodes a known base64 vector", () => {
    // "AQID" is base64 for the bytes [1, 2, 3].
    expect(Array.from(urlBase64ToUint8Array("AQID"))).toEqual([1, 2, 3]);
  });

  it("urlBase64ToUint8Array handles base64url chars and padding", () => {
    // "-_8" (base64url) → "+/8" (base64) → bytes [251, 255].
    expect(Array.from(urlBase64ToUint8Array("-_8"))).toEqual([251, 255]);
  });

  it("keyToBase64 encodes an ArrayBuffer and handles null", () => {
    expect(keyToBase64(new Uint8Array([1, 2, 3]).buffer)).toBe("AQID");
    expect(keyToBase64(null)).toBe("");
  });
});

describe("subscribeThisDevice", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns disabled-server when the public key is empty", async () => {
    stubBrowserPush(vi.fn());
    mockedGet.mockResolvedValue({ data: { publicKey: "" } });

    const result = await subscribeThisDevice();

    expect(result).toBe("disabled-server");
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it("subscribes and posts the subscription JSON on success", async () => {
    const subscription = {
      endpoint: "https://push.example/abc",
      getKey: (name: string) =>
        name === "p256dh"
          ? new Uint8Array([1, 2, 3]).buffer
          : new Uint8Array([4, 5]).buffer,
    };
    stubBrowserPush(vi.fn().mockResolvedValue(subscription));
    mockedGet.mockResolvedValue({ data: { publicKey: VAPID_KEY } });
    mockedPost.mockResolvedValue({ data: {} });

    const result = await subscribeThisDevice();

    expect(result).toBe("subscribed");
    expect(mockedPost).toHaveBeenCalledWith("/push/subscriptions", {
      endpoint: "https://push.example/abc",
      p256dh: "AQID",
      auth: "BAU=",
      userAgent: "test-agent",
    });
  });
});
