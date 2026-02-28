package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.AdminInviteResponse;
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

    public void sendHtmlInvitation(AdminInviteResponse inviteResponse) throws MessagingException {
        String htmlTemplate = getHtmlTemplate();

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

    private String getHtmlTemplate() {
        try {
            ClassPathResource resource = new ClassPathResource("templates/email/inviteEmail.html");

            return new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

        } catch (IOException e) {
            throw new RuntimeException("Errore durante il caricamento del template email", e);
        }
    }
}