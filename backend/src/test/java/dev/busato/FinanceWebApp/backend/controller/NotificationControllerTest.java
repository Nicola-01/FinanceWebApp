package dev.busato.FinanceWebApp.backend.controller;

import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import dev.busato.FinanceWebApp.backend.service.NotificationService;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;

@WebMvcTest(
    controllers = NotificationController.class,
    excludeAutoConfiguration = {
      org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class
    })
class NotificationControllerTest extends BaseWebMvcTest {

  @org.springframework.test.context.bean.override.mockito.MockitoBean
  private NotificationService notificationService;

  @Test
  void ack_Returns204AndDelegates() throws Exception {
    UUID id = UUID.randomUUID();

    mockMvc.perform(post("/api/notifications/{id}/ack", id)).andExpect(status().isNoContent());

    verify(notificationService).ack(id, mockUser.getId());
  }
}
