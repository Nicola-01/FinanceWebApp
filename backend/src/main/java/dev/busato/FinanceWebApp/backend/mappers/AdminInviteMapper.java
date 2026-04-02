package dev.busato.FinanceWebApp.backend.mappers;

import dev.busato.FinanceWebApp.backend.dto.AdminInviteResponse;
import dev.busato.FinanceWebApp.backend.model.UserInvitation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AdminInviteMapper {

    @Value("${application.frontend.url}")
    private String FRONTEND_URL;

    public AdminInviteResponse mapToAdminInviteResponse(UserInvitation invitation) {
        return AdminInviteResponse.builder()
                .email(invitation.getEmail())
                .url(generateInviteUrl(invitation.getToken()))
                .note(invitation.getNote())
                .status(invitation.getStatus().name())
                .expiresAt(invitation.getExpiresAt())
                .createdAt(invitation.getCreatedAt())
                .build();
    }

    private String generateInviteUrl(String token) {
        return FRONTEND_URL + "/register?token=" + token;
    }
}
