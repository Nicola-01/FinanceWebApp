package dev.busato.FinanceWebApp.backend.security;

import dev.busato.FinanceWebApp.backend.exceptions.InvalidTokenException;
import dev.busato.FinanceWebApp.backend.model.PersonalAccessToken;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.service.PatService;
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
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PatAuthenticationFilterTest {

    @Mock
    private PatService patService;
    @Mock
    private UserDetailsService userDetailsService;

    @Mock
    private HttpServletRequest request;
    @Mock
    private HttpServletResponse response;
    @Mock
    private FilterChain filterChain;

    @Mock
    private Authentication existingAuthentication;

    @InjectMocks
    private PatAuthenticationFilter patAuthenticationFilter;

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

        patAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void doFilterInternal_NotBearerPat_CallsFilterChain() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn("Bearer something_else");

        patAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void doFilterInternal_AlreadyAuthenticated_CallsFilterChain() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn("Bearer fin_pat_token");
        SecurityContextHolder.getContext().setAuthentication(existingAuthentication);

        patAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertEquals(existingAuthentication, SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void doFilterInternal_ValidToken_SetsAuthenticationAndCallsFilterChain() throws ServletException, IOException {
        String token = "fin_pat_valid";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);

        User user = new User();
        user.setUsername("testuser");
        PersonalAccessToken pat = new PersonalAccessToken();
        pat.setUser(user);

        when(patService.validateToken(token)).thenReturn(pat);

        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getAuthorities()).thenReturn(Collections.emptyList());
        when(userDetailsService.loadUserByUsername("testuser")).thenReturn(userDetails);

        patAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertEquals(userDetails, auth.getPrincipal());
        assertEquals(pat, auth.getCredentials());
    }

    @Test
    void doFilterInternal_InvalidToken_Returns401() throws ServletException, IOException {
        String token = "fin_pat_invalid";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);

        when(patService.validateToken(token)).thenThrow(new InvalidTokenException("Invalid PAT"));

        StringWriter stringWriter = new StringWriter();
        PrintWriter printWriter = new PrintWriter(stringWriter);
        when(response.getWriter()).thenReturn(printWriter);

        patAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        verify(response).setContentType("application/json");
        verify(filterChain, never()).doFilter(any(), any());

        String responseBody = stringWriter.toString();
        assertTrue(responseBody.contains("Invalid PAT"));
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }
}
