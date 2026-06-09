package com.studysync.repository;

import com.studysync.model.PrivateNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PrivateNoteRepository extends JpaRepository<PrivateNote, Long> {
    Optional<PrivateNote> findByUserIdAndRoomId(Long userId, Long roomId);
}
