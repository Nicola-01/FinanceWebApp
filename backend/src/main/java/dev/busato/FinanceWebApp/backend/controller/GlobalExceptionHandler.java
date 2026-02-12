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

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleUserNotFoundException(
            UserNotFoundException ex, HttpServletRequest request) {
//
//        logger.warn("Product not found: {}", ex.getMessage());
//
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND, ex.getMessage());
        problemDetail.setTitle("User_Not_Found");
        problemDetail.setInstance(URI.create(request.getRequestURI()));
        problemDetail.setProperty("timestamp", LocalDateTime.now());
//
//        if (ex.getProductId() != null) {
//            problemDetail.setProperty("productId", ex.getProductId());
//        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(problemDetail);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ProblemDetail> handleBadCredentialsException(
            BadCredentialsException ex, HttpServletRequest request) {
//
//        logger.warn("Product not found: {}", ex.getMessage());
//
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.FORBIDDEN, ex.getMessage());
        problemDetail.setTitle("Bad_Credentials");
        problemDetail.setInstance(URI.create(request.getRequestURI()));
        problemDetail.setProperty("timestamp", LocalDateTime.now());
//
//        if (ex.getProductId() != null) {
//            problemDetail.setProperty("productId", ex.getProductId());
//        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(problemDetail);
    }


    @ExceptionHandler(WalletNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleWalletNotFoundException(
            WalletNotFoundException ex, HttpServletRequest request) {
//
//        logger.warn("Product not found: {}", ex.getMessage());
//
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND, ex.getMessage());
        problemDetail.setTitle("Wallet_Not_Found");
        problemDetail.setInstance(URI.create(request.getRequestURI()));
        problemDetail.setProperty("timestamp", LocalDateTime.now());
//
//        if (ex.getProductId() != null) {
//            problemDetail.setProperty("productId", ex.getProductId());
//        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(problemDetail);
    }


    @ExceptionHandler(TagNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleTagNotFoundException(
            TagNotFoundException ex, HttpServletRequest request) {
//
//        logger.warn("Product not found: {}", ex.getMessage());
//
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND, ex.getMessage());
        problemDetail.setTitle("Tag_Not_Found");
        problemDetail.setInstance(URI.create(request.getRequestURI()));
        problemDetail.setProperty("timestamp", LocalDateTime.now());
//
//        if (ex.getProductId() != null) {
//            problemDetail.setProperty("productId", ex.getProductId());
//        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(problemDetail);
    }


    @ExceptionHandler(PermissionDeniedException.class)
    public ResponseEntity<ProblemDetail> handlePermissionDeniedException(
            PermissionDeniedException ex, HttpServletRequest request) {
//
//        logger.warn("Product not found: {}", ex.getMessage());
//
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND, ex.getMessage());
        problemDetail.setTitle("Permission Denied");
        problemDetail.setInstance(URI.create(request.getRequestURI()));
        problemDetail.setProperty("timestamp", LocalDateTime.now());
//
//        if (ex.getProductId() != null) {
//            problemDetail.setProperty("productId", ex.getProductId());
//        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(problemDetail);
    }
}
