package dev.busato.FinanceWebApp.backend.dto;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MemberRequest {
    @NotBlank(message = "User is required")
    private String user;
    private String role;
}