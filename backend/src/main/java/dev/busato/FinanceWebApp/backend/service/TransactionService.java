package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.TagRequest;
import dev.busato.FinanceWebApp.backend.dto.TagResponse;
import dev.busato.FinanceWebApp.backend.dto.TransactionRequest;
import dev.busato.FinanceWebApp.backend.dto.TransactionResponse;
import dev.busato.FinanceWebApp.backend.exceptions.TagNotFoundException;
import dev.busato.FinanceWebApp.backend.exceptions.WalletNotFoundException;
import dev.busato.FinanceWebApp.backend.model.*;
import dev.busato.FinanceWebApp.backend.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final WalletAccessRepository walletAccessRepository;
    private final UserRepository userRepository;
    private final TagRepository tagRepository;
    private final WalletRepository walletRepository;

    @Transactional
    @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
    public TransactionResponse createTransaction(TransactionRequest request, UUID walletId, UUID userId) {
        Wallet wallet = walletRepository.findById(walletId).orElseThrow(() -> new WalletNotFoundException(walletId));

        if (request.getName().length() < 3 || request.getName().length() > 25)
            throw new IllegalArgumentException("The name must be between 3 and 25 characters long.");

        Tag tag = null;
        if (request.getTag() != null)
            tag = tagRepository.findByNameIgnoreCaseAndWalletId(request.getTag(), walletId)
                    .orElseThrow(() -> new TagNotFoundException(request.getTag(), walletId));

        Transaction transaction = Transaction.builder()
                .wallet(wallet)
                .tag(tag)
                .name(request.getName())
                .amount(request.getAmount())
                .originalAmount(request.getOriginalAmount())
                .originalCurrency(request.getOriginalCurrency())
                .exchangeValue(request.getExchangeValue())
                .transactionDate(LocalDate.now())
                .type(Transaction.Type.valueOf(request.getType()))
                .notes(request.getNotes())
                .build();

        transaction = transactionRepository.save(transaction);
        return mapToResponse(transaction);
    }

    @PreAuthorize("@walletSecurity.hasReadAccess(#userId, #walletId)")
    public List<TransactionResponse> getTransactionsByWalletID(UUID walletId, UUID userId) {
        return transactionRepository.getAllByWalletId(walletId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
    public TransactionResponse updateTransaction(UUID transactionId, TransactionRequest request, UUID walletId, UUID userId) {
        // 1. Cerchiamo la transazione assicurandoci che appartenga a questo wallet
        Transaction transaction = transactionRepository.findByIdAndWalletId(transactionId, walletId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found or does not belong to this wallet"));

        // 2. Validazione del nome
        if (request.getName() != null) {
            if (request.getName().length() < 3 || request.getName().length() > 25) {
                throw new IllegalArgumentException("The name must be between 3 and 25 characters long.");
            }
            transaction.setName(request.getName());
        }

        // 3. Gestione del Tag (può essere null o vuoto se l'utente lo rimuove)
        Tag tag = null;
        if (request.getTag() != null && !request.getTag().isBlank()) {
            tag = tagRepository.findByNameIgnoreCaseAndWalletId(request.getTag(), walletId)
                    .orElseThrow(() -> new TagNotFoundException(request.getTag(), walletId));
        }
        transaction.setTag(tag);

        transaction.setAmount(request.getAmount());
        transaction.setOriginalAmount(request.getOriginalAmount());
        transaction.setOriginalCurrency(request.getOriginalCurrency());
        transaction.setExchangeValue(request.getExchangeValue()); // P.S. Ricordati del typo "exchangeValue" ;)
        transaction.setType(Transaction.Type.valueOf(request.getType()));
        transaction.setNotes(request.getNotes());

        if (request.getTransactionDate() != null) {
            transaction.setTransactionDate(request.getTransactionDate());
        }

        return mapToResponse(transaction);
    }

    @Transactional
    @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
    public void deleteTransaction(UUID transactionId, UUID walletId, UUID userId) {
        Transaction transaction = transactionRepository.findByIdAndWalletId(transactionId, walletId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found or does not belong to this wallet"));

        transactionRepository.delete(transaction);
    }

    private TransactionResponse mapToResponse(Transaction transaction) {
        return TransactionResponse.builder()
                .id(transaction.getId())
                .name(transaction.getName())
                .amount(transaction.getAmount())
                .originalAmount(transaction.getOriginalAmount())
                .originalCurrency(transaction.getOriginalCurrency())
                .exchangeValue(transaction.getExchangeValue())
                .tag(
                    TagResponse.builder()
                        .name(transaction.getTag().getName())
                        .icon(transaction.getTag().getIcon())
                        .colorHex(transaction.getTag().getColorHex())
                        .parentName(Optional.ofNullable(transaction.getTag().getParent())
                            .map(Tag::getName) // parent could be null
                            .orElse(null))
                        .build()
                )
                .transactionDate(transaction.getTransactionDate())
                .type(transaction.getType().toString())
                .notes(transaction.getNotes())
                .build();


    }

}
