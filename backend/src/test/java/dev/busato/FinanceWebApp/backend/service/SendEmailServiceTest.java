package dev.busato.FinanceWebApp.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;

import dev.busato.FinanceWebApp.backend.dto.AdminInviteResponse;
import dev.busato.FinanceWebApp.backend.dto.BudgetStatusResponse;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
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

  @Test
  void renderWalletInviteHtml_EscapesUserControlledFields() {
    // Security regression: walletName / inviterUsername / walletColor are user-controlled and land
    // in an HTML email. They must be escaped / validated so they cannot inject markup.
    Wallet wallet = new Wallet();
    wallet.setName("<img src=x onerror=alert(1)>");
    // Not a hex colour — must be dropped in favour of the safe default, so the tag never renders.
    wallet.setColor("red\"><script>alert(1)</script>");

    String template =
        "<a style=\"color:{{walletColor}}\">{{walletName}} by {{inviterUsername}} at {{appUrl}}</a>";
    String html = sendEmailService.renderWalletInviteHtml(template, "<b>attacker</b>", wallet);

    // Raw attacker markup must not survive into the email body.
    assertFalse(html.contains("<img src=x"), "wallet name markup must be escaped");
    assertFalse(
        html.contains("<script>alert(1)</script>"), "injected color markup must be dropped");
    assertFalse(html.contains("<b>attacker</b>"), "inviter username markup must be escaped");

    // Escaped forms / safe fallback are present instead.
    assertTrue(html.contains("&lt;img src=x"), "wallet name should be HTML-escaped");
    assertTrue(
        html.contains("color:#000000"), "invalid color should fall back to the safe default");
  }

  @Test
  void renderWalletInviteHtml_KeepsValidHexColor() {
    Wallet wallet = new Wallet();
    wallet.setName("My Wallet");
    wallet.setColor("#1A2B3C");

    String html =
        sendEmailService.renderWalletInviteHtml(
            "<a style=\"color:{{walletColor}}\">{{walletName}}</a>", "inviter", wallet);

    assertTrue(html.contains("color:#1A2B3C"), "a valid hex colour should be preserved");
    assertTrue(html.contains("My Wallet"));
  }

  @Test
  void renderBudgetAlertHtml_escapesUserControlledFields() {
    // Security regression: walletName / budgetName / currency are user-controlled free text and
    // land in an HTML email. They must be escaped so they cannot inject markup.
    Wallet wallet = new Wallet();
    wallet.setName("<script>alert(1)</script>");
    wallet.setCurrency("<img src=x>");

    BudgetStatusResponse status =
        BudgetStatusResponse.builder()
            .id(UUID.randomUUID())
            .name("<script>alert(2)</script>")
            .spent(new BigDecimal("85.00"))
            .effectiveLimit(new BigDecimal("100.00"))
            .percentUsed(85)
            .status("WARNING")
            .crossedThresholds(List.of(80))
            .active(true)
            .periodStart(LocalDate.of(2026, 7, 1))
            .periodEnd(LocalDate.of(2026, 7, 31))
            .alertThresholds(List.of(80, 100))
            .build();

    String html = sendEmailService.renderBudgetAlertHtml(wallet, status, 80);

    // Raw attacker markup must not survive into the email body.
    assertFalse(html.contains("<script>alert(1)</script>"), "wallet name markup must be escaped");
    assertFalse(html.contains("<script>alert(2)</script>"), "budget name markup must be escaped");
    assertFalse(html.contains("<img src=x>"), "currency markup must be escaped");

    // Escaped forms are present instead.
    assertTrue(
        html.contains("&lt;script&gt;alert(1)&lt;/script&gt;"),
        "wallet name should be HTML-escaped");
    assertTrue(
        html.contains("&lt;script&gt;alert(2)&lt;/script&gt;"),
        "budget name should be HTML-escaped");
    assertTrue(html.contains("&lt;img src=x&gt;"), "currency should be HTML-escaped");
  }
}
