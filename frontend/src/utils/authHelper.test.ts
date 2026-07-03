import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getToken,
  getDecodedToken,
  isTokenValid,
  getUserAuth,
} from "./authHelper";
import { makeJwt } from "../test/testUtils";

const NOW = new Date("2026-01-01T00:00:00Z");
const NOW_SEC = Math.floor(NOW.getTime() / 1000);

describe("authHelper", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getToken", () => {
    it("returns null when no token is stored", () => {
      expect(getToken()).toBeNull();
    });
    it("reads from sessionStorage when localStorage is empty", () => {
      sessionStorage.setItem("jwtToken", "session-token");
      expect(getToken()).toBe("session-token");
    });
    it("prefers localStorage over sessionStorage", () => {
      localStorage.setItem("jwtToken", "local-token");
      sessionStorage.setItem("jwtToken", "session-token");
      expect(getToken()).toBe("local-token");
    });
  });

  describe("getDecodedToken", () => {
    it("decodes a well-formed token payload", () => {
      const token = makeJwt({
        sub: "alice",
        userId: "u1",
        role: "USER",
        exp: NOW_SEC + 60,
      });
      localStorage.setItem("jwtToken", token);
      const decoded = getDecodedToken();
      expect(decoded).toMatchObject({
        sub: "alice",
        userId: "u1",
        role: "USER",
      });
    });
    it("returns null (no throw) for a malformed token", () => {
      localStorage.setItem("jwtToken", "not.a.jwt");
      expect(() => getDecodedToken()).not.toThrow();
      expect(getDecodedToken()).toBeNull();
    });
    it("returns null when there is no token", () => {
      expect(getDecodedToken()).toBeNull();
    });
  });

  describe("isTokenValid", () => {
    it("is true for a token expiring in the future", () => {
      localStorage.setItem("jwtToken", makeJwt({ exp: NOW_SEC + 60 }));
      expect(isTokenValid()).toBe(true);
    });
    it("is false for an expired token", () => {
      localStorage.setItem("jwtToken", makeJwt({ exp: NOW_SEC - 60 }));
      expect(isTokenValid()).toBe(false);
    });
    it("is false at the exact expiry boundary (strict >)", () => {
      localStorage.setItem("jwtToken", makeJwt({ exp: NOW_SEC }));
      expect(isTokenValid()).toBe(false);
    });
    it("is false when there is no token", () => {
      expect(isTokenValid()).toBe(false);
    });
    it("SECURITY: a tampered/garbage token is never valid", () => {
      localStorage.setItem("jwtToken", "garbage");
      expect(isTokenValid()).toBe(false);
    });
  });

  describe("getUserAuth", () => {
    it("maps the decoded payload to user info", () => {
      localStorage.setItem(
        "jwtToken",
        makeJwt({ sub: "bob", userId: "u2", role: "ADMIN", exp: NOW_SEC + 60 }),
      );
      expect(getUserAuth()).toEqual({
        username: "bob",
        userId: "u2",
        role: "ADMIN",
        isExpired: false,
      });
    });
    it("flags an expired token as isExpired", () => {
      localStorage.setItem(
        "jwtToken",
        makeJwt({ sub: "bob", userId: "u2", role: "USER", exp: NOW_SEC - 1 }),
      );
      expect(getUserAuth()?.isExpired).toBe(true);
    });
    it("returns null without a token", () => {
      expect(getUserAuth()).toBeNull();
    });
  });
});
