package dev.busato.FinanceWebApp.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class TagDTO {
    private String name;
    private String icon;
    private String colorHex;
//    private String description;
    private String parentName;
}
