package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.ChangePasswordRequest;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;

    @Transactional
    public void changePassword(User user, ChangePasswordRequest request) {
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword()))
            throw new BadCredentialsException("Current password is incorrect");

        if (!request.getNewPassword().equals(request.getConfirmPassword()))
            throw new IllegalArgumentException("Passwords do not match");

        if (request.getNewPassword().equals(request.getCurrentPassword()))
            throw new IllegalArgumentException("New password cannot be the same as the old one");

        String pw = request.getNewPassword();
        boolean isValid = pw.length() >= 8 &&
                pw.matches(".*[a-z].*") &&
                pw.matches(".*[A-Z].*") &&
                pw.matches(".*[0-9].*") &&
                pw.matches(".*[^A-Za-z0-9].*");

        if (!isValid)
            throw new IllegalArgumentException("Password does not meet security requirements");

        user.setPassword(passwordEncoder.encode(pw));
        user.setPasswordMustChange(false);
        userRepository.save(user);
    }
}
