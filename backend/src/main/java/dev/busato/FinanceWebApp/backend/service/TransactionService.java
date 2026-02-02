package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.TagDTO;
import dev.busato.FinanceWebApp.backend.dto.TransactionRequest;
import dev.busato.FinanceWebApp.backend.exceptions.TagNotFoundException;
import dev.busato.FinanceWebApp.backend.exceptions.UserNotFoundException;
import dev.busato.FinanceWebApp.backend.exceptions.WalletNotFoundException;
import dev.busato.FinanceWebApp.backend.model.*;
import dev.busato.FinanceWebApp.backend.repository.TagRepository;
import dev.busato.FinanceWebApp.backend.repository.TransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import lombok.RequiredArgsConstructor;
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

    public TransactionRequest createTransaction(TransactionRequest request, UUID walletID, UUID userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        WalletAccess walletAccess = walletAccessRepository.findByUserIdAndWalletId(userId, walletID)
                .orElseThrow(() -> new WalletNotFoundException(walletID));
        Wallet wallet = walletAccess.getWallet();

        Tag tag = null;
        if (request.getTag() != null && request.getTag().getName() != null)
            tag = tagRepository.findByNameIgnoreCaseAndWalletId(request.getTag().getName(), walletID)
                    .orElseThrow(() -> new TagNotFoundException(request.getTag().getName(), walletID));

        Transaction transaction = Transaction.builder()
                .wallet(wallet)
                .tag(tag)
                .name(request.getName())
                .amount(request.getAmount())
                .originalAmount(request.getOriginalAmount())
                .originalCurrency(request.getOriginalCurrency())
                .exchangeVale(request.getExchangeVale())
                .transactionDate(LocalDate.now())
                .type(Transaction.Type.valueOf(request.getType()))
                .notes(request.getNotes())
                .build();

        transaction = transactionRepository.save(transaction);
        return mapToResponse(transaction);
    }

    public List<TransactionRequest> getTransactionsByWalletID(UUID walletId) {
        return transactionRepository.getAllByWalletId(walletId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private TransactionRequest mapToResponse(Transaction transaction) {
        return TransactionRequest.builder()
                .name(transaction.getName())
                .amount(transaction.getAmount())
                .originalAmount(transaction.getOriginalAmount())
                .originalCurrency(transaction.getOriginalCurrency())
                .exchangeVale(transaction.getExchangeVale())
                .tag(
                    TagDTO.builder()
                        .name(transaction.getTag().getName())
                        .icon(transaction.getTag().getIcon())
                        .colorHex(transaction.getTag().getColorHex())
//                        .description(transaction.getTag().getDescription())
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
