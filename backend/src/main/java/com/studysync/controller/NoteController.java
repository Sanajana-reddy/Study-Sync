package com.studysync.controller;

import com.studysync.dto.NoteRequest;
import com.studysync.dto.NoteResponse;
import com.studysync.service.NoteService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notes")
public class NoteController {
    @Autowired
    private NoteService noteService;

    @PostMapping("/private")
    public ResponseEntity<NoteResponse> savePrivateNote(@Valid @RequestBody NoteRequest request,
                                                        Authentication authentication) {
        String username = authentication.getName();
        NoteResponse response = noteService.savePrivateNote(request, username);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/private/{roomId}")
    public ResponseEntity<NoteResponse> getPrivateNote(@PathVariable Long roomId,
                                                       Authentication authentication) {
        String username = authentication.getName();
        NoteResponse response = noteService.getPrivateNote(roomId, username);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/shared/{roomId}")
    public ResponseEntity<NoteResponse> getSharedNote(@PathVariable Long roomId,
                                                      Authentication authentication) {
        String username = authentication.getName();
        NoteResponse response = noteService.getSharedNote(roomId, username);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/shared")
    public ResponseEntity<NoteResponse> updateSharedNote(@Valid @RequestBody NoteRequest request,
                                                          Authentication authentication) {
        String username = authentication.getName();
        NoteResponse response = noteService.updateSharedNote(request, username);
        return ResponseEntity.ok(response);
    }
}
