package dev.busato.FinanceWebApp.backend.mappers;

import dev.busato.FinanceWebApp.backend.dto.UserProfileResponse;
import dev.busato.FinanceWebApp.backend.dto.UserResponse;
import dev.busato.FinanceWebApp.backend.model.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

  public UserResponse mapToResponse(User user) {
    return UserResponse.builder()
        .id(user.getId())
        .name(user.getUsername())
        .createdAt(user.getCreatedAt())
        .build();
  }

  /**
   * Account-settings profile. The email is masked here so the full address never leaves the API.
   */
  public UserProfileResponse toProfileResponse(User user) {
    return UserProfileResponse.builder()
        .id(user.getId())
        .username(user.getUsername())
        .email(maskEmail(user.getEmail()))
        .role(user.getRole() == null ? null : user.getRole().name())
        .createdAt(user.getCreatedAt())
        .build();
  }

  /**
   * Masks the local part of an email, keeping the first (and, when long enough, last) character and
   * the full domain — e.g. {@code nicola@example.com} → {@code n***a@example.com}.
   */
  private static String maskEmail(String email) {
    if (email == null || email.isBlank()) return email;
    int at = email.indexOf('@');
    if (at <= 0) return "***"; // no local part / malformed — reveal nothing
    String local = email.substring(0, at);
    String domain = email.substring(at); // keeps the leading '@'
    String maskedLocal =
        local.length() <= 2
            ? local.charAt(0) + "***"
            : local.charAt(0) + "***" + local.charAt(local.length() - 1);
    return maskedLocal + domain;
  }
}
