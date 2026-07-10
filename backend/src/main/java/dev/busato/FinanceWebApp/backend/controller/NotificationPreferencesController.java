package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.NotificationPreferencesRequest;
import dev.busato.FinanceWebApp.backend.dto.NotificationPreferencesResponse;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.service.NotificationPreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The caller's global (per-event-type) notification toggles. */
@RestController
@RequestMapping("/api/users/me/notification-preferences")
@RequiredArgsConstructor
public class NotificationPreferencesController {

  private final NotificationPreferenceService notificationPreferenceService;

  @GetMapping
  public ResponseEntity<NotificationPreferencesResponse> getPreferences(
      @AuthenticationPrincipal User user) {
    return ResponseEntity.ok(notificationPreferenceService.getPreferences(user.getId()));
  }

  @PutMapping
  public ResponseEntity<Void> updatePreferences(
      @AuthenticationPrincipal User user, @RequestBody NotificationPreferencesRequest request) {
    notificationPreferenceService.updatePreferences(user.getId(), request);
    return ResponseEntity.noContent().build();
  }
}
