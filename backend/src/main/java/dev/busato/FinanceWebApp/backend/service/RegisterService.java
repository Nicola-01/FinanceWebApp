package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.MemberResponse;
import dev.busato.FinanceWebApp.backend.dto.RegisterInviteRequest;
import dev.busato.FinanceWebApp.backend.dto.RegisterInviteResponse;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.UserInvitation;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.UserInvitationRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RegisterService {

    private final UserInvitationRepository userInvitationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DemoService demoService;


    public RegisterInviteResponse getRegisterInvite(String token) {
        UserInvitation invitation = userInvitationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or missing invitation link."));
        return mapToResponse(invitation);
    }

    @Transactional
    public void registerViaInvite(String token, RegisterInviteRequest request) {

        UserInvitation invitation = userInvitationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or missing invitation link."));

        if (invitation.getStatus() != UserInvitation.InvitationStatus.PENDING)
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

        invitation.setStatus(UserInvitation.InvitationStatus.ACCEPTED);
    }

    private RegisterInviteResponse mapToResponse(UserInvitation invitation) {
        String maskedEmail = invitation.getEmail().replaceAll("(^[^@]{2})[^@]+", "$1***");

        return RegisterInviteResponse.builder()
                .email(maskedEmail)
                .createdAt(invitation.getCreatedAt())
                .expiresAt(invitation.getExpiresAt())
                .status(invitation.getStatus().toString())
                .build();
    }
}