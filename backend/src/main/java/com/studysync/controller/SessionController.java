package com.studysync.controller;

import com.studysync.dto.ArchiveSessionRequest;
import com.studysync.model.Session;
import com.studysync.service.SessionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {
    @Autowired
    private SessionService sessionService;

    @PostMapping("/start/{roomId}")
    public ResponseEntity<Session> startSession(@PathVariable Long roomId,
                                                Authentication authentication) {
        String username = authentication.getName();
        Session session = sessionService.startSession(roomId, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(session);
    }

    @PostMapping("/archive")
    public ResponseEntity<Session> archiveSession(@Valid @RequestBody ArchiveSessionRequest request,
                                                  Authentication authentication) {
        String username = authentication.getName();
        Session session = sessionService.archiveSession(request, username);
        return ResponseEntity.ok(session);
    }

    @GetMapping("/room/{roomId}")
    public ResponseEntity<List<Session>> getRoomSessions(@PathVariable Long roomId,
                                                         Authentication authentication) {
        String username = authentication.getName();
        List<Session> sessions = sessionService.getRoomSessions(roomId, username);
        return ResponseEntity.ok(sessions);
    }
}
