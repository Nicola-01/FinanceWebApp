package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.JobRun;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobRunRepository extends JpaRepository<JobRun, UUID> {

  /** Most recent runs for a job, newest first (for the System-tab history list). */
  List<JobRun> findTop20ByJobKeyOrderByStartedAtDesc(String jobKey);

  /** All runs for a job, newest first — used to prune history beyond the cap. */
  List<JobRun> findByJobKeyOrderByStartedAtDesc(String jobKey);
}
