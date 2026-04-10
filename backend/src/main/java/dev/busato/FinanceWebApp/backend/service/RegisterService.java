package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.RegisterInviteRequest;
import dev.busato.FinanceWebApp.backend.dto.RegisterInviteResponse;
import dev.busato.FinanceWebApp.backend.dto.ResetPasswordRequest;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Registrations;
import dev.busato.FinanceWebApp.backend.repository.RegistrationsRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RegisterService {

    private final RegistrationsRepository userInvitationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DemoService demoService;
    private final SendEmailService sendEmailService;

    @Value("${application.frontend.url}")
    private String frontendUrl;


    public RegisterInviteResponse getRegisterInvite(String token) {
        Registrations invitation = userInvitationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or missing invitation link."));
        return mapToResponse(invitation);
    }

    @Transactional
    public void registerViaInvite(String token, RegisterInviteRequest request) {

        Registrations invitation = userInvitationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or missing invitation link."));

        if (invitation.getStatus() != Registrations.InvitationStatus.PENDING)
            throw new IllegalArgumentException("This invitation has already been used or revoked.");

        if (invitation.getExpiresAt().isBefore(LocalDateTime.now()))
            throw new IllegalArgumentException("This invitation link has expired.");

        if (userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(request.getUsername(), request.getUsername()).isPresent())
            throw new IllegalArgumentException("This username is already in use. Please choose another one.");

        User newUser = User.builder()
                .email(invitation.getEmail())
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.USER)
                .passwordMustChange(false)
                .build();

        userRepository.save(newUser);

        demoService.generateDemoWallet(newUser.getId());

        invitation.setStatus(Registrations.InvitationStatus.ACCEPTED);
    }

    // ==================== FORGOT PASSWORD ====================

    @Transactional
    public void requestPasswordReset(String email) {
        // Check if a user with this email exists
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("No account found with this email address."));

        // Check cooldown: if a FORGOTPASSWORD request was sent less than 1 minute ago, reject
        Optional<Registrations> existing = userInvitationRepository
                .findByEmailIgnoreCaseAndStatus(email, Registrations.InvitationStatus.FORGOTPASSWORD);

        if (existing.isPresent()) {
            LocalDateTime createdAt = existing.get().getCreatedAt();
            long secondsSince = ChronoUnit.SECONDS.between(createdAt, LocalDateTime.now());
            if (secondsSince < 60) {
                throw new IllegalArgumentException("A reset email was already sent. Please wait before requesting another one.");
            }
            // Delete old request before creating a new one
            userInvitationRepository.deleteByEmailIgnoreCaseAndStatus(email, Registrations.InvitationStatus.FORGOTPASSWORD);
        }

        // Create new FORGOTPASSWORD record with 1 hour expiration
        String token = UUID.randomUUID().toString();
        Registrations resetRequest = Registrations.builder()
                .email(user.getEmail())
                .token(token)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .status(Registrations.InvitationStatus.FORGOTPASSWORD)
                .note("Password reset request")
                .build();

        userInvitationRepository.save(resetRequest);

        // Send email
        String resetUrl = frontendUrl + "/reset-password?token=" + token;
        try {
            sendEmailService.sendForgotPasswordEmail(user.getEmail(), resetUrl, resetRequest.getExpiresAt());
        } catch (Exception e) {
            throw new RuntimeException("Failed to send password reset email.", e);
        }
    }

    public RegisterInviteResponse getResetPasswordInvite(String token) {
        Registrations record = userInvitationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or missing reset link."));

        if (record.getStatus() != Registrations.InvitationStatus.FORGOTPASSWORD)
            throw new IllegalArgumentException("This reset link is no longer valid.");

        if (record.getExpiresAt().isBefore(LocalDateTime.now()))
            throw new IllegalArgumentException("This reset link has expired.");

        return mapToResponse(record);
    }

    @Transactional
    public void resetPassword(String token, ResetPasswordRequest request) {
        Registrations record = userInvitationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or missing reset link."));

        if (record.getStatus() != Registrations.InvitationStatus.FORGOTPASSWORD)
            throw new IllegalArgumentException("This reset link is no longer valid.");

        if (record.getExpiresAt().isBefore(LocalDateTime.now()))
            throw new IllegalArgumentException("This reset link has expired.");

        if (!request.getNewPassword().equals(request.getConfirmPassword()))
            throw new IllegalArgumentException("Passwords do not match.");

        // Validate password strength
        String pw = request.getNewPassword();
        boolean isValid = pw.length() >= 8 &&
                pw.matches(".*[a-z].*") &&
                pw.matches(".*[A-Z].*") &&
                pw.matches(".*[0-9].*") &&
                pw.matches(".*[^A-Za-z0-9].*");

        if (!isValid)
            throw new IllegalArgumentException("Password does not meet security requirements.");

        // Find the user and update password
        User user = userRepository.findByEmailIgnoreCase(record.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        user.setPassword(passwordEncoder.encode(pw));
        user.setPasswordMustChange(false);
        userRepository.save(user);

        // Mark the request as used
        record.setStatus(Registrations.InvitationStatus.ACCEPTED);
    }

    // ==================== HELPERS ====================

    private RegisterInviteResponse mapToResponse(Registrations invitation) {
        String maskedEmail = invitation.getEmail().replaceAll("(^[^@]{2})[^@]+", "$1***");

        return RegisterInviteResponse.builder()
                .email(maskedEmail)
                .createdAt(invitation.getCreatedAt())
                .expiresAt(invitation.getExpiresAt())
                .status(invitation.getStatus().toString())
                .build();
    }
}