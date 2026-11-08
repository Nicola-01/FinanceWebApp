package dev.busato.FinanceWebApp.backend.openbanking;

import dev.busato.FinanceWebApp.backend.exceptions.TagNotFoundException;
import dev.busato.FinanceWebApp.backend.mappers.TagMapper;
import dev.busato.FinanceWebApp.backend.model.BankRule;
import dev.busato.FinanceWebApp.backend.model.Subscription;
import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.openbanking.BankDtos.BankRuleRequest;
import dev.busato.FinanceWebApp.backend.openbanking.BankDtos.BankRuleResponse;
import dev.busato.FinanceWebApp.backend.repository.BankRuleRepository;
import dev.busato.FinanceWebApp.backend.repository.SubscriptionRepository;
import dev.busato.FinanceWebApp.backend.repository.TagRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** CRUD of a wallet's bank rules; same open-banking gate as {@link BankLinkService}. */
@Service
@RequiredArgsConstructor
public class BankRuleService {

  private final BankRuleRepository ruleRepository;
  private final SubscriptionRepository subscriptionRepository;
  private final TagRepository tagRepository;
  private final WalletRepository walletRepository;
  private final BankLinkService bankLinkService;
  private final TagMapper tagMapper;

  @Transactional(readOnly = true)
  @PreAuthorize("@walletSecurity.hasReadAccess(#userId, #walletId)")
  public List<BankRuleResponse> list(UUID userId, UUID walletId) {
    bankLinkService.requireFeature(userId);
    return ruleRepository.findAllByWalletIdOrderByNameAsc(walletId).stream()
        .map(this::toResponse)
        .toList();
  }

  @Transactional
  @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
  public BankRuleResponse create(UUID userId, UUID walletId, BankRuleRequest req) {
    bankLinkService.requireFeature(userId);
    Wallet wallet =
        walletRepository
            .findById(walletId)
            .orElseThrow(() -> new IllegalArgumentException("Wallet not found"));
    BankRule rule = BankRule.builder().wallet(wallet).build();
    apply(rule, req, walletId);
    return toResponse(ruleRepository.save(rule));
  }

  @Transactional
  @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
  public BankRuleResponse update(UUID userId, UUID walletId, UUID ruleId, BankRuleRequest req) {
    bankLinkService.requireFeature(userId);
    BankRule rule = find(ruleId, walletId);
    apply(rule, req, walletId);
    return toResponse(ruleRepository.save(rule));
  }

  @Transactional
  @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
  public void delete(UUID userId, UUID walletId, UUID ruleId) {
    bankLinkService.requireFeature(userId);
    BankRule rule = find(ruleId, walletId);
    List<String> usedBy = usedBy(rule);
    if (!usedBy.isEmpty())
      throw new IllegalArgumentException("Used by: " + String.join(", ", usedBy));
    ruleRepository.delete(rule);
  }

  private BankRule find(UUID ruleId, UUID walletId) {
    return ruleRepository
        .findByIdAndWalletId(ruleId, walletId)
        .orElseThrow(() -> new IllegalArgumentException("Bank rule not found"));
  }

  private void apply(BankRule rule, BankRuleRequest req, UUID walletId) {
    rule.setName(req.name());
    rule.setMatchText(req.matchText());
    rule.setRegex(req.regex());
    rule.setIgnoreCase(req.ignoreCase() == null || req.ignoreCase());
    rule.setRenameTo(req.renameTo());
    rule.setTag(resolveTag(req.tag(), walletId));
    BankMatchRule.validate(rule);
    ruleRepository
        .findByWalletIdAndNameIgnoreCase(walletId, rule.getName())
        .filter(other -> !other.getId().equals(rule.getId()))
        .ifPresent(
            other -> {
              throw new IllegalArgumentException(
                  "A bank rule named '" + rule.getName() + "' already exists");
            });
  }

  private Tag resolveTag(String tagName, UUID walletId) {
    if (tagName == null || tagName.isBlank()) return null;
    return tagRepository
        .findByNameIgnoreCaseAndWalletId(tagName, walletId)
        .filter(t -> !t.isPlaceholder())
        .orElseThrow(() -> new TagNotFoundException(tagName, walletId));
  }

  private List<String> usedBy(BankRule rule) {
    return subscriptionRepository.findAllByBankRuleId(rule.getId()).stream()
        .map(Subscription::getName)
        .toList();
  }

  private BankRuleResponse toResponse(BankRule r) {
    return new BankRuleResponse(
        r.getId(),
        r.getName(),
        r.getMatchText(),
        r.isRegex(),
        r.isIgnoreCase(),
        r.getTag() == null ? null : tagMapper.mapToResponse(r.getTag()),
        r.getRenameTo(),
        usedBy(r),
        r.getUpdatedAt());
  }
}
