import React, { useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { completeBankCallback } from "../api/bankApi";
import { triggerToast } from "../components/ui/ToastNotification.tsx";
import { getApiErrorTitle } from "../utils/apiError";

/** Landing page of the bank's consent redirect: finishes the link, then returns to the wallet. */
const BankCallback: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const error = params.get("error");
  const code = params.get("code");
  const state = params.get("state");
  // The code is single-use: guard against the StrictMode double effect.
  const started = useRef(false);

  useEffect(() => {
    if (error || started.current) return;
    started.current = true;
    if (!code || !state) {
      triggerToast("Invalid bank callback", false);
      navigate("/dashboard", { replace: true });
      return;
    }
    completeBankCallback(code, state)
      .then((c) => {
        // The link is saved even when it ended in ERROR (e.g. no accounts): say why.
        if (c.status === "ACTIVE")
          triggerToast("Bank linked successfully", true);
        else
          triggerToast(c.lastError ?? "The bank link needs attention", false);
        navigate(`/dashboard/${c.walletId}`, { replace: true });
      })
      .catch((e) => {
        triggerToast(getApiErrorTitle(e, "Could not link bank"), false);
        navigate("/dashboard", { replace: true });
      });
  }, [error, code, state, navigate]);

  if (error) {
    const desc = params.get("error_description");
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-app-bg p-6 text-app-text">
        <p>
          The bank returned an error: {error}
          {desc ? ` (${desc})` : ""}
        </p>
        <Link to="/dashboard" className="underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg text-app-muted">
      Linking your bank...
    </div>
  );
};

export default BankCallback;
