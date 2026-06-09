package com.studysync.dto;

import jakarta.validation.constraints.NotNull;

public class NoteRequest {
    @NotNull
    private Long roomId;
    private String content;

    public NoteRequest() {}

    public NoteRequest(Long roomId, String content) {
        this.roomId = roomId;
        this.content = content;
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
}
