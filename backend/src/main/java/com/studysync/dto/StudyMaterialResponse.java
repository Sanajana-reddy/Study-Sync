package com.studysync.dto;

import java.time.LocalDateTime;

public class StudyMaterialResponse {
    private Long id;
    private Long roomId;
    private String fileName;
    private String fileType;
    private String filePath;
    private String uploadedByUsername;
    private boolean canDelete;
    private LocalDateTime uploadedAt;

    public StudyMaterialResponse() {}

    public StudyMaterialResponse(
            Long id,
            Long roomId,
            String fileName,
            String fileType,
            String filePath,
            String uploadedByUsername,
            boolean canDelete,
            LocalDateTime uploadedAt
    ) {
        this.id = id;
        this.roomId = roomId;
        this.fileName = fileName;
        this.fileType = fileType;
        this.filePath = filePath;
        this.uploadedByUsername = uploadedByUsername;
        this.canDelete = canDelete;
        this.uploadedAt = uploadedAt;
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

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public String getUploadedByUsername() {
        return uploadedByUsername;
    }

    public void setUploadedByUsername(String uploadedByUsername) {
        this.uploadedByUsername = uploadedByUsername;
    }

    public boolean isCanDelete() {
        return canDelete;
    }

    public void setCanDelete(boolean canDelete) {
        this.canDelete = canDelete;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
}
