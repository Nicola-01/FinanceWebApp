package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.TagRequest;
import dev.busato.FinanceWebApp.backend.dto.TagResponse;
import dev.busato.FinanceWebApp.backend.exceptions.TagHasChildrenException;
import dev.busato.FinanceWebApp.backend.exceptions.TagInUseException;
import dev.busato.FinanceWebApp.backend.mappers.TagMapper;
import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.repository.TagRepository;
import dev.busato.FinanceWebApp.backend.repository.TransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TagServiceTest {

    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private TagRepository tagRepository;
    @Mock
    private WalletRepository walletRepository;
    @Mock
    private TagMapper tagMapper;

    @InjectMocks
    private TagService tagService;

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
        // Note: lombok builder creates immutable objects if not careful, wait, actually if @Data is used setters exist.
        request.setName("Food");

        when(tagRepository.existsByNameIgnoreCaseAndWalletId("Food", walletId)).thenReturn(false);
        when(walletRepository.getReferenceById(walletId)).thenReturn(wallet);

        tagService.createTag(request, walletId, userId);

        verify(tagRepository).save(any(Tag.class));
    }

    @Test
    void createTag_AlreadyExists_ThrowsException() {
        TagRequest request = TagRequest.builder().build();
        // Note: lombok builder creates immutable objects if not careful, wait, actually if @Data is used setters exist.
        request.setName("Food");

        when(tagRepository.existsByNameIgnoreCaseAndWalletId("Food", walletId)).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> tagService.createTag(request, walletId, userId));
    }

    @Test
    void deleteTag_NotUsedNoChildren_DeletesTag() {
        Tag tag = new Tag();
        tag.setName("Food");

        when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId)).thenReturn(Optional.of(tag));
        when(tagRepository.existsByParent(tag)).thenReturn(false);
        when(transactionRepository.existsByTag(tag)).thenReturn(false);

        tagService.deleteTag("Food", walletId, userId);

        verify(tagRepository).delete(tag);
    }

    @Test
    void deleteTag_HasChildren_ThrowsException() {
        Tag tag = new Tag();

        when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId)).thenReturn(Optional.of(tag));
        when(tagRepository.existsByParent(tag)).thenReturn(true);

        assertThrows(TagHasChildrenException.class, () -> tagService.deleteTag("Food", walletId, userId));
    }

    @Test
    void deleteTag_InUse_ThrowsException() {
        Tag tag = new Tag();

        when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId)).thenReturn(Optional.of(tag));
        when(tagRepository.existsByParent(tag)).thenReturn(false);
        when(transactionRepository.existsByTag(tag)).thenReturn(true);

        assertThrows(TagInUseException.class, () -> tagService.deleteTag("Food", walletId, userId));
    }

    @Test
    void updateTag_ChangeName_UpdatesSuccessfully() {
        TagRequest request = TagRequest.builder().build();
        // Note: lombok builder creates immutable objects if not careful, wait, actually if @Data is used setters exist.
        request.setName("NewFood");

        Tag tag = new Tag();
        tag.setName("Food");

        when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId)).thenReturn(Optional.of(tag));
        when(tagRepository.existsByNameIgnoreCaseAndWalletId("NewFood", walletId)).thenReturn(false);

        tagService.updateTag("Food", request, walletId, userId);

        assertEquals("NewFood", tag.getName());
    }

    @Test
    void updateTag_SetSelfAsParent_ThrowsException() {
        TagRequest request = TagRequest.builder().build();
        // Note: lombok builder creates immutable objects if not careful, wait, actually if @Data is used setters exist.
        request.setParentName("Food");

        Tag tag = new Tag();
        tag.setId(UUID.randomUUID());
        tag.setName("Food");

        when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId)).thenReturn(Optional.of(tag));

        assertThrows(IllegalArgumentException.class, () -> tagService.updateTag("Food", request, walletId, userId));
    }

    // ==================== createTag — edge cases ====================

    @Test
    void createTag_NameTooShort_ThrowsException() {
        TagRequest request = TagRequest.builder().build();
        request.setName("A"); // < 2 chars

        assertThrows(IllegalArgumentException.class, () -> tagService.createTag(request, walletId, userId));
    }

    @Test
    void createTag_NameTooLong_ThrowsException() {
        TagRequest request = TagRequest.builder().build();
        request.setName("A".repeat(26)); // > 25 chars

        assertThrows(IllegalArgumentException.class, () -> tagService.createTag(request, walletId, userId));
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
        when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId)).thenReturn(Optional.of(parentTag));

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
        when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId)).thenReturn(Optional.of(parentTag));

        assertThrows(IllegalArgumentException.class, () -> tagService.createTag(request, walletId, userId));
    }

    @Test
    void createTag_ParentNotFound_ThrowsTagNotFoundException() {
        TagRequest request = TagRequest.builder().build();
        request.setName("SubTag");
        request.setParentName("Ghost");

        when(tagRepository.existsByNameIgnoreCaseAndWalletId("SubTag", walletId)).thenReturn(false);
        when(walletRepository.getReferenceById(walletId)).thenReturn(wallet);
        when(tagRepository.findByNameIgnoreCaseAndWalletId("Ghost", walletId)).thenReturn(Optional.empty());

        assertThrows(dev.busato.FinanceWebApp.backend.exceptions.TagNotFoundException.class,
                () -> tagService.createTag(request, walletId, userId));
    }

    // ==================== deleteTag — edge case ====================

    @Test
    void deleteTag_TagNotFound_ThrowsTagNotFoundException() {
        when(tagRepository.findByNameIgnoreCaseAndWalletId("Ghost", walletId)).thenReturn(Optional.empty());

        assertThrows(dev.busato.FinanceWebApp.backend.exceptions.TagNotFoundException.class,
                () -> tagService.deleteTag("Ghost", walletId, userId));
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

        when(tagRepository.findByNameIgnoreCaseAndWalletId("SubFood", walletId)).thenReturn(Optional.of(tag));

        tagService.updateTag("SubFood", request, walletId, userId);

        assertNull(tag.getParent());
    }

    @Test
    void updateTag_DuplicateNewName_ThrowsException() {
        TagRequest request = TagRequest.builder().build();
        request.setName("ExistingTag");

        Tag tag = new Tag();
        tag.setName("OriginalName");

        when(tagRepository.findByNameIgnoreCaseAndWalletId("OriginalName", walletId)).thenReturn(Optional.of(tag));
        when(tagRepository.existsByNameIgnoreCaseAndWalletId("ExistingTag", walletId)).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> tagService.updateTag("OriginalName", request, walletId, userId));
    }
}
