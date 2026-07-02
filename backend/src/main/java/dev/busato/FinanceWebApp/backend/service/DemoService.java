package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.exceptions.UserNotFoundException;
import dev.busato.FinanceWebApp.backend.model.*;
import dev.busato.FinanceWebApp.backend.repository.*;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DemoService {

  private final UserRepository userRepository;
  private final WalletRepository walletRepository;
  private final WalletAccessRepository walletAccessRepository;
  private final TagRepository tagRepository;
  private final TransactionRepository transactionRepository;
  private final SubscriptionRepository subscriptionRepository;

  private final Random random = new Random();

  @Transactional
  public void generateDemoWallet(UUID userId) {
    User user =
        userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));

    Wallet demoWallet =
        Wallet.builder()
            .name("Demo Wallet")
            .color("#3b82f6") // Blue
            .icon("wallet")
            .currency("EUR")
            .createdAt(LocalDate.now())
            .encryptedWallet(false)
            .build();

    walletRepository.save(demoWallet);

    WalletAccess.WalletAccessId accessId =
        new WalletAccess.WalletAccessId(userId, demoWallet.getId());
    WalletAccess access = new WalletAccess();
    access.setId(accessId);
    access.setUser(user);
    access.setWallet(demoWallet);
    access.setRole(WalletAccess.WalletRole.OWNER);
    access.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
    access.setInvitedAt(LocalDate.now());

    walletAccessRepository.save(access);

    List<Tag> tags = createDemoTags(demoWallet);

    generateTransactions(demoWallet, tags);

    generateSubscriptions(demoWallet, tags);
  }

  private List<Tag> createDemoTags(Wallet wallet) {
    List<Tag> allTags = new ArrayList<>();

    // WORK
    Tag work = saveTag("Work", null, "work", "#4caf50", wallet, allTags);
    saveTag("Salary", work, "moneyBill", "#4caf50", wallet, allTags);
    saveTag("Bonus", work, "gift", "#81c784", wallet, allTags);
    saveTag("Meal Vouchers", work, "receipt", "#a5d6a7", wallet, allTags);

    // HOME
    Tag home = saveTag("Home", null, "house", "#2196f3", wallet, allTags);
    saveTag("Rent", home, "bank", "#64b5f6", wallet, allTags);
    saveTag("Gas", home, "energy", "#ffb74d", wallet, allTags);
    saveTag("Electricity", home, "energy", "#fff176", wallet, allTags);
    saveTag("Internet", home, "internet", "#4dd0e1", wallet, allTags);

    // CAR
    Tag car = saveTag("Car", null, "car", "#f44336", wallet, allTags);
    saveTag("Car Tax", car, "receipt", "#e57373", wallet, allTags);
    saveTag("Insurance", car, "receipt", "#ef5350", wallet, allTags);
    saveTag("Gasoline", car, "gas", "#ff8a65", wallet, allTags);
    saveTag("Maintenance", car, "repair", "#90a4ae", wallet, allTags);

    // SUBSCRIPTIONS
    Tag subscriptions = saveTag("Subscriptions", null, "calendar", "#9c27b0", wallet, allTags);
    saveTag("Netflix", subscriptions, "movies", "#e50914", wallet, allTags);
    saveTag("Amazon Prime", subscriptions, "cart", "#00a8e1", wallet, allTags);
    saveTag("Spotify", subscriptions, "music", "#1db954", wallet, allTags);

    // GROCERIES
    Tag shopping = saveTag("Groceries", null, "basket", "#ff9800", wallet, allTags);
    saveTag("Food", shopping, "groceries", "#ffb74d", wallet, allTags);
    saveTag("Hygiene", shopping, "health", "#81d4fa", wallet, allTags);

    // FOOD & ENTERTAINMENT
    Tag food = saveTag("Food & Entertainment", null, "dining", "#e91e63", wallet, allTags);
    saveTag("Pizza", food, "pizza", "#f06292", wallet, allTags);
    saveTag("Sushi", food, "sushi", "#ba68c8", wallet, allTags);
    saveTag("Ice Cream", food, "dessert", "#4fc3f7", wallet, allTags);

    return allTags;
  }

  private Tag saveTag(
      String name, Tag parent, String icon, String color, Wallet wallet, List<Tag> allTags) {
    Tag tag =
        Tag.builder().name(name).parent(parent).icon(icon).colorHex(color).wallet(wallet).build();
    tag = tagRepository.save(tag);
    allTags.add(tag);
    return tag;
  }

  private void generateTransactions(Wallet wallet, List<Tag> tags) {
    LocalDate startDate = LocalDate.now().minusMonths(24).withDayOfMonth(1);
    LocalDate endDate = LocalDate.now();

    List<Transaction> transactions = new ArrayList<>();

    LocalDate currentDate = startDate;
    while (currentDate.isBefore(endDate) || currentDate.isEqual(endDate)) {
      int year = currentDate.getYear();
      int month = currentDate.getMonthValue();
      int daysInMonth = currentDate.lengthOfMonth();

      // --- FIXED INCOMES ---
      // Salary (on the 27th of the month)
      addTx(
          transactions,
          wallet,
          tags,
          "Salary",
          "Monthly Salary",
          getRandomAmount(1600, 1800),
          currentDate.withDayOfMonth(Math.min(27, daysInMonth)),
          Transaction.Type.INCOME);

      // 13th Month Pay (in December)
      if (month == 12) {
        addTx(
            transactions,
            wallet,
            tags,
            "Bonus",
            "13th Month Salary",
            getRandomAmount(1500, 1700),
            currentDate.withDayOfMonth(15),
            Transaction.Type.INCOME);
      }

      // --- MONTHLY FIXED EXPENSES ---
      // Rent (on the 1st of the month)
      addTx(
          transactions,
          wallet,
          tags,
          "Rent",
          "Apartment Rent",
          650.0,
          currentDate.withDayOfMonth(1),
          Transaction.Type.EXPENSE);

      // Internet
      addTx(
          transactions,
          wallet,
          tags,
          "Internet",
          "Fiber Optic",
          29.90,
          currentDate.withDayOfMonth(10),
          Transaction.Type.EXPENSE);

      // Subscriptions
      addTx(
          transactions,
          wallet,
          tags,
          "Netflix",
          "Netflix Standard",
          12.99,
          currentDate.withDayOfMonth(15),
          Transaction.Type.EXPENSE);
      addTx(
          transactions,
          wallet,
          tags,
          "Spotify",
          "Spotify Premium",
          10.99,
          currentDate.withDayOfMonth(20),
          Transaction.Type.EXPENSE);

      // Bills (Bi-monthly)
      if (month % 2 == 0) {
        addTx(
            transactions,
            wallet,
            tags,
            "Electricity",
            "Electricity Bill",
            getRandomAmount(80, 150),
            currentDate.withDayOfMonth(random.nextInt(15) + 1),
            Transaction.Type.EXPENSE);
        addTx(
            transactions,
            wallet,
            tags,
            "Gas",
            "Gas Bill",
            getRandomAmount(70, 200),
            currentDate.withDayOfMonth(random.nextInt(15) + 10),
            Transaction.Type.EXPENSE);
      }

      // --- ANNUAL EXPENSES ---
      if (month == 5) {
        addTx(
            transactions,
            wallet,
            tags,
            "Insurance",
            "Car Insurance Renewal",
            450.0,
            currentDate.withDayOfMonth(5),
            Transaction.Type.EXPENSE);
      }
      if (month == 9) {
        addTx(
            transactions,
            wallet,
            tags,
            "Car Tax",
            "Car Tax",
            180.0,
            currentDate.withDayOfMonth(20),
            Transaction.Type.EXPENSE);
      }
      if (month == 1) {
        addTx(
            transactions,
            wallet,
            tags,
            "Amazon Prime",
            "Prime Renewal",
            49.90,
            currentDate.withDayOfMonth(11),
            Transaction.Type.EXPENSE);
      }

      // --- RECURRING AND RANDOM EXPENSES IN THE MONTH ---
      // Groceries (about 4 times a month)
      for (int i = 0; i < 4; i++) {
        addTx(
            transactions,
            wallet,
            tags,
            "Food",
            "Supermarket Shopping",
            getRandomAmount(40, 90),
            currentDate.withDayOfMonth(random.nextInt(daysInMonth) + 1),
            Transaction.Type.EXPENSE);
      }

      // Gasoline (2-3 times a month)
      int benzinaCount = random.nextInt(2) + 2;
      for (int i = 0; i < benzinaCount; i++) {
        addTx(
            transactions,
            wallet,
            tags,
            "Gasoline",
            "Refueling",
            getRandomAmount(40, 60),
            currentDate.withDayOfMonth(random.nextInt(daysInMonth) + 1),
            Transaction.Type.EXPENSE);
      }

      // Occasional entertainment
      if (random.nextBoolean()) {
        addTx(
            transactions,
            wallet,
            tags,
            "Pizza",
            "Pizzeria with friends",
            getRandomAmount(15, 25),
            currentDate.withDayOfMonth(random.nextInt(daysInMonth) + 1),
            Transaction.Type.EXPENSE);
      }
      if (random.nextInt(3) == 0) { // 33% probability per month
        addTx(
            transactions,
            wallet,
            tags,
            "Sushi",
            "All you can eat",
            getRandomAmount(30, 60),
            currentDate.withDayOfMonth(random.nextInt(daysInMonth) + 1),
            Transaction.Type.EXPENSE);
      }

      // Move to the next month
      currentDate = currentDate.plusMonths(1);
    }

    // Batch save to optimize performance
    transactionRepository.saveAll(transactions);
  }

  private void generateSubscriptions(Wallet wallet, List<Tag> tags) {
    // --- MONTHLY EXPENSES ---
    addSub(
        wallet,
        tags,
        "Rent",
        "Apartment Rent",
        650.0,
        Subscription.Frequency.MONTHLY,
        1,
        1,
        false,
        Subscription.Type.EXPENSE);

    addSub(
        wallet,
        tags,
        "Internet",
        "Fiber Optic",
        29.90,
        Subscription.Frequency.MONTHLY,
        1,
        10,
        false,
        Subscription.Type.EXPENSE);

    addSub(
        wallet,
        tags,
        "Netflix",
        "Netflix Standard",
        12.99,
        Subscription.Frequency.MONTHLY,
        1,
        15,
        false,
        Subscription.Type.EXPENSE);

    addSub(
        wallet,
        tags,
        "Spotify",
        "Spotify Premium",
        10.99,
        Subscription.Frequency.MONTHLY,
        1,
        20,
        false,
        Subscription.Type.EXPENSE);

    // --- MONTHLY INCOME ---
    addSub(
        wallet,
        tags,
        "Salary",
        "Monthly Salary",
        1750.0,
        Subscription.Frequency.MONTHLY,
        1,
        27,
        false,
        Subscription.Type.INCOME);

    // --- YEARLY EXPENSES ---
    // Amazon Prime (Jan 11)
    addSub(
        wallet,
        tags,
        "Amazon Prime",
        "Prime Renewal",
        49.90,
        Subscription.Frequency.YEARLY,
        1,
        11,
        false,
        Subscription.Type.EXPENSE);

    // Car Insurance (May 5)
    addSub(
        wallet,
        tags,
        "Insurance",
        "Car Insurance Renewal",
        450.0,
        Subscription.Frequency.YEARLY,
        1,
        5,
        false,
        Subscription.Type.EXPENSE);

    // Car Tax (Sep 20)
    addSub(
        wallet,
        tags,
        "Car Tax",
        "Car Tax",
        180.0,
        Subscription.Frequency.YEARLY,
        1,
        20,
        false,
        Subscription.Type.EXPENSE);
  }

  private void addSub(
      Wallet wallet,
      List<Tag> tags,
      String tagName,
      String title,
      double amount,
      Subscription.Frequency frequency,
      int interval,
      int day,
      boolean lastWorkingDay,
      Subscription.Type type) {

    Tag selectedTag =
        tags.stream().filter(t -> t.getName().equalsIgnoreCase(tagName)).findFirst().orElse(null);

    BigDecimal bdAmount = BigDecimal.valueOf(amount);

    // Calculate next execution date
    LocalDate today = LocalDate.now();
    LocalDate nextDate;

    if (frequency == Subscription.Frequency.MONTHLY) {
      nextDate = today.withDayOfMonth(Math.min(day, today.lengthOfMonth()));
      if (!nextDate.isAfter(today)) {
        nextDate = nextDate.plusMonths(interval);
        nextDate = nextDate.withDayOfMonth(Math.min(day, nextDate.lengthOfMonth()));
      }
    } else if (frequency == Subscription.Frequency.YEARLY) {
      // For yearly, 'day' is used in a slightly different way in this helper,
      // but let's assume we pass the day and we need to handle the month.
      // Simplified: for demo yearly, we'll just pick the month from the historic data.
      int month = 1;
      if (tagName.equalsIgnoreCase("Insurance")) month = 5;
      else if (tagName.equalsIgnoreCase("Car Tax")) month = 9;
      else if (tagName.equalsIgnoreCase("Amazon Prime")) month = 1;

      nextDate = LocalDate.of(today.getYear(), month, day);
      if (!nextDate.isAfter(today)) {
        nextDate = nextDate.plusYears(interval);
      }
    } else {
      nextDate = today.plusDays(1);
    }

    Subscription sub =
        Subscription.builder()
            .wallet(wallet)
            .tag(selectedTag)
            .name(title)
            .amount(bdAmount)
            .originalAmount(bdAmount)
            .originalCurrency("EUR")
            .exchangeValue(BigDecimal.ONE)
            .type(type)
            .status(Subscription.Status.ACTIVE)
            .startDate(LocalDate.now().minusMonths(1))
            .nextExecutionDate(nextDate)
            .frequencyType(frequency)
            .frequencyInterval(interval)
            .monthlySpecificDay(frequency == Subscription.Frequency.MONTHLY ? day : null)
            .lastWorkingDayOfMonth(lastWorkingDay)
            .duration(Subscription.Duration.FOREVER)
            .executedTimes(12) // Just a number to show it has been running
            .build();

    subscriptionRepository.save(sub);
  }

  private void addTx(
      List<Transaction> txList,
      Wallet wallet,
      List<Tag> tags,
      String tagName,
      String title,
      double amount,
      LocalDate date,
      Transaction.Type type) {

    if (date.isAfter(LocalDate.now())) return;

    Tag selectedTag =
        tags.stream().filter(t -> t.getName().equalsIgnoreCase(tagName)).findFirst().orElse(null);

    BigDecimal bdAmount = BigDecimal.valueOf(amount);

    Transaction tx =
        Transaction.builder()
            .wallet(wallet)
            .tag(selectedTag)
            .name(title)
            .amount(bdAmount)
            .originalAmount(bdAmount)
            .originalCurrency("EUR")
            .exchangeValue(BigDecimal.ONE)
            .transactionDate(date)
            .type(type)
            .build();

    txList.add(tx);
  }

  private double getRandomAmount(double min, double max) {
    double amount = min + (max - min) * random.nextDouble();
    return Math.round(amount * 100.0) / 100.0;
  }
}
