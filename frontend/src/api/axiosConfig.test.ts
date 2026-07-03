import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AxiosHeaders } from "axios";
import type {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosAdapter,
} from "axios";
import { stubLocation, setOnline } from "../test/testUtils";

vi.mock("../utils/offlineDb", () => ({
  offlineDb: {
    cache: { put: vi.fn().mockResolvedValue(undefined), get: vi.fn() },
    syncQueue: { add: vi.fn().mockResolvedValue(1) },
  },
}));

import api from "./axiosConfig";
import { offlineDb } from "../utils/offlineDb";

const cachePut = offlineDb.cache.put as unknown as ReturnType<typeof vi.fn>;
const cacheGet = offlineDb.cache.get as unknown as ReturnType<typeof vi.fn>;
const queueAdd = offlineDb.syncQueue.add as unknown as ReturnType<typeof vi.fn>;

interface InterceptorHandler {
  fulfilled: (value: unknown) => unknown;
  rejected: (error: unknown) => unknown;
}
const reqHandler = (
  api.interceptors.request as unknown as { handlers: InterceptorHandler[] }
).handlers[0];
const resHandler = (
  api.interceptors.response as unknown as { handlers: InterceptorHandler[] }
).handlers[0];

const cfg = (
  over: Partial<InternalAxiosRequestConfig>,
): InternalAxiosRequestConfig =>
  ({ headers: new AxiosHeaders(), ...over }) as InternalAxiosRequestConfig;

const resp = (
  config: InternalAxiosRequestConfig,
  data: unknown,
): AxiosResponse =>
  ({
    data,
    status: 200,
    statusText: "OK",
    headers: new AxiosHeaders(),
    config,
  }) as AxiosResponse;

interface FakeError {
  config: InternalAxiosRequestConfig;
  response?: { status: number };
  code?: string;
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  cachePut.mockReset().mockResolvedValue(undefined);
  cacheGet.mockReset();
  queueAdd.mockReset().mockResolvedValue(1);
  setOnline(true);
});
afterEach(() => {
  api.defaults.adapter = undefined;
  vi.restoreAllMocks();
});

describe("request interceptor", () => {
  it.each([
    "/auth/login",
    "/auth/register",
    "/auth/demo",
    "/auth/forgot-password",
    "/auth/reset-password",
  ])("SECURITY: never attaches Authorization to public endpoint %s", (url) => {
    localStorage.setItem("jwtToken", "tok");
    const out = reqHandler.fulfilled(
      cfg({ url }),
    ) as InternalAxiosRequestConfig;
    expect((out.headers as AxiosHeaders).has("Authorization")).toBe(false);
  });

  it("attaches the Bearer token to protected endpoints", () => {
    localStorage.setItem("jwtToken", "tok");
    const out = reqHandler.fulfilled(
      cfg({ url: "/wallets" }),
    ) as InternalAxiosRequestConfig;
    expect((out.headers as AxiosHeaders).get("Authorization")).toBe(
      "Bearer tok",
    );
  });

  it("reads the token from sessionStorage as a fallback", () => {
    sessionStorage.setItem("jwtToken", "stok");
    const out = reqHandler.fulfilled(
      cfg({ url: "/wallets" }),
    ) as InternalAxiosRequestConfig;
    expect((out.headers as AxiosHeaders).get("Authorization")).toBe(
      "Bearer stok",
    );
  });

  it("attaches no header when there is no token", () => {
    const out = reqHandler.fulfilled(
      cfg({ url: "/wallets" }),
    ) as InternalAxiosRequestConfig;
    expect((out.headers as AxiosHeaders).has("Authorization")).toBe(false);
  });
});

describe("response interceptor — caching", () => {
  it("caches GET responses", async () => {
    await resHandler.fulfilled(
      resp(cfg({ method: "get", url: "/wallets" }), { a: 1 }),
    );
    expect(cachePut).toHaveBeenCalledWith({
      url: "/wallets",
      data: { a: 1 },
      timestamp: expect.any(Number),
    });
  });

  it("does not cache non-GET responses", async () => {
    await resHandler.fulfilled(
      resp(cfg({ method: "post", url: "/wallets" }), {}),
    );
    expect(cachePut).not.toHaveBeenCalled();
  });

  it("swallows cache-write errors and still returns the response", async () => {
    cachePut.mockRejectedValueOnce(new Error("db fail"));
    const res = resp(cfg({ method: "get", url: "/x" }), {});
    await expect(resHandler.fulfilled(res)).resolves.toBe(res);
  });
});

describe("response interceptor — offline fallback", () => {
  it("serves a cached GET on network error", async () => {
    setOnline(false);
    cacheGet.mockResolvedValue({ data: { cached: true } });
    const error: FakeError = {
      config: cfg({ method: "get", url: "/wallets" }),
      code: "ERR_NETWORK",
    };
    const res = (await resHandler.rejected(error)) as AxiosResponse & {
      isOfflineCache?: boolean;
    };
    expect(res.data).toEqual({ cached: true });
    expect(res.isOfflineCache).toBe(true);
  });

  it("rejects a GET when nothing is cached", async () => {
    setOnline(false);
    cacheGet.mockResolvedValue(undefined);
    const error: FakeError = {
      config: cfg({ method: "get", url: "/wallets" }),
      code: "ERR_NETWORK",
    };
    await expect(resHandler.rejected(error)).rejects.toBe(error);
  });

  it("queues an offline POST and returns a mock response", async () => {
    setOnline(false);
    const dispatch = vi.spyOn(window, "dispatchEvent");
    const error: FakeError = {
      config: cfg({
        method: "post",
        url: "/transactions",
        data: JSON.stringify({ x: 1 }),
      }),
      code: "ERR_NETWORK",
    };
    const res = (await resHandler.rejected(error)) as AxiosResponse<{
      id: string;
      x: number;
    }> & { isOfflineQueueMock?: boolean };

    expect(queueAdd).toHaveBeenCalledTimes(1);
    expect(res.isOfflineQueueMock).toBe(true);
    expect(res.data.x).toBe(1);
    expect(res.data.id).toMatch(/^offline-/);
    const types = dispatch.mock.calls.map(([e]) => (e as Event).type);
    expect(types).toContain("offline-sync-queued");
  });

  it("SECURITY: does not re-queue a sync replay request", async () => {
    setOnline(false);
    const error: FakeError = {
      config: cfg({
        method: "post",
        url: "/x",
        data: "{}",
        // custom flag set by syncService to avoid re-queueing
        isSyncRequest: true,
      } as Partial<InternalAxiosRequestConfig>),
      code: "ERR_NETWORK",
    };
    await expect(resHandler.rejected(error)).rejects.toBe(error);
    expect(queueAdd).not.toHaveBeenCalled();
  });
});

describe("response interceptor — 401 auto-refresh", () => {
  let loc: { href: string };
  beforeEach(() => {
    loc = stubLocation();
  });

  const successAdapter =
    (): AxiosAdapter =>
    async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
      if (config.url?.includes("/auth/refresh")) {
        return resp(config, { token: "newtok" });
      }
      return resp(config, { ok: true });
    };

  it("refreshes on 401 then retries the original request", async () => {
    localStorage.setItem("jwtToken", "old");
    api.defaults.adapter = successAdapter();
    const error: FakeError = {
      config: cfg({ url: "/wallets", method: "get" }),
      response: { status: 401 },
    };
    const res = (await resHandler.rejected(error)) as AxiosResponse<{
      ok: boolean;
    }>;
    expect(res.data).toEqual({ ok: true });
    expect(localStorage.getItem("jwtToken")).toBe("newtok");
  });

  it("SECURITY: redirects to /login when the refresh endpoint returns 401", async () => {
    localStorage.setItem("jwtToken", "old");
    const error: FakeError = {
      config: cfg({ url: "/auth/refresh", method: "post" }),
      response: { status: 401 },
    };
    await expect(resHandler.rejected(error)).rejects.toBe(error);
    expect(localStorage.getItem("jwtToken")).toBeNull();
    expect(loc.href).toBe("/login");
  });

  it("clears storage and redirects when the refresh call fails", async () => {
    localStorage.setItem("jwtToken", "old");
    api.defaults.adapter = (async (
      config: InternalAxiosRequestConfig,
    ): Promise<AxiosResponse> => {
      if (config.url?.includes("/auth/refresh")) {
        return Promise.reject({
          config,
          response: { status: 500 },
        } as FakeError);
      }
      return resp(config, {});
    }) as AxiosAdapter;
    const error: FakeError = {
      config: cfg({ url: "/wallets", method: "get" }),
      response: { status: 401 },
    };
    await expect(resHandler.rejected(error)).rejects.toBeDefined();
    expect(localStorage.getItem("jwtToken")).toBeNull();
    expect(loc.href).toBe("/login");
  });

  it("dedupes concurrent 401s into a single refresh (single-flight)", async () => {
    localStorage.setItem("jwtToken", "old");
    let refreshCalls = 0;
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    api.defaults.adapter = (async (
      config: InternalAxiosRequestConfig,
    ): Promise<AxiosResponse> => {
      if (config.url?.includes("/auth/refresh")) {
        refreshCalls += 1;
        await gate;
        return resp(config, { token: "newtok" });
      }
      return resp(config, { ok: true });
    }) as AxiosAdapter;

    const mkErr = (): FakeError => ({
      config: cfg({ url: "/wallets", method: "get" }),
      response: { status: 401 },
    });
    const p1 = resHandler.rejected(mkErr());
    const p2 = resHandler.rejected(mkErr());
    release();
    await Promise.all([p1, p2]);
    expect(refreshCalls).toBe(1);
  });
});
