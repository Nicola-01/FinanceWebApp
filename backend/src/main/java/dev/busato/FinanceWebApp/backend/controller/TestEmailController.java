package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.service.EmailInvitationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Deprecated // TODO
public class TestEmailController {

    // 1. INIETTA IL SERVIZIO INVECE DI FARE "NEW"
    @Autowired
    private EmailInvitationService emailInvitationService;

    // Ho rimosso JavaMailSender da qui perché ora se ne occupa il Service!

//    @GetMapping("/api/test-email")
    public String sendTestEmail() {
        try {
            // 2. USA L'ISTANZA GESTITA DA SPRING
            emailInvitationService.sendHtmlInvitation("nickbusato0101@gmail.com", "123Stella");

            return "✅ Email di test inviata con successo! Controlla la tua casella di posta (e dai un'occhiata anche allo Spam, non si sa mai).";

        } catch (Exception e) {
            // Se qualcosa va storto, stampiamo l'errore a schermo
            return "❌ Errore durante l'invio dell'email: <br><br>" + e.getMessage();
        }
    }
}