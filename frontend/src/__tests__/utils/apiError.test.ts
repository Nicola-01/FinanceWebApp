import { describe, it, expect } from "vitest";
import { AxiosError } from "axios";
import type { AxiosResponse } from "axios";
import {
  getApiErrorTitle,
  getApiErrorDetail,
  getApiErrorStatus,
  isReplayError,
  isAbortError,
} from "../../utils/apiError";

const axiosError = (status: number, data: unknown): AxiosError => {
  const err = new AxiosError("boom", "ERR");
  err.response = { status, data } as unknown as AxiosResponse;
  return err;
};

describe("getApiErrorTitle", () => {
  it("returns the ProblemDetail title from an AxiosError", () => {
    expect(getApiErrorTitle(axiosError(400, { title: "Bad" }), "fb")).toBe(
      "Bad",
    );
  });
  it("falls back when the AxiosError has no title", () => {
    expect(getApiErrorTitle(axiosError(400, {}), "fb")).toBe("fb");
  });
  it("falls back for a non-Axios error", () => {
    expect(getApiErrorTitle(new Error("x"), "fb")).toBe("fb");
  });
});

describe("getApiErrorDetail", () => {
  it("returns the ProblemDetail detail from an AxiosError", () => {
    expect(getApiErrorDetail(axiosError(400, { detail: "why" }), "fb")).toBe(
      "why",
    );
  });
  it("falls back for a non-Axios error", () => {
    expect(getApiErrorDetail("nope", "fb")).toBe("fb");
  });
});

describe("getApiErrorStatus", () => {
  it("returns the HTTP status from an AxiosError", () => {
    expect(getApiErrorStatus(axiosError(503, {}))).toBe(503);
  });
  it("returns undefined for a non-Axios error", () => {
    expect(getApiErrorStatus(new Error("x"))).toBeUndefined();
  });
});

describe("isReplayError", () => {
  it("is true only for 400 + replay_detected", () => {
    expect(isReplayError(axiosError(400, { error: "replay_detected" }))).toBe(
      true,
    );
  });
  it("is false for 400 with a different error code", () => {
    expect(isReplayError(axiosError(400, { error: "other" }))).toBe(false);
  });
  it("is false for replay_detected on a non-400 status", () => {
    expect(isReplayError(axiosError(401, { error: "replay_detected" }))).toBe(
      false,
    );
  });
  it("is false for a non-Axios error", () => {
    expect(isReplayError(new Error("x"))).toBe(false);
  });
});

describe("isAbortError", () => {
  it.each(["CanceledError", "AbortError"])(
    "is true for an Error named %s",
    (name) => {
      const err = new Error("aborted");
      err.name = name;
      expect(isAbortError(err)).toBe(true);
    },
  );
  it("is false for an unrelated Error", () => {
    expect(isAbortError(new Error("other"))).toBe(false);
  });
  it("is false for a non-Error value", () => {
    expect(isAbortError({ name: "AbortError" })).toBe(false);
  });
});
