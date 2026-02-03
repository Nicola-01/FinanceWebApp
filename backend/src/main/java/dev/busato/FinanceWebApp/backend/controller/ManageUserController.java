package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.UserRequest;
import dev.busato.FinanceWebApp.backend.dto.UserResponse;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.service.ManageUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/management")
@RequiredArgsConstructor
public class ManageUserController {

    private final ManageUserService manageUserService;

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getUsers() {
        return ResponseEntity.ok(manageUserService.getUsers());
    }

    @PostMapping("/newuser")
    public ResponseEntity<UserResponse> newUser(@RequestBody UserRequest userRequest) {
        return ResponseEntity.ok(manageUserService.createUser(userRequest));
    }

}
