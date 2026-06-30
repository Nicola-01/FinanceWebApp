package dev.busato.FinanceWebApp.backend.dto;

import lombok.Builder;
import lombok.Data;

import jakarta.validation.constraints.NotBlank;

@Data
@Builder
public class TagRequest {
    @NotBlank(message = "Name is required")
    private String name;
    private String icon;
    private String colorHex;
//    private String description;
    private String parentName;
}
