package com.vpm.vocalpitchmonitor.exceptions;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.io.IOException;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller validation - automatically called when arguments fail validation tests.
 * Provides global exception handling for the application.
 */
@RestControllerAdvice
public class RequestHandler {

    /**
     * Handles exceptions triggered when method arguments fail validation (typically for POST requests).
     * Extracts specific field errors and messages to construct a detailed error response.
     *
     * @param exception the exception thrown when validation on an argument annotated with @Valid fails
     * @return a ResponseEntity containing a map of field names to error messages and an HTTP 400 (Bad Request) status
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(
            MethodArgumentNotValidException exception
    ){
        Map<String, String> response = new HashMap<>();
        exception.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            response.put(fieldName, errorMessage);
        });

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles exceptions when a requested entity cannot be found (typically for GET requests).
     * Returns a standard error response structure including the timestamp, message, and request path.
     *
     * @param exception the exception thrown when an entity is not found in the persistence layer
     * @param request the current web request during which the exception occurred
     * @return a ResponseEntity containing error messages and an HTTP 404 (Not Found) status
     */
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleEntityNotFoundException(
            EntityNotFoundException exception,
            WebRequest request
    ){
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", new Date());
        response.put("message", exception.getMessage());
        response.put("path", request.getDescription(false));

        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    /**
     * Handles input/output exceptions that occur during file processing or other IO operations.
     *
     * @param exception the exception thrown when an I/O error occurs
     * @return a ResponseEntity containing error details (timestamp, message) and an HTTP 400 (Bad Request) status
     */
    @ExceptionHandler(IOException.class)
    public ResponseEntity<Map<String, Object>> handleIOException(
            IOException exception
    ){
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", new Date());
        response.put("message", exception.getMessage());

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

}
