import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faCircleCheck,
  faRotateRight,
  faPenToSquare,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../components/ui/Button";
import { formatCooldown } from "./useCooldown";

interface Props {
  email: string;
  loading: boolean;
  cooldown: number;
  onResend: () => void;
  onChangeEmail: () => void;
}

/** "Check your email" confirmation state with resend cooldown. */
export const ForgotPasswordSent: React.FC<Props> = ({
  email,
  loading,
  cooldown,
  onResend,
  onChangeEmail,
}) => (
  <>
    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-[var(--r-card)] bg-app-green/15 text-app-green">
      <FontAwesomeIcon icon={faCircleCheck} className="text-2xl" />
    </div>
    <h1 className="mb-1 text-2xl font-bold tracking-tight text-app-text">
      Check your email
    </h1>
    <p className="mb-1 text-sm text-app-muted">
      We've sent a password reset link to
    </p>
    <p className="mb-5 break-all text-sm font-semibold text-app-text">
      {email}
    </p>

    <div className="mb-6 rounded-[var(--r-input)] border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs leading-relaxed text-app-muted">
        Didn't get it? Check your spam folder, or resend below. The link is
        valid for <strong className="text-app-text">15 minutes</strong>.
      </p>
    </div>

    <Button
      type="button"
      variant="primary"
      size="lg"
      fullWidth
      ripple
      disabled={loading || cooldown > 0}
      onClick={onResend}
    >
      {loading ? (
        <>
          <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
          Sending…
        </>
      ) : cooldown > 0 ? (
        <>Resend in {formatCooldown(cooldown)}</>
      ) : (
        <>
          <FontAwesomeIcon icon={faRotateRight} />
          Resend email
        </>
      )}
    </Button>

    {/* Let the user go back and fix a mistyped email */}
    <button
      type="button"
      onClick={onChangeEmail}
      className="mt-4 flex cursor-pointer items-center justify-center gap-2 self-center border-none bg-transparent text-sm text-app-muted transition-colors hover:text-app-text"
    >
      <FontAwesomeIcon icon={faPenToSquare} />
      Use a different email
    </button>
  </>
);
