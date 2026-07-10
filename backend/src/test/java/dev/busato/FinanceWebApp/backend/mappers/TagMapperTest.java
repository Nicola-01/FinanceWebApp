package dev.busato.FinanceWebApp.backend.mappers;

import static org.junit.jupiter.api.Assertions.*;

import dev.busato.FinanceWebApp.backend.dto.TagResponse;
import dev.busato.FinanceWebApp.backend.model.Tag;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TagMapperTest {
  @InjectMocks private TagMapper tagMapper;

  @Test
  void mapToResponse_WithParent_ShouldMapCorrectly() {
    Tag parentTag = new Tag();
    parentTag.setName("Parent Tag");
    Tag tag = new Tag();
    tag.setName("Test Tag");
    tag.setIcon("test-icon");
    tag.setColorHex("#FFFFFF");
    tag.setParent(parentTag);
    Instant updatedAt = Instant.now();
    tag.setUpdatedAt(updatedAt);
    TagResponse response = tagMapper.mapToResponse(tag);
    assertNotNull(response);
    assertEquals("Test Tag", response.getName());
    assertEquals("test-icon", response.getIcon());
    assertEquals("#FFFFFF", response.getColorHex());
    assertEquals("Parent Tag", response.getParentName());
    assertEquals(updatedAt, response.getUpdatedAt());
  }

  @Test
  void mapToResponse_WithoutParent_ShouldMapCorrectly() {
    Tag tag = new Tag();
    tag.setName("Test Tag");
    tag.setIcon("test-icon");
    tag.setColorHex("#FFFFFF");
    tag.setParent(null);
    TagResponse response = tagMapper.mapToResponse(tag);
    assertNotNull(response);
    assertEquals("Test Tag", response.getName());
    assertEquals("test-icon", response.getIcon());
    assertEquals("#FFFFFF", response.getColorHex());
    assertNull(response.getParentName());
  }
}
