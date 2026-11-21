import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import { formatDuration, formatRunTime } from "./jobSchedule";
import type { JobRunDTO } from "./types";
import { useUiVersion } from "../../hooks/useUiVersion";

/** "Recent runs" list (latest 6). */
export const JobRunHistory: React.FC<{ runs: JobRunDTO[] }> = ({ runs }) => {
  const [ui] = useUiVersion();
  // ui-v2-switch: plain 13px inner divide-y list with tabular dates.
  if (ui === "v2") {
    return (
      <div>
        <p className="m-0 mb-1 text-[13px] font-semibold text-app-muted">
          Recent runs
        </p>
        <ul className="m-0 flex list-none flex-col divide-y divide-app-border p-0">
          {runs.slice(0, 6).map((run, i) => {
            const ok = run.status === "SUCCESS";
            return (
              <li
                key={i}
                className="flex min-h-9 items-center gap-2.5 text-[13px] text-app-muted"
              >
                <FontAwesomeIcon
                  icon={ok ? faCircleCheck : faCircleXmark}
                  className={ok ? "text-app-income" : "text-app-danger"}
                  aria-hidden="true"
                />
                <span className="tabular-nums text-app-text">
                  {formatRunTime(run.startedAt)}
                </span>
                <span className="tabular-nums">
                  {formatDuration(run.durationMs)}
                </span>
                {run.manual && <span>manual</span>}
                {run.message && (
                  <span className="truncate text-app-faint">{run.message}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
  return (
    <div className="border-t border-app-border pt-3">
      <p className="m-0 mb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-app-muted">
        Recent runs
      </p>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {runs.slice(0, 6).map((run, i) => {
          const ok = run.status === "SUCCESS";
          return (
            <li
              key={i}
              className="flex items-center gap-2 text-xs text-app-muted"
            >
              <FontAwesomeIcon
                icon={ok ? faCircleCheck : faCircleXmark}
                className={ok ? "text-app-green" : "text-app-red"}
              />
              <span className="font-app-mono text-app-text">
                {formatRunTime(run.startedAt)}
              </span>
              <span className="font-app-mono">
                {formatDuration(run.durationMs)}
              </span>
              {run.manual && (
                <span className="rounded bg-app-input px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-app-muted">
                  manual
                </span>
              )}
              {run.message && (
                <span className="truncate text-app-muted/80">
                  {run.message}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
