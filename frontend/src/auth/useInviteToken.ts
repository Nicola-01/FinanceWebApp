import { useEffect, useState } from "react";
import api from "../api/axiosConfig";
import { getApiErrorTitle } from "../utils/apiError";

export interface InviteResponse {
  email: string;
  createdAt: string;
  expiresAt: string;
  status: string;
}

interface Options {
  /** e.g. "/auth/register" — the token is appended as a path segment. */
  endpoint: string;
  /** Status the invite must have to still be usable. */
  validStatus: string;
  missingTokenMessage: string;
  usedMessage: string;
  invalidMessage: string;
}

/** Verifies an emailed invite / reset token on mount (GET `${endpoint}/${token}`). */
export function useInviteToken(token: string | null, opts: Options) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<InviteResponse | null>(null);

  const { endpoint, validStatus, missingTokenMessage, usedMessage } = opts;
  const { invalidMessage } = opts;

  useEffect(() => {
    if (!token) {
      setError(missingTokenMessage);
      setIsLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await api.get(`${endpoint}/${token}`);
        setInviteData(res.data);

        if (res.data.status !== validStatus) {
          setError(usedMessage);
        }
      } catch (err: unknown) {
        setError(getApiErrorTitle(err, invalidMessage));
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [
    token,
    endpoint,
    validStatus,
    missingTokenMessage,
    usedMessage,
    invalidMessage,
  ]);

  return { isLoading, error, inviteData };
}
