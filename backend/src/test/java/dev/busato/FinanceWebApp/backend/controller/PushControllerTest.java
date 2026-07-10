package dev.busato.FinanceWebApp.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import dev.busato.FinanceWebApp.backend.dto.PushSubscriptionRequest;
import dev.busato.FinanceWebApp.backend.push.WebPushGateway;
import dev.busato.FinanceWebApp.backend.service.NotificationPreferenceService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;

@WebMvcTest(
    controllers = PushController.class,
    excludeAutoConfiguration = {
      org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class
    })
class PushControllerTest extends BaseWebMvcTest {

  @org.springframework.test.context.bean.override.mockito.MockitoBean
  private WebPushGateway webPushGateway;

  @org.springframework.test.context.bean.override.mockito.MockitoBean
  private NotificationPreferenceService notificationPreferenceService;

  @Test
  void getPublicKey_ReturnsKey() throws Exception {
    when(webPushGateway.getPublicKey()).thenReturn("BPublicKey123");

    mockMvc
        .perform(get("/api/push/public-key"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.publicKey").value("BPublicKey123"));
  }

  @Test
  void subscribe_Returns204AndDelegates() throws Exception {
    PushSubscriptionRequest request =
        PushSubscriptionRequest.builder()
            .endpoint("https://push/e1")
            .p256dh("k")
            .auth("a")
            .userAgent("UA")
            .build();

    mockMvc
        .perform(
            post("/api/push/subscriptions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isNoContent());

    verify(notificationPreferenceService)
        .subscribe(eq(mockUser.getId()), any(PushSubscriptionRequest.class));
  }

  @Test
  void unsubscribe_Returns204AndDelegates() throws Exception {
    mockMvc
        .perform(
            delete("/api/push/subscriptions")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"endpoint\":\"https://push/e1\"}"))
        .andExpect(status().isNoContent());

    verify(notificationPreferenceService).unsubscribe(mockUser.getId(), "https://push/e1");
  }
}
