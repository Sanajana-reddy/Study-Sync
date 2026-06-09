package com.studysync.dto;

import java.time.LocalDateTime;

public class RoomResponse {
    private Long id;
    private String code;
    private String name;
    private String ownerUsername;
    private LocalDateTime createdAt;

    public RoomResponse() {}

    public RoomResponse(Long id, String code, String name, String ownerUsername, LocalDateTime createdAt) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.ownerUsername = ownerUsername;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getOwnerUsername() {
        return ownerUsername;
    }

    public void setOwnerUsername(String ownerUsername) {
        this.ownerUsername = ownerUsername;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
