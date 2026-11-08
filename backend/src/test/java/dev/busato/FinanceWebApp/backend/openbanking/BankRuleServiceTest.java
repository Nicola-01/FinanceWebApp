package dev.busato.FinanceWebApp.backend.openbanking;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dev.busato.FinanceWebApp.backend.exceptions.OpenBankingDisabledException;
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
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BankRuleServiceTest {

  @Mock BankRuleRepository ruleRepository;
  @Mock SubscriptionRepository subscriptionRepository;
  @Mock TagRepository tagRepository;
  @Mock WalletRepository walletRepository;
  @Mock BankLinkService bankLinkService;
  @Mock TagMapper tagMapper;
  @InjectMocks BankRuleService service;

  final UUID userId = UUID.randomUUID();
  final UUID walletId = UUID.randomUUID();
  Wallet wallet;

  @BeforeEach
  void setUp() {
    wallet = new Wallet();
    wallet.setId(walletId);
    lenient().when(walletRepository.findById(walletId)).thenReturn(Optional.of(wallet));
    lenient()
        .when(ruleRepository.save(any(BankRule.class)))
        .thenAnswer(
            i -> {
              BankRule r = i.getArgument(0);
              if (r.getId() == null) r.setId(UUID.randomUUID());
              return r;
            });
    lenient()
        .when(ruleRepository.findByWalletIdAndNameIgnoreCase(any(), any()))
        .thenReturn(Optional.empty());
  }

  private static BankRuleRequest req(String name, String text) {
    return new BankRuleRequest(name, text, false, null, null, null, null, null);
  }

  private BankRule existing(String name) {
    return BankRule.builder()
        .id(UUID.randomUUID())
        .wallet(wallet)
        .name(name)
        .matchText("X")
        .build();
  }

  private static Subscription sub(String name) {
    return Subscription.builder().name(name).build();
  }

  @Test
  void create_valid_trimsAndSaves() {
    BankRuleResponse r = service.create(userId, walletId, req("  Amazon ", " AMZN "));
    assertEquals("Amazon", r.name());
    assertEquals("AMZN", r.matchText());
    assertTrue(r.ignoreCase());
    assertEquals(List.of(), r.usedBy());
  }

  @Test
  void create_duplicateNameDifferentCase_throws() {
    when(ruleRepository.findByWalletIdAndNameIgnoreCase(walletId, "Amazon"))
        .thenReturn(Optional.of(existing("amazon")));
    assertThrows(
        IllegalArgumentException.class, () -> service.create(userId, walletId, req("Amazon", "A")));
    verify(ruleRepository, never()).save(any());
  }

  @Test
  void update_sameNameSameRule_ok() {
    BankRule rule = existing("Amazon");
    when(ruleRepository.findByIdAndWalletId(rule.getId(), walletId)).thenReturn(Optional.of(rule));
    when(ruleRepository.findByWalletIdAndNameIgnoreCase(walletId, "Amazon"))
        .thenReturn(Optional.of(rule));
    BankRuleResponse r = service.update(userId, walletId, rule.getId(), req("Amazon", "AMZN"));
    assertEquals("AMZN", r.matchText());
  }

  @Test
  void update_renameToOtherRulesName_throws() {
    BankRule rule = existing("Amazon");
    when(ruleRepository.findByIdAndWalletId(rule.getId(), walletId)).thenReturn(Optional.of(rule));
    when(ruleRepository.findByWalletIdAndNameIgnoreCase(walletId, "Fuel"))
        .thenReturn(Optional.of(existing("fuel")));
    assertThrows(
        IllegalArgumentException.class,
        () -> service.update(userId, walletId, rule.getId(), req("Fuel", "AMZN")));
  }

  @Test
  void update_otherWalletRule_throws() {
    UUID ruleId = UUID.randomUUID();
    when(ruleRepository.findByIdAndWalletId(ruleId, walletId)).thenReturn(Optional.empty());
    IllegalArgumentException e =
        assertThrows(
            IllegalArgumentException.class,
            () -> service.update(userId, walletId, ruleId, req("A", "B")));
    assertEquals("Bank rule not found", e.getMessage());
  }

  @Test
  void create_placeholderTag_throwsTagNotFound() {
    Tag placeholder = new Tag();
    placeholder.setPlaceholder(true);
    when(tagRepository.findByNameIgnoreCaseAndWalletId("To categorise", walletId))
        .thenReturn(Optional.of(placeholder));
    assertThrows(
        TagNotFoundException.class,
        () ->
            service.create(
                userId,
                walletId,
                new BankRuleRequest("A", "B", false, null, "To categorise", null, null, null)));
  }

  @Test
  void create_unknownTag_throwsTagNotFound() {
    when(tagRepository.findByNameIgnoreCaseAndWalletId("Nope", walletId))
        .thenReturn(Optional.empty());
    assertThrows(
        TagNotFoundException.class,
        () ->
            service.create(
                userId,
                walletId,
                new BankRuleRequest("A", "B", false, null, "Nope", null, null, null)));
  }

  @Test
  void create_withTag_linksIt() {
    Tag food = new Tag();
    food.setName("Food");
    when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId))
        .thenReturn(Optional.of(food));
    service.create(
        userId, walletId, new BankRuleRequest("A", "B", false, false, "Food", "Shop", null, null));
    verify(ruleRepository)
        .save(
            argThat(
                r -> r.getTag() == food && "Shop".equals(r.getRenameTo()) && !r.isIgnoreCase()));
  }

  @Test
  void create_featureDisabled_throwsOpenBankingDisabled() {
    doThrow(new OpenBankingDisabledException()).when(bankLinkService).requireFeature(userId);
    assertThrows(
        OpenBankingDisabledException.class, () -> service.create(userId, walletId, req("A", "B")));
    verify(ruleRepository, never()).save(any());
  }

  @Test
  void create_invalidRegex_throws() {
    assertThrows(
        IllegalArgumentException.class,
        () ->
            service.create(
                userId,
                walletId,
                new BankRuleRequest("A", "(", true, null, null, null, null, null)));
  }

  @Test
  void list_includesUsedBy() {
    BankRule a = existing("A");
    when(ruleRepository.findAllByWalletIdOrderByNameAsc(walletId)).thenReturn(List.of(a));
    when(subscriptionRepository.findAllByBankRuleId(a.getId()))
        .thenReturn(List.of(sub("Netflix"), sub("Spotify")));
    assertEquals(List.of("Netflix", "Spotify"), service.list(userId, walletId).get(0).usedBy());
  }

  @Test
  void delete_inUse_throwsUsedBy() {
    BankRule a = existing("A");
    when(ruleRepository.findByIdAndWalletId(a.getId(), walletId)).thenReturn(Optional.of(a));
    when(subscriptionRepository.findAllByBankRuleId(a.getId()))
        .thenReturn(List.of(sub("Netflix"), sub("Spotify")));
    IllegalArgumentException e =
        assertThrows(
            IllegalArgumentException.class, () -> service.delete(userId, walletId, a.getId()));
    assertEquals("Used by: Netflix, Spotify", e.getMessage());
    verify(ruleRepository, never()).delete(any());
  }

  @Test
  void delete_unused_deletes() {
    BankRule a = existing("A");
    when(ruleRepository.findByIdAndWalletId(a.getId(), walletId)).thenReturn(Optional.of(a));
    when(subscriptionRepository.findAllByBankRuleId(a.getId())).thenReturn(List.of());
    service.delete(userId, walletId, a.getId());
    verify(ruleRepository).delete(a);
  }
}
