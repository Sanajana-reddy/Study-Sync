package com.studysync.service;

import com.studysync.dto.ArchiveSessionRequest;
import com.studysync.model.Room;
import com.studysync.model.Session;
import com.studysync.model.User;
import com.studysync.repository.SessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class SessionService {
    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private RoomService roomService;

    @Autowired
    private UserService userService;

    public Session startSession(Long roomId, String username) {
        User user = userService.findByUsername(username);
        Room room = roomService.getRoomEntity(roomId);

        if (!roomService.isUserMemberOfRoom(user.getId(), room.getId())) {
            throw new RuntimeException("User is not a member of this room");
        }

        Session session = new Session(room);
        return sessionRepository.save(session);
    }

    public Session archiveSession(ArchiveSessionRequest request, String username) {
        User user = userService.findByUsername(username);
        Session session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new RuntimeException("Session not found"));

        Room room = session.getRoom();
        if (!roomService.isUserMemberOfRoom(user.getId(), room.getId())) {
            throw new RuntimeException("User is not a member of this room");
        }

        session.setEndedAt(LocalDateTime.now());
        session.setSummary(request.getSummary());
        return sessionRepository.save(session);
    }

    public List<Session> getRoomSessions(Long roomId, String username) {
        User user = userService.findByUsername(username);
        Room room = roomService.getRoomEntity(roomId);

        if (!roomService.isUserMemberOfRoom(user.getId(), room.getId())) {
            throw new RuntimeException("User is not a member of this room");
        }

        return sessionRepository.findByRoomId(roomId);
    }
}
