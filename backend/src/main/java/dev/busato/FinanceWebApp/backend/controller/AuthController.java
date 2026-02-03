package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.AuthResponse;
import dev.busato.FinanceWebApp.backend.dto.LoginRequest;
import dev.busato.FinanceWebApp.backend.exceptions.InvalidPasswordException;
import dev.busato.FinanceWebApp.backend.exceptions.UserNotFoundException;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetailsService;
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
    private final UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        var user = userRepository.findByUsername(request.getUsername()).orElseThrow(
                () -> new UserNotFoundException(request.getUsername())
        );

        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", user.getRole()); // Mettiamo il ruolo
        extraClaims.put("userId", user.getId());

        if (authentication.isAuthenticated()) {
            String token = jwtService.generateToken(extraClaims, user);
            return ResponseEntity.ok(AuthResponse.builder().token(token).build());
        } else {
            throw new InvalidPasswordException();
        }
    }
}
