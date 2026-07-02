package dev.busato.FinanceWebApp.backend.mappers;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import dev.busato.FinanceWebApp.backend.dto.AdminInviteResponse;
import dev.busato.FinanceWebApp.backend.model.Registrations;
import java.time.LocalDateTime;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AdminInviteMapperTest {
  @InjectMocks private AdminInviteMapper adminInviteMapper;

  @Test
  void mapToAdminInviteResponse_ShouldMapCorrectly() {
    ReflectionTestUtils.setField(adminInviteMapper, "FRONTEND_URL", "http://localhost:4200");
    Registrations reg = new Registrations();
    reg.setId(UUID.randomUUID());
    reg.setEmail("test@example.com");
    reg.setToken("token123");
    reg.setNote("Some note");
    reg.setStatus(Registrations.InvitationStatus.PENDING);
    reg.setExpiresAt(LocalDateTime.now().plusDays(1));
    AdminInviteResponse response = adminInviteMapper.mapToAdminInviteResponse(reg);
    assertNotNull(response);
    assertEquals("test@example.com", response.getEmail());
    assertEquals("http://localhost:4200/register?token=token123", response.getUrl());
    assertEquals("Some note", response.getNote());
    assertEquals("PENDING", response.getStatus());
    assertEquals(reg.getExpiresAt(), response.getExpiresAt());
  }
}
