package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.exceptions.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // --- 404 NOT FOUND ---

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleUserNotFoundException(
            UserNotFoundException ex, HttpServletRequest request) {
        return buildErrorResponse(ex, HttpStatus.NOT_FOUND, "User Not Found", request);
    }

    @ExceptionHandler(WalletNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleWalletNotFoundException(
            WalletNotFoundException ex, HttpServletRequest request) {
        return buildErrorResponse(ex, HttpStatus.NOT_FOUND, "Wallet Not Found", request);
    }

    @ExceptionHandler(TagNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleTagNotFoundException(
            TagNotFoundException ex, HttpServletRequest request) {
        return buildErrorResponse(ex, HttpStatus.NOT_FOUND, "Tag Not Found", request);
    }

    // --- 409 CONFLICT ---

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<ProblemDetail> handleUserAlreadyExistsException(
            UserAlreadyExistsException ex, HttpServletRequest request) {
        return buildErrorResponse(ex, HttpStatus.CONFLICT, "User Already Exists", request);
    }

    // --- SECURITY (401 & 403) ---

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ProblemDetail> handleBadCredentialsException(
            BadCredentialsException ex, HttpServletRequest request) {
        return buildErrorResponse(ex, HttpStatus.UNAUTHORIZED, "Bad Credentials", request);
    }

    @ExceptionHandler(PermissionDeniedException.class)
    public ResponseEntity<ProblemDetail> handlePermissionDeniedException(
            PermissionDeniedException ex, HttpServletRequest request) {
        return buildErrorResponse(ex, HttpStatus.FORBIDDEN, "Permission Denied", request);
    }

    @ExceptionHandler(UnauthorizedAccessException.class)
    public ResponseEntity<ProblemDetail> handleUnauthorizedAccessException(
            UnauthorizedAccessException ex, HttpServletRequest request) {
        return buildErrorResponse(ex, HttpStatus.FORBIDDEN, "Permission Denied", request);
    }

    @ExceptionHandler(TagHasChildrenException.class)
    public ResponseEntity<ProblemDetail> handleTagHasChildrenException(
            TagHasChildrenException ex, HttpServletRequest request) {
        return buildErrorResponse(ex, HttpStatus.BAD_REQUEST, "The tag has sub-tag", request);
    }

    /**
     * Constructs the standardised ProblemDetail response.
     * * @param ex The captured exception
     * @param status The HTTP status to return
     * @param title A short title for the error
     * @param request The original HTTP request (for the URI)
     * @return The ready ResponseEntity
     */
    private ResponseEntity<ProblemDetail> buildErrorResponse(
            Exception ex, HttpStatus status, String title, HttpServletRequest request) {

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(status, ex.getMessage());

        problemDetail.setTitle(title);
        problemDetail.setInstance(URI.create(request.getRequestURI()));
        problemDetail.setProperty("timestamp", LocalDateTime.now());

        return ResponseEntity.status(status).body(problemDetail);
    }
}