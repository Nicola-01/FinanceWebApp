package dev.busato.FinanceWebApp.backend.mappers;

import dev.busato.FinanceWebApp.backend.dto.UserResponse;
import dev.busato.FinanceWebApp.backend.model.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@ExtendWith(MockitoExtension.class)
class UserMapperTest {
    @InjectMocks
    private UserMapper userMapper;

    @Test
    void mapToResponse_ShouldMapAllFields() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername("test@example.com");
        user.setCreatedAt(LocalDate.now());
        UserResponse response = userMapper.mapToResponse(user);
        assertNotNull(response);
        assertEquals(user.getId(), response.getId());
        assertEquals(user.getUsername(), response.getName());
        assertEquals(user.getCreatedAt(), response.getCreatedAt());
    }
}
