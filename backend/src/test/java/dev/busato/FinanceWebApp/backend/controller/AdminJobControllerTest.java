package dev.busato.FinanceWebApp.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import dev.busato.FinanceWebApp.backend.dto.ScheduledJobDTO;
import dev.busato.FinanceWebApp.backend.dto.UpdateEnabledRequest;
import dev.busato.FinanceWebApp.backend.dto.UpdateScheduleRequest;
import dev.busato.FinanceWebApp.backend.scheduling.JobFrequency;
import dev.busato.FinanceWebApp.backend.scheduling.ScheduledJobService;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;

@WebMvcTest(
    controllers = AdminJobController.class,
    excludeAutoConfiguration = {
      org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class
    })
@WithMockUser(roles = "ADMIN")
class AdminJobControllerTest extends BaseWebMvcTest {

  @org.springframework.test.context.bean.override.mockito.MockitoBean
  private ScheduledJobService jobService;

  private ScheduledJobDTO sampleDto() {
    return new ScheduledJobDTO(
        "backup",
        "Database Backup",
        true,
        "DAILY",
        3,
        0,
        List.of(),
        null,
        null,
        Instant.now(),
        List.of());
  }

  @Test
  void listJobs_ShouldReturn200WithJobs() throws Exception {
    when(jobService.listJobs()).thenReturn(List.of(sampleDto()));

    mockMvc
        .perform(get("/api/admin/jobs"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].key").value("backup"))
        .andExpect(jsonPath("$[0].displayName").value("Database Backup"))
        .andExpect(jsonPath("$[0].enabled").value(true))
        .andExpect(jsonPath("$[0].frequency").value("DAILY"));
  }

  @Test
  void updateSchedule_ShouldReturn200() throws Exception {
    UpdateScheduleRequest req =
        new UpdateScheduleRequest(JobFrequency.WEEKLY, 4, 30, List.of("MON", "WED"), null, null);
    when(jobService.updateSchedule(eq("backup"), any())).thenReturn(sampleDto());

    mockMvc
        .perform(
            put("/api/admin/jobs/{key}/schedule", "backup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.key").value("backup"));

    verify(jobService).updateSchedule(eq("backup"), any());
  }

  @Test
  void updateSchedule_InvalidHour_ShouldReturn400() throws Exception {
    // hourOfDay 25 violates @Max(23)
    String body = "{\"frequency\":\"DAILY\",\"hourOfDay\":25,\"minuteOfHour\":0}";

    mockMvc
        .perform(
            put("/api/admin/jobs/{key}/schedule", "backup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
        .andExpect(status().isBadRequest());
  }

  @Test
  void setEnabled_ShouldReturn200() throws Exception {
    when(jobService.setEnabled(eq("backup"), eq(false))).thenReturn(sampleDto());

    mockMvc
        .perform(
            put("/api/admin/jobs/{key}/enabled", "backup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpdateEnabledRequest(false))))
        .andExpect(status().isOk());

    verify(jobService).setEnabled(eq("backup"), eq(false));
  }

  @Test
  void runNow_ShouldReturn200() throws Exception {
    when(jobService.runNow(eq("backup"))).thenReturn(sampleDto());

    mockMvc
        .perform(post("/api/admin/jobs/{key}/run", "backup"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.key").value("backup"));

    verify(jobService).runNow(eq("backup"));
  }
}
