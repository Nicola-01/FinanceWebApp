package dev.busato.FinanceWebApp.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.busato.FinanceWebApp.backend.dto.AdminInviteRequest;
import dev.busato.FinanceWebApp.backend.service.SendEmailService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class ManageUserServiceTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private SendEmailService sendEmailService;

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void testCreateInviteAsAdmin() throws Exception {

        AdminInviteRequest request = new AdminInviteRequest();
        request.setEmail("newuser@example.com");

        mockMvc.perform(post("/api/admin/management")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "simpleUser", roles = {"USER"})
    void testCreateInviteAsSimpleUser_ShouldFail() throws Exception {

        AdminInviteRequest request = new AdminInviteRequest();
        request.setEmail("newuser@example.com");

        mockMvc.perform(post("/api/admin/management")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}