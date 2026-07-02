package dev.busato.FinanceWebApp.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeast;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.security.JwtService;
import dev.busato.FinanceWebApp.backend.service.DemoService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@WebMvcTest(
    controllers = DemoController.class,
    excludeAutoConfiguration = {
      org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class
    })
@TestPropertySource(properties = "application.demo.enabled=true")
class DemoControllerTest extends BaseWebMvcTest {

  @MockitoBean private UserRepository userRepository;

  @MockitoBean private PasswordEncoder passwordEncoder;

  @MockitoBean private JwtService jwtService;

  @MockitoBean private DemoService demoService;

  @Test
  void createDemoUser_ShouldReturn200() throws Exception {
    when(userRepository.existsByUsernameIgnoreCase(anyString())).thenReturn(false);
    when(passwordEncoder.encode(anyString())).thenReturn("hashed-password");
    when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
    when(jwtService.generateToken(any(), any())).thenReturn("demo-jwt-token");

    mockMvc
        .perform(post("/api/auth/demo"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.token").value("demo-jwt-token"))
        .andExpect(jsonPath("$.role").value("USER"))
        .andExpect(jsonPath("$.passwordMustChange").value(false));

    verify(demoService).generateDemoWallet(any());
  }

  @Test
  void createDemoUser_WithUsernameCollision_ShouldRetryAndReturn200() throws Exception {
    when(userRepository.existsByUsernameIgnoreCase(anyString())).thenReturn(true, false);
    when(passwordEncoder.encode(anyString())).thenReturn("hashed-password");
    when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
    when(jwtService.generateToken(any(), any())).thenReturn("demo-jwt-token");

    mockMvc
        .perform(post("/api/auth/demo"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.token").value("demo-jwt-token"))
        .andExpect(jsonPath("$.role").value("USER"))
        .andExpect(jsonPath("$.passwordMustChange").value(false));

    verify(userRepository, atLeast(2)).existsByUsernameIgnoreCase(anyString());
    verify(demoService).generateDemoWallet(any());
  }
}
