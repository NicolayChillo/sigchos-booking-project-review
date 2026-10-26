package com.sigchos.booking.exceptions;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import com.sigchos.booking.exceptions.dto.ErrorResponse;
import com.sigchos.booking.modules.storage.exceptions.StorageException;
import com.sigchos.booking.modules.storage.exceptions.StorageFileDuplicatedException;
import com.sigchos.booking.modules.storage.exceptions.StorageFileInvalidException;
import com.sigchos.booking.modules.storage.exceptions.StorageFileNotFoundException;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {
        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
                        HttpServletRequest request) {
                String message = ex.getBindingResult().getFieldErrors().stream()
                                .map(error -> error.getField() + ": " + error.getDefaultMessage()).findFirst()
                                .orElse("Validation error");

                ErrorResponse error = new ErrorResponse(
                                LocalDateTime.now(),
                                HttpStatus.BAD_REQUEST.value(),
                                "Bad Request",
                                message,
                                request.getRequestURI());

                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        @ExceptionHandler(ResponseStatusException.class)
        public ResponseEntity<ErrorResponse> handleResponseStatus(ResponseStatusException ex,
                        HttpServletRequest request) {
                ErrorResponse error = new ErrorResponse(
                                LocalDateTime.now(),
                                ex.getStatusCode().value(),
                                ex.getMessage(),
                                ex.getReason(),
                                request.getRequestURI());

                return ResponseEntity.status(ex.getStatusCode()).body(error);
        }

        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex,
                        HttpServletRequest request) {
                ErrorResponse error = new ErrorResponse(
                                LocalDateTime.now(),
                                HttpStatus.FORBIDDEN.value(),
                                "Forbidden",
                                "You do not have permission to access this resource",
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }

        @ExceptionHandler({
                        ExpiredJwtException.class,
                        MalformedJwtException.class,
                        SignatureException.class,
                        UsernameNotFoundException.class
        })
        public ResponseEntity<ErrorResponse> handleJwtExceptions(Exception ex, HttpServletRequest request) {
                String message = "Invalid or expired token";
                if (ex instanceof ExpiredJwtException)
                        message = "The token has expired";

                ErrorResponse error = new ErrorResponse(
                                LocalDateTime.now(),
                                HttpStatus.UNAUTHORIZED.value(),
                                "Unauthorized",
                                message,
                                request.getRequestURI());

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        @ExceptionHandler(StorageException.class)
        public ResponseEntity<ErrorResponse> handleStorageException(StorageException ex,
                        HttpServletRequest request) {

                ErrorResponse error = new ErrorResponse(
                                LocalDateTime.now(),
                                HttpStatus.BAD_REQUEST.value(),
                                "Bad Request",
                                ex.getMessage(),
                                request.getRequestURI());

                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        @ExceptionHandler(StorageFileNotFoundException.class)
        public ResponseEntity<ErrorResponse> handleStorageException(StorageFileNotFoundException ex,
                        HttpServletRequest request) {

                ErrorResponse error = new ErrorResponse(
                                LocalDateTime.now(),
                                HttpStatus.NOT_FOUND.value(),
                                "Not Found",
                                ex.getMessage(),
                                request.getRequestURI());

                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }

        @ExceptionHandler(StorageFileDuplicatedException.class)
        public ResponseEntity<ErrorResponse> handleStorageException(StorageFileDuplicatedException ex,
                        HttpServletRequest request) {

                ErrorResponse error = new ErrorResponse(
                                LocalDateTime.now(),
                                HttpStatus.CONFLICT.value(),
                                "Conflict",
                                ex.getMessage(),
                                request.getRequestURI());

                return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }

        @ExceptionHandler(StorageFileInvalidException.class)
        public ResponseEntity<ErrorResponse> handleStorageException(StorageFileInvalidException ex,
                        HttpServletRequest request) {

                ErrorResponse error = new ErrorResponse(
                                LocalDateTime.now(),
                                HttpStatus.BAD_REQUEST.value(),
                                "Bad Request",
                                ex.getMessage(),
                                request.getRequestURI());

                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
}
