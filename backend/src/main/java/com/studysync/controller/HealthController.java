package com.studysync.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/")
    public ResponseEntity<Map<String, String>> root() {
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "service", "StudySync Backend",
                "message", "Backend is running. Use frontend at localhost:5173 and API under /api"
        ));
    }

    @GetMapping("/api")
    public ResponseEntity<Map<String, String>> apiRoot() {
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "service", "StudySync API",
                "message", "Use /api/auth/login, /api/auth/register, or the frontend at localhost:5173"
        ));
    }
}
