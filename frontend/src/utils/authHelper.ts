import { jwtDecode } from "jwt-decode";

/**
 * Interface representing the structure of your JWT payload.
 * Adjust the fields based on your backend implementation.
 */
export interface DecodedToken {
  sub: string; // Usually the username or email
  userId: string; // Custom field for the database ID
  role: string; // User role (e.g., 'admin', 'user')
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
}

const TOKEN_KEY = "jwtToken";
const MUST_CHANGE_KEY = "mustChangePWD";

/**
 * Retrieves the raw token from storage
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
};

/** Stores a freshly issued token: localStorage when remembered, else sessionStorage. */
export const setToken = (token: string, remember: boolean): void => {
  (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
};

/** Persist a freshly-issued access token in whichever storage currently holds it. */
export const replaceToken = (token: string): void => {
  (localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage).setItem(
    TOKEN_KEY,
    token,
  );
};

/** Forced password-change flag; unreadable values count as `false`. */
export const getMustChangePWD = (): boolean => {
  try {
    return (
      JSON.parse(localStorage.getItem(MUST_CHANGE_KEY) || "false") === true
    );
  } catch {
    return false;
  }
};

export const setMustChangePWD = (value: boolean): void => {
  localStorage.setItem(MUST_CHANGE_KEY, JSON.stringify(value));
};

export const clearMustChangePWD = (): void => {
  localStorage.removeItem(MUST_CHANGE_KEY);
};

/** Local logout: drop the token from both storages and the forced-password flag. */
export const clearSession = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  clearMustChangePWD();
};

/**
 * Decodes the token and returns the full payload
 */
export const getDecodedToken = (): DecodedToken | null => {
  const token = getToken();
  if (!token) return null;

  try {
    return jwtDecode<DecodedToken>(token);
  } catch (error) {
    console.error("Invalid token format", error);
    return null;
  }
};

/**
 *
 */
export const isTokenValid = (): boolean => {
  const decoded = getDecodedToken();
  if (!decoded) return false;

  const currentTime = Date.now() / 1000; // Convert to seconds
  return decoded.exp > currentTime;
};

/**
 * Specific helper to get user info in one go
 */
export const getUserAuth = () => {
  const decoded = getDecodedToken();
  if (!decoded) return null;

  return {
    username: decoded.sub,
    userId: decoded.userId,
    role: decoded.role,
    isExpired: decoded.exp * 1000 < Date.now(),
  };
};
