package dev.busato.FinanceWebApp.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;

import dev.busato.FinanceWebApp.backend.dto.AdminInviteResponse;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class SendEmailServiceTest {

  @Mock private JavaMailSender mailSender;

  @Mock private MimeMessage mimeMessage;

  @InjectMocks private SendEmailService sendEmailService;

  @BeforeEach
  void setUp() {
    ReflectionTestUtils.setField(sendEmailService, "FRONTEND_URL", "http://localhost:3000");
    lenient().when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
  }

  @Test
  void sendRegistrationInvitation_SendsEmail() throws Exception {
    AdminInviteResponse inviteResponse =
        AdminInviteResponse.builder()
            .email("test@example.com")
            .url("http://localhost:3000/register?token=123")
            .expiresAt(LocalDateTime.of(2024, 1, 1, 12, 0))
            .build();

    sendEmailService.sendRegistrationInvitation(inviteResponse);

    verify(mailSender).send(mimeMessage);
  }

  @Test
  void sendForgotPasswordEmail_SendsEmail() throws Exception {
    sendEmailService.sendForgotPasswordEmail(
        "test@example.com",
        "http://localhost:3000/reset?token=123",
        LocalDateTime.of(2024, 1, 1, 12, 0));

    verify(mailSender).send(mimeMessage);
  }

  @Test
  void sendWalletInvitation_SendsEmailWithIcon() throws Exception {
    Wallet wallet = new Wallet();
    wallet.setName("My Wallet");
    wallet.setColor("#FF0000");
    wallet.setIcon("wallet");

    sendEmailService.sendWalletInvitation("inviterUser", wallet, "recipient@example.com", true);

    verify(mailSender).send(mimeMessage);
  }

  @Test
  void sendEmailChangeCode_ToNewAddress_SendsEmail() throws Exception {
    sendEmailService.sendEmailChangeCode("new@example.com", "123456", true);

    verify(mailSender).send(mimeMessage);
  }

  @Test
  void sendEmailChangeCode_ToCurrentAddress_SendsEmail() throws Exception {
    sendEmailService.sendEmailChangeCode("current@example.com", "654321", false);

    verify(mailSender).send(mimeMessage);
  }

  @Test
  void toFontAwesomeIcon_ConvertsCorrectly() {
    assertNull(SendEmailService.toFontAwesomeIcon(null));
    assertEquals("fa-wallet", SendEmailService.toFontAwesomeIcon("Wallet"));
    assertEquals("fa-piggy-bank", SendEmailService.toFontAwesomeIcon("PiggyBank"));
    assertEquals("fa-credit-card", SendEmailService.toFontAwesomeIcon("creditCard"));
  }

  @Test
  void sendWalletInvitation_ViewerRole_SubjectContainsView() throws Exception {
    Wallet wallet = new Wallet();
    wallet.setName("My Wallet");
    wallet.setColor("#00FF00");
    wallet.setIcon("wallet");

    sendEmailService.sendWalletInvitation("inviter", wallet, "recipient@example.com", false);

    verify(mailSender).send(mimeMessage);
  }

  @Test
  void sendWalletInvitation_NullColor_FallsBackToBlack() throws Exception {
    Wallet wallet = new Wallet();
    wallet.setName("No Color Wallet");
    wallet.setColor(null); // Falls back to #000000
    wallet.setIcon("home");

    sendEmailService.sendWalletInvitation("inviter", wallet, "recipient@example.com", true);

    verify(mailSender).send(mimeMessage);
  }

  @Test
  void sendWalletInvitation_NullIcon_UsesDefaultWalletIcon() throws Exception {
    Wallet wallet = new Wallet();
    wallet.setName("No Icon Wallet");
    wallet.setColor("#FF0000");
    wallet.setIcon(null); // Should fallback to default

    sendEmailService.sendWalletInvitation("inviter", wallet, "recipient@example.com", true);

    verify(mailSender).send(mimeMessage);
  }
}
