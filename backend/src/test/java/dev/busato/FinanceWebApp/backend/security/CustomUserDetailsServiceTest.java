package dev.busato.FinanceWebApp.backend.security;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

  @Mock private UserRepository userRepository;

  @InjectMocks private CustomUserDetailsService customUserDetailsService;

  @Test
  void loadUserByUsername_UserExists_ReturnsUserDetails() {
    User user = new User();
    user.setUsername("testuser@example.com");

    when(userRepository.findByUsernameIgnoreCase("testuser@example.com"))
        .thenReturn(Optional.of(user));

    UserDetails result = customUserDetailsService.loadUserByUsername("testuser@example.com");

    assertNotNull(result);
    assertEquals("testuser@example.com", result.getUsername());
  }

  @Test
  void loadUserByUsername_UserNotFound_ThrowsUsernameNotFoundException() {
    when(userRepository.findByUsernameIgnoreCase("nonexistent@example.com"))
        .thenReturn(Optional.empty());

    UsernameNotFoundException exception =
        assertThrows(
            UsernameNotFoundException.class,
            () -> customUserDetailsService.loadUserByUsername("nonexistent@example.com"));

    assertEquals("nonexistent@example.com", exception.getMessage());
  }

  @Test
  void loadUserByUsername_CaseInsensitive_DelegatesCorrectlyToRepository() {
    User user = new User();
    user.setUsername("testuser@example.com");

    when(userRepository.findByUsernameIgnoreCase("TESTUSER@EXAMPLE.COM"))
        .thenReturn(Optional.of(user));

    UserDetails result = customUserDetailsService.loadUserByUsername("TESTUSER@EXAMPLE.COM");

    assertNotNull(result);
    // Verifica che il repository è stato chiamato con l'input originale (case-insensitive è
    // delegato al DB)
    verify(userRepository).findByUsernameIgnoreCase("TESTUSER@EXAMPLE.COM");
  }
}
