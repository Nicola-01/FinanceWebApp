package dev.busato.FinanceWebApp.backend.mappers;

import dev.busato.FinanceWebApp.backend.dto.MemberResponse;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@ExtendWith(MockitoExtension.class)
class MemberMapperTest {
    @InjectMocks
    private MemberMapper memberMapper;

    @Test
    void mapToResponse_ShouldMapCorrectly() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername("member@example.com");
        WalletAccess access = new WalletAccess();
        access.setUser(user);
        access.setRole(WalletAccess.WalletRole.EDITOR);
        access.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
        MemberResponse response = memberMapper.mapToResponse(access);
        assertNotNull(response);
        assertEquals(user.getId(), response.getUserId());
        assertEquals(user.getUsername(), response.getUsername());
        assertEquals("EDITOR", response.getRole());
        assertEquals("ACCEPTED", response.getStatus());
    }
}
