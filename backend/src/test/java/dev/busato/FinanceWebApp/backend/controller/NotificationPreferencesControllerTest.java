package dev.busato.FinanceWebApp.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import dev.busato.FinanceWebApp.backend.dto.NotificationPreferencesRequest;
import dev.busato.FinanceWebApp.backend.dto.NotificationPreferencesResponse;
import dev.busato.FinanceWebApp.backend.service.NotificationPreferenceService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;

@WebMvcTest(
    controllers = NotificationPreferencesController.class,
    excludeAutoConfiguration = {
      org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class
    })
class NotificationPreferencesControllerTest extends BaseWebMvcTest {

  @org.springframework.test.context.bean.override.mockito.MockitoBean
  private NotificationPreferenceService notificationPreferenceService;

  @Test
  void getPreferences_Returns200() throws Exception {
    when(notificationPreferenceService.getPreferences(mockUser.getId()))
        .thenReturn(
            NotificationPreferencesResponse.builder()
                .invites(true)
                .transactions(false)
                .subscriptions(true)
                .recurringExecutions(true)
                .walletMutes(List.of())
                .build());

    mockMvc
        .perform(get("/api/users/me/notification-preferences"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.invites").value(true))
        .andExpect(jsonPath("$.transactions").value(false));
  }

  @Test
  void updatePreferences_Returns204AndDelegates() throws Exception {
    NotificationPreferencesRequest request =
        NotificationPreferencesRequest.builder()
            .invites(true)
            .transactions(true)
            .subscriptions(false)
            .recurringExecutions(true)
            .build();

    mockMvc
        .perform(
            put("/api/users/me/notification-preferences")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isNoContent());

    verify(notificationPreferenceService)
        .updatePreferences(eq(mockUser.getId()), any(NotificationPreferencesRequest.class));
  }
}
