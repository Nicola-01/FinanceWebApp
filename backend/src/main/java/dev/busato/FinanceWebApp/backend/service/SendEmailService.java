package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.AdminInviteResponse;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;

@Service
public class SendEmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendRegistrationInvitation(AdminInviteResponse inviteResponse) throws MessagingException {
        String htmlTemplate = getHtmlTemplate("templates/email/registrationInviteEmail.html");

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy 'at' HH:mm");
        String formattedDate = inviteResponse.getExpiresAt().format(formatter);

        String finalHtml = htmlTemplate
                .replace("{{url}}", inviteResponse.getUrl())
                .replace("{{expiresAt}}", formattedDate);

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom("noreply@busato.dev");
        helper.setTo(inviteResponse.getEmail());
        helper.setSubject("FinanceWebApp registration invitation");
        helper.setText(finalHtml, true);

        mailSender.send(message);
    }

    public void sendWalletInvitation(String inviterUsername, Wallet wallet, String recipientEmail, boolean editor) throws MessagingException {
        String htmlTemplate = getHtmlTemplate("templates/email/walletInviteEmail.html");

        // Sostituisci i segnaposto nel template HTML con i valori reali
        String finalHtml = htmlTemplate
                .replace("{{walletColor}}", wallet.getColor())
                .replace("{{walletIconClass}}", toFontAwesomeIcon(wallet.getIcon()))
                .replace("{{inviterUsername}}", inviterUsername)
                .replace("{{walletName}}", wallet.getName());

        // Crea e configura il messaggio email
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom("noreply@busato.dev");
        helper.setTo(recipientEmail);
        helper.setSubject(inviterUsername + " has invited you to " + (editor ? "edit" : "view") + " a wallet!");
        helper.setText(finalHtml, true);

        mailSender.send(message);
    }

    private String getHtmlTemplate(String path) {
        try {
            ClassPathResource resource = new ClassPathResource(path);

            return new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

        } catch (IOException e) {
            throw new RuntimeException("Error loading email template", e);
        }
    }

    public static String toFontAwesomeIcon(String input) {
        if (input == null) return null;

        return "fa-" + input.replaceAll("([a-z0-9])([A-Z])", "$1-$2")
                .replaceAll("([A-Z])([A-Z][a-z])", "$1-$2")
                .toLowerCase();
    }
}