package dev.busato.FinanceWebApp.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. Disable CSRF (Cross-Site Request Forgery)
                // We don't need it because we use JWT (Stateless), not Browser Sessions/Cookies
                .csrf(AbstractHttpConfigurer::disable)

                // 2. Set Session Management to STATELESS
                // This tells Spring: "Don't create a JSESSIONID cookie. We will verify every request."
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 3. Define Access Rules
                .authorizeHttpRequests(auth -> auth
                        // Allow everyone to access Login and Register endpoints
                        .requestMatchers("/api/auth/**").permitAll()

                        // Allow testing the wallet creation WITHOUT login (TEMPORARY FOR DEV)
                        // Remove this line later when JWT is ready!
                        .requestMatchers("/api/wallets/**").permitAll()

                        // Lock everything else: You must be authenticated to access other URLs
                        .anyRequest().authenticated()
                );

        return http.build();
    }
}