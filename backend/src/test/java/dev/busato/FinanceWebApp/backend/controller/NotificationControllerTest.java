package dev.busato.FinanceWebApp.backend.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import dev.busato.FinanceWebApp.backend.dto.NotificationResponse;
import dev.busato.FinanceWebApp.backend.service.NotificationService;
import java.util.List;
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

  @Test
  void list_Returns200() throws Exception {
    when(notificationService.list(mockUser.getId()))
        .thenReturn(
            List.of(
                NotificationResponse.builder()
                    .id(UUID.randomUUID())
                    .type("TRANSACTION_CREATED")
                    .title("New transaction by @nicola")
                    .read(false)
                    .build()));

    mockMvc
        .perform(get("/api/notifications"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].type").value("TRANSACTION_CREATED"))
        .andExpect(jsonPath("$[0].read").value(false));
  }

  @Test
  void unreadCount_Returns200() throws Exception {
    when(notificationService.unreadCount(mockUser.getId())).thenReturn(4L);

    mockMvc
        .perform(get("/api/notifications/unread-count"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.count").value(4));
  }

  @Test
  void markRead_Returns204AndDelegates() throws Exception {
    mockMvc.perform(post("/api/notifications/mark-read")).andExpect(status().isNoContent());

    verify(notificationService).markAllRead(mockUser.getId());
  }

  @Test
  void purgeRead_Returns204AndDelegates() throws Exception {
    mockMvc.perform(delete("/api/notifications/read")).andExpect(status().isNoContent());

    verify(notificationService).purgeRead(mockUser.getId());
  }
}
