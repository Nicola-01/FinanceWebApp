package dev.busato.FinanceWebApp.backend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import dev.busato.FinanceWebApp.backend.exceptions.InvalidTokenException;
import dev.busato.FinanceWebApp.backend.exceptions.UserNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.Objects;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

class GlobalExceptionHandlerTest {

  private GlobalExceptionHandler exceptionHandler;
  private HttpServletRequest request;

  @BeforeEach
  void setUp() {
    exceptionHandler = new GlobalExceptionHandler();
    request = new MockHttpServletRequest();
    ((MockHttpServletRequest) request).setRequestURI("/api/test");
  }

  @Test
  void handleUserNotFoundException_Returns404() {
    UserNotFoundException ex = new UserNotFoundException("User not found");
    ResponseEntity<ProblemDetail> response =
        exceptionHandler.handleUserNotFoundException(ex, request);

    assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    ProblemDetail problemDetail = response.getBody();
    assertEquals("User Not Found", problemDetail.getTitle());
    assertEquals("Could not find user with name/email: User not found", problemDetail.getDetail());
    assertEquals(URI.create("/api/test"), problemDetail.getInstance());
  }

  @Test
  void handleInvalidTokenException_Returns401() {
    InvalidTokenException ex = new InvalidTokenException("Invalid PAT token");
    ResponseEntity<ProblemDetail> response =
        exceptionHandler.handleInvalidTokenException(ex, request);

    assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    assertEquals("Invalid Token", Objects.requireNonNull(response.getBody()).getTitle());
  }

  @Test
  void handleGenericException_DoesNotLeakInformation_Returns500() {
    // Create an exception with sensitive internal details
    Exception sensitiveException =
        new RuntimeException(
            "Database connection failed for user postgres with password secretpassword");

    ResponseEntity<ProblemDetail> response =
        exceptionHandler.handleGenericException(sensitiveException, request);

    // Verify the response is 500 Internal Server Error
    assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());

    ProblemDetail problemDetail = response.getBody();
    assertEquals("Internal Server Error", problemDetail.getTitle());

    // CRITICAL: Ensure the sensitive message is NOT in the response body
    String responseDetail = problemDetail.getDetail();
    assertTrue(!responseDetail.contains("postgres") && !responseDetail.contains("secretpassword"));

    // Instead, it should contain a generic safe message
    assertEquals("An unexpected error occurred. Please try again later.", responseDetail);
  }
}
