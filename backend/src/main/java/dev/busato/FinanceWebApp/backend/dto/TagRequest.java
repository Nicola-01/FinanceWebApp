package dev.busato.FinanceWebApp.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TagRequest {
    private String name;
    private String icon;
    private String colorHex;
//    private String description;
    private String parentName;
}
