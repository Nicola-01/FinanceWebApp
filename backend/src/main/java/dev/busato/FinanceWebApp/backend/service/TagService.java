package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.TagRequest;
import dev.busato.FinanceWebApp.backend.dto.TagResponse;
import dev.busato.FinanceWebApp.backend.dto.TransactionResponse;
import dev.busato.FinanceWebApp.backend.exceptions.TagNotFoundException;
import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.repository.*;
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
                .collect(Collectors.toList());
    }

    @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
    public TagResponse createTag(TagRequest tagRequest, UUID walletId, UUID userId) {

        if (tagRequest.getName().length() <= 3 || tagRequest.getName().length() > 25)
            throw new IllegalArgumentException("The name must be between 3 and 25 characters long.");

        Wallet wallet = walletRepository.getReferenceById(walletId);

        Tag parentTag = null;

        if (tagRequest.getParentName() != null)
            parentTag = tagRepository.findByNameIgnoreCaseAndWalletId(tagRequest.getParentName(), walletId)
                    .orElseThrow(() -> new TagNotFoundException(tagRequest.getParentName(), walletId));

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
