package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.RegisterInviteRequest;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.UserInvitation;
import dev.busato.FinanceWebApp.backend.repository.UserInvitationRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserInvitationRepository userInvitationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void registerViaInvite(RegisterInviteRequest request) {

        UserInvitation invitation = userInvitationRepository.findByToken(request.getToken())
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
                .build();

        userRepository.save(newUser);

        invitation.setStatus(UserInvitation.InvitationStatus.ACCEPTED);
    }
}