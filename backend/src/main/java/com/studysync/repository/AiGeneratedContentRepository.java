package com.studysync.repository;

import com.studysync.model.AiGeneratedContent;
import com.studysync.model.ContentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiGeneratedContentRepository extends JpaRepository<AiGeneratedContent, Long> {
    List<AiGeneratedContent> findByRoomId(Long roomId);
    List<AiGeneratedContent> findByRoomIdAndType(Long roomId, ContentType type);
    List<AiGeneratedContent> findByRoomIdOrderByCreatedAtDesc(Long roomId);
}
