package com.studysync.controller;

import com.studysync.dto.CreateRoomRequest;
import com.studysync.dto.JoinRoomRequest;
import com.studysync.dto.RoomResponse;
import com.studysync.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {
    @Autowired
    private RoomService roomService;

    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(@Valid @RequestBody CreateRoomRequest request,
                                                   Authentication authentication) {
        String username = authentication.getName();
        RoomResponse response = roomService.createRoom(request, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/join")
    public ResponseEntity<RoomResponse> joinRoom(@Valid @RequestBody JoinRoomRequest request,
                                                 Authentication authentication) {
        String username = authentication.getName();
        RoomResponse response = roomService.joinRoom(request, username);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<RoomResponse> getRoomByCode(@PathVariable String code) {
        RoomResponse response = roomService.getRoomByCode(code);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-rooms")
    public ResponseEntity<List<RoomResponse>> getMyRooms(Authentication authentication) {
        String username = authentication.getName();
        List<RoomResponse> rooms = roomService.getUserRooms(username);
        return ResponseEntity.ok(rooms);
    }
}
