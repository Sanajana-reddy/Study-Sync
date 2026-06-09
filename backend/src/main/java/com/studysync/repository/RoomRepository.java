package com.studysync.repository;

import com.studysync.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    Optional<Room> findByCode(String code);
    Optional<Room> findByCodeIgnoreCase(String code);
    boolean existsByCode(String code);
}
