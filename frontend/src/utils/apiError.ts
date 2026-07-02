import { AxiosError } from "axios";

/** Subset of the RFC-7807 ProblemDetail body returned by the backend. */
interface ProblemDetail {
  title?: string;
  detail?: string;
}

/**
 * Extracts the RFC-7807 `title` from a failed API call, falling back to the
 * provided message when the error is not an Axios error or carries no title.
 *
 * Lets callers type their `catch` binding as `unknown` instead of `any`.
 */
export function getApiErrorTitle(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as ProblemDetail | undefined;
    if (data?.title) return data.title;
  }
  return fallback;
}

/**
 * Like {@link getApiErrorTitle} but reads the RFC-7807 `detail` field.
 */
export function getApiErrorDetail(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as ProblemDetail | undefined;
    if (data?.detail) return data.detail;
  }
  return fallback;
}

/** HTTP status code of a failed Axios request, or `undefined`. */
export function getApiErrorStatus(err: unknown): number | undefined {
  return err instanceof AxiosError ? err.response?.status : undefined;
}

/** True when the backend rejected an OAuth token as a replayed request. */
export function isReplayError(err: unknown): boolean {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: string } | undefined;
    return err.response?.status === 400 && data?.error === "replay_detected";
  }
  return false;
}

/** True for request cancellations (Axios `CanceledError` / DOM `AbortError`). */
export function isAbortError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === "CanceledError" || err.name === "AbortError")
  );
}
