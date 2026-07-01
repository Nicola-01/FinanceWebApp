package dev.busato.FinanceWebApp.backend.mappers;

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
}
