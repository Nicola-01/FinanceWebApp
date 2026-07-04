package dev.busato.FinanceWebApp.backend.mappers;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import dev.busato.FinanceWebApp.backend.dto.UserProfileResponse;
import dev.busato.FinanceWebApp.backend.dto.UserResponse;
import dev.busato.FinanceWebApp.backend.model.User;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserMapperTest {
  @InjectMocks private UserMapper userMapper;

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

  @Test
  void toProfileResponse_MapsFieldsAndMasksLongLocalPart() {
    User user = new User();
    UUID id = UUID.randomUUID();
    LocalDate created = LocalDate.now();
    user.setId(id);
    user.setUsername("nicola");
    user.setEmail("nicola@example.com");
    user.setRole(User.Role.ADMIN);
    user.setCreatedAt(created);

    UserProfileResponse res = userMapper.toProfileResponse(user);

    assertEquals(id, res.getId());
    assertEquals("nicola", res.getUsername());
    assertEquals("n***a@example.com", res.getEmail());
    assertEquals("ADMIN", res.getRole());
    assertEquals(created, res.getCreatedAt());
  }

  @Test
  void toProfileResponse_MasksShortLocalPart() {
    User user = new User();
    user.setEmail("ab@x.com");
    assertEquals("a***@x.com", userMapper.toProfileResponse(user).getEmail());
  }

  @Test
  void toProfileResponse_NullEmailAndRole_LeftNull() {
    User user = new User();
    user.setEmail(null);
    user.setRole(null);
    UserProfileResponse res = userMapper.toProfileResponse(user);
    assertNull(res.getEmail());
    assertNull(res.getRole());
  }

  @Test
  void toProfileResponse_BlankEmail_ReturnedAsIs() {
    User user = new User();
    user.setEmail("");
    assertEquals("", userMapper.toProfileResponse(user).getEmail());
  }

  @Test
  void toProfileResponse_MalformedEmailWithoutLocalPart_FullyMasked() {
    User user = new User();
    user.setEmail("noatsign");
    assertEquals("***", userMapper.toProfileResponse(user).getEmail());

    user.setEmail("@domain.com");
    assertEquals("***", userMapper.toProfileResponse(user).getEmail());
  }
}
