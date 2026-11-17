package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.model.Tag;
import java.util.Collection;
import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/** Resolves which tags count as investments: a flagged tag plus its whole subtree. */
public final class InvestmentTags {

  private InvestmentTags() {}

  /**
   * True when the tag or any ancestor is flagged. The placeholder is never an investment. Walks the
   * parent chain with identity-based visiting so corrupt cyclic data terminates (and Tag's
   * recursive equals/hashCode are never used).
   */
  public static boolean isInvestment(Tag tag) {
    if (tag == null || tag.isPlaceholder()) return false;
    Set<Tag> visited = Collections.newSetFromMap(new IdentityHashMap<>());
    for (Tag current = tag; current != null && visited.add(current); current = current.getParent())
      if (current.isInvestment()) return true;
    return false;
  }

  /** Ids of every tag in the wallet that is an investment (flagged or inside a flagged subtree). */
  public static Set<UUID> investmentTagIds(Collection<Tag> walletTags) {
    return walletTags.stream()
        .filter(InvestmentTags::isInvestment)
        .map(Tag::getId)
        .collect(Collectors.toSet());
  }
}
