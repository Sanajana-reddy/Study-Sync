package com.studysync.dto;

import jakarta.validation.constraints.NotNull;

public class ArchiveSessionRequest {
    @NotNull
    private Long sessionId;
    private String summary;

    public ArchiveSessionRequest() {}

    public ArchiveSessionRequest(Long sessionId, String summary) {
        this.sessionId = sessionId;
        this.summary = summary;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }
}
