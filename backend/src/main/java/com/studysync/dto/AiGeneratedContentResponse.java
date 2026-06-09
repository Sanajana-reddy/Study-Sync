package com.studysync.dto;

import com.studysync.model.AiGeneratedContent;
import com.studysync.model.ContentType;

import java.time.LocalDateTime;

public class AiGeneratedContentResponse {
    private Long id;
    private Long roomId;
    private ContentType type;
    private String content;
    private LocalDateTime createdAt;

    public AiGeneratedContentResponse() {}

    public AiGeneratedContentResponse(Long id, Long roomId, ContentType type, String content, LocalDateTime createdAt) {
        this.id = id;
        this.roomId = roomId;
        this.type = type;
        this.content = content;
        this.createdAt = createdAt;
    }

    public static AiGeneratedContentResponse fromEntity(AiGeneratedContent entity) {
        return new AiGeneratedContentResponse(
                entity.getId(),
                entity.getRoom().getId(),
                entity.getType(),
                entity.getContent(),
                entity.getCreatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public ContentType getType() {
        return type;
    }

    public void setType(ContentType type) {
        this.type = type;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
