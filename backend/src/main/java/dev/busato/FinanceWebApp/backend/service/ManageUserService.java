package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.UserRequest;
import dev.busato.FinanceWebApp.backend.dto.UserResponse;
import dev.busato.FinanceWebApp.backend.exceptions.UserAlreadyExistsException;
import dev.busato.FinanceWebApp.backend.exceptions.UserNotFoundException;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.repository.ManageUserRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ManageUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ManageUserRepository manageUserRepository;

    //    @PreAuthorize("adminUser.Role.equals(User.Role.ADMIN)")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> getUsers() {
        return userRepository.findAllByRole(User.Role.USER)
                .stream().map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse createUser(UserRequest userRequest) {
        String tempPassword = generateRandomPassword(12);

        if (userRepository.existsByUsernameIgnoreCase(userRequest.getUsername()))
            throw new UserAlreadyExistsException(userRequest.getUsername());

        User user = User.builder()
                .username(userRequest.getUsername())
                .password(passwordEncoder.encode(tempPassword))
                .build();

        UserResponse userResponse = mapToResponse(manageUserRepository.save(user));
        userResponse.setTempPassword(tempPassword);
        return userResponse;
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(UUID id) {
        if (!userRepository.existsById(id))
            throw new UserNotFoundException(id);
        userRepository.deleteById(id);
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getUsername())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private String generateRandomPassword(int length) {
        return UUID.randomUUID().toString().replace("-", "").substring(0, length);
    }
}
