package com.studysync.service;

import com.studysync.dto.NoteRequest;
import com.studysync.dto.NoteResponse;
import com.studysync.model.PrivateNote;
import com.studysync.model.Room;
import com.studysync.model.SharedNote;
import com.studysync.model.User;
import com.studysync.repository.PrivateNoteRepository;
import com.studysync.repository.SharedNoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class NoteService {
    @Autowired
    private PrivateNoteRepository privateNoteRepository;

    @Autowired
    private SharedNoteRepository sharedNoteRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private RoomService roomService;

    public NoteResponse savePrivateNote(NoteRequest request, String username) {
        User user = userService.findByUsername(username);
        Room room = roomService.getRoomEntity(request.getRoomId());

        if (!roomService.isUserMemberOfRoom(user.getId(), room.getId())) {
            throw new RuntimeException("User is not a member of this room");
        }

        PrivateNote note = privateNoteRepository.findByUserIdAndRoomId(user.getId(), room.getId())
                .orElse(new PrivateNote(user, room, request.getContent()));

        note.setContent(request.getContent());
        note = privateNoteRepository.save(note);

        return new NoteResponse(note.getId(), note.getRoom().getId(),
                note.getContent(), note.getUpdatedAt());
    }

    public NoteResponse getPrivateNote(Long roomId, String username) {
        User user = userService.findByUsername(username);
        Room room = roomService.getRoomEntity(roomId);

        if (!roomService.isUserMemberOfRoom(user.getId(), room.getId())) {
            throw new RuntimeException("User is not a member of this room");
        }

        PrivateNote note = privateNoteRepository.findByUserIdAndRoomId(user.getId(), room.getId())
                .orElse(new PrivateNote(user, room, ""));

        return new NoteResponse(note.getId(), note.getRoom().getId(),
                note.getContent(), note.getUpdatedAt());
    }

    public NoteResponse getSharedNote(Long roomId, String username) {
        User user = userService.findByUsername(username);
        Room room = roomService.getRoomEntity(roomId);

        if (!roomService.isUserMemberOfRoom(user.getId(), room.getId())) {
            throw new RuntimeException("User is not a member of this room");
        }

        SharedNote note = sharedNoteRepository.findByRoomId(roomId)
                .orElse(new SharedNote(room, ""));

        return new NoteResponse(note.getId(), note.getRoom().getId(),
                note.getContent(), note.getUpdatedAt());
    }

    public NoteResponse updateSharedNote(NoteRequest request, String username) {
        User user = userService.findByUsername(username);
        Room room = roomService.getRoomEntity(request.getRoomId());

        if (!roomService.isUserMemberOfRoom(user.getId(), room.getId())) {
            throw new RuntimeException("User is not a member of this room");
        }

        SharedNote note = sharedNoteRepository.findByRoomId(room.getId())
                .orElse(new SharedNote(room, request.getContent()));

        note.setContent(request.getContent());
        note = sharedNoteRepository.save(note);

        return new NoteResponse(note.getId(), note.getRoom().getId(),
                note.getContent(), note.getUpdatedAt());
    }
}
