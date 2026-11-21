import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faArrowUp,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import api from "../api/axiosConfig";
import { triggerToast } from "../components/ui/ToastNotification.tsx";
import { Card } from "../components/ui/Card";
import { getApiErrorTitle } from "../utils/apiError.ts";
import { AdminPageHeader } from "./AdminPageHeader.tsx";
import { useNow } from "../hooks/useNow.ts";
import { JobCard } from "./system/JobCard.tsx";
import type { ScheduledJobDTO } from "./system/types.ts";
import { JOB_GRID } from "./system/JobRowV2.tsx";
import {
  JOB_SORT_OPTIONS,
  sortJobs,
  type JobSortKey,
  type SortDir,
} from "./system/jobSort.ts";
import { Selector } from "../components/ui/Selector.tsx";
import Button from "../components/ui/Button";
import { useUiVersion } from "../hooks/useUiVersion.ts";

// ─── System tab ──────────────────────────────────────────────────────────────

const SystemTab: React.FC = () => {
  const [jobs, setJobs] = useState<ScheduledJobDTO[]>([]);
  const [loading, setLoading] = useState(true);
  // One shared ticker drives every card's countdown.
  const now = useNow();
  const [ui] = useUiVersion();
  // ui-v2-switch: sort controls for the v2 list (v1 keeps the server order).
  const [sortKey, setSortKey] = useState<JobSortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const loadJobs = useCallback(async () => {
    try {
      const resp = await api.get<ScheduledJobDTO[]>("/admin/jobs");
      setJobs(resp.data);
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Could not load jobs"), false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="flex items-center gap-2 text-sm text-app-muted">
          <FontAwesomeIcon icon={faSpinner} spin />
          Loading jobs…
        </div>
      );
    }
    if (jobs.length === 0) {
      return (
        <Card
          padding="none"
          className="px-4 py-6 text-center text-sm text-app-muted"
        >
          No scheduled jobs.
        </Card>
      );
    }
    // ui-v2-switch
    if (ui === "v2") {
      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Selector
              options={JOB_SORT_OPTIONS}
              value={sortKey}
              onChange={setSortKey}
              size="sm"
              fullWidth={false}
              ariaLabel="Sort jobs"
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Reverse order"
              title="Reverse order"
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            >
              <FontAwesomeIcon
                icon={sortDir === "asc" ? faArrowUp : faArrowDown}
              />
            </Button>
          </div>
          <div className="overflow-hidden rounded-[var(--r-card)] bg-app-card shadow-[var(--box-ring)]">
            <div
              className={`${JOB_GRID} hidden min-h-10 px-4 text-[13px] text-app-muted md:grid`}
            >
              <span>Job</span>
              <span>Schedule</span>
              <span>Last run</span>
              <span aria-hidden="true" />
            </div>
            <div className="divide-y divide-app-border">
              {sortJobs(jobs, sortKey, sortDir).map((job) => (
                <JobCard
                  key={job.key}
                  job={job}
                  now={now}
                  zIndex={0}
                  onReload={loadJobs}
                />
              ))}
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-4">
        {jobs.map((job, i) => (
          <JobCard
            key={job.key}
            job={job}
            now={now}
            zIndex={jobs.length - i}
            onReload={loadJobs}
          />
        ))}
      </div>
    );
  }, [loading, jobs, now, loadJobs, ui, sortKey, sortDir]);

  return (
    <div className="flex flex-col gap-6 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-1">
      <AdminPageHeader
        title="System"
        description="Scheduled maintenance jobs — edit schedules, run on demand, review history."
      />
      {content}
    </div>
  );
};

export default SystemTab;
