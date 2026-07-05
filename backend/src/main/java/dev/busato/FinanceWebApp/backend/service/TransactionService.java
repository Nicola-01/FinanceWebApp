package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.TagResponse;
import dev.busato.FinanceWebApp.backend.dto.TransactionBulkResponse;
import dev.busato.FinanceWebApp.backend.dto.TransactionRequest;
import dev.busato.FinanceWebApp.backend.dto.TransactionResponse;
import dev.busato.FinanceWebApp.backend.exceptions.TagNotFoundException;
import dev.busato.FinanceWebApp.backend.exceptions.WalletNotFoundException;
import dev.busato.FinanceWebApp.backend.mappers.TagMapper;
import dev.busato.FinanceWebApp.backend.mappers.TransactionMapper;
import dev.busato.FinanceWebApp.backend.model.*;
import dev.busato.FinanceWebApp.backend.repository.*;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
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
  private final TagMapper tagMapper;
  private final TagService tagService;

  @Transactional
  @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
  public TransactionResponse createTransaction(
      TransactionRequest request, UUID walletId, UUID userId) {
    return createTransactionInternal(request, walletId);
  }

  /**
   * Bulk-upserts transactions in a single atomic transaction. Write access is verified once for the
   * whole batch.
   *
   * <p>For each row the referenced tag is resolved by case-insensitive name; a non-blank tag name
   * with no matching tag is <b>auto-created</b> with default styling (icon {@code "tag"}, colour
   * {@code "var(--color-app-green)"}, no parent) and reported once in {@link
   * TransactionBulkResponse#getAutoCreatedTags()}. A row is then treated as a <b>duplicate</b> of
   * an existing transaction when it shares the same name, tag and transaction date (name and tag
   * compared case-insensitively/trimmed, date exact): the existing transaction's mutable fields are
   * overwritten and it is reported in {@code updated}; otherwise a new transaction is created and
   * reported in {@code created}. Duplicate detection also spans rows created earlier in the same
   * batch, so two identical rows collapse to a single record (last one wins).
   *
   * <p>The batch is all-or-nothing: if any row is invalid the whole transaction is rolled back and
   * an {@link IllegalArgumentException} whose message is prefixed with the failing 0-based row
   * index is thrown.
   *
   * @param requests The transactions to upsert (an empty/null list yields empty result lists)
   * @param walletId The UUID of the wallet
   * @param userId The UUID of the user performing the upsert
   * @return The created and updated transactions plus any auto-created tags
   */
  @Transactional
  @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
  public TransactionBulkResponse createTransactionsBulk(
      List<TransactionRequest> requests, UUID walletId, UUID userId) {
    List<Transaction> createdList = new ArrayList<>();
    List<Transaction> updatedList = new ArrayList<>();
    List<TagResponse> autoCreatedTags = new ArrayList<>();
    if (requests == null || requests.isEmpty())
      return TransactionBulkResponse.builder()
          .created(new ArrayList<>())
          .updated(new ArrayList<>())
          .autoCreatedTags(autoCreatedTags)
          .build();

    Wallet wallet =
        walletRepository
            .findById(walletId)
            .orElseThrow(() -> new WalletNotFoundException(walletId));

    // Tag index (existing + auto-created within this batch), keyed by normalised name.
    Map<String, Tag> tagByName = new HashMap<>();
    for (Tag t : tagRepository.getTagsByWalletId(walletId))
      tagByName.put(normalize(t.getName()), t);

    // Existing transactions keyed by (name|tag|date) for dedup; absorbs in-batch creations.
    Map<String, Transaction> byKey = new HashMap<>();
    for (Transaction t : transactionRepository.getAllByWalletId(walletId))
      byKey.put(
          transactionKey(
              t.getName(),
              t.getTag() == null ? null : t.getTag().getName(),
              t.getTransactionDate()),
          t);

    // Identity-based bookkeeping so responses are built once from final entity state (last wins).
    Set<Transaction> createdInBatch = Collections.newSetFromMap(new IdentityHashMap<>());
    Set<Transaction> updatedTracked = Collections.newSetFromMap(new IdentityHashMap<>());

    for (int i = 0; i < requests.size(); i++) {
      try {
        TransactionRequest req = requests.get(i);
        validateTransactionName(req.getName());
        Transaction.Type type = parseTransactionType(req.getType());
        requireNonNegativeAmount(req.getAmount());

        Tag tag = resolveOrAutoCreateTag(req.getTag(), walletId, tagByName, autoCreatedTags);

        LocalDate date =
            req.getTransactionDate() != null ? req.getTransactionDate() : LocalDate.now();
        String key = transactionKey(req.getName(), tag == null ? null : tag.getName(), date);
        Transaction existing = byKey.get(key);

        if (existing == null) {
          Transaction created = buildTransaction(req, wallet, tag, type, date, walletId);
          created = transactionRepository.save(created);
          byKey.put(key, created);
          createdInBatch.add(created);
          createdList.add(created);
        } else {
          applyMutableTransactionFields(existing, req, type);
          transactionRepository.save(existing);
          if (!createdInBatch.contains(existing) && updatedTracked.add(existing))
            updatedList.add(existing);
        }
      } catch (RuntimeException ex) {
        throw new IllegalArgumentException("Row " + i + ": " + ex.getMessage(), ex);
      }
    }

    return TransactionBulkResponse.builder()
        .created(
            createdList.stream().map(transactionMapper::mapToResponse).collect(Collectors.toList()))
        .updated(
            updatedList.stream().map(transactionMapper::mapToResponse).collect(Collectors.toList()))
        .autoCreatedTags(autoCreatedTags)
        .build();
  }

  /**
   * Per-row create logic for the single-create path. Assumes write access to the wallet has already
   * been verified by the caller.
   */
  private TransactionResponse createTransactionInternal(TransactionRequest request, UUID walletId) {
    Wallet wallet =
        walletRepository
            .findById(walletId)
            .orElseThrow(() -> new WalletNotFoundException(walletId));

    validateTransactionName(request.getName());

    Tag tag = null;
    if (request.getTag() != null)
      tag =
          tagRepository
              .findByNameIgnoreCaseAndWalletId(request.getTag(), walletId)
              .orElseThrow(() -> new TagNotFoundException(request.getTag(), walletId));

    requireNonNegativeAmount(request.getAmount());

    Subscription subscription = resolveSubscription(request.getSubscriptionId(), walletId);

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

  /** Builds (without persisting) a new transaction entity for the bulk-create path. */
  private Transaction buildTransaction(
      TransactionRequest req,
      Wallet wallet,
      Tag tag,
      Transaction.Type type,
      LocalDate date,
      UUID walletId) {
    Subscription subscription = resolveSubscription(req.getSubscriptionId(), walletId);
    return Transaction.builder()
        .wallet(wallet)
        .subscription(subscription)
        .tag(tag)
        .name(req.getName())
        .amount(req.getAmount())
        .originalAmount(req.getOriginalAmount())
        .originalCurrency(req.getOriginalCurrency())
        .exchangeValue(req.getExchangeValue())
        .transactionDate(date)
        .type(type)
        .notes(req.getNotes())
        .build();
  }

  /** Overwrites the mutable fields of an existing transaction from a duplicate bulk row. */
  private void applyMutableTransactionFields(
      Transaction transaction, TransactionRequest req, Transaction.Type type) {
    transaction.setAmount(req.getAmount());
    transaction.setType(type);
    transaction.setNotes(req.getNotes());
    transaction.setOriginalAmount(req.getOriginalAmount());
    transaction.setOriginalCurrency(req.getOriginalCurrency());
    transaction.setExchangeValue(req.getExchangeValue());
  }

  /**
   * Resolves a transaction's tag by name, auto-creating it with default styling when the name is
   * non-blank and no matching tag exists. Auto-created tags are recorded once each.
   */
  private Tag resolveOrAutoCreateTag(
      String tagName,
      UUID walletId,
      Map<String, Tag> tagByName,
      List<TagResponse> autoCreatedTags) {
    if (tagName == null || tagName.isBlank()) return null;
    Tag tag = tagByName.get(normalize(tagName));
    if (tag == null) {
      tag =
          tagService.createTagFromImport(tagName.trim(), "tag", "var(--color-app-green)", walletId);
      tagByName.put(normalize(tagName), tag);
      autoCreatedTags.add(tagMapper.mapToResponse(tag));
    }
    return tag;
  }

  private Subscription resolveSubscription(UUID subscriptionId, UUID walletId) {
    if (subscriptionId == null) return null;
    return subscriptionRepository
        .findByIdAndWalletId(subscriptionId, walletId)
        .orElseThrow(
            () ->
                new IllegalArgumentException(
                    "Subscription not found or does not belong to this wallet"));
  }

  private void validateTransactionName(String name) {
    if (name == null || name.length() < 3 || name.length() > 40)
      throw new IllegalArgumentException("The name must be between 3 and 40 characters long.");
  }

  private Transaction.Type parseTransactionType(String type) {
    if (type == null || type.isBlank()) throw new IllegalArgumentException("The type is required.");
    try {
      return Transaction.Type.valueOf(type);
    } catch (IllegalArgumentException ex) {
      throw new IllegalArgumentException("Invalid transaction type: " + type);
    }
  }

  private void requireNonNegativeAmount(BigDecimal amount) {
    if (amount == null) throw new IllegalArgumentException("The amount is required.");
    if (amount.compareTo(BigDecimal.ZERO) < 0)
      throw new IllegalArgumentException("The amount cannot be negative.");
  }

  private static String normalize(String value) {
    return value == null ? null : value.trim().toLowerCase(Locale.ROOT);
  }

  /** Case-insensitive dedup key: transaction name + tag name + exact date. */
  private static String transactionKey(String name, String tagName, LocalDate date) {
    return normalize(name) + "|" + (tagName == null ? "" : normalize(tagName)) + "|" + date;
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
