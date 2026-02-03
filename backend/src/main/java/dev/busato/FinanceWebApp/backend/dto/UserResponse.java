package dev.busato.FinanceWebApp.backend.dto;

import dev.busato.FinanceWebApp.backend.model.User;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class UserResponse {
    String name;
    private User.Role role;
    private String tempPassword;
    private boolean mustChangePassword;
    private LocalDate createdAt;
}
