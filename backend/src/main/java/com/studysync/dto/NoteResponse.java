package com.studysync.dto;

import java.time.LocalDateTime;

public class NoteResponse {
    private Long id;
    private Long roomId;
    private String content;
    private LocalDateTime updatedAt;

    public NoteResponse() {}

    public NoteResponse(Long id, Long roomId, String content, LocalDateTime updatedAt) {
        this.id = id;
        this.roomId = roomId;
        this.content = content;
        this.updatedAt = updatedAt;
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

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
