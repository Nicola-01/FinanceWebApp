package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.ChangePasswordRequest;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.repository.PersonalAccessTokenRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final PersonalAccessTokenRepository patRepository;

    /**
     * Legge la tokenVersion dal DB con cache Caffeine.
     * Ogni richiesta autenticata chiama questo metodo nel filtro JWT.
     */
    @Cacheable(value = "tokenVersions", key = "#userId")
    public int getTokenVersion(UUID userId) {
        return userRepository.findById(userId)
                .map(User::getTokenVersion)
                .orElse(-1); // -1 = utente non trovato → invalida qualsiasi token
    }

    /**
     * Incrementa la tokenVersion → invalida TUTTI i token dell'utente su ogni device.
     * Usato da: logout-all, cambio password, reset password.
     */
    @CacheEvict(value = "tokenVersions", key = "#user.id")
    @Transactional
    public void incrementTokenVersion(User user) {
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);
        patRepository.deleteAllByUserId(user.getId());
    }

    /**
     * Cambio password: valida, aggiorna la password e incrementa tokenVersion.
     */
    @CacheEvict(value = "tokenVersions", key = "#user.id")
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
        user.setTokenVersion(user.getTokenVersion() + 1); // Invalida tutti i token
        userRepository.save(user);
        patRepository.deleteAllByUserId(user.getId()); // Invalida i Personal Access Tokens
    }
}
