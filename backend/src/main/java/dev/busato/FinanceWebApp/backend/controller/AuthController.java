package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.AuthResponse;
import dev.busato.FinanceWebApp.backend.dto.ChangePasswordRequest;
import dev.busato.FinanceWebApp.backend.dto.LoginRequest;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.security.JwtService;
import dev.busato.FinanceWebApp.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        User user = (User) authentication.getPrincipal();

        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", user.getRole());
        extraClaims.put("userId", user.getId());

        String token = jwtService.generateToken(extraClaims, user, request.isRememberMe());

        return ResponseEntity.ok(AuthResponse.builder()
                .token(token)
                .role(String.valueOf(user.getRole()))
                .passwordMustChange(user.isPasswordMustChange())
                .build());
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @AuthenticationPrincipal User user,
            @RequestBody ChangePasswordRequest request
    ) {
        userService.changePassword(user, request);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }
}

