package dev.busato.FinanceWebApp.backend.config;

import dev.busato.FinanceWebApp.backend.security.JwtAuthenticationFilter;
import dev.busato.FinanceWebApp.backend.security.PatAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

  private final JwtAuthenticationFilter jwtAuthFilter; // <--- Inietta il filtro
  private final PatAuthenticationFilter patAuthFilter; // <--- PAT authentication filter

  @Value("${application.frontend.url}")
  private String FRONTEND_URL;

  @Value("${application.backend.url}")
  private String BACKEND_URL;

  @Value("${application.mcpserver.url}")
  private String MCP_SERVER_URL;

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http.csrf(AbstractHttpConfigurer::disable)
        .cors(Customizer.withDefaults()) // Usa il bean corsConfigurationSource qui sotto
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .exceptionHandling(
            ex ->
                ex.authenticationEntryPoint(
                    (request, response, authException) -> {
                      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401, non 403
                      response.setContentType("application/json");
                      response.getWriter().write("{\"message\":\"Unauthorized\"}");
                    }))
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers(HttpMethod.OPTIONS, "/**")
                    .permitAll()
                    .requestMatchers("/api/test-email")
                    .permitAll()
                    // Questi endpoint sotto /api/auth richiedono autenticazione
                    .requestMatchers("/api/auth/logout-all")
                    .authenticated()
                    .requestMatchers("/api/auth/change-password")
                    .authenticated()
                    // Il resto di /api/auth è pubblico (login, register, refresh, logout,
                    // forgot-password, ecc.)
                    .requestMatchers("/api/auth/**")
                    .permitAll()
                    // OAuth 2.0 public endpoints (MCP spec)
                    .requestMatchers("/.well-known/**")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/oauth/authorize")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/oauth/token")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/oauth/register")
                    .permitAll()
                    .requestMatchers("/api/admin/**")
                    .hasRole("ADMIN")
                    .requestMatchers("/api/dashboard/**")
                    .hasRole("USER")
                    .anyRequest()
                    .authenticated())
        .addFilterBefore(
            patAuthFilter, UsernamePasswordAuthenticationFilter.class) // PAT runs first
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();

    // Only the configured origins are allowed. In dev these default to localhost (see
    // application.properties); in prod they resolve to the real hosts, so no localhost origin
    // bleeds
    // through into a production deployment (which, combined with allowCredentials, would be
    // unsafe).
    configuration.setAllowedOrigins(
        java.util.stream.Stream.of(FRONTEND_URL, BACKEND_URL, MCP_SERVER_URL)
            .filter(o -> o != null && !o.isBlank())
            .distinct()
            .toList());

    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    // A volte "Authorization" non basta, meglio essere permissivi in fase di debug
    configuration.setAllowedHeaders(List.of("*"));
    configuration.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }
}
