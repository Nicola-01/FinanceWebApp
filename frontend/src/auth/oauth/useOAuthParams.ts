import { useSearchParams } from "react-router-dom";

export interface OAuthParams {
  clientId: string;
  redirectUri: string;
  scope: string;
  codeChallenge: string;
  state: string;
  /** Token is auto-named after the requesting client — the user never edits it. */
  tokenName: string;
  /** All required params (client_id, redirect_uri, code_challenge, state) present. */
  valid: boolean;
}

/** OAuth authorize-request params read from the consent page URL. */
export function useOAuthParams(): OAuthParams {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get("client_id") || "";
  const redirectUri = searchParams.get("redirect_uri") || "";
  const scope = searchParams.get("scope") || "";
  const codeChallenge = searchParams.get("code_challenge") || "";
  const state = searchParams.get("state") || "";
  return {
    clientId,
    redirectUri,
    scope,
    codeChallenge,
    state,
    tokenName: `OAuth: ${clientId}`,
    valid: !!(clientId && redirectUri && codeChallenge && state),
  };
}
