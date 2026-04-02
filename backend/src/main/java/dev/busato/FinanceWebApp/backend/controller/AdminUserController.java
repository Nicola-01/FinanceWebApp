package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.*;
import dev.busato.FinanceWebApp.backend.service.AdminUserInviteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/management")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserInviteService manageUserService;

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getUsers() {
        return ResponseEntity.ok(manageUserService.getUsersWithStats());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        manageUserService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/invites")
    public ResponseEntity<List<AdminInviteResponse>> getInvites() {
        return ResponseEntity.ok(manageUserService.getInvites());
    }

    @PostMapping
    public ResponseEntity<AdminInviteResponse> newUser(@RequestBody AdminInviteRequest inviteRequest) {
        return ResponseEntity.ok(manageUserService.createInvite(inviteRequest));
    }

    @DeleteMapping("invite/{email}")
    public ResponseEntity<Void> revokeInvite(@PathVariable String email) {
        manageUserService.revokeInvite(email);
        return ResponseEntity.noContent().build();
    }
}
