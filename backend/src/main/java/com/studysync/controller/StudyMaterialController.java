package com.studysync.controller;

import com.studysync.dto.StudyMaterialResponse;
import com.studysync.exception.RoomNotFoundException;
import com.studysync.model.Room;
import com.studysync.model.StudyMaterial;
import com.studysync.repository.RoomRepository;
import com.studysync.repository.StudyMaterialRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/material")
public class StudyMaterialController {

    private static final String UPLOAD_DIR = "uploads";

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private StudyMaterialRepository studyMaterialRepository;

    @PostMapping("/upload/{roomId}")
    public ResponseEntity<StudyMaterialResponse> uploadMaterial(
            @PathVariable Long roomId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is required");
        }

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RoomNotFoundException("Room not found"));

        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "material" : file.getOriginalFilename());
        String safeName = Paths.get(originalName).getFileName().toString();
        String storedName = UUID.randomUUID() + "_" + safeName;
        Path targetPath = uploadPath.resolve(storedName);

        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        StudyMaterial material = new StudyMaterial(
                room,
                safeName,
                file.getContentType() == null ? "application/octet-stream" : file.getContentType(),
                "/uploads/" + storedName,
                authentication != null ? authentication.getName() : null
        );
        StudyMaterial saved = studyMaterialRepository.save(material);

        return ResponseEntity.ok(toResponse(saved, authentication));
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<StudyMaterialResponse> getLatestMaterial(
            @PathVariable Long roomId,
            Authentication authentication
    ) {
        roomRepository.findById(roomId)
                .orElseThrow(() -> new RoomNotFoundException("Room not found"));

        StudyMaterial material = studyMaterialRepository.findTopByRoomIdOrderByUploadedAtDesc(roomId)
                .orElseThrow(() -> new RuntimeException("No study material found for this room"));

        return ResponseEntity.ok(toResponse(material, authentication));
    }

    @GetMapping("/list/{roomId}")
    public ResponseEntity<List<StudyMaterialResponse>> getMaterials(
            @PathVariable Long roomId,
            Authentication authentication
    ) {
        roomRepository.findById(roomId)
                .orElseThrow(() -> new RoomNotFoundException("Room not found"));

        List<StudyMaterialResponse> materials = studyMaterialRepository.findByRoomIdOrderByUploadedAtDesc(roomId)
                .stream()
                .map(material -> toResponse(material, authentication))
                .toList();

        return ResponseEntity.ok(materials);
    }

    @GetMapping("/file/{roomId}")
    public ResponseEntity<Resource> getLatestMaterialFile(@PathVariable Long roomId) throws IOException {
        roomRepository.findById(roomId)
                .orElseThrow(() -> new RoomNotFoundException("Room not found"));

        StudyMaterial material = studyMaterialRepository.findTopByRoomIdOrderByUploadedAtDesc(roomId)
                .orElseThrow(() -> new RuntimeException("No study material found for this room"));

        String normalizedPath = material.getFilePath().startsWith("/")
                ? material.getFilePath().substring(1)
                : material.getFilePath();
        Path filePath = Paths.get(normalizedPath).normalize();
        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            throw new RuntimeException("Study material file is missing or unreadable");
        }

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(
                    material.getFileType() == null ? "application/octet-stream" : material.getFileType()
            );
        } catch (Exception ex) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + material.getFileName() + "\"")
                .body(resource);
    }

    @GetMapping("/file/id/{materialId}")
    public ResponseEntity<Resource> getMaterialFileById(@PathVariable Long materialId) throws IOException {
        StudyMaterial material = studyMaterialRepository.findById(materialId)
                .orElseThrow(() -> new RuntimeException("Study material not found"));

        String normalizedPath = material.getFilePath().startsWith("/")
                ? material.getFilePath().substring(1)
                : material.getFilePath();
        Path filePath = Paths.get(normalizedPath).normalize();
        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            throw new RuntimeException("Study material file is missing or unreadable");
        }

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(
                    material.getFileType() == null ? "application/octet-stream" : material.getFileType()
            );
        } catch (Exception ex) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + material.getFileName() + "\"")
                .body(resource);
    }

    @DeleteMapping("/{roomId}/{materialId}")
    public ResponseEntity<Void> deleteMaterial(
            @PathVariable Long roomId,
            @PathVariable Long materialId,
            Authentication authentication
    ) throws IOException {
        roomRepository.findById(roomId)
                .orElseThrow(() -> new RoomNotFoundException("Room not found"));

        StudyMaterial material = studyMaterialRepository.findById(materialId)
                .orElseThrow(() -> new RuntimeException("Study material not found"));

        if (material.getRoom() == null || !roomId.equals(material.getRoom().getId())) {
            throw new RuntimeException("Material does not belong to this room");
        }

        if (!canDelete(material, authentication)) {
            throw new RuntimeException("Only teachers or the uploader can delete this file");
        }

        String normalizedPath = material.getFilePath().startsWith("/")
                ? material.getFilePath().substring(1)
                : material.getFilePath();
        Path filePath = Paths.get(normalizedPath).normalize();
        Files.deleteIfExists(filePath);

        studyMaterialRepository.delete(material);
        return ResponseEntity.noContent().build();
    }

    private StudyMaterialResponse toResponse(StudyMaterial material, Authentication authentication) {
        return new StudyMaterialResponse(
                material.getId(),
                material.getRoom().getId(),
                material.getFileName(),
                material.getFileType(),
                material.getFilePath(),
                material.getUploadedByUsername(),
                canDelete(material, authentication),
                material.getUploadedAt()
        );
    }

    private boolean canDelete(StudyMaterial material, Authentication authentication) {
        if (authentication == null) {
            return false;
        }

        boolean isTeacher = authentication.getAuthorities()
                .stream()
                .anyMatch(authority -> "ROLE_TEACHER".equals(authority.getAuthority()));
        if (isTeacher) {
            return true;
        }

        String username = authentication.getName();
        if (username == null || username.isBlank()) {
            return false;
        }

        // Room owner acts as room admin and can manage all files in that room.
        if (material.getRoom() != null
                && material.getRoom().getOwner() != null
                && username.equals(material.getRoom().getOwner().getUsername())) {
            return true;
        }

        return username.equals(material.getUploadedByUsername());
    }
}
