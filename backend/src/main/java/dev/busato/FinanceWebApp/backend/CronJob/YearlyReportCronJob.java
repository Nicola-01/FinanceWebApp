package dev.busato.FinanceWebApp.backend.CronJob;

import dev.busato.FinanceWebApp.backend.report.ReportService;
import dev.busato.FinanceWebApp.backend.scheduling.JobFrequency;
import dev.busato.FinanceWebApp.backend.scheduling.ManagedJob;
import java.time.Year;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Emails every opted-in user the yearly wrap-up. Covers the previous calendar year, derived from
 * the execution date — the admin "Run now" re-sends the last closed year.
 */
@Component
@RequiredArgsConstructor
public class YearlyReportCronJob implements ManagedJob {

  private final ReportService reportService;

  @Override
  public String key() {
    return "yearly-report";
  }

  @Override
  public String displayName() {
    return "Yearly Wrap-up Email";
  }

  @Override
  public ScheduleDefaults defaults() {
    return new ScheduleDefaults(JobFrequency.YEARLY, 7, 30, null, 1, 1);
  }

  @Override
  public String run() {
    return reportService.sendYearlyReports(Year.now().getValue() - 1);
  }
}
