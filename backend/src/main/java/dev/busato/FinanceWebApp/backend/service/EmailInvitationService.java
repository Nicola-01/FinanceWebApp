package dev.busato.FinanceWebApp.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@Deprecated // TODO
public class EmailInvitationService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendHtmlInvitation(String toEmail, String token) throws MessagingException {
        // 1. Costruisci il link dinamicamente usando il token generato
        // Ovviamente adatterai localhost con il tuo FRONTEND_URL in produzione
        String registrationLink = "http://localhost:5173/register?token=" + token;

        // 2. Prepara il template HTML (puoi anche leggerlo da un file nelle resources)
        String htmlTemplate = getHtmlTemplate();

        // 3. Sostituisci il segnaposto con il link vero e proprio
        String finalHtml = htmlTemplate.replace("{{REGISTRATION_LINK}}", registrationLink);

        // 4. Crea il messaggio MimeMessage
        MimeMessage message = mailSender.createMimeMessage();

        // Il "true" abilita il multipart (per allegati o HTML complesso)
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom("noreply@busato.dev"); // Usa l'indirizzo autorizzato che hai già testato
        helper.setTo(toEmail);
        helper.setSubject("Invito di registrazione a FinanceWebApp");

        // Il "true" finale è FONDAMENTALE: dice a Spring che il testo è HTML e non testo semplice
        helper.setText(finalHtml, true);

        // 5. Invia l'email!
        mailSender.send(message);
    }

    private static String getHtmlTemplate() {
        // Qui incolli tutto il codice HTML fornito sopra sotto forma di stringa.
        // Se usi Java 15+, puoi usare i Text Blocks (""") che sono perfetti per l'HTML!
        return """
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>Invito di registrazione</title>
                    </head>
                    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="padding: 20px 0;">
                            <tr>
                                <td align="center">
                                    <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                                        <tr>
                                            <td align="center" style="background-color: #0056b3; padding: 30px 20px;">
                                                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Benvenuto in FinanceWebApp</h1>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 40px 30px; color: #333333; line-height: 1.6; font-size: 16px;">
                                                <p style="margin-top: 0;">Ciao,</p>
                                                <p>Un amministratore ti ha invitato a creare il tuo account per accedere alla piattaforma. Per completare la registrazione e impostare le tue credenziali, clicca sul pulsante qui sotto:</p>
                
                                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
                                                    <tr>
                                                        <td align="center">
                                                            <a href="{{REGISTRATION_LINK}}" style="background-color: #0056b3; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 4px; font-weight: bold; display: inline-block;">Imposta la tua Password</a>
                                                        </td>
                                                    </tr>
                                                </table>
                
                                                <p style="font-size: 14px; color: #666666;">Se il pulsante non funziona, copia e incolla questo link nel tuo browser:<br>
                                                <a href="{{REGISTRATION_LINK}}" style="color: #0056b3; word-break: break-all;">{{REGISTRATION_LINK}}</a></p>
                
                                                <p style="margin-bottom: 0;">Questo link scadrà tra 24 ore per motivi di sicurezza.</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td align="center" style="background-color: #f8f9fa; padding: 20px; color: #888888; font-size: 12px;">
                                                <p style="margin: 0;">&copy; 2026 FinanceWebApp. Tutti i diritti riservati.</p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </body>
                    </html>
                """;
    }
}