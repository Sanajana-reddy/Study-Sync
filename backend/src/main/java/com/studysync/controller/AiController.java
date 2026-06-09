package com.studysync.controller;

import com.studysync.dto.AiGenerateRequest;
import com.studysync.dto.AiGeneratedContentResponse;
import com.studysync.service.AiContentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
public class AiController {
    private final AiContentService aiContentService;

    public AiController(AiContentService aiContentService) {
        this.aiContentService = aiContentService;
    }

    @PostMapping("/generate/{roomId}")
    public ResponseEntity<AiGeneratedContentResponse> generateContent(@PathVariable Long roomId,
                                                                      @Valid @RequestBody AiGenerateRequest request) {
        AiGeneratedContentResponse response = aiContentService.generateForRoom(roomId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<List<AiGeneratedContentResponse>> getGeneratedContent(@PathVariable Long roomId) {
        List<AiGeneratedContentResponse> response = aiContentService.getGeneratedForRoom(roomId);
        return ResponseEntity.ok(response);
    }
}
