package com.studysync.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class JoinRoomRequest {
    @NotBlank
    @Size(min = 6, max = 10)
    private String code;

    public JoinRoomRequest() {}

    public JoinRoomRequest(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
