package com.studysync.service;

import com.studysync.dto.AiGenerateRequest;
import com.studysync.dto.AiGeneratedContentResponse;
import com.studysync.model.AiGeneratedContent;
import com.studysync.model.ContentType;
import com.studysync.model.Room;
import com.studysync.repository.AiGeneratedContentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class AiContentService {
    private final AiGeneratedContentRepository aiGeneratedContentRepository;
    private final RoomService roomService;
    private final RestTemplate restTemplate;

    @Value("${openai.url:${ai.api.url:https://api.openai.com/v1/chat/completions}}")
    private String aiApiUrl;

    @Value("${openai.api.key:${ai.api.key:${OPENAI_API_KEY:}}}")
    private String aiApiKey;

    @Value("${ai.api.model:gpt-4o-mini}")
    private String aiModel;

    public AiContentService(AiGeneratedContentRepository aiGeneratedContentRepository,
                            RoomService roomService,
                            RestTemplateBuilder restTemplateBuilder) {
        this.aiGeneratedContentRepository = aiGeneratedContentRepository;
        this.roomService = roomService;
        this.restTemplate = restTemplateBuilder.build();
    }

    public AiGeneratedContentResponse generateForRoom(Long roomId, AiGenerateRequest request) {
        Room room = roomService.getRoomEntity(roomId);

        String generated = callAiApi(buildPrompt(request.getType(), request.getContent()));

        AiGeneratedContent saved = aiGeneratedContentRepository.save(
                new AiGeneratedContent(room, request.getType(), generated)
        );

        return AiGeneratedContentResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<AiGeneratedContentResponse> getGeneratedForRoom(Long roomId) {
        roomService.getRoomEntity(roomId);
        return aiGeneratedContentRepository.findByRoomIdOrderByCreatedAtDesc(roomId)
                .stream()
                .map(AiGeneratedContentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    private String buildPrompt(ContentType type, String notesContent) {
        String trimmedContent = notesContent == null ? "" : notesContent.trim();
        if (trimmedContent.isEmpty()) {
            throw new RuntimeException("content cannot be empty");
        }

        if (type == ContentType.SUMMARY) {
            return "Create a concise, structured summary of the following notes.\n" +
                    "Return sections: Key Ideas, Important Terms, and Quick Revision Points.\n\n" +
                    trimmedContent;
        }

        if (type == ContentType.MCQ) {
            return "Create exactly 5 multiple-choice questions from the following notes.\n" +
                    "Each question must have 4 options (A-D) and one correct answer.\n" +
                    "Format clearly and keep questions study-focused.\n\n" +
                    trimmedContent;
        }

        throw new RuntimeException("Unsupported content type");
    }

    private String callAiApi(String prompt) {
        String effectiveApiKey = aiApiKey == null ? "" : aiApiKey.trim();
        if (effectiveApiKey.isBlank() || "YOUR_API_KEY".equalsIgnoreCase(effectiveApiKey)) {
            throw new RuntimeException("AI API key is not configured");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(effectiveApiKey);

        Map<String, Object> body = Map.of(
                "model", aiModel,
                "messages", List.of(
                        Map.of("role", "system", "content", "You are a helpful study assistant."),
                        Map.of("role", "user", "content", prompt)
                ),
                "temperature", 0.2
        );

        ResponseEntity<Map> response;
        try {
            response = restTemplate.postForEntity(
                    aiApiUrl,
                    new HttpEntity<>(body, headers),
                    Map.class
            );
        } catch (HttpClientErrorException.Unauthorized ex) {
            throw new RuntimeException("AI provider authentication failed. Check openai.api.key.");
        } catch (HttpClientErrorException.Forbidden ex) {
            throw new RuntimeException("AI provider rejected the request. Check API key permissions and model access.");
        } catch (HttpClientErrorException ex) {
            throw new RuntimeException("AI provider client error: " + ex.getStatusCode().value());
        } catch (HttpServerErrorException ex) {
            throw new RuntimeException("AI provider server error. Please try again.");
        }

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("AI API request failed");
        }

        return extractGeneratedContent(response.getBody());
    }

    private String extractGeneratedContent(Map<?, ?> responseBody) {
        Object choicesObject = responseBody.get("choices");
        if (!(choicesObject instanceof List<?> choices) || choices.isEmpty()) {
            throw new RuntimeException("AI API response did not include choices");
        }

        Object firstChoice = choices.get(0);
        if (!(firstChoice instanceof Map<?, ?> choiceMap)) {
            throw new RuntimeException("AI API response choice format is invalid");
        }

        Object messageObject = choiceMap.get("message");
        if (messageObject instanceof Map<?, ?> messageMap) {
            Object contentObject = messageMap.get("content");
            if (contentObject != null) {
                String content = String.valueOf(contentObject).trim();
                if (!content.isEmpty()) {
                    return content;
                }
            }
        }

        Object textObject = choiceMap.get("text");
        if (textObject != null) {
            String content = String.valueOf(textObject).trim();
            if (!content.isEmpty()) {
                return content;
            }
        }

        throw new RuntimeException("AI API response did not include generated content");
    }
}
