package dev.busato.FinanceWebApp.backend.mappers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.busato.FinanceWebApp.backend.dto.PatCreateResponse;
import dev.busato.FinanceWebApp.backend.dto.PatResponse;
import dev.busato.FinanceWebApp.backend.dto.WalletPermission;
import dev.busato.FinanceWebApp.backend.model.PersonalAccessToken;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class PatMapper {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Maps entity → creation response (includes the plain token, shown once).
     */
    public PatCreateResponse toCreateResponse(PersonalAccessToken entity, String plainToken) {
        return PatCreateResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .plainToken(plainToken)
                .tokenPrefix(entity.getTokenPrefix())
                .walletPermissions(parseWalletPermissions(entity.getWalletPermissions()))
                .createdAt(entity.getCreatedAt())
                .expiresAt(entity.getExpiresAt())
                .build();
    }

    /**
     * Maps entity → list response (no plain token).
     */
    public PatResponse toResponse(PersonalAccessToken entity) {
        return PatResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .tokenPrefix(entity.getTokenPrefix())
                .walletPermissions(parseWalletPermissions(entity.getWalletPermissions()))
                .createdAt(entity.getCreatedAt())
                .expiresAt(entity.getExpiresAt())
                .lastUsedAt(entity.getLastUsedAt())
                .build();
    }

    /** Deserializes the JSON wallet permissions string into a typed list. */
    public List<WalletPermission> parseWalletPermissions(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse wallet permissions JSON", e);
        }
    }

    /** Serializes wallet permissions list to a JSON string for DB storage. */
    public String serializeWalletPermissions(List<WalletPermission> permissions) {
        if (permissions == null || permissions.isEmpty()) return "[]";
        try {
            return objectMapper.writeValueAsString(permissions);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize wallet permissions", e);
        }
    }
}
