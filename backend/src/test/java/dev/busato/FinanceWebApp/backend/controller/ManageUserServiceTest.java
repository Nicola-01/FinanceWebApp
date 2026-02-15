package dev.busato.FinanceWebApp.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.busato.FinanceWebApp.backend.dto.UserRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AdminUserIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper; // Per convertire oggetti in JSON

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"}) // <--- FINGE DI ESSERE ADMIN!
    void testCreateUserAsAdmin() throws Exception {

        // 1. Preparo i dati
        UserRequest request = UserRequest.builder()
                .username("test.user").build();
//        request.setRole(User.Role.USER);

        // 2. Chiamo l'endpoint simulando una richiesta HTTP
        mockMvc.perform(post("/api/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))) // converte request in stringa JSON

                // 3. Verifico i risultati
                .andExpect(status().isOk()); // Mi aspetto 200 OK
//                .andExpect(jsonPath("$.username").value("test.user")) // Controllo il nome
//                .andExpect(jsonPath("$.tempPassword").exists()); // Controllo che ci sia la psw
    }

    @Test
    @WithMockUser(username = "simpleUser", roles = {"USER"}) // <--- FINGE DI ESSERE USER NORMALE
    void testCreateUserAsSimpleUser_ShouldFail() throws Exception {

        UserRequest request = UserRequest.builder()
                .username("hacker.user").build();

        mockMvc.perform(post("/api/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))

                .andExpect(status().isForbidden()); // Mi aspetto 403 Forbidden!
    }
}