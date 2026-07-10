package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.AdminInviteResponse;
import dev.busato.FinanceWebApp.backend.dto.BudgetStatusResponse;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import javax.imageio.ImageIO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

@Service
public class SendEmailService {

  @Autowired private JavaMailSender mailSender;

  @Value("${application.frontend.url}")
  private String FRONTEND_URL;

  // A wallet colour is only ever a CSS hex colour. Anything else is rejected before it reaches the
  // email HTML, so a crafted value cannot break out of the style attribute it is interpolated into.
  private static final java.util.regex.Pattern HEX_COLOR =
      java.util.regex.Pattern.compile("^#[0-9a-fA-F]{6}$");

  public void sendRegistrationInvitation(AdminInviteResponse inviteResponse)
      throws MessagingException, UnsupportedEncodingException {
    String htmlTemplate = getHtmlTemplate("templates/email/registrationInviteEmail.html");

    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy 'at' HH:mm");
    String formattedDate = inviteResponse.getExpiresAt().format(formatter);

    String finalHtml =
        htmlTemplate
            .replace("{{url}}", inviteResponse.getUrl())
            .replace("{{expiresAt}}", formattedDate);

    MimeMessage message = mailSender.createMimeMessage();
    MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

    helper.setFrom("noreply@busato.dev", "FinanceWebApp");
    helper.setTo(inviteResponse.getEmail());
    helper.setSubject("FinanceWebApp registration invitation");
    helper.setText(finalHtml, true);

    mailSender.send(message);
  }

  public void sendForgotPasswordEmail(String email, String url, LocalDateTime expiresAt)
      throws MessagingException, UnsupportedEncodingException {
    String htmlTemplate = getHtmlTemplate("templates/email/forgotPasswordEmail.html");

    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy 'at' HH:mm");
    String formattedDate = expiresAt.format(formatter);

    String finalHtml = htmlTemplate.replace("{{url}}", url).replace("{{expiresAt}}", formattedDate);

    MimeMessage message = mailSender.createMimeMessage();
    MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

    helper.setFrom("noreply@busato.dev", "FinanceWebApp");
    helper.setTo(email);
    helper.setSubject("Reset your FinanceWebApp password");
    helper.setText(finalHtml, true);

    mailSender.send(message);
  }

  /**
   * Sends a 6-digit email-change verification code. The same template is reused for both
   * recipients; {@code toNewAddress} only tailors the intro copy (confirming the new address vs.
   * authorising the change from the current one). The code itself is never logged or stored in
   * plaintext.
   */
  public void sendEmailChangeCode(String to, String code, boolean toNewAddress)
      throws MessagingException, UnsupportedEncodingException {
    String htmlTemplate = getHtmlTemplate("templates/email/emailChangeCodeEmail.html");

    String context =
        toNewAddress
            ? "Enter this code to confirm this new address for your FinanceWebApp account."
            : "Enter this code to authorise the email change on your FinanceWebApp account.";

    String finalHtml = htmlTemplate.replace("{{code}}", code).replace("{{context}}", context);

    MimeMessage message = mailSender.createMimeMessage();
    MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

    helper.setFrom("noreply@busato.dev", "FinanceWebApp");
    helper.setTo(to);
    helper.setSubject("Your FinanceWebApp email change code");
    helper.setText(finalHtml, true);

    mailSender.send(message);
  }

  /**
   * Notifies wallet members that a budget crossed one of its alert thresholds. {@code budgetName},
   * {@code walletName} and {@code currency} are user-controlled free text (see {@link
   * #renderBudgetAlertHtml}) and, like the wallet-invitation email above, are HTML-escaped before
   * interpolation to prevent markup injection.
   */
  public void sendBudgetAlert(
      Wallet wallet, BudgetStatusResponse status, int threshold, List<String> recipients)
      throws Exception {
    String finalHtml = renderBudgetAlertHtml(wallet, status, threshold);

    MimeMessage message = mailSender.createMimeMessage();
    MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

    helper.setFrom("noreply@busato.dev", "FinanceWebApp");
    helper.setTo(recipients.toArray(String[]::new));
    helper.setSubject(
        "Budget \"" + status.getName() + "\" reached " + threshold + "% in " + wallet.getName());
    helper.setText(finalHtml, true);

    mailSender.send(message);
  }

  /**
   * Fills the budget-alert template. {@code walletName}, {@code budgetName} and {@code currency}
   * are user-controlled free text interpolated into an HTML email later sent with {@code
   * helper.setText(html, true)}, so they are HTML-escaped to prevent markup injection. The
   * remaining fields (amounts, dates, threshold) are numeric/date values computed server-side and
   * are safe as-is.
   */
  String renderBudgetAlertHtml(Wallet wallet, BudgetStatusResponse status, int threshold) {
    String htmlTemplate = getHtmlTemplate("templates/email/budgetAlertEmail.html");

    return htmlTemplate
        .replace("{{walletName}}", HtmlUtils.htmlEscape(wallet.getName()))
        .replace("{{budgetName}}", HtmlUtils.htmlEscape(status.getName()))
        .replace("{{threshold}}", String.valueOf(threshold))
        .replace("{{spent}}", status.getSpent().toPlainString())
        .replace("{{limit}}", status.getEffectiveLimit().toPlainString())
        .replace("{{currency}}", HtmlUtils.htmlEscape(wallet.getCurrency()))
        .replace("{{periodStart}}", status.getPeriodStart().toString())
        .replace("{{periodEnd}}", status.getPeriodEnd().toString());
  }

  private String getHtmlTemplate(String path) {
    try {
      ClassPathResource resource = new ClassPathResource(path);

      return new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

    } catch (IOException e) {
      throw new RuntimeException("Error loading email template", e);
    }
  }

  /**
   * Fills the wallet-invitation template. All three user-controlled values are interpolated into an
   * HTML email that is later sent with {@code helper.setText(html, true)}, so they must be
   * sanitized to prevent HTML/markup injection: the colour is restricted to a hex literal (it lands
   * inside a {@code style} attribute) and the free-text fields are HTML-escaped.
   */
  String renderWalletInviteHtml(String htmlTemplate, String inviterUsername, Wallet wallet) {
    return htmlTemplate
        .replace("{{walletColor}}", sanitizeHexColor(wallet.getColor()))
        .replace("{{inviterUsername}}", HtmlUtils.htmlEscape(inviterUsername))
        .replace("{{appUrl}}", FRONTEND_URL)
        .replace("{{walletName}}", HtmlUtils.htmlEscape(wallet.getName()));
  }

  /** Returns the colour if it is a valid 6-digit hex literal, otherwise a safe default. */
  private static String sanitizeHexColor(String color) {
    return color != null && HEX_COLOR.matcher(color).matches() ? color : "#000000";
  }

  public static String toFontAwesomeIcon(String input) {
    if (input == null) return null;

    return "fa-"
        + input
            .replaceAll("([a-z0-9])([A-Z])", "$1-$2")
            .replaceAll("([A-Z])([A-Z][a-z])", "$1-$2")
            .toLowerCase();
  }

  public void sendWalletInvitation(
      String inviterUsername, Wallet wallet, String recipientEmail, boolean editor)
      throws Exception {
    String htmlTemplate = getHtmlTemplate("templates/email/walletInviteEmail.html");

    String finalHtml = renderWalletInviteHtml(htmlTemplate, inviterUsername, wallet);
    String safeColor = sanitizeHexColor(wallet.getColor());

    // ATTENZIONE: Il parametro 'true' abilita il multipart (necessario per le immagini inline)
    MimeMessage message = mailSender.createMimeMessage();
    MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

    helper.setFrom("noreply@busato.dev", "FinanceWebApp");
    helper.setTo(recipientEmail);
    helper.setSubject(
        inviterUsername + " has invited you to " + (editor ? "edit" : "view") + " a wallet!");

    // 1. Imposta l'HTML
    helper.setText(finalHtml, true);

    // 2. Genera l'icona FontAwesome come immagine PNG (usa il colore già sanificato)
    byte[] iconBytes = generateIconImage(wallet.getIcon(), safeColor);

    // 3. Inietta l'immagine nell'HTML usando il Content-ID "walletIcon"
    helper.addInline("walletIcon", new ByteArrayResource(iconBytes), "image/png");

    mailSender.send(message);
  }

  // --- METODI DI SUPPORTO PER GENERARE L'IMMAGINE ---

  private byte[] generateIconImage(String iconName, String hexColor) throws Exception {
    int size = 64; // Dimensione ottimale per i display ad alta risoluzione
    BufferedImage image = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
    Graphics2D g2d = image.createGraphics();

    // Migliora la qualità dell'immagine
    g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
    g2d.setRenderingHint(
        RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

    // Carica il font dalla cartella resources
    try (InputStream is = getClass().getResourceAsStream("/fonts/fa-solid-900.ttf")) {
      if (is == null) {
        throw new RuntimeException(
            "File font non trovato! Assicurati di avere src/main/resources/fonts/fa-solid-900.ttf");
      }
      Font font = Font.createFont(Font.TRUETYPE_FONT, is).deriveFont(Font.PLAIN, 36f);
      g2d.setFont(font);
    }

    // Colora l'icona col colore del wallet
    g2d.setColor(Color.decode(hexColor != null && !hexColor.isEmpty() ? hexColor : "#000000"));

    // Ottieni il carattere unicode corrispondente
    String unicode = getUnicodeForIcon(iconName);

    // Centra l'icona nel riquadro
    FontMetrics fm = g2d.getFontMetrics();
    int x = (size - fm.stringWidth(unicode)) / 2;
    int y = ((size - fm.getHeight()) / 2) + fm.getAscent();

    g2d.drawString(unicode, x, y);
    g2d.dispose();

    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    ImageIO.write(image, "png", baos);
    return baos.toByteArray();
  }

  // Mappa i nomi testuali ai codici Unicode di FontAwesome
  private String getUnicodeForIcon(String iconName) {
    if (iconName == null) return "\uf555"; // Default: wallet

    return switch (iconName.toLowerCase()) {
      case "cart" -> "\uf07a";
      case "wallet" -> "\uf555";
      case "home" -> "\uf015";
      case "piggybank" -> "\uf4d3";
      case "car" -> "\uf1b9";
      case "plane" -> "\uf072";
      case "utensils" -> "\uf2e7";
      case "gamepad" -> "\uf11b";
      case "heart" -> "\uf004";
      case "gift" -> "\uf06b";
      case "briefcase" -> "\uf0b1";
        // Puoi aggiungere qui tutte le altre icone che gestisci nella tua app
      default -> "\uf555";
    };
  }
}
