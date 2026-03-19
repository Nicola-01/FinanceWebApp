package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.TagRequest;
import dev.busato.FinanceWebApp.backend.dto.TagResponse;
import dev.busato.FinanceWebApp.backend.dto.TransactionResponse;
import dev.busato.FinanceWebApp.backend.exceptions.TagHasChildrenException;
import dev.busato.FinanceWebApp.backend.exceptions.TagInUseException;
import dev.busato.FinanceWebApp.backend.exceptions.TagNotFoundException;
import dev.busato.FinanceWebApp.backend.exceptions.UnauthorizedAccessException;
import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TransactionRepository transactionRepository;
    private final WalletAccessRepository walletAccessRepository;
    private final UserRepository userRepository;
    private final TagRepository tagRepository;
    private final WalletRepository walletRepository;

//    public TagResponse getTagByID(UUID id) {}

    @PreAuthorize("@walletSecurity.hasReadAccess(#userId, #walletId)")
    public List<TagResponse> getTags(UUID walletId, UUID userId) {
        return tagRepository.getTagsByWalletId(walletId).stream()
                .map(this::mapToResponse)
                .sorted((t1, t2) -> t1.getName().compareTo(t2.getName()))
                .collect(Collectors.toList());
    }

    @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
    public TagResponse createTag(TagRequest tagRequest, UUID walletId, UUID userId) {

        if (tagRequest.getName().length() < 2 || tagRequest.getName().length() > 25)
            throw new IllegalArgumentException("The name must be between 2 and 15 characters long.");

        if (tagRepository.existsByNameIgnoreCaseAndWalletId(tagRequest.getName(), walletId))
            throw new IllegalArgumentException("A tag with the name '" + tagRequest.getName() + "' already exists.");

        Wallet wallet = walletRepository.getReferenceById(walletId);

        Tag parentTag = null;
        if (tagRequest.getParentName() != null) {
            parentTag = tagRepository.findByNameIgnoreCaseAndWalletId(tagRequest.getParentName(), walletId)
                    .orElseThrow(() -> new TagNotFoundException(tagRequest.getParentName(), walletId));

            if (parentTag.getName().equals(tagRequest.getName()))
                throw new IllegalArgumentException("A tag cannot be its own parent.");
        }

        Tag tag = Tag.builder()
                .name(tagRequest.getName())
                .wallet(wallet)
                .icon(tagRequest.getIcon())
                .colorHex(tagRequest.getColorHex())
                .parent(parentTag)
                .build();

        tagRepository.save(tag);

        return mapToResponse(tag);
    }

    @Transactional
    @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
    public void deleteTag(String tagName, UUID walletId, UUID userId) {
        Tag tag = tagRepository.findByNameIgnoreCaseAndWalletId(tagName, walletId)
                .orElseThrow(() -> new TagNotFoundException(tagName, walletId));

        if (tagRepository.existsByParent(tag))
            throw new TagHasChildrenException(tagName);

        if (transactionRepository.existsByTag(tag))
            throw new TagInUseException(tagName);

        tagRepository.delete(tag);
    }

    @Transactional
    @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
    public TagResponse updateTag(String tagName, TagRequest request, UUID walletId, UUID userId) {
        Tag tag = tagRepository.findByNameIgnoreCaseAndWalletId(tagName, walletId)
                .orElseThrow(() -> new TagNotFoundException(tagName, walletId));

        if (request.getName() != null && !request.getName().isBlank() && !tag.getName().equalsIgnoreCase(request.getName())) {
            if (request.getName().length() < 2 || request.getName().length() > 15)
                throw new IllegalArgumentException("The name must be between 2 and 15 characters long.");
            if (tagRepository.existsByNameIgnoreCaseAndWalletId(request.getName(), walletId))
                throw new IllegalArgumentException("A tag with the name '" + request.getName() + "' already exists.");
            tag.setName(request.getName());
        }

        if (request.getColorHex() != null && !request.getColorHex().isBlank())
            tag.setColorHex(request.getColorHex());

        if (request.getIcon() != null && !request.getIcon().isBlank())
            tag.setIcon(request.getIcon());

        if (request.getParentName() != null) {
            if (request.getParentName().isBlank()) {
                tag.setParent(null);
            } else {
                Tag parentTag = tagRepository.findByNameIgnoreCaseAndWalletId(request.getParentName(), walletId)
                        .orElseThrow(() -> new TagNotFoundException(request.getParentName(), walletId));

                if (parentTag.getId().equals(tag.getId()))
                    throw new IllegalArgumentException("A tag cannot be its own parent.");

                tag.setParent(parentTag);
            }
        }

        return mapToResponse(tag);
    }

    private TagResponse mapToResponse(Tag tag) {
        return TagResponse.builder()
                .name(tag.getName())
                .icon(tag.getIcon())
                .colorHex(tag.getColorHex())
                .parentName(Optional.ofNullable(tag.getParent())
                        .map(Tag::getName) // parent could be null
                        .orElse(null))
                .build();
    }

}
