package dev.busato.FinanceWebApp.backend.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;

import dev.busato.FinanceWebApp.backend.model.Budget;
import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Transaction;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class BudgetRepositoryTest {

  @Autowired private WalletRepository walletRepository;
  @Autowired private TagRepository tagRepository;
  @Autowired private TransactionRepository transactionRepository;
  @Autowired private BudgetRepository budgetRepository;

  private Wallet wallet;
  private Tag food;
  private Tag restaurants; // child of food

  @BeforeEach
  void setUp() {
    wallet = new Wallet();
    wallet.setName("Budget Wallet");
    wallet.setCurrency("EUR");
    wallet = walletRepository.save(wallet);

    food = tagRepository.save(Tag.builder().name("Food").wallet(wallet).build());
    restaurants =
        tagRepository.save(Tag.builder().name("Restaurants").wallet(wallet).parent(food).build());

    tx("Groceries", "50.00", Transaction.Type.EXPENSE, food, LocalDate.of(2026, 7, 10));
    tx("Dinner", "30.00", Transaction.Type.EXPENSE, restaurants, LocalDate.of(2026, 7, 20));
    tx("Untagged", "20.00", Transaction.Type.EXPENSE, null, LocalDate.of(2026, 7, 12));
    tx("Salary", "2000.00", Transaction.Type.INCOME, null, LocalDate.of(2026, 7, 15));
    tx("Old expense", "99.00", Transaction.Type.EXPENSE, food, LocalDate.of(2026, 6, 15));
  }

  private void tx(String name, String amount, Transaction.Type type, Tag tag, LocalDate date) {
    transactionRepository.save(
        Transaction.builder()
            .wallet(wallet)
            .name(name)
            .amount(new BigDecimal(amount))
            .originalAmount(new BigDecimal(amount))
            .type(type)
            .tag(tag)
            .transactionDate(date)
            .build());
  }

  @Test
  void sumByWallet_countsOnlyExpensesInRange() {
    BigDecimal sum =
        transactionRepository.sumAmountByWalletAndDateRange(
            wallet.getId(),
            Transaction.Type.EXPENSE,
            LocalDate.of(2026, 7, 1),
            LocalDate.of(2026, 7, 31));
    // 50 + 30 + 20 — income and the June expense are excluded
    assertEquals(0, new BigDecimal("100.00").compareTo(sum));
  }

  @Test
  void sumByTags_filtersToTheGivenTagIds() {
    BigDecimal subtree =
        transactionRepository.sumAmountByWalletAndDateRangeAndTags(
            wallet.getId(),
            Transaction.Type.EXPENSE,
            LocalDate.of(2026, 7, 1),
            LocalDate.of(2026, 7, 31),
            List.of(food.getId(), restaurants.getId()));
    assertEquals(0, new BigDecimal("80.00").compareTo(subtree));

    BigDecimal leafOnly =
        transactionRepository.sumAmountByWalletAndDateRangeAndTags(
            wallet.getId(),
            Transaction.Type.EXPENSE,
            LocalDate.of(2026, 7, 1),
            LocalDate.of(2026, 7, 31),
            List.of(restaurants.getId()));
    assertEquals(0, new BigDecimal("30.00").compareTo(leafOnly));
  }

  @Test
  void sum_withNoMatches_returnsZeroNotNull() {
    BigDecimal sum =
        transactionRepository.sumAmountByWalletAndDateRange(
            wallet.getId(),
            Transaction.Type.EXPENSE,
            LocalDate.of(2020, 1, 1),
            LocalDate.of(2020, 1, 31));
    assertEquals(0, BigDecimal.ZERO.compareTo(sum));
  }

  @Test
  void budget_persistsAndLoadsWithDefaults() {
    budgetRepository.save(
        Budget.builder()
            .wallet(wallet)
            .tag(food)
            .name("Food budget")
            .limitAmount(new BigDecimal("300.00"))
            .periodType(Budget.PeriodType.MONTHLY)
            .startDate(LocalDate.of(2026, 7, 1))
            .build());

    List<Budget> found = budgetRepository.findAllByWalletId(wallet.getId());
    assertEquals(1, found.size());
    assertEquals("[80,100]", found.get(0).getAlertThresholds());
    assertEquals(false, found.get(0).isRollover());
  }
}
