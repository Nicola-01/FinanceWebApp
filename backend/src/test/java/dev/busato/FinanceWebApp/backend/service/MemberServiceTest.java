package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.MemberRequest;
import dev.busato.FinanceWebApp.backend.dto.MemberResponse;
import dev.busato.FinanceWebApp.backend.mappers.MemberMapper;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MemberServiceTest {

    @Mock
    private WalletAccessRepository walletAccessRepository;
    @Mock
    private WalletRepository walletRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SendEmailService sendEmailService;
    @Mock
    private WalletService walletService;
    @Mock
    private MemberMapper memberMapper;

    @InjectMocks
    private MemberService memberService;

    private UUID walletId;
    private UUID userId;
    private UUID targetUserId;
    private User targetUser;
    private Wallet wallet;

    @BeforeEach
    void setUp() {
        walletId = UUID.randomUUID();
        userId = UUID.randomUUID();
        targetUserId = UUID.randomUUID();

        wallet = new Wallet();
        wallet.setId(walletId);

        targetUser = new User();
        targetUser.setId(targetUserId);
        targetUser.setUsername("targetUser");
        targetUser.setEmail("target@example.com");
    }

    @Test
    void getMembers_ReturnsMembersList() {
        WalletAccess access = new WalletAccess();
        when(walletAccessRepository.findAllByWalletId(walletId)).thenReturn(List.of(access));
        when(memberMapper.mapToResponse(access)).thenReturn(MemberResponse.builder().build());

        List<MemberResponse> responses = memberService.getMembers(walletId, userId);

        assertEquals(1, responses.size());
    }

    @Test
    void inviteMember_ValidRequest_CreatesInvite() throws Exception {
        MemberRequest request = new MemberRequest();
        request.setUser("targetUser");
        request.setRole("VIEWER");

        when(walletRepository.findById(walletId)).thenReturn(Optional.of(wallet));
        when(userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase("targetUser", "targetUser"))
                .thenReturn(Optional.of(targetUser));

        // Not a demo user, not self, no pending invite, not rejected recently
        targetUser.setRole(User.Role.USER); // Not demo
        when(walletAccessRepository.existsByWalletIdAndUserIdAndStatusIn(eq(walletId), eq(targetUserId), any()))
                .thenReturn(false);
        when(walletAccessRepository.existsByWalletIdAndUserIdAndStatusInAndUpdatedAtAfter(eq(walletId), eq(targetUserId), any(), any()))
                .thenReturn(false);

        User owner = new User();
        owner.setUsername("owner");
        when(userRepository.findById(userId)).thenReturn(Optional.of(owner));

        when(memberMapper.mapToResponse(any())).thenReturn(MemberResponse.builder().build());

        memberService.inviteMember(walletId, request, userId);

        verify(walletAccessRepository).save(any(WalletAccess.class));
        verify(sendEmailService).sendWalletInvitation(eq("owner"), eq(wallet), eq("target@example.com"), eq(false));
    }

    @Test
    void inviteMember_DemoUser_ThrowsException() {
        MemberRequest request = new MemberRequest();
        request.setUser("demoUser");
        request.setRole("VIEWER");

        when(walletRepository.findById(walletId)).thenReturn(Optional.of(wallet));

        targetUser.setDemo(true);
        when(userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase("demoUser", "demoUser"))
                .thenReturn(Optional.of(targetUser));

        assertThrows(IllegalArgumentException.class, () -> memberService.inviteMember(walletId, request, userId));
    }

    @Test
    void inviteMember_Self_ThrowsException() {
        MemberRequest request = new MemberRequest();
        request.setUser("selfUser");
        request.setRole("VIEWER");

        when(walletRepository.findById(walletId)).thenReturn(Optional.of(wallet));

        targetUser.setId(userId); // Target is self
        when(userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase("selfUser", "selfUser"))
                .thenReturn(Optional.of(targetUser));

        assertThrows(IllegalArgumentException.class, () -> memberService.inviteMember(walletId, request, userId));
    }

    @Test
    void inviteMember_AlreadyPending_ThrowsException() {
        MemberRequest request = new MemberRequest();
        request.setUser("targetUser");
        request.setRole("VIEWER");

        when(walletRepository.findById(walletId)).thenReturn(Optional.of(wallet));
        when(userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase("targetUser", "targetUser"))
                .thenReturn(Optional.of(targetUser));

        when(walletAccessRepository.existsByWalletIdAndUserIdAndStatusIn(eq(walletId), eq(targetUserId), any()))
                .thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> memberService.inviteMember(walletId, request, userId));
    }

    @Test
    void updateMemberRole_ValidRole_UpdatesRole() {
        MemberRequest request = new MemberRequest();
        request.setRole("EDITOR");

        WalletAccess access = new WalletAccess();
        access.setRole(WalletAccess.WalletRole.VIEWER);

        when(walletAccessRepository.findByWalletIdAndUserId(walletId, targetUserId))
                .thenReturn(Optional.of(access));

        memberService.updateMemberRole(walletId, targetUserId, request, userId);

        assertEquals(WalletAccess.WalletRole.EDITOR, access.getRole());
    }

    @Test
    void updateMemberRole_ChangeOwnerRole_ThrowsException() {
        MemberRequest request = new MemberRequest();
        request.setRole("EDITOR");

        WalletAccess access = new WalletAccess();
        access.setRole(WalletAccess.WalletRole.OWNER); // Cannot change owner

        when(walletAccessRepository.findByWalletIdAndUserId(walletId, targetUserId))
                .thenReturn(Optional.of(access));

        assertThrows(IllegalArgumentException.class, () -> memberService.updateMemberRole(walletId, targetUserId, request, userId));
    }

    @Test
    void removeMember_ValidMember_RevokesAccess() {
        WalletAccess access = new WalletAccess();
        access.setRole(WalletAccess.WalletRole.VIEWER);

        when(walletAccessRepository.findByWalletIdAndUserId(walletId, targetUserId))
                .thenReturn(Optional.of(access));

        memberService.removeMember(walletId, targetUserId, userId);

        assertEquals(WalletAccess.InvitationStatus.REVOKED, access.getStatus());
    }

    // ==================== inviteMember — edge cases ====================

    @Test
    void inviteMember_UserNotFoundInSystem_ReturnsStubResponse() {
        MemberRequest request = new MemberRequest();
        request.setUser("unknown@email.com");
        request.setRole("VIEWER");

        when(walletRepository.findById(walletId)).thenReturn(Optional.of(wallet));
        when(userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase("unknown@email.com", "unknown@email.com"))
                .thenReturn(Optional.empty());

        MemberResponse response = memberService.inviteMember(walletId, request, userId);

        assertEquals("unknown@email.com", response.getUsername());
        assertEquals("VIEWER", response.getRole());
        assertEquals(WalletAccess.InvitationStatus.PENDING.name(), response.getStatus());
    }

    @Test
    void inviteMember_RecentlyRejected_ThrowsException() {
        MemberRequest request = new MemberRequest();
        request.setUser("targetUser");
        request.setRole("VIEWER");

        when(walletRepository.findById(walletId)).thenReturn(Optional.of(wallet));
        when(userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase("targetUser", "targetUser"))
                .thenReturn(Optional.of(targetUser));
        when(walletAccessRepository.existsByWalletIdAndUserIdAndStatusIn(eq(walletId), eq(targetUserId), any()))
                .thenReturn(false);
        when(walletAccessRepository.existsByWalletIdAndUserIdAndStatusInAndUpdatedAtAfter(eq(walletId), eq(targetUserId), any(), any()))
                .thenReturn(true); // Rejected/left within 3 days

        assertThrows(IllegalArgumentException.class, () -> memberService.inviteMember(walletId, request, userId));
    }

    @Test
    void inviteMember_EmailSendFails_ThrowsRuntimeException() throws Exception {
        MemberRequest request = new MemberRequest();
        request.setUser("targetUser");
        request.setRole("VIEWER");

        when(walletRepository.findById(walletId)).thenReturn(Optional.of(wallet));
        when(userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase("targetUser", "targetUser"))
                .thenReturn(Optional.of(targetUser));
        when(walletAccessRepository.existsByWalletIdAndUserIdAndStatusIn(eq(walletId), eq(targetUserId), any()))
                .thenReturn(false);
        when(walletAccessRepository.existsByWalletIdAndUserIdAndStatusInAndUpdatedAtAfter(eq(walletId), eq(targetUserId), any(), any()))
                .thenReturn(false);

        User owner = new User();
        owner.setUsername("owner");
        when(userRepository.findById(userId)).thenReturn(Optional.of(owner));

        doThrow(new RuntimeException("SMTP error")).when(sendEmailService)
                .sendWalletInvitation(any(), any(), any(), anyBoolean());

        assertThrows(RuntimeException.class, () -> memberService.inviteMember(walletId, request, userId));
    }

    @Test
    void inviteMember_WalletNotFound_ThrowsWalletNotFoundException() {
        MemberRequest request = new MemberRequest();
        request.setUser("targetUser");
        request.setRole("VIEWER");

        when(walletRepository.findById(walletId)).thenReturn(Optional.empty());

        assertThrows(dev.busato.FinanceWebApp.backend.exceptions.WalletNotFoundException.class,
                () -> memberService.inviteMember(walletId, request, userId));
    }

    // ==================== removeMember — edge cases ====================

    @Test
    void removeMember_AttemptToRemoveOwner_ThrowsException() {
        WalletAccess access = new WalletAccess();
        access.setRole(WalletAccess.WalletRole.OWNER);

        when(walletAccessRepository.findByWalletIdAndUserId(walletId, targetUserId))
                .thenReturn(Optional.of(access));

        assertThrows(IllegalArgumentException.class,
                () -> memberService.removeMember(walletId, targetUserId, userId));
    }

    @Test
    void removeMember_MemberNotFound_ThrowsException() {
        when(walletAccessRepository.findByWalletIdAndUserId(walletId, targetUserId))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> memberService.removeMember(walletId, targetUserId, userId));
    }

    // ==================== getInvites ====================

    @Test
    void getInvites_ReturnsPendingInvites() {
        User invitedUser = new User();
        invitedUser.setId(targetUserId);

        WalletAccess access = new WalletAccess();
        access.setStatus(WalletAccess.InvitationStatus.PENDING);
        access.setWallet(wallet);

        when(walletAccessRepository.findAllByUserIdAndStatus(targetUserId, WalletAccess.InvitationStatus.PENDING))
                .thenReturn(List.of(access));

        WalletAccess ownerAccess = new WalletAccess();
        User ownerUser = new User();
        ownerUser.setUsername("walletOwner");
        ownerAccess.setUser(ownerUser);

        when(walletAccessRepository.findByWalletIdAndRole(walletId, WalletAccess.WalletRole.OWNER))
                .thenReturn(Optional.of(ownerAccess));

        when(memberMapper.mapToWalletInviteResponse(any(), eq("walletOwner")))
                .thenReturn(dev.busato.FinanceWebApp.backend.dto.WalletInviteResponse.builder().build());

        var result = memberService.getInvites(invitedUser);

        assertEquals(1, result.size());
    }

    // ==================== setStatus ====================

    @Test
    void setStatus_ValidRequest_UpdatesStatus() {
        WalletAccess access = new WalletAccess();
        access.setStatus(WalletAccess.InvitationStatus.PENDING);

        when(walletAccessRepository.findByWalletIdAndUserId(walletId, targetUserId))
                .thenReturn(Optional.of(access));

        memberService.setStatus(targetUserId, walletId, WalletAccess.InvitationStatus.ACCEPTED);

        assertEquals(WalletAccess.InvitationStatus.ACCEPTED, access.getStatus());
        verify(walletAccessRepository).save(access);
    }

    @Test
    void setStatus_MemberNotFound_ThrowsException() {
        when(walletAccessRepository.findByWalletIdAndUserId(walletId, targetUserId))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> memberService.setStatus(targetUserId, walletId, WalletAccess.InvitationStatus.ACCEPTED));
    }
}
