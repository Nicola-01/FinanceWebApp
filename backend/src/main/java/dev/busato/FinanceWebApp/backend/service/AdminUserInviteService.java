package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.AdminInviteRequest;
import dev.busato.FinanceWebApp.backend.dto.AdminInviteResponse;
import dev.busato.FinanceWebApp.backend.dto.UserResponse;
import dev.busato.FinanceWebApp.backend.exceptions.UserNotFoundException;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.UserInvitation;
import dev.busato.FinanceWebApp.backend.repository.ManageUserRepository;
import dev.busato.FinanceWebApp.backend.repository.UserInvitationRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import jakarta.mail.MessagingException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserInviteService {
    @Value("${application.frontend.url}")
    private String FRONTEND_URL;

    private final SendEmailService sendEmailService;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ManageUserRepository manageUserRepository;
    private final UserInvitationRepository userInvitationRepository;

    //    @PreAuthorize("adminUser.Role.equals(User.Role.ADMIN)")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> getUsers() {
        return userRepository.findAllByRole(User.Role.USER)
                .stream().map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(UUID id) {
        if (!userRepository.existsById(id))
            throw new UserNotFoundException(id);
        userRepository.deleteById(id);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public AdminInviteResponse createInvite(AdminInviteRequest request) {
        if (userRepository.findByEmailIgnoreCase(request.getEmail()).isPresent())
            throw new IllegalArgumentException("A user with this email address is already registered.");

        UserInvitation invitation = userInvitationRepository.findByEmailIgnoreCase(request.getEmail())
                .orElse(new UserInvitation());

        String token = UUID.randomUUID().toString();
        invitation.setEmail(request.getEmail());
        invitation.setToken(token);
        invitation.setNote(request.getNote());
        invitation.setExpiresAt(LocalDateTime.now().plusDays(3));
        invitation.setStatus(UserInvitation.InvitationStatus.PENDING);

        userInvitationRepository.save(invitation);

        String url =generateInviteUrl(token);

        AdminInviteResponse inviteResponse = AdminInviteResponse.builder()
                .email(request.getEmail())
                .note(request.getNote())
                .url(url)
                .expiresAt(LocalDateTime.now().plusDays(3))
                .status(UserInvitation.InvitationStatus.PENDING.toString())
                .build();

        try {
            sendEmailService.sendRegistrationInvitation(inviteResponse);
        } catch (MessagingException e) {
            throw new RuntimeException("Unable to send the invitation email to " + request.getEmail(), e);
        }

        return AdminInviteResponse.builder()
                .email(invitation.getEmail())
                .note(invitation.getNote())
                .url(generateInviteUrl(token))
                .createdAt(invitation.getCreatedAt())
                .expiresAt(invitation.getExpiresAt())
                .status(invitation.getStatus().toString())
                .build();
    }


    @PreAuthorize("hasRole('ADMIN')")
    public List<AdminInviteResponse> getInvites() {
        return userInvitationRepository.findAll().stream()
                .map(this::mapToAdminInviteResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void revokeInvite(String email) {
        UserInvitation invitation = userInvitationRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UserNotFoundException(email));

        invitation.setStatus(UserInvitation.InvitationStatus.REVOKED);
    }

    @Scheduled(cron = "0 0 0 * * *") // Ogni giorno a mezzanotte
    @Transactional
    public void cleanupExpiredInvitations() {
        int daysToKeep = 7;
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysToKeep);
        userInvitationRepository.deleteExpiredInvitations(cutoffDate);
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getUsername())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private AdminInviteResponse mapToAdminInviteResponse(UserInvitation invitation) {
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
