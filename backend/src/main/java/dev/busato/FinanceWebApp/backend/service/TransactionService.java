package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.TransactionRequest;
import dev.busato.FinanceWebApp.backend.dto.TransactionResponse;
import dev.busato.FinanceWebApp.backend.exceptions.TagNotFoundException;
import dev.busato.FinanceWebApp.backend.exceptions.WalletNotFoundException;
import dev.busato.FinanceWebApp.backend.mappers.TransactionMapper;
import dev.busato.FinanceWebApp.backend.model.*;
import dev.busato.FinanceWebApp.backend.repository.*;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TransactionService {

  private final TransactionRepository transactionRepository;
  private final WalletAccessRepository walletAccessRepository;
  private final UserRepository userRepository;
  private final TagRepository tagRepository;
  private final WalletRepository walletRepository;
  private final SubscriptionRepository subscriptionRepository;
  private final TransactionMapper transactionMapper;

  @Transactional
  @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
  public TransactionResponse createTransaction(
      TransactionRequest request, UUID walletId, UUID userId) {
    Wallet wallet =
        walletRepository
            .findById(walletId)
            .orElseThrow(() -> new WalletNotFoundException(walletId));

    if (request.getName().length() < 3 || request.getName().length() > 40)
      throw new IllegalArgumentException("The name must be between 3 and 40 characters long.");

    Tag tag = null;
    if (request.getTag() != null)
      tag =
          tagRepository
              .findByNameIgnoreCaseAndWalletId(request.getTag(), walletId)
              .orElseThrow(() -> new TagNotFoundException(request.getTag(), walletId));

    if (request.getAmount().compareTo(BigDecimal.ZERO) < 0)
      throw new IllegalArgumentException("The amount cannot be negative.");

    Subscription subscription = null;
    if (request.getSubscriptionId() != null) {
      subscription =
          subscriptionRepository
              .findByIdAndWalletId(request.getSubscriptionId(), walletId)
              .orElseThrow(
                  () ->
                      new IllegalArgumentException(
                          "Subscription not found or does not belong to this wallet"));
    }

    Transaction transaction =
        Transaction.builder()
            .wallet(wallet)
            .subscription(subscription)
            .tag(tag)
            .name(request.getName())
            .amount(request.getAmount())
            .originalAmount(request.getOriginalAmount())
            .originalCurrency(request.getOriginalCurrency())
            .exchangeValue(request.getExchangeValue())
            .transactionDate(
                request.getTransactionDate() != null
                    ? request.getTransactionDate()
                    : LocalDate.now())
            .type(Transaction.Type.valueOf(request.getType()))
            .notes(request.getNotes())
            .build();

    transaction = transactionRepository.save(transaction);
    return transactionMapper.mapToResponse(transaction);
  }

  @PreAuthorize("@walletSecurity.hasReadAccess(#userId, #walletId)")
  public List<TransactionResponse> getTransactionsByWalletID(UUID walletId, UUID userId) {
    return transactionRepository.getAllByWalletId(walletId).stream()
        .map(transactionMapper::mapToResponse)
        .collect(Collectors.toList());
  }

  @Transactional
  @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
  public TransactionResponse updateTransaction(
      UUID transactionId, TransactionRequest request, UUID walletId, UUID userId) {
    Transaction transaction =
        transactionRepository
            .findByIdAndWalletId(transactionId, walletId)
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "Transaction not found or does not belong to this wallet"));

    if (request.getName() != null) {
      if (request.getName().length() < 2 || request.getName().length() > 40) {
        throw new IllegalArgumentException("The name must be between 3 and 40 characters long.");
      }
      transaction.setName(request.getName());
    }

    if (request.getAmount().compareTo(BigDecimal.ZERO) < 0)
      throw new IllegalArgumentException("The amount cannot be negative.");

    if (request.getTag() != null && !request.getTag().isBlank()) {
      Tag tag =
          tagRepository
              .findByNameIgnoreCaseAndWalletId(request.getTag(), walletId)
              .orElseThrow(() -> new TagNotFoundException(request.getTag(), walletId));
      transaction.setTag(tag);
    }

    if (request.getAmount() != null) transaction.setAmount(request.getAmount());
    if (request.getOriginalAmount() != null)
      transaction.setOriginalAmount(request.getOriginalAmount());
    if (request.getOriginalCurrency() != null)
      transaction.setOriginalCurrency(request.getOriginalCurrency());
    if (request.getExchangeValue() != null)
      transaction.setExchangeValue(request.getExchangeValue());
    if (request.getType() != null) transaction.setType(Transaction.Type.valueOf(request.getType()));
    if (request.getNotes() != null) transaction.setNotes(request.getNotes());

    if (request.getTransactionDate() != null)
      transaction.setTransactionDate(request.getTransactionDate());

    return transactionMapper.mapToResponse(transaction);
  }

  @Transactional
  @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
  public void deleteTransaction(UUID transactionId, UUID walletId, UUID userId) {
    Transaction transaction =
        transactionRepository
            .findByIdAndWalletId(transactionId, walletId)
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "Transaction not found or does not belong to this wallet"));

    transactionRepository.delete(transaction);
  }
}
