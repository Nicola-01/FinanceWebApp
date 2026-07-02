package dev.busato.FinanceWebApp.backend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import dev.busato.FinanceWebApp.backend.exceptions.InvalidTokenException;
import dev.busato.FinanceWebApp.backend.exceptions.PermissionDeniedException;
import dev.busato.FinanceWebApp.backend.exceptions.TagHasChildrenException;
import dev.busato.FinanceWebApp.backend.exceptions.TagInUseException;
import dev.busato.FinanceWebApp.backend.exceptions.TagNotFoundException;
import dev.busato.FinanceWebApp.backend.exceptions.UnauthorizedAccessException;
import dev.busato.FinanceWebApp.backend.exceptions.UserAlreadyExistsException;
import dev.busato.FinanceWebApp.backend.exceptions.UserNotFoundException;
import dev.busato.FinanceWebApp.backend.exceptions.WalletNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.Objects;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.MethodArgumentNotValidException;

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

  @Test
  void handleWalletNotFoundException_Returns404() {
    WalletNotFoundException ex = new WalletNotFoundException(UUID.randomUUID());
    ResponseEntity<ProblemDetail> response =
        exceptionHandler.handleWalletNotFoundException(ex, request);

    assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    ProblemDetail problemDetail = response.getBody();
    assertEquals("Wallet Not Found", problemDetail.getTitle());
    assertEquals(ex.getMessage(), problemDetail.getDetail());
    assertEquals(URI.create("/api/test"), problemDetail.getInstance());
    assertNotNull(problemDetail.getProperties().get("timestamp"));
  }

  @Test
  void handleTagNotFoundException_Returns404() {
    TagNotFoundException ex = new TagNotFoundException("Groceries", UUID.randomUUID());
    ResponseEntity<ProblemDetail> response =
        exceptionHandler.handleTagNotFoundException(ex, request);

    assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    ProblemDetail problemDetail = response.getBody();
    assertEquals("Tag Not Found", problemDetail.getTitle());
    assertEquals(ex.getMessage(), problemDetail.getDetail());
    assertEquals(URI.create("/api/test"), problemDetail.getInstance());
    assertNotNull(problemDetail.getProperties().get("timestamp"));
  }

  @Test
  void handleUserAlreadyExistsException_Returns409() {
    UserAlreadyExistsException ex = new UserAlreadyExistsException("jdoe");
    ResponseEntity<ProblemDetail> response =
        exceptionHandler.handleUserAlreadyExistsException(ex, request);

    assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
    ProblemDetail problemDetail = response.getBody();
    assertEquals("User Already Exists", problemDetail.getTitle());
    assertEquals(ex.getMessage(), problemDetail.getDetail());
    assertEquals(URI.create("/api/test"), problemDetail.getInstance());
    assertNotNull(problemDetail.getProperties().get("timestamp"));
  }

  @Test
  void handleBadCredentialsException_Returns401() {
    BadCredentialsException ex = new BadCredentialsException("Bad credentials supplied");
    ResponseEntity<ProblemDetail> response =
        exceptionHandler.handleBadCredentialsException(ex, request);

    assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    ProblemDetail problemDetail = response.getBody();
    assertEquals("Bad Credentials", problemDetail.getTitle());
    assertEquals(ex.getMessage(), problemDetail.getDetail());
    assertEquals(URI.create("/api/test"), problemDetail.getInstance());
    assertNotNull(problemDetail.getProperties().get("timestamp"));
  }

  @Test
  void handlePermissionDeniedException_Returns403() {
    PermissionDeniedException ex = new PermissionDeniedException("jdoe", UUID.randomUUID());
    ResponseEntity<ProblemDetail> response =
        exceptionHandler.handlePermissionDeniedException(ex, request);

    assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    ProblemDetail problemDetail = response.getBody();
    assertEquals("Permission Denied", problemDetail.getTitle());
    assertEquals(ex.getMessage(), problemDetail.getDetail());
    assertEquals(URI.create("/api/test"), problemDetail.getInstance());
    assertNotNull(problemDetail.getProperties().get("timestamp"));
  }

  @Test
  void handleUnauthorizedAccessException_Returns403() {
    UnauthorizedAccessException ex = new UnauthorizedAccessException("Access not authorized");
    ResponseEntity<ProblemDetail> response =
        exceptionHandler.handleUnauthorizedAccessException(ex, request);

    assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    ProblemDetail problemDetail = response.getBody();
    assertEquals("Permission Denied", problemDetail.getTitle());
    assertEquals(ex.getMessage(), problemDetail.getDetail());
    assertEquals(URI.create("/api/test"), problemDetail.getInstance());
    assertNotNull(problemDetail.getProperties().get("timestamp"));
  }

  @Test
  void handleTagHasChildrenException_Returns400() {
    TagHasChildrenException ex = new TagHasChildrenException("Groceries");
    ResponseEntity<ProblemDetail> response =
        exceptionHandler.handleTagHasChildrenException(ex, request);

    assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    ProblemDetail problemDetail = response.getBody();
    assertEquals("The tag has sub-tag", problemDetail.getTitle());
    assertEquals(ex.getMessage(), problemDetail.getDetail());
    assertEquals(URI.create("/api/test"), problemDetail.getInstance());
    assertNotNull(problemDetail.getProperties().get("timestamp"));
  }

  @Test
  void handleTagInUseException_Returns409() {
    TagInUseException ex = new TagInUseException("Groceries");
    ResponseEntity<ProblemDetail> response = exceptionHandler.handleTagInUseException(ex, request);

    assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
    ProblemDetail problemDetail = response.getBody();
    assertEquals("Tag in Use", problemDetail.getTitle());
    assertEquals(ex.getMessage(), problemDetail.getDetail());
    assertEquals(URI.create("/api/test"), problemDetail.getInstance());
    assertNotNull(problemDetail.getProperties().get("timestamp"));
  }

  @Test
  void handleIllegalArgumentException_Returns409() {
    IllegalArgumentException ex = new IllegalArgumentException("Invalid argument supplied");
    ResponseEntity<ProblemDetail> response =
        exceptionHandler.handleIllegalArgumentException(ex, request);

    assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
    ProblemDetail problemDetail = response.getBody();
    // Title is the raw exception message, not a static string.
    assertEquals(ex.getMessage(), problemDetail.getTitle());
    assertEquals(ex.getMessage(), problemDetail.getDetail());
    assertEquals(URI.create("/api/test"), problemDetail.getInstance());
    assertNotNull(problemDetail.getProperties().get("timestamp"));
  }

  @Test
  void handleValidationException_Returns400() throws NoSuchMethodException {
    MethodParameter methodParameter =
        new MethodParameter(
            GlobalExceptionHandlerTest.class.getDeclaredMethod(
                "dummyMethodForParameter", String.class),
            0);
    BindingResult bindingResult = mock(BindingResult.class);
    when(bindingResult.getAllErrors()).thenReturn(java.util.Collections.emptyList());
    MethodArgumentNotValidException ex =
        new MethodArgumentNotValidException(methodParameter, bindingResult);

    ResponseEntity<ProblemDetail> response =
        exceptionHandler.handleValidationException(ex, request);

    assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    ProblemDetail problemDetail = response.getBody();
    assertEquals("Validation Error", problemDetail.getTitle());
    assertEquals("Invalid input data", problemDetail.getDetail());
    assertEquals(URI.create("/api/test"), problemDetail.getInstance());
    assertNotNull(problemDetail.getProperties().get("timestamp"));
  }

  // Helper method used solely to obtain a MethodParameter instance for the validation test above.
  @SuppressWarnings("unused")
  private void dummyMethodForParameter(String value) {}
}
