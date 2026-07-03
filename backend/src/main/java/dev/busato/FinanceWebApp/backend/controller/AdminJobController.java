package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.ScheduledJobDTO;
import dev.busato.FinanceWebApp.backend.dto.UpdateEnabledRequest;
import dev.busato.FinanceWebApp.backend.dto.UpdateScheduleRequest;
import dev.busato.FinanceWebApp.backend.scheduling.ScheduledJobService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Admin control panel for the scheduled maintenance jobs (System tab).
 *
 * <p>GET /api/admin/jobs → list jobs (config + next run + recent history) PUT
 * /api/admin/jobs/{key}/schedule → change a job's structured schedule PUT
 * /api/admin/jobs/{key}/enabled → enable/disable a job POST /api/admin/jobs/{key}/run → run a job
 * now
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/jobs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminJobController {

  private final ScheduledJobService jobService;

  @GetMapping
  public List<ScheduledJobDTO> list() {
    return jobService.listJobs();
  }

  @PutMapping("/{key}/schedule")
  public ScheduledJobDTO updateSchedule(
      @PathVariable String key, @RequestBody @Valid UpdateScheduleRequest req) {
    return jobService.updateSchedule(key, req);
  }

  @PutMapping("/{key}/enabled")
  public ScheduledJobDTO setEnabled(
      @PathVariable String key, @RequestBody UpdateEnabledRequest req) {
    return jobService.setEnabled(key, req.enabled());
  }

  @PostMapping("/{key}/run")
  public ScheduledJobDTO runNow(@PathVariable String key) {
    log.info("[AdminJobController] Manual run requested – key={}", key);
    return jobService.runNow(key);
  }
}
