package dev.busato.FinanceWebApp.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import dev.busato.FinanceWebApp.backend.model.Tag;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class InvestmentTagsTest {

  private static Tag tag(String name, boolean investment, Tag parent) {
    return Tag.builder()
        .id(UUID.randomUUID())
        .name(name)
        .investment(investment)
        .parent(parent)
        .build();
  }

  @Test
  void isInvestment_null_false() {
    assertFalse(InvestmentTags.isInvestment(null));
  }

  @Test
  void isInvestment_flaggedSelf_true() {
    assertTrue(InvestmentTags.isInvestment(tag("ETF", true, null)));
  }

  @Test
  void isInvestment_inheritsFromGrandparent_true() {
    Tag root = tag("Investments", true, null);
    Tag middle = tag("Funds", false, root);
    Tag leaf = tag("Index", false, middle);
    assertTrue(InvestmentTags.isInvestment(leaf));
  }

  @Test
  void isInvestment_childFlaggedParentNot_siblingFalse() {
    Tag savings = tag("Savings", false, null);
    Tag pension = tag("Pension", true, savings);
    Tag emergency = tag("Emergency", false, savings);
    assertTrue(InvestmentTags.isInvestment(pension));
    assertFalse(InvestmentTags.isInvestment(emergency));
    assertFalse(InvestmentTags.isInvestment(savings));
  }

  @Test
  void isInvestment_placeholder_false() {
    Tag placeholder =
        Tag.builder().name("To categorise").placeholder(true).investment(true).build();
    assertFalse(InvestmentTags.isInvestment(placeholder));
  }

  @Test
  void isInvestment_cycleTerminates() {
    Tag a = tag("A", false, null);
    Tag b = tag("B", false, a);
    a.setParent(b);
    assertFalse(InvestmentTags.isInvestment(a));
    assertFalse(InvestmentTags.isInvestment(b));

    Tag flagged = tag("Flagged", true, null);
    Tag c = tag("C", false, flagged);
    flagged.setParent(c);
    assertTrue(InvestmentTags.isInvestment(c));
  }

  @Test
  void investmentTagIds_returnsSubtreesOnly() {
    Tag investments = tag("Investments", true, null);
    Tag pac = tag("PAC", false, investments);
    Tag etf = tag("ETF", false, investments);
    Tag savings = tag("Savings", false, null);
    Tag emergency = tag("Emergency", false, savings);
    Tag pension = tag("Pension", true, savings);

    Set<UUID> ids =
        InvestmentTags.investmentTagIds(
            List.of(investments, pac, etf, savings, emergency, pension));

    assertEquals(Set.of(investments.getId(), pac.getId(), etf.getId(), pension.getId()), ids);
  }
}
