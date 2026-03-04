package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.exceptions.UserNotFoundException;
import dev.busato.FinanceWebApp.backend.model.*;
import dev.busato.FinanceWebApp.backend.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DemoService {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final WalletAccessRepository walletAccessRepository;
    private final TagRepository tagRepository;
    private final TransactionRepository transactionRepository;

    private final Random random = new Random();

    @Transactional
    public void generateDemoWallet(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        // 1. Creazione del Wallet (usando la chiave "wallet" dal tuo ICONS)
        Wallet demoWallet = Wallet.builder()
                .name("Portafoglio Demo")
                .color("#3b82f6") // Blu
                .icon("wallet")
                .currency("EUR")
                .createdAt(LocalDate.now())
                .encryptedWallet(false)
                .build();

        walletRepository.save(demoWallet);

        // 2. Creazione dell'Accesso (Owner)
        WalletAccess.WalletAccessId accessId = new WalletAccess.WalletAccessId(userId, demoWallet.getId());
        WalletAccess access = new WalletAccess();
        access.setId(accessId);
        access.setUser(user);
        access.setWallet(demoWallet);
        access.setRole(WalletAccess.WalletRole.OWNER);
        access.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
        access.setInvitedAt(LocalDate.now());

        walletAccessRepository.save(access);

        // 3. Creazione delle Categorie (Tags)
        List<Tag> tags = createDemoTags(demoWallet);

        // 4. Generazione Transazioni (~2 anni)
        generateTransactions(demoWallet, tags);
    }

    private List<Tag> createDemoTags(Wallet wallet) {
        List<Tag> allTags = new ArrayList<>();

        // LAVORO
        Tag lavoro = saveTag("Lavoro", null, "work", "#4caf50", wallet, allTags);
        saveTag("Stipendio", lavoro, "moneyBill", "#4caf50", wallet, allTags);
        saveTag("Bonus", lavoro, "gift", "#81c784", wallet, allTags);
        saveTag("Buoni Pasto", lavoro, "receipt", "#a5d6a7", wallet, allTags);

        // CASA
        Tag casa = saveTag("Casa", null, "house", "#2196f3", wallet, allTags);
        saveTag("Affitto", casa, "bank", "#64b5f6", wallet, allTags);
        saveTag("Gas", casa, "energy", "#ffb74d", wallet, allTags);
        saveTag("Luce", casa, "energy", "#fff176", wallet, allTags);
        saveTag("Internet", casa, "internet", "#4dd0e1", wallet, allTags);

        // AUTO
        Tag auto = saveTag("Auto", null, "car", "#f44336", wallet, allTags);
        saveTag("Bollo", auto, "receipt", "#e57373", wallet, allTags);
        saveTag("Assicurazione", auto, "receipt", "#ef5350", wallet, allTags);
        saveTag("Benzina", auto, "gas", "#ff8a65", wallet, allTags);
        saveTag("Manutenzione", auto, "repair", "#90a4ae", wallet, allTags);

        // ABBONAMENTI
        Tag abbonamenti = saveTag("Abbonamenti", null, "calendar", "#9c27b0", wallet, allTags);
        saveTag("Netflix", abbonamenti, "movies", "#e50914", wallet, allTags);
        saveTag("Amazon Prime", abbonamenti, "cart", "#00a8e1", wallet, allTags);
        saveTag("Spotify", abbonamenti, "music", "#1db954", wallet, allTags);

        // SPESA
        Tag spesa = saveTag("Spesa", null, "basket", "#ff9800", wallet, allTags);
        saveTag("Alimentari", spesa, "groceries", "#ffb74d", wallet, allTags);
        saveTag("Igiene", spesa, "health", "#81d4fa", wallet, allTags);

        // CIBO & SVAGO
        Tag cibo = saveTag("Cibo & Svago", null, "dining", "#e91e63", wallet, allTags);
        saveTag("Pizza", cibo, "pizza", "#f06292", wallet, allTags);
        saveTag("Sushi", cibo, "sushi", "#ba68c8", wallet, allTags);
        saveTag("Gelato", cibo, "dessert", "#4fc3f7", wallet, allTags);

        return allTags;
    }

    private Tag saveTag(String name, Tag parent, String icon, String color, Wallet wallet, List<Tag> allTags) {
        Tag tag = Tag.builder()
                .name(name)
                .parent(parent)
                .icon(icon)
                .colorHex(color)
                .wallet(wallet)
                .build();
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

            // --- ENTRATE FISSE ---
            // Stipendio (il 27 del mese)
            addTx(transactions, wallet, tags, "Stipendio", "Stipendio Mensile", getRandomAmount(1600, 1800),
                    currentDate.withDayOfMonth(Math.min(27, daysInMonth)), Transaction.Type.INCOME);

            // Tredicesima (a Dicembre)
            if (month == 12) {
                addTx(transactions, wallet, tags, "Bonus", "Tredicesima", getRandomAmount(1500, 1700),
                        currentDate.withDayOfMonth(15), Transaction.Type.INCOME);
            }

            // --- SPESE FISSE MENSILI ---
            // Affitto (il 1° del mese)
            addTx(transactions, wallet, tags, "Affitto", "Affitto appartamento", 650.0,
                    currentDate.withDayOfMonth(1), Transaction.Type.EXPENSE);

            // Internet
            addTx(transactions, wallet, tags, "Internet", "Fibra Ottica", 29.90,
                    currentDate.withDayOfMonth(10), Transaction.Type.EXPENSE);

            // Abbonamenti
            addTx(transactions, wallet, tags, "Netflix", "Netflix Standard", 12.99,
                    currentDate.withDayOfMonth(15), Transaction.Type.EXPENSE);
            addTx(transactions, wallet, tags, "Spotify", "Spotify Premium", 10.99,
                    currentDate.withDayOfMonth(20), Transaction.Type.EXPENSE);

            // Bollette (Bi-mestrali)
            if (month % 2 == 0) {
                addTx(transactions, wallet, tags, "Luce", "Bolletta Enel", getRandomAmount(80, 150),
                        currentDate.withDayOfMonth(random.nextInt(15) + 1), Transaction.Type.EXPENSE);
                addTx(transactions, wallet, tags, "Gas", "Bolletta Gas", getRandomAmount(70, 200),
                        currentDate.withDayOfMonth(random.nextInt(15) + 10), Transaction.Type.EXPENSE);
            }

            // --- SPESE ANNUALI ---
            if (month == 5) {
                addTx(transactions, wallet, tags, "Assicurazione", "Rinnovo RCA", 450.0,
                        currentDate.withDayOfMonth(5), Transaction.Type.EXPENSE);
            }
            if (month == 9) {
                addTx(transactions, wallet, tags, "Bollo", "Bollo Auto", 180.0,
                        currentDate.withDayOfMonth(20), Transaction.Type.EXPENSE);
            }
            if (month == 1) {
                addTx(transactions, wallet, tags, "Amazon Prime", "Rinnovo Prime", 49.90,
                        currentDate.withDayOfMonth(11), Transaction.Type.EXPENSE);
            }

            // --- SPESE RICORRENTI E CASUALI NEL MESE ---
            // Spesa (circa 4 volte al mese)
            for (int i = 0; i < 4; i++) {
                addTx(transactions, wallet, tags, "Alimentari", "Spesa Supermercato", getRandomAmount(40, 90),
                        currentDate.withDayOfMonth(random.nextInt(daysInMonth) + 1), Transaction.Type.EXPENSE);
            }

            // Benzina (2-3 volte al mese)
            int benzinaCount = random.nextInt(2) + 2;
            for (int i = 0; i < benzinaCount; i++) {
                addTx(transactions, wallet, tags, "Benzina", "Rifornimento", getRandomAmount(40, 60),
                        currentDate.withDayOfMonth(random.nextInt(daysInMonth) + 1), Transaction.Type.EXPENSE);
            }

            // Svago occasionale
            if (random.nextBoolean()) {
                addTx(transactions, wallet, tags, "Pizza", "Pizzeria con amici", getRandomAmount(15, 25),
                        currentDate.withDayOfMonth(random.nextInt(daysInMonth) + 1), Transaction.Type.EXPENSE);
            }
            if (random.nextInt(3) == 0) { // 33% di probabilità al mese
                addTx(transactions, wallet, tags, "Sushi", "All you can eat", getRandomAmount(30, 60),
                        currentDate.withDayOfMonth(random.nextInt(daysInMonth) + 1), Transaction.Type.EXPENSE);
            }

            // Passa al mese successivo
            currentDate = currentDate.plusMonths(1);
        }

        // Salvataggio massivo per ottimizzare le performance
        transactionRepository.saveAll(transactions);
    }

    private void addTx(List<Transaction> txList, Wallet wallet, List<Tag> tags, String tagName,
                       String title, double amount, LocalDate date, Transaction.Type type) {

        Tag selectedTag = tags.stream()
                .filter(t -> t.getName().equalsIgnoreCase(tagName))
                .findFirst()
                .orElse(null);

        BigDecimal bdAmount = BigDecimal.valueOf(amount);

        Transaction tx = Transaction.builder()
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