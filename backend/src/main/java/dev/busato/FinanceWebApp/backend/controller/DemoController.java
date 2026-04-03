package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.AuthResponse;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.security.JwtService;
import dev.busato.FinanceWebApp.backend.service.DemoService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "application.demo.enabled", havingValue = "true")
public class DemoController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final DemoService demoService;

    private final Random random = new Random();

    @Value("${application.demo.enabled}")
    private boolean DEMO;

    @PostMapping("/demo")
    public ResponseEntity<AuthResponse> createDemoUser() {

        // Generate unique username: DEMO_XXXXX
        String username = "DEMO_" + String.format("%05d", random.nextInt(100000));

        // Ensure uniqueness (extremely unlikely collision, but safe)
        while (userRepository.existsByUsernameIgnoreCase(username)) {
            username = "DEMO_" + String.format("%05d", random.nextInt(100000));
        }

        String email = username.toLowerCase() + "@demo.local";

        User demoUser = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .role(User.Role.USER)
                .passwordMustChange(false)
                .demo(true)
                .build();

        userRepository.save(demoUser);

        // Generate demo wallet with sample data
        demoService.generateDemoWallet(demoUser.getId());

        // Generate JWT (session-only, no remember me)
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", demoUser.getRole());
        extraClaims.put("userId", demoUser.getId());

        String token = jwtService.generateToken(extraClaims, demoUser, false);

        return ResponseEntity.ok(AuthResponse.builder()
                .token(token)
                .role(String.valueOf(demoUser.getRole()))
                .passwordMustChange(false)
                .build());
    }
}
