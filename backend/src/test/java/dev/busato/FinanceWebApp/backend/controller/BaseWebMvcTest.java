package dev.busato.FinanceWebApp.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.busato.FinanceWebApp.backend.model.User;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.core.MethodParameter;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Base class for all @WebMvcTest classes. We disable Spring Security filters to test only the web
 * layer (validation, serialization, routing).
 */
@ActiveProfiles("test")
@AutoConfigureMockMvc(addFilters = false)
@Import(BaseWebMvcTest.TestWebMvcConfig.class)
public abstract class BaseWebMvcTest {

  @Autowired protected MockMvc mockMvc;

  @Autowired protected ObjectMapper objectMapper;

  @org.springframework.test.context.bean.override.mockito.MockitoBean
  protected dev.busato.FinanceWebApp.backend.security.JwtAuthenticationFilter
      jwtAuthenticationFilter;

  @org.springframework.test.context.bean.override.mockito.MockitoBean
  protected dev.busato.FinanceWebApp.backend.security.PatAuthenticationFilter
      patAuthenticationFilter;

  // --- Common test data ---
  protected static User mockUser;
  protected static User mockAdmin;

  static {
    mockUser = new User();
    mockUser.setId(UUID.fromString("11111111-1111-1111-1111-111111111111"));
    mockUser.setUsername("user@example.com");
    mockUser.setEmail("user@example.com");
    mockUser.setRole(User.Role.USER);

    mockAdmin = new User();
    mockAdmin.setId(UUID.fromString("22222222-2222-2222-2222-222222222222"));
    mockAdmin.setUsername("admin@example.com");
    mockAdmin.setEmail("admin@example.com");
    mockAdmin.setRole(User.Role.ADMIN);
  }

  @BeforeEach
  public void setUpBase() throws Exception {
    org.mockito.Mockito.doAnswer(
            invocation -> {
              jakarta.servlet.FilterChain chain = invocation.getArgument(2);
              chain.doFilter(invocation.getArgument(0), invocation.getArgument(1));
              return null;
            })
        .when(jwtAuthenticationFilter)
        .doFilter(
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any());

    org.mockito.Mockito.doAnswer(
            invocation -> {
              jakarta.servlet.FilterChain chain = invocation.getArgument(2);
              chain.doFilter(invocation.getArgument(0), invocation.getArgument(1));
              return null;
            })
        .when(patAuthenticationFilter)
        .doFilter(
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any());
  }

  @TestConfiguration
  public static class TestWebMvcConfig implements WebMvcConfigurer {
    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
      resolvers.add(
          new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
              return parameter.hasParameterAnnotation(AuthenticationPrincipal.class)
                  && parameter.getParameterType().isAssignableFrom(User.class);
            }

            @Override
            public Object resolveArgument(
                MethodParameter parameter,
                ModelAndViewContainer mavContainer,
                NativeWebRequest webRequest,
                WebDataBinderFactory binderFactory) {
              return mockUser; // Always inject mockUser for controller tests
            }
          });
    }
  }
}
