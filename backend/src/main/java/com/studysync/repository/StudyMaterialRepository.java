package com.studysync.repository;

import com.studysync.model.StudyMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudyMaterialRepository extends JpaRepository<StudyMaterial, Long> {
    Optional<StudyMaterial> findTopByRoomIdOrderByUploadedAtDesc(Long roomId);
    List<StudyMaterial> findByRoomIdOrderByUploadedAtDesc(Long roomId);
}
