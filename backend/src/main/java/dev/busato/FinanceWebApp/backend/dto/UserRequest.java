package dev.busato.FinanceWebApp.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserRequest {
    String username;
}
