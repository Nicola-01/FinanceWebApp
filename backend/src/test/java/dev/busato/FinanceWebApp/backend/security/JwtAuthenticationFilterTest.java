package dev.busato.FinanceWebApp.backend.security;

import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.io.IOException;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtService jwtService;
    @Mock
    private UserDetailsService userDetailsService;
    @Mock
    private UserService userService;

    @Mock
    private HttpServletRequest request;
    @Mock
    private HttpServletResponse response;
    @Mock
    private FilterChain filterChain;

    @Mock
    private Authentication existingAuthentication;

    @InjectMocks
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void doFilterInternal_NoAuthHeader_CallsFilterChain() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn(null);

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void doFilterInternal_NotBearer_CallsFilterChain() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn("Basic something");

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void doFilterInternal_AlreadyAuthenticated_CallsFilterChain() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn("Bearer token123");
        SecurityContextHolder.getContext().setAuthentication(existingAuthentication);

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertEquals(existingAuthentication, SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void doFilterInternal_IsPatToken_CallsFilterChainAndIgnores() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn("Bearer fin_pat_something");

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void doFilterInternal_IsRefreshToken_CallsFilterChainAndIgnores() throws ServletException, IOException {
        String token = "refresh_token";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtService.isRefreshToken(token)).thenReturn(true);

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void doFilterInternal_ExtractUsernameThrowsException_CallsFilterChain() throws ServletException, IOException {
        String token = "bad_token";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtService.isRefreshToken(token)).thenReturn(false);
        when(jwtService.extractUsername(token)).thenThrow(new RuntimeException("Bad JWT"));

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void doFilterInternal_ValidTokenAndValidVersion_Authenticates() throws ServletException, IOException {
        String token = "valid_token";
        String username = "user@test.com";
        UUID userId = UUID.randomUUID();

        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtService.isRefreshToken(token)).thenReturn(false);
        when(jwtService.extractUsername(token)).thenReturn(username);

        User mockUser = new User();
        mockUser.setId(userId);
        mockUser.setUsername(username);
        mockUser.setTokenVersion(1);

        when(userDetailsService.loadUserByUsername(username)).thenReturn(mockUser);
        when(jwtService.isTokenValid(token, mockUser)).thenReturn(true);

        when(userService.getTokenVersion(userId)).thenReturn(1);
        when(jwtService.extractTokenVersion(token)).thenReturn(1);

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertEquals(mockUser, auth.getPrincipal());
    }

    @Test
    void doFilterInternal_ValidTokenButInvalidVersion_DoesNotAuthenticate() throws ServletException, IOException {
        String token = "valid_token_old_version";
        String username = "user@test.com";
        UUID userId = UUID.randomUUID();

        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtService.isRefreshToken(token)).thenReturn(false);
        when(jwtService.extractUsername(token)).thenReturn(username);

        User mockUser = new User();
        mockUser.setId(userId);
        mockUser.setUsername(username);

        when(userDetailsService.loadUserByUsername(username)).thenReturn(mockUser);
        when(jwtService.isTokenValid(token, mockUser)).thenReturn(true);

        // Cache says version 2, token says version 1
        when(userService.getTokenVersion(userId)).thenReturn(2);
        when(jwtService.extractTokenVersion(token)).thenReturn(1);

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }
}
