package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.exceptions.TagNotFoundException;
import dev.busato.FinanceWebApp.backend.exceptions.UserNotFoundException;
import dev.busato.FinanceWebApp.backend.exceptions.WalletNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
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
        problemDetail.setType(URI.create("https://api.shopping.com/problems/product-not-found"));
        problemDetail.setTitle("Product Not Found");
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
            UserNotFoundException ex, HttpServletRequest request) {
//
//        logger.warn("Product not found: {}", ex.getMessage());
//
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND, ex.getMessage());
        problemDetail.setType(URI.create("https://api.shopping.com/problems/product-not-found"));
        problemDetail.setTitle("Product Not Found");
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
            UserNotFoundException ex, HttpServletRequest request) {
//
//        logger.warn("Product not found: {}", ex.getMessage());
//
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND, ex.getMessage());
        problemDetail.setType(URI.create("https://api.shopping.com/problems/product-not-found"));
        problemDetail.setTitle("Product Not Found");
        problemDetail.setInstance(URI.create(request.getRequestURI()));
        problemDetail.setProperty("timestamp", LocalDateTime.now());
//
//        if (ex.getProductId() != null) {
//            problemDetail.setProperty("productId", ex.getProductId());
//        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(problemDetail);
    }
}
