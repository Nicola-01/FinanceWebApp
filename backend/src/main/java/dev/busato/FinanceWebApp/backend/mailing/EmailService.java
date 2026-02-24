package dev.busato.FinanceWebApp.backend.mailing;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendRegistrationEmail(String toEmail) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("noreply@busato.dev");
        message.setTo(toEmail);
        message.setSubject("Benvenuto! Conferma la tua registrazione");
        message.setText("Ciao! Grazie per esserti registrato. Clicca sul link seguente per attivare l'account...");

        mailSender.send(message);
    }
}