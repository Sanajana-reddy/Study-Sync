package com.studysync.repository;

import com.studysync.model.SharedNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SharedNoteRepository extends JpaRepository<SharedNote, Long> {
    Optional<SharedNote> findByRoomId(Long roomId);
}
