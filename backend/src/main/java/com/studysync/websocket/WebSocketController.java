package com.studysync.websocket;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class WebSocketController {
    private final SimpMessagingTemplate messagingTemplate;
    private final Map<Long, Map<String, String>> roomParticipants = new ConcurrentHashMap<>();
    private final Map<String, ParticipantSession> participantSessions = new ConcurrentHashMap<>();

    public WebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    private static class ParticipantSession {
        private final Long roomId;
        private final String userId;

        private ParticipantSession(Long roomId, String userId) {
            this.roomId = roomId;
            this.userId = userId;
        }
    }

    private List<Map<String, String>> getParticipantsPayload(Long roomId) {
        Map<String, String> users = roomParticipants.getOrDefault(roomId, Map.of());
        List<Map<String, String>> participants = new ArrayList<>();
        for (Map.Entry<String, String> entry : users.entrySet()) {
            Map<String, String> item = new HashMap<>();
            item.put("userId", entry.getKey());
            item.put("username", entry.getValue());
            participants.add(item);
        }
        return participants;
    }

    @MessageMapping("/notes/{roomId}")
    @SendTo("/topic/notes/{roomId}")
    public Map<String, Object> handleNotesUpdate(Map<String, Object> message, Principal principal) {
        message.put("username", principal.getName());
        message.put("timestamp", System.currentTimeMillis());
        return message;
    }

    @MessageMapping("/cursor/{roomId}")
    @SendTo("/topic/cursor/{roomId}")
    public Map<String, Object> handleCursorUpdate(Map<String, Object> message, Principal principal) {
        message.put("username", principal.getName());
        message.put("timestamp", System.currentTimeMillis());
        return message;
    }

    @MessageMapping("/doubt/{roomId}")
    @SendTo("/topic/doubt/{roomId}")
    public Map<String, Object> handleDoubt(Map<String, Object> message, Principal principal) {
        message.put("username", principal.getName());
        message.put("timestamp", System.currentTimeMillis());
        return message;
    }

    @MessageMapping("/whiteboard/{roomId}")
    @SendTo("/topic/whiteboard/{roomId}")
    public Map<String, Object> handleWhiteboardUpdate(Map<String, Object> message, Principal principal) {
        message.put("username", principal.getName());
        message.put("timestamp", System.currentTimeMillis());
        return message;
    }

    @MessageMapping("/pomodoro/{roomId}")
    @SendTo("/topic/pomodoro/{roomId}")
    public Map<String, Object> handlePomodoroUpdate(Map<String, Object> message, Principal principal) {
        message.put("username", principal.getName());
        message.put("timestamp", System.currentTimeMillis());
        return message;
    }

    @MessageMapping("/webrtc/offer/{roomId}")
    @SendTo("/topic/webrtc/offer/{roomId}")
    public Map<String, Object> handleWebRtcOffer(Map<String, Object> message) {
        return message;
    }

    @MessageMapping("/webrtc/answer/{roomId}")
    @SendTo("/topic/webrtc/answer/{roomId}")
    public Map<String, Object> handleWebRtcAnswer(Map<String, Object> message) {
        return message;
    }

    @MessageMapping("/webrtc/ice/{roomId}")
    @SendTo("/topic/webrtc/ice/{roomId}")
    public Map<String, Object> handleWebRtcIce(Map<String, Object> message) {
        return message;
    }

    @MessageMapping("/chat/{roomId}")
    public void handleChatMessage(
            @DestinationVariable Long roomId,
            Map<String, Object> message,
            Principal principal
    ) {
        String sender = principal != null
                ? principal.getName()
                : String.valueOf(message.getOrDefault("sender", "guest"));

        message.put("sender", sender);
        if (message.get("timestamp") == null) {
            message.put("timestamp", System.currentTimeMillis());
        }

        messagingTemplate.convertAndSend("/topic/chat/" + roomId, message);
    }

    @MessageMapping("/participants/{roomId}")
    public void handleParticipantJoin(
            @DestinationVariable Long roomId,
            Map<String, Object> message,
            Principal principal,
            SimpMessageHeaderAccessor headerAccessor
    ) {
        String username = principal != null ? principal.getName() : String.valueOf(message.getOrDefault("username", "guest"));
        String userId = String.valueOf(message.getOrDefault("userId", username));
        String sessionId = headerAccessor.getSessionId();

        roomParticipants
                .computeIfAbsent(roomId, key -> new ConcurrentHashMap<>())
                .put(userId, username);

        if (sessionId != null) {
            participantSessions.put(sessionId, new ParticipantSession(roomId, userId));
        }

        messagingTemplate.convertAndSend("/topic/participants/" + roomId, getParticipantsPayload(roomId));
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        if (sessionId == null) {
            return;
        }

        ParticipantSession session = participantSessions.remove(sessionId);
        if (session == null) {
            return;
        }

        Map<String, String> users = roomParticipants.get(session.roomId);
        if (users == null) {
            return;
        }

        users.remove(session.userId);
        if (users.isEmpty()) {
            roomParticipants.remove(session.roomId);
        }

        messagingTemplate.convertAndSend("/topic/participants/" + session.roomId, getParticipantsPayload(session.roomId));
    }
}
