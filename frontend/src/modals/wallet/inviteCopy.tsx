import type React from "react";

/**
 * Translates a per-wallet role into the plain-language capabilities the invitee
 * gets — we never surface the raw "EDITOR"/"VIEWER" token to the user.
 */
export const roleCapability = (
  role: string,
): { title: React.ReactNode; detail: string } => {
  switch (role.toUpperCase()) {
    case "VIEWER":
      return {
        title: (
          <>
            You can <span className="font-bold text-app-text">view</span> this
            wallet
          </>
        ),
        detail:
          "See its balance, transactions and analytics — read-only, you can't make changes.",
      };
    case "OWNER":
      return {
        title: (
          <>
            You get <span className="font-bold text-app-text">full access</span>{" "}
            to this wallet
          </>
        ),
        detail:
          "Manage everything — transactions, subscriptions, tags and members.",
      };
    case "EDITOR":
    default:
      return {
        title: (
          <>
            You can <span className="font-bold text-app-text">view</span> and{" "}
            <span className="font-bold text-app-text">edit</span> this wallet
          </>
        ),
        detail:
          "Add, edit and delete transactions, subscriptions and tags together.",
      };
  }
};

/** Format an ISO date as e.g. "5 July 2026"; falls back to the raw string. */
export const formatInvitedAt = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
