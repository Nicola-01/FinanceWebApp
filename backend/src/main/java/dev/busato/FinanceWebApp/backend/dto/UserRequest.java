package dev.busato.FinanceWebApp.backend.dto;

import lombok.Builder;
import lombok.Data;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;

@Data
@Builder
public class UserRequest {
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 20, message = "Username must be between 3 and 20 characters")
    String username;
}
