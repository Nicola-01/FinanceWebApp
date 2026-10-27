import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import api from "../api/axiosConfig";
import { triggerToast } from "../components/ui/ToastNotification.tsx";
import { Card } from "../components/ui/Card";
import { getApiErrorTitle } from "../utils/apiError.ts";
import { AdminPageHeader } from "./AdminPageHeader.tsx";
import { useNow } from "../hooks/useNow.ts";
import { JobCard } from "./system/JobCard.tsx";
import type { ScheduledJobDTO } from "./system/types.ts";

// ─── System tab ──────────────────────────────────────────────────────────────

const SystemTab: React.FC = () => {
  const [jobs, setJobs] = useState<ScheduledJobDTO[]>([]);
  const [loading, setLoading] = useState(true);
  // One shared ticker drives every card's countdown.
  const now = useNow();

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
  }, [loading, jobs, now, loadJobs]);

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
