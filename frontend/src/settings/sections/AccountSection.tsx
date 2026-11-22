import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faIdBadge,
  faCalendarDays,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../api/axiosConfig";
import { Card } from "../../components/ui/Card";
import { triggerToast } from "../../components/ui/ToastNotification";
import { getApiErrorDetail } from "../../utils/apiError";
import { useUiVersion } from "../../hooks/useUiVersion";
import { formatLongLocalDate } from "../../utils/longDate";
import { AccountRow as Row } from "../account/AccountRow";
import { UsernameRow } from "../account/UsernameRow";
import { EmailChangeRow } from "../account/EmailChangeRow";
import { Skeleton } from "../../components/ui/Skeleton";

interface UserProfile {
  id: string;
  username: string;
  email: string | null; // masked server-side
  role: string | null;
  createdAt: string | null; // YYYY-MM-DD
}

export const AccountSection: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [ui] = useUiVersion();
  const isV2 = ui === "v2"; // ui-v2-switch

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/users/me");
        setProfile(res.data);
      } catch (err: unknown) {
        triggerToast(getApiErrorDetail(err, "Failed to load profile"), false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Card>
      {loading ? (
        isV2 ? ( // ui-v2-switch: rows shaped like AccountRow (label + value)
          <div aria-hidden="true" className="divide-y divide-app-border">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 py-4"
              >
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-10">
            <FontAwesomeIcon icon={faSpinner} spin className="text-app-muted" />
          </div>
        )
      ) : (
        <div
          className={
            isV2
              ? "divide-y divide-app-border" // ui-v2-switch: rows sit directly in the Card
              : "divide-y divide-app-border overflow-hidden rounded-[var(--r-input)] border border-app-border"
          }
        >
          <UsernameRow
            username={profile?.username}
            onUpdated={(name) =>
              setProfile((p) => (p ? { ...p, username: name } : p))
            }
          />

          <EmailChangeRow
            email={profile?.email}
            onUpdated={(email) => setProfile((p) => (p ? { ...p, email } : p))}
          />

          {/* Role — shown only for admins */}
          {profile?.role === "ADMIN" && (
            <Row label="Role" icon={faIdBadge}>
              {isV2 ? (
                <span className="rounded-full bg-app-raised px-2.5 py-0.5 text-[13px] font-semibold text-app-text">
                  Admin
                </span>
              ) : (
                <span className="rounded bg-app-yellow/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-app-yellow">
                  Admin
                </span>
              )}
            </Row>
          )}

          {/* Member since */}
          <Row label="Member since" icon={faCalendarDays}>
            <span
              className={
                isV2
                  ? "text-[15px] tabular-nums text-app-text"
                  : "text-sm font-medium text-app-text"
              }
            >
              {profile?.createdAt
                ? formatLongLocalDate(profile.createdAt)
                : "—"}
            </span>
          </Row>
        </div>
      )}
    </Card>
  );
};
