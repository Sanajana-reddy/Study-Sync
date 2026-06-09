package com.studysync.dto;

import com.studysync.model.ContentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AiGenerateRequest {
    @NotNull(message = "type is required")
    private ContentType type;

    @NotBlank(message = "content is required")
    private String content;

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
}
