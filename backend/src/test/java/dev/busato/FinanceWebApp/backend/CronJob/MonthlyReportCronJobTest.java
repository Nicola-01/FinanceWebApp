package dev.busato.FinanceWebApp.backend.CronJob;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import dev.busato.FinanceWebApp.backend.report.ReportService;
import dev.busato.FinanceWebApp.backend.scheduling.JobFrequency;
import java.time.YearMonth;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MonthlyReportCronJobTest {

  @Mock private ReportService reportService;

  @InjectMocks private MonthlyReportCronJob job;

  @Test
  void run_CoversPreviousMonth_ReturnsServiceSummary() {
    when(reportService.sendMonthlyReports(YearMonth.now().minusMonths(1)))
        .thenReturn("sent 2, skipped 0 (no data), failed 0");

    assertEquals("sent 2, skipped 0 (no data), failed 0", job.run());
    verify(reportService).sendMonthlyReports(YearMonth.now().minusMonths(1));
  }

  @Test
  void metadata_IsStable() {
    assertEquals("monthly-report", job.key());
    assertEquals("Monthly Report Email", job.displayName());
    assertTrue(job.available());
    assertEquals(JobFrequency.MONTHLY, job.defaults().frequency());
    assertEquals(7, job.defaults().hour());
    assertEquals(0, job.defaults().minute());
    assertEquals(1, job.defaults().dayOfMonth());
  }
}
