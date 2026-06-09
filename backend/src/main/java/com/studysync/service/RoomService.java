package com.studysync.service;

import com.studysync.dto.CreateRoomRequest;
import com.studysync.dto.JoinRoomRequest;
import com.studysync.dto.RoomResponse;
import com.studysync.exception.AlreadyMemberException;
import com.studysync.exception.RoomNotFoundException;
import com.studysync.model.Room;
import com.studysync.model.RoomMember;
import com.studysync.model.User;
import com.studysync.repository.RoomMemberRepository;
import com.studysync.repository.RoomRepository;
import com.studysync.util.RoomCodeGenerator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class RoomService {
    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomMemberRepository roomMemberRepository;

    @Autowired
    private UserService userService;

    public RoomResponse createRoom(CreateRoomRequest request, String username) {
        User owner = userService.findByUsername(username);

        String code;
        do {
            code = RoomCodeGenerator.generate();
        } while (roomRepository.existsByCode(code));

        Room room = new Room(code, request.getName(), owner);
        room = roomRepository.save(room);

        RoomMember ownerMember = new RoomMember(owner, room);
        roomMemberRepository.save(ownerMember);

        return new RoomResponse(room.getId(), room.getCode(), room.getName(),
                room.getOwner().getUsername(), room.getCreatedAt());
    }

    public RoomResponse joinRoom(JoinRoomRequest request, String username) {
        Room room = roomRepository.findByCodeIgnoreCase(request.getCode().trim())
                .orElseThrow(() -> new RoomNotFoundException("Room not found"));

        User user = userService.findByUsername(username);

        if (roomMemberRepository.existsByUserIdAndRoomId(user.getId(), room.getId())) {
            throw new AlreadyMemberException("You are already a member of this room");
        }

        RoomMember member = new RoomMember(user, room);
        roomMemberRepository.save(member);

        return new RoomResponse(room.getId(), room.getCode(), room.getName(),
                room.getOwner().getUsername(), room.getCreatedAt());
    }

    public RoomResponse getRoomByCode(String code) {
        Room room = roomRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new RoomNotFoundException("Room not found"));

        return new RoomResponse(room.getId(), room.getCode(), room.getName(),
                room.getOwner().getUsername(), room.getCreatedAt());
    }

    public Room getRoomEntity(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));
    }

    public boolean isUserMemberOfRoom(Long userId, Long roomId) {
        return roomMemberRepository.existsByUserIdAndRoomId(userId, roomId);
    }

    public List<RoomResponse> getUserRooms(String username) {
        User user = userService.findByUsername(username);
        List<RoomMember> memberships = roomMemberRepository.findByUserId(user.getId());

        return memberships.stream()
                .map(member -> {
                    Room room = member.getRoom();
                    return new RoomResponse(room.getId(), room.getCode(), room.getName(),
                            room.getOwner().getUsername(), room.getCreatedAt());
                })
                .collect(Collectors.toList());
    }
}
