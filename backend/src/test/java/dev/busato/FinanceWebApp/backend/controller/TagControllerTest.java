package dev.busato.FinanceWebApp.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import dev.busato.FinanceWebApp.backend.dto.TagBulkResponse;
import dev.busato.FinanceWebApp.backend.dto.TagRequest;
import dev.busato.FinanceWebApp.backend.dto.TagResponse;
import dev.busato.FinanceWebApp.backend.service.TagService;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;

@WebMvcTest(
    controllers = TagController.class,
    excludeAutoConfiguration = {
      org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class
    })
class TagControllerTest extends BaseWebMvcTest {

  @org.springframework.test.context.bean.override.mockito.MockitoBean private TagService tagService;

  @Test
  void getTags_ShouldReturn200() throws Exception {
    UUID walletId = UUID.randomUUID();
    TagResponse mockResponse = TagResponse.builder().name("Groceries").build();

    when(tagService.getTags(eq(walletId), any(UUID.class))).thenReturn(List.of(mockResponse));

    mockMvc
        .perform(get("/api/tags/{walletID}", walletId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].name").value("Groceries"));
  }

  @Test
  void createTag_ShouldReturn200() throws Exception {
    UUID walletId = UUID.randomUUID();
    TagRequest request = TagRequest.builder().name("Groceries").build();
    TagResponse mockResponse = TagResponse.builder().name("Groceries").build();

    when(tagService.createTag(any(TagRequest.class), eq(walletId), any(UUID.class)))
        .thenReturn(mockResponse);

    mockMvc
        .perform(
            post("/api/tags/{walletID}", walletId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Groceries"));
  }

  @Test
  void createTagsBulk_ShouldReturn200() throws Exception {
    UUID walletId = UUID.randomUUID();
    TagRequest r1 = TagRequest.builder().name("Groceries").build();
    TagRequest r2 = TagRequest.builder().name("Rent").build();

    when(tagService.createTagsBulk(anyList(), eq(walletId), any(UUID.class)))
        .thenReturn(
            TagBulkResponse.builder()
                .created(List.of(TagResponse.builder().name("Groceries").build()))
                .updated(List.of(TagResponse.builder().name("Rent").build()))
                .build());

    mockMvc
        .perform(
            post("/api/tags/{walletID}/bulk", walletId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(List.of(r1, r2))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.created[0].name").value("Groceries"))
        .andExpect(jsonPath("$.updated[0].name").value("Rent"));

    verify(tagService).createTagsBulk(anyList(), eq(walletId), any(UUID.class));
  }

  @Test
  void createTag_WithInvalidPayload_ShouldReturn400() throws Exception {
    UUID walletId = UUID.randomUUID();
    // Missing name field, should trigger @Valid @NotBlank
    TagRequest request = TagRequest.builder().build();

    mockMvc
        .perform(
            post("/api/tags/{walletID}", walletId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.title").value("Validation Error"))
        .andExpect(jsonPath("$.detail").value("Invalid input data"));
  }

  @Test
  void updateTag_ShouldReturn200() throws Exception {
    UUID walletId = UUID.randomUUID();
    String tagName = "Groceries";
    TagRequest request = TagRequest.builder().name("Groceries-Updated").build();
    TagResponse mockResponse = TagResponse.builder().name("Groceries-Updated").build();

    when(tagService.updateTag(eq(tagName), any(TagRequest.class), eq(walletId), any(UUID.class)))
        .thenReturn(mockResponse);

    mockMvc
        .perform(
            put("/api/tags/{walletID}/{tagName}", walletId, tagName)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Groceries-Updated"));
  }

  @Test
  void deleteTag_ShouldReturn204() throws Exception {
    UUID walletId = UUID.randomUUID();
    String tagName = "Groceries";

    mockMvc
        .perform(delete("/api/tags/{walletID}/{tagName}", walletId, tagName))
        .andExpect(status().isNoContent());

    verify(tagService).deleteTag(eq(tagName), eq(walletId), any(UUID.class));
  }
}
