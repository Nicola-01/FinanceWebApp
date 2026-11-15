package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.ScheduledJobDTO;
import dev.busato.FinanceWebApp.backend.dto.UpdateEnabledRequest;
import dev.busato.FinanceWebApp.backend.dto.UpdateScheduleRequest;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.report.ReportService;
import dev.busato.FinanceWebApp.backend.scheduling.ScheduledJobService;
import jakarta.validation.Valid;
import java.time.Year;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/**
 * Admin control panel for the scheduled maintenance jobs (System tab).
 *
 * <p>GET /api/admin/jobs → list jobs (config + next run + recent history) PUT
 * /api/admin/jobs/{key}/schedule → change a job's structured schedule PUT
 * /api/admin/jobs/{key}/enabled → enable/disable a job POST /api/admin/jobs/{key}/run → run a job
 * now POST /api/admin/jobs/{key}/test → send a report job's email to the calling admin only
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/jobs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminJobController {

  private final ScheduledJobService jobService;
  private final ReportService reportService;

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

  /** Sends the last closed period's report to the calling admin only (opt-in ignored). */
  @PostMapping("/{key}/test")
  public Map<String, String> sendTest(
      @PathVariable String key, @AuthenticationPrincipal User admin) {
    log.info("[AdminJobController] Test send requested – key={}", key);
    String result =
        switch (key) {
          case "monthly-report" ->
              reportService.sendTestMonthlyReport(admin, YearMonth.now().minusMonths(1));
          case "yearly-report" ->
              reportService.sendTestYearlyReport(admin, Year.now().getValue() - 1);
          default ->
              throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No test send for " + key);
        };
    return Map.of("message", result);
  }
}
