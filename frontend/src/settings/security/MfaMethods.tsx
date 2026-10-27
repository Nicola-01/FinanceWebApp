import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFingerprint,
  faQrcode,
  faEnvelope,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { ComingSoonBadge } from "../ComingSoon";

interface MfaMethodProps {
  icon: IconDefinition;
  title: string;
  description: string;
  recommended?: boolean;
}

const MFA_METHODS: MfaMethodProps[] = [
  {
    icon: faFingerprint,
    title: "Passkey",
    description:
      "Sign in with a device passkey or biometrics (WebAuthn). The most phishing-resistant option.",
    recommended: true,
  },
  {
    icon: faQrcode,
    title: "Authenticator app",
    description:
      "Scan a QR code and enter a rotating 6-digit code from an app like Authy or Google Authenticator (TOTP).",
  },
  {
    icon: faEnvelope,
    title: "Email code",
    description:
      "Receive a one-time code by email at each sign-in. The simplest, but the weakest factor.",
  },
];

const MfaMethod: React.FC<MfaMethodProps> = ({
  icon,
  title,
  description,
  recommended,
}) => (
  <div
    className={`flex flex-col gap-3 rounded-[var(--r-input)] border bg-app-input p-4 ${
      recommended ? "border-[var(--brand-1)]/40" : "border-app-border"
    }`}
  >
    <div className="flex items-center gap-3">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--r-sm)] ${
          recommended
            ? "bg-[var(--brand-1)]/15 text-[var(--brand-1)]"
            : "bg-app-surface text-app-muted"
        }`}
      >
        <FontAwesomeIcon icon={icon} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-app-text">{title}</p>
          {recommended && (
            <Badge variant="subtle" tone="brand" uppercase>
              Recommended
            </Badge>
          )}
        </div>
      </div>
    </div>
    <p className="text-xs text-app-muted">{description}</p>
    <div className="mt-auto flex items-center justify-between pt-1">
      <ComingSoonBadge />
      <Button variant="secondary" size="sm" disabled>
        Enable
      </Button>
    </div>
  </div>
);

/** Two-factor authentication card (all methods are "coming soon"). */
export const MfaMethods: React.FC = () => (
  <Card
    title="Two-factor authentication"
    subtitle="Add a second step when signing in"
    icon={faFingerprint}
  >
    <div className="grid gap-4 sm:grid-cols-3">
      {MFA_METHODS.map((m) => (
        <MfaMethod key={m.title} {...m} />
      ))}
    </div>
  </Card>
);
