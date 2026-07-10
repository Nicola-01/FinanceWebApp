package dev.busato.FinanceWebApp.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dev.busato.FinanceWebApp.backend.dto.TagBulkResponse;
import dev.busato.FinanceWebApp.backend.dto.TagRequest;
import dev.busato.FinanceWebApp.backend.dto.TagResponse;
import dev.busato.FinanceWebApp.backend.exceptions.StaleWriteException;
import dev.busato.FinanceWebApp.backend.exceptions.TagHasChildrenException;
import dev.busato.FinanceWebApp.backend.exceptions.TagInUseException;
import dev.busato.FinanceWebApp.backend.mappers.TagMapper;
import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.repository.TagRepository;
import dev.busato.FinanceWebApp.backend.repository.TransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TagServiceTest {

  @Mock private TransactionRepository transactionRepository;
  @Mock private TagRepository tagRepository;
  @Mock private WalletRepository walletRepository;
  @Mock private TagMapper tagMapper;

  @InjectMocks private TagService tagService;

  private UUID walletId;
  private UUID userId;
  private Wallet wallet;

  @BeforeEach
  void setUp() {
    walletId = UUID.randomUUID();
    userId = UUID.randomUUID();
    wallet = new Wallet();
    wallet.setId(walletId);
  }

  @Test
  void getTags_ReturnsSortedTags() {
    Tag tag1 = new Tag();
    tag1.setName("Z-Tag");
    Tag tag2 = new Tag();
    tag2.setName("A-Tag");

    when(tagRepository.getTagsByWalletId(walletId)).thenReturn(List.of(tag1, tag2));

    TagResponse response1 = TagResponse.builder().build();
    response1.setName("Z-Tag");
    TagResponse response2 = TagResponse.builder().build();
    response2.setName("A-Tag");

    when(tagMapper.mapToResponse(tag1)).thenReturn(response1);
    when(tagMapper.mapToResponse(tag2)).thenReturn(response2);

    List<TagResponse> result = tagService.getTags(walletId, userId);

    assertEquals(2, result.size());
    assertEquals("A-Tag", result.get(0).getName()); // Sorted by name
    assertEquals("Z-Tag", result.get(1).getName());
  }

  @Test
  void createTag_ValidRequest_CreatesTag() {
    TagRequest request = TagRequest.builder().build();
    // Note: lombok builder creates immutable objects if not careful, wait, actually if @Data is
    // used setters exist.
    request.setName("Food");

    when(tagRepository.existsByNameIgnoreCaseAndWalletId("Food", walletId)).thenReturn(false);
    when(walletRepository.getReferenceById(walletId)).thenReturn(wallet);

    tagService.createTag(request, walletId, userId);

    verify(tagRepository).save(any(Tag.class));
  }

  @Test
  void createTag_AlreadyExists_ThrowsException() {
    TagRequest request = TagRequest.builder().build();
    // Note: lombok builder creates immutable objects if not careful, wait, actually if @Data is
    // used setters exist.
    request.setName("Food");

    when(tagRepository.existsByNameIgnoreCaseAndWalletId("Food", walletId)).thenReturn(true);

    assertThrows(
        IllegalArgumentException.class, () -> tagService.createTag(request, walletId, userId));
  }

  // ==================== createTagsBulk (upsert) ====================

  @Test
  void createTagsBulk_ValidRows_CreatesAllAndReturnsResponses() {
    TagRequest r1 = TagRequest.builder().build();
    r1.setName("Food");
    TagRequest r2 = TagRequest.builder().build();
    r2.setName("Rent");

    when(walletRepository.getReferenceById(walletId)).thenReturn(wallet);
    when(tagRepository.getTagsByWalletId(walletId)).thenReturn(List.of());

    TagBulkResponse result = tagService.createTagsBulk(List.of(r1, r2), walletId, userId);

    assertEquals(2, result.getCreated().size());
    assertEquals(0, result.getUpdated().size());
    verify(tagRepository, times(2)).save(any(Tag.class));
  }

  @Test
  void createTagsBulk_EmptyList_ReturnsEmptyLists() {
    TagBulkResponse result = tagService.createTagsBulk(List.of(), walletId, userId);

    assertEquals(0, result.getCreated().size());
    assertEquals(0, result.getUpdated().size());
    verify(tagRepository, never()).save(any());
  }

  @Test
  void createTagsBulk_ExistingName_UpdatesIconColorAndParent() {
    // A pre-existing "Food" tag plus a pre-existing "Bills" tag used as the new parent.
    Tag existingFood = new Tag();
    existingFood.setId(UUID.randomUUID());
    existingFood.setName("Food");
    existingFood.setIcon("old-icon");
    existingFood.setColorHex("#000000");
    Tag existingBills = new Tag();
    existingBills.setId(UUID.randomUUID());
    existingBills.setName("Bills");

    when(walletRepository.getReferenceById(walletId)).thenReturn(wallet);
    when(tagRepository.getTagsByWalletId(walletId))
        .thenReturn(List.of(existingFood, existingBills));

    // Row matches "Food" by name (case-insensitive) and refreshes icon/color/parent.
    TagRequest update = TagRequest.builder().build();
    update.setName("food");
    update.setIcon("burger");
    update.setColorHex("#ff0000");
    update.setParentName("Bills");
    // A brand-new tag to prove created/updated are split correctly.
    TagRequest fresh = TagRequest.builder().build();
    fresh.setName("Salary");

    TagBulkResponse result = tagService.createTagsBulk(List.of(update, fresh), walletId, userId);

    assertEquals(1, result.getUpdated().size());
    assertEquals(1, result.getCreated().size());
    // Existing entity mutated in place.
    assertEquals("burger", existingFood.getIcon());
    assertEquals("#ff0000", existingFood.getColorHex());
    assertEquals(existingBills, existingFood.getParent());
  }

  @Test
  void createTagsBulk_InvalidRow_ThrowsRowPrefixedException() {
    TagRequest r1 = TagRequest.builder().build();
    r1.setName("Food");
    TagRequest r2 = TagRequest.builder().build();
    r2.setName("A"); // Too short → rolls back the whole batch

    when(walletRepository.getReferenceById(walletId)).thenReturn(wallet);
    when(tagRepository.getTagsByWalletId(walletId)).thenReturn(List.of());

    IllegalArgumentException ex =
        assertThrows(
            IllegalArgumentException.class,
            () -> tagService.createTagsBulk(List.of(r1, r2), walletId, userId));

    assertTrue(ex.getMessage().startsWith("Row 1:"), ex.getMessage());
  }

  @Test
  void createTagsBulk_ChildBeforeParent_ResolvesInBatchParent() {
    // The child references a parent that appears LATER in the input list and is itself new. The
    // topological sweep must create the parentless row first so the child can resolve it in-batch.
    TagRequest child = TagRequest.builder().build();
    child.setName("SubFood");
    child.setParentName("Food");
    TagRequest parent = TagRequest.builder().build();
    parent.setName("Food");

    when(walletRepository.getReferenceById(walletId)).thenReturn(wallet);
    when(tagRepository.getTagsByWalletId(walletId)).thenReturn(List.of());

    TagBulkResponse result = tagService.createTagsBulk(List.of(child, parent), walletId, userId);

    assertEquals(2, result.getCreated().size());

    // Verify insertion order: the parentless "Food" is saved before the child "SubFood", and the
    // child's parent is the exact in-batch entity that was created first.
    ArgumentCaptor<Tag> captor = ArgumentCaptor.forClass(Tag.class);
    verify(tagRepository, times(2)).save(captor.capture());
    List<Tag> savedInOrder = captor.getAllValues();
    assertEquals("Food", savedInOrder.get(0).getName());
    assertEquals("SubFood", savedInOrder.get(1).getName());
    assertEquals(savedInOrder.get(0), savedInOrder.get(1).getParent());
  }

  @Test
  void createTagsBulk_MultiLevelNesting_ResolvesAcrossPasses() {
    // Deep chain Cat -> Bird -> Ant, all new, supplied deepest-first. The iterative resolve must
    // create Ant, then Bird, then Cat.
    TagRequest cat = TagRequest.builder().build();
    cat.setName("Cat");
    cat.setParentName("Bird");
    TagRequest bird = TagRequest.builder().build();
    bird.setName("Bird");
    bird.setParentName("Ant");
    TagRequest ant = TagRequest.builder().build();
    ant.setName("Ant");

    when(walletRepository.getReferenceById(walletId)).thenReturn(wallet);
    when(tagRepository.getTagsByWalletId(walletId)).thenReturn(List.of());

    TagBulkResponse result = tagService.createTagsBulk(List.of(cat, bird, ant), walletId, userId);

    assertEquals(3, result.getCreated().size());

    ArgumentCaptor<Tag> captor = ArgumentCaptor.forClass(Tag.class);
    verify(tagRepository, times(3)).save(captor.capture());
    List<Tag> savedInOrder = captor.getAllValues();
    assertEquals("Ant", savedInOrder.get(0).getName());
    assertEquals("Bird", savedInOrder.get(1).getName());
    assertEquals("Cat", savedInOrder.get(2).getName());
    assertEquals(savedInOrder.get(0), savedInOrder.get(1).getParent());
    assertEquals(savedInOrder.get(1), savedInOrder.get(2).getParent());
  }

  @Test
  void createTagsBulk_UnresolvableParent_ThrowsRowPrefixedException() {
    // A child whose parent is neither pre-existing nor present in the batch can never resolve.
    TagRequest child = TagRequest.builder().build();
    child.setName("Orphan");
    child.setParentName("Ghost");

    when(walletRepository.getReferenceById(walletId)).thenReturn(wallet);
    when(tagRepository.getTagsByWalletId(walletId)).thenReturn(List.of());

    IllegalArgumentException ex =
        assertThrows(
            IllegalArgumentException.class,
            () -> tagService.createTagsBulk(List.of(child), walletId, userId));

    assertTrue(ex.getMessage().startsWith("Row 0:"), ex.getMessage());
    assertTrue(ex.getMessage().contains("Ghost"), ex.getMessage());
  }

  @Test
  void createTagsBulk_IntraBatchDuplicateName_LastRowWins() {
    // Two rows named "Food" collapse to one tag; the last row's attributes win.
    TagRequest first = TagRequest.builder().build();
    first.setName("Food");
    first.setIcon("first");
    TagRequest second = TagRequest.builder().build();
    second.setName("Food");
    second.setIcon("second");

    when(walletRepository.getReferenceById(walletId)).thenReturn(wallet);
    when(tagRepository.getTagsByWalletId(walletId)).thenReturn(List.of());

    TagBulkResponse result = tagService.createTagsBulk(List.of(first, second), walletId, userId);

    // Only one tag is created for the duplicated name.
    assertEquals(1, result.getCreated().size());
    ArgumentCaptor<Tag> captor = ArgumentCaptor.forClass(Tag.class);
    verify(tagRepository).save(captor.capture());
    assertEquals("second", captor.getValue().getIcon());
  }

  @Test
  void deleteTag_NotUsedNoChildren_DeletesTag() {
    Tag tag = new Tag();
    tag.setName("Food");

    when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId))
        .thenReturn(Optional.of(tag));
    when(tagRepository.existsByParent(tag)).thenReturn(false);
    when(transactionRepository.existsByTag(tag)).thenReturn(false);

    tagService.deleteTag("Food", walletId, userId, null);

    verify(tagRepository).delete(tag);
  }

  @Test
  void deleteTag_HasChildren_ThrowsException() {
    Tag tag = new Tag();

    when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId))
        .thenReturn(Optional.of(tag));
    when(tagRepository.existsByParent(tag)).thenReturn(true);

    assertThrows(
        TagHasChildrenException.class, () -> tagService.deleteTag("Food", walletId, userId, null));
  }

  @Test
  void deleteTag_InUse_ThrowsException() {
    Tag tag = new Tag();

    when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId))
        .thenReturn(Optional.of(tag));
    when(tagRepository.existsByParent(tag)).thenReturn(false);
    when(transactionRepository.existsByTag(tag)).thenReturn(true);

    assertThrows(
        TagInUseException.class, () -> tagService.deleteTag("Food", walletId, userId, null));
  }

  @Test
  void updateTag_ChangeName_UpdatesSuccessfully() {
    TagRequest request = TagRequest.builder().build();
    // Note: lombok builder creates immutable objects if not careful, wait, actually if @Data is
    // used setters exist.
    request.setName("NewFood");

    Tag tag = new Tag();
    tag.setName("Food");

    when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId))
        .thenReturn(Optional.of(tag));
    when(tagRepository.existsByNameIgnoreCaseAndWalletId("NewFood", walletId)).thenReturn(false);

    tagService.updateTag("Food", request, walletId, userId);

    assertEquals("NewFood", tag.getName());
  }

  @Test
  void updateTag_SetSelfAsParent_ThrowsException() {
    TagRequest request = TagRequest.builder().build();
    // Note: lombok builder creates immutable objects if not careful, wait, actually if @Data is
    // used setters exist.
    request.setParentName("Food");

    Tag tag = new Tag();
    tag.setId(UUID.randomUUID());
    tag.setName("Food");

    when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId))
        .thenReturn(Optional.of(tag));

    assertThrows(
        IllegalArgumentException.class,
        () -> tagService.updateTag("Food", request, walletId, userId));
  }

  // ==================== createTag — edge cases ====================

  @Test
  void createTag_NameTooShort_ThrowsException() {
    TagRequest request = TagRequest.builder().build();
    request.setName("A"); // < 2 chars

    assertThrows(
        IllegalArgumentException.class, () -> tagService.createTag(request, walletId, userId));
  }

  @Test
  void createTag_NameTooLong_ThrowsException() {
    TagRequest request = TagRequest.builder().build();
    request.setName("A".repeat(26)); // > 25 chars

    assertThrows(
        IllegalArgumentException.class, () -> tagService.createTag(request, walletId, userId));
  }

  @Test
  void createTag_WithValidParent_CreatesTagWithParent() {
    TagRequest request = TagRequest.builder().build();
    request.setName("SubFood");
    request.setParentName("Food");

    Tag parentTag = new Tag();
    parentTag.setName("Food");

    when(tagRepository.existsByNameIgnoreCaseAndWalletId("SubFood", walletId)).thenReturn(false);
    when(walletRepository.getReferenceById(walletId)).thenReturn(wallet);
    when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId))
        .thenReturn(Optional.of(parentTag));

    tagService.createTag(request, walletId, userId);

    verify(tagRepository).save(any(Tag.class));
  }

  @Test
  void createTag_ParentSameAsChild_ThrowsException() {
    TagRequest request = TagRequest.builder().build();
    request.setName("Food");
    request.setParentName("Food");

    Tag parentTag = new Tag();
    parentTag.setName("Food");

    when(tagRepository.existsByNameIgnoreCaseAndWalletId("Food", walletId)).thenReturn(false);
    when(walletRepository.getReferenceById(walletId)).thenReturn(wallet);
    when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId))
        .thenReturn(Optional.of(parentTag));

    assertThrows(
        IllegalArgumentException.class, () -> tagService.createTag(request, walletId, userId));
  }

  @Test
  void createTag_ParentNotFound_ThrowsTagNotFoundException() {
    TagRequest request = TagRequest.builder().build();
    request.setName("SubTag");
    request.setParentName("Ghost");

    when(tagRepository.existsByNameIgnoreCaseAndWalletId("SubTag", walletId)).thenReturn(false);
    when(walletRepository.getReferenceById(walletId)).thenReturn(wallet);
    when(tagRepository.findByNameIgnoreCaseAndWalletId("Ghost", walletId))
        .thenReturn(Optional.empty());

    assertThrows(
        dev.busato.FinanceWebApp.backend.exceptions.TagNotFoundException.class,
        () -> tagService.createTag(request, walletId, userId));
  }

  // ==================== deleteTag — edge case ====================

  @Test
  void deleteTag_TagNotFound_ThrowsTagNotFoundException() {
    when(tagRepository.findByNameIgnoreCaseAndWalletId("Ghost", walletId))
        .thenReturn(Optional.empty());

    assertThrows(
        dev.busato.FinanceWebApp.backend.exceptions.TagNotFoundException.class,
        () -> tagService.deleteTag("Ghost", walletId, userId, null));
  }

  // ==================== baseUpdatedAt / Stale Write precondition ====================

  @Test
  void updateTag_staleBaseUpdatedAt_throwsStaleWrite() {
    Instant serverTime = Instant.parse("2026-07-08T10:00:00Z");
    Tag tag = new Tag();
    tag.setName("Food");
    tag.setUpdatedAt(serverTime);

    when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId))
        .thenReturn(Optional.of(tag));

    TagRequest request =
        TagRequest.builder()
            .name("NewFood")
            .baseUpdatedAt(serverTime.minusSeconds(60)) // older than the server row
            .build();

    assertThrows(
        StaleWriteException.class, () -> tagService.updateTag("Food", request, walletId, userId));
    assertEquals("Food", tag.getName()); // not mutated
  }

  @Test
  void updateTag_nullBaseUpdatedAt_skipsPrecondition() {
    Instant serverTime = Instant.parse("2026-07-08T10:00:00Z");
    Tag tag = new Tag();
    tag.setName("Food");
    tag.setUpdatedAt(serverTime);

    when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId))
        .thenReturn(Optional.of(tag));
    when(tagRepository.existsByNameIgnoreCaseAndWalletId("NewFood", walletId)).thenReturn(false);

    TagRequest request = TagRequest.builder().name("NewFood").build(); // no baseUpdatedAt

    tagService.updateTag("Food", request, walletId, userId);

    assertEquals("NewFood", tag.getName());
  }

  @Test
  void deleteTag_staleBaseUpdatedAt_throwsStaleWrite() {
    Instant serverTime = Instant.parse("2026-07-08T10:00:00Z");
    Tag tag = new Tag();
    tag.setName("Food");
    tag.setUpdatedAt(serverTime);

    when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId))
        .thenReturn(Optional.of(tag));

    assertThrows(
        StaleWriteException.class,
        () -> tagService.deleteTag("Food", walletId, userId, serverTime.minusSeconds(60)));
    verify(tagRepository, never()).delete(any());
  }

  // ==================== updateTag — edge cases ====================

  @Test
  void updateTag_BlankParentName_RemovesParent() {
    TagRequest request = TagRequest.builder().build();
    request.setParentName(""); // blank → remove parent

    Tag tag = new Tag();
    tag.setName("SubFood");
    Tag oldParent = new Tag();
    oldParent.setName("Food");
    tag.setParent(oldParent);

    when(tagRepository.findByNameIgnoreCaseAndWalletId("SubFood", walletId))
        .thenReturn(Optional.of(tag));

    tagService.updateTag("SubFood", request, walletId, userId);

    assertNull(tag.getParent());
  }

  @Test
  void updateTag_DuplicateNewName_ThrowsException() {
    TagRequest request = TagRequest.builder().build();
    request.setName("ExistingTag");

    Tag tag = new Tag();
    tag.setName("OriginalName");

    when(tagRepository.findByNameIgnoreCaseAndWalletId("OriginalName", walletId))
        .thenReturn(Optional.of(tag));
    when(tagRepository.existsByNameIgnoreCaseAndWalletId("ExistingTag", walletId)).thenReturn(true);

    assertThrows(
        IllegalArgumentException.class,
        () -> tagService.updateTag("OriginalName", request, walletId, userId));
  }
}
