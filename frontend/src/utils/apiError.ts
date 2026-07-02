import { AxiosError } from "axios";

/** Subset of the RFC-7807 ProblemDetail body returned by the backend. */
interface ProblemDetail {
  title?: string;
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
