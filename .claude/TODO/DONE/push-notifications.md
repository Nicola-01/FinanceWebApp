# Web Push Notifications — Implementation Plan / TODO

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.
> Branch: `feat/push-notifications` — **base: `main`** (confirmed by the user). House
> rule: one branch per task, never commit to `release/*`/`main`; the user merges manually.
> **Prerequisite:** execute AFTER `.claude/TODO/offline-sync.md` (both touch `AppHeader`
> and the PWA plumbing; that plan lands first by user decision).

**Goal:** Real Web Push (VAPID) notifications — delivered with the app closed — for:
wallet invitations, transactions **created/updated/deleted** by other members in a shared
wallet, subscriptions created/updated/deleted (only while the subscription is ACTIVE),
and cron-executed recurring transactions (user-toggleable, default ON). Preferences on
three levels (device / global per-event-type / per-wallet mute) all managed from the
Settings page. **Phase 2** adds a notification-center history in the `AppHeader` with a
yellow unread dot and read-then-purge lifecycle.

**Architecture:** Backend persists a `Notification` row per recipient **and** sends the
push in one flow: domain services publish Spring events; an `@Async
@TransactionalEventListener(AFTER_COMMIT)` dispatcher resolves recipients (ACCEPTED
members minus the actor, filtered by global prefs + per-wallet mute) and hands each one to
`NotificationService` (persist + `WebPushSender`). Sending goes through a thin
`PushGateway` seam wrapping `nl.martijndwars:web-push`; dead subscriptions (404/410) are
pruned. Frontend: the service worker migrates from `generateSW` to **`injectManifest`**
(`src/sw.ts`) to gain `push`/`notificationclick` handlers; clicking a push opens the app
with `?notif=<id>` which **acks (deletes) that notification**; foreground pushes become
toasts. Preferences UI is a new **Notifications** section in `/settings`.

**Tech Stack:** Spring Boot 3.5 / Java 21, `nl.martijndwars:web-push` + BouncyCastle;
vite-plugin-pwa `injectManifest` + Workbox 7; React 19 + TS; Vitest.

## Global Constraints (apply to every task)

- **English only** — code, comments, UI copy, notification copy.
- **All endpoints under `/api/...`**.
- Backend gates: `./gradlew test` green, **add tests for your change**, then
  `./gradlew spotlessApply`; keep `./gradlew check` (Spotless + **≥90% line coverage**)
  passing. New entity PKs are **UUIDv7** (`@UuidGenerator(algorithm =
  UuidV7Generator.class)`). Schema via `ddl-auto=update` — **no migration files**. New
  NOT-NULL columns on existing tables need `columnDefinition = "... default ..."` (the
  `User.tokenVersion` pattern) or existing rows break.
- Frontend gates (from `frontend/`, CI order): `npm run lint` → `npm test` →
  `npm run build`. Tests under `src/__tests__/` mirroring the tree; relative imports only.
- **UI:** read `frontend/style.md` first; reuse `components/ui/` primitives (`Card`,
  `Toggle`, `Button`, `ResponsiveOverlay`); `app-*` tokens; no glow. The unread dot is
  **yellow/amber** (`bg-amber-400`) per user decision.
- Do **not** kill the running Vite dev server.
- New env vars (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`) must have
  **empty-string defaults** in `application.properties` so tests and keyless dev boots
  keep working (push simply disables itself).
- Commit at the end of every task (`feat(scope): ...`).

---

## Confirmed design decisions (from the interview — do not relitigate)

1. **Web Push (VAPID)** now; notification-center history is **Phase 2 of this same plan**
   (entity persisted from Phase 1 so Phase 2 is UI + 3 endpoints only).
2. Events & recipients:
   | Event | Recipients |
   |---|---|
   | Wallet invite created | the invited user |
   | Transaction created / updated / deleted | ACCEPTED members of the wallet, **minus the actor** |
   | Subscription created / updated / deleted (**only if the subscription is ACTIVE**) | same |
   | Recurring execution (cron materializes a transaction) | ALL ACCEPTED members (no actor), gated by its own pref, **default ON** |
   MCP/PAT-created mutations behave identically (actor = token owner). Non-shared
   wallets fall out naturally (no recipients after excluding the actor).
3. Copy format (exact): title `New transaction by @{username}` (and
   `Transaction updated by @{username}` / `Transaction deleted by @{username}` /
   `New subscription by @{username}` / `Subscription updated by @{username}` /
   `Subscription deleted by @{username}` / `Recurring transaction executed` /
   `Wallet invitation`); body = recap `"{tagName} · {amount} {currency} · {walletName}"`
   (invite body: `@{inviter} invited you to "{walletName}"`).
4. Preference model, all managed in `/settings` (`SettingsPage`):
   - **Device**: enable/disable push on THIS device (browser permission + subscription).
   - **Global per-user** (default ON): `invites`, `transactions`, `subscriptions`,
     `recurringExecutions`.
   - **Per-wallet**: single mute toggle (`WalletAccess.notificationsMuted`), wins over
     globals. No per-event×per-wallet matrix.
5. Phase 2 lifecycle: push click → that notification is **acked/removed**; otherwise it
   sits unread → yellow dot on the bell; **opening the center marks everything read**
   (no per-item action); when the center has been closed again for **≥ 10 s** the read
   ones are purged (reopening within 10 s still shows them).

---

## Phase 1 — Backend push infrastructure

### Task 1: dependencies, VAPID config, `PushSubscription` entity, `PushGateway`/`WebPushSender`

**Files:**
- Modify: `backend/build.gradle`
- Modify: `backend/src/main/resources/application.properties`
- Modify: root `.env` (+ `docker-compose.yml` / `docker-compose.prod.yml` backend
  `environment` blocks, mirroring how `MAIL_*` are passed)
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/model/PushSubscription.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/repository/PushSubscriptionRepository.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/push/PushGateway.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/push/WebPushGateway.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/push/WebPushSender.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/push/WebPushSenderTest.java`

**Interfaces (Produces):**
```java
public interface PushGateway {           // seam over the library, mockable
  /** @return HTTP status returned by the push service. */
  int send(String endpoint, String p256dh, String auth, String payload) throws Exception;
  boolean isConfigured();
}
// WebPushSender
public void sendToUser(UUID userId, String payloadJson); // fans out to all the user's subscriptions, prunes 404/410
```

- [x] **Step 1: build.gradle + properties + env plumbing**

```gradle
implementation 'nl.martijndwars:web-push:5.1.1'
implementation 'org.bouncycastle:bcprov-jdk18on:1.78.1'
```
`application.properties`:
```properties
# Web Push (VAPID). Empty values disable push sending entirely.
application.push.vapid.public-key=${VAPID_PUBLIC_KEY:}
application.push.vapid.private-key=${VAPID_PRIVATE_KEY:}
application.push.vapid.subject=${VAPID_SUBJECT:mailto:admin@localhost}
```
Root `.env`: add the three keys (generate once with `npx web-push generate-vapid-keys`).
Add the three vars to the backend service `environment` in both compose files, next to
the `MAIL_*` entries.

- [x] **Step 2: Entity + repository**

```java
package dev.busato.FinanceWebApp.backend.model;

import dev.busato.FinanceWebApp.backend.persistence.UuidV7Generator;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
    name = "push_subscriptions",
    uniqueConstraints = @UniqueConstraint(name = "uk_push_endpoint", columnNames = "endpoint"))
public class PushSubscription {

  @Id
  @UuidGenerator(algorithm = UuidV7Generator.class)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(nullable = false, length = 1024)
  private String endpoint;

  @Column(nullable = false, length = 512)
  private String p256dh;

  @Column(nullable = false, length = 512)
  private String auth;

  private String userAgent;

  @CreationTimestamp
  @Column(updatable = false)
  private Instant createdAt;
}
```
```java
public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, UUID> {
  List<PushSubscription> findAllByUserId(UUID userId);
  Optional<PushSubscription> findByEndpoint(String endpoint);
  void deleteByEndpointAndUserId(String endpoint, UUID userId);
  void deleteAllByUserId(UUID userId);
}
```
Also: `AccountDeletionService` must call `pushSubscriptionRepository.deleteAllByUserId`
(add it where PATs are cleaned up).

- [x] **Step 3: Failing WebPushSender tests (Mockito, matching repo style)**

```java
@ExtendWith(MockitoExtension.class)
class WebPushSenderTest {
  @Mock private PushSubscriptionRepository pushSubscriptionRepository;
  @Mock private PushGateway pushGateway;
  @InjectMocks private WebPushSender webPushSender;

  @Test
  void sendsPayloadToEverySubscriptionOfTheUser() throws Exception {
    UUID userId = UUID.randomUUID();
    when(pushGateway.isConfigured()).thenReturn(true);
    when(pushSubscriptionRepository.findAllByUserId(userId))
        .thenReturn(List.of(sub("e1"), sub("e2")));
    when(pushGateway.send(any(), any(), any(), any())).thenReturn(201);
    webPushSender.sendToUser(userId, "{\"title\":\"x\"}");
    verify(pushGateway, times(2)).send(any(), any(), any(), eq("{\"title\":\"x\"}"));
  }

  @Test
  void prunesSubscriptionOn410Gone() throws Exception {
    UUID userId = UUID.randomUUID();
    PushSubscription dead = sub("dead");
    when(pushGateway.isConfigured()).thenReturn(true);
    when(pushSubscriptionRepository.findAllByUserId(userId)).thenReturn(List.of(dead));
    when(pushGateway.send(any(), any(), any(), any())).thenReturn(410);
    webPushSender.sendToUser(userId, "{}");
    verify(pushSubscriptionRepository).delete(dead);
  }

  @Test
  void doesNothingWhenNotConfigured() {
    when(pushGateway.isConfigured()).thenReturn(false);
    webPushSender.sendToUser(UUID.randomUUID(), "{}");
    verifyNoInteractions(pushSubscriptionRepository);
  }

  @Test
  void aFailingEndpointDoesNotStopTheOthers() throws Exception {
    UUID userId = UUID.randomUUID();
    when(pushGateway.isConfigured()).thenReturn(true);
    when(pushSubscriptionRepository.findAllByUserId(userId))
        .thenReturn(List.of(sub("boom"), sub("ok")));
    when(pushGateway.send(eq("boom"), any(), any(), any())).thenThrow(new RuntimeException("x"));
    when(pushGateway.send(eq("ok"), any(), any(), any())).thenReturn(201);
    webPushSender.sendToUser(userId, "{}");
    verify(pushGateway).send(eq("ok"), any(), any(), any());
  }

  private PushSubscription sub(String endpoint) {
    return PushSubscription.builder().endpoint(endpoint).p256dh("p").auth("a").build();
  }
}
```
Run: `./gradlew test --tests "*.WebPushSenderTest"` → compile FAIL.

- [x] **Step 4: Implement gateway + sender**

`PushGateway.java` — interface exactly as in *Interfaces* above.

`WebPushGateway.java` (thin, the ONLY class touching the library — kept minimal on
purpose; its logic is exercised indirectly, the branching lives in `WebPushSender`):
```java
package dev.busato.FinanceWebApp.backend.push;

import jakarta.annotation.PostConstruct;
import java.security.Security;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class WebPushGateway implements PushGateway {

  @Value("${application.push.vapid.public-key}")
  private String publicKey;

  @Value("${application.push.vapid.private-key}")
  private String privateKey;

  @Value("${application.push.vapid.subject}")
  private String subject;

  private PushService pushService;

  @PostConstruct
  void init() throws Exception {
    if (!isConfigured()) return;
    if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
      Security.addProvider(new BouncyCastleProvider());
    }
    pushService = new PushService(publicKey, privateKey, subject);
  }

  @Override
  public boolean isConfigured() {
    return publicKey != null && !publicKey.isBlank()
        && privateKey != null && !privateKey.isBlank();
  }

  @Override
  public int send(String endpoint, String p256dh, String auth, String payload)
      throws Exception {
    Notification notification = new Notification(endpoint, p256dh, auth, payload);
    return pushService.send(notification).getStatusLine().getStatusCode();
  }

  public String getPublicKey() {
    return publicKey;
  }
}
```

`WebPushSender.java`:
```java
package dev.busato.FinanceWebApp.backend.push;

import dev.busato.FinanceWebApp.backend.model.PushSubscription;
import dev.busato.FinanceWebApp.backend.repository.PushSubscriptionRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebPushSender {

  private final PushSubscriptionRepository pushSubscriptionRepository;
  private final PushGateway pushGateway;

  @Transactional
  public void sendToUser(UUID userId, String payloadJson) {
    if (!pushGateway.isConfigured()) return;
    for (PushSubscription sub : pushSubscriptionRepository.findAllByUserId(userId)) {
      try {
        int status = pushGateway.send(sub.getEndpoint(), sub.getP256dh(), sub.getAuth(), payloadJson);
        if (status == 404 || status == 410) {
          // Push service says this subscription is dead — prune it.
          pushSubscriptionRepository.delete(sub);
        }
      } catch (Exception e) {
        log.warn("Push send failed for endpoint {}: {}", sub.getEndpoint(), e.getMessage());
      }
    }
  }
}
```

- [x] **Step 5: Run, format, commit**

```bash
./gradlew spotlessApply test
git add backend .env docker-compose.yml docker-compose.prod.yml
git commit -m "feat(backend): web-push gateway, sender and push subscriptions"
```

---

### Task 2: `Notification` entity, copy builder, `NotificationService`, ack endpoint

**Files:**
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/model/Notification.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/repository/NotificationRepository.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/NotificationService.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/push/NotificationCopy.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/NotificationController.java`
- Test: `.../service/NotificationServiceTest.java`, `.../push/NotificationCopyTest.java`

**Interfaces (Produces):**
```java
// model
public class Notification { UUID id; User user /*recipient*/; NotificationType type;
  UUID walletId /*nullable*/; String title; String body; String url;
  Instant createdAt; Instant readAt /*nullable*/; }
public enum NotificationType { WALLET_INVITE, TRANSACTION_CREATED, TRANSACTION_UPDATED,
  TRANSACTION_DELETED, SUBSCRIPTION_CREATED, SUBSCRIPTION_UPDATED, SUBSCRIPTION_DELETED,
  RECURRING_EXECUTED }   // nested in Notification, EnumType.STRING

// NotificationCopy — pure static builders returning record Copy(String title, String body, String url)
public static Copy transactionActivity(NotificationType type, String actorUsername,
    String tagName, BigDecimal amount, String currency, String walletName, UUID walletId);
public static Copy subscriptionActivity(NotificationType type, String actorUsername,
    String tagName, BigDecimal amount, String currency, String walletName, UUID walletId);
public static Copy recurringExecuted(String txName, BigDecimal amount, String currency,
    String walletName, UUID walletId);
public static Copy walletInvite(String inviterUsername, String walletName);

// NotificationService
@Transactional public void notifyUser(User recipient, NotificationType type,
    UUID walletId, NotificationCopy.Copy copy);   // persists row + sends push
@Transactional public void ack(UUID notificationId, UUID userId); // delete if owned; idempotent
```
Push payload JSON (built with the existing Jackson `ObjectMapper` bean, injected):
`{"title": ..., "body": ..., "url": ..., "notificationId": "<uuid>"}`.
URLs: transactions/subscriptions → `/dashboard/{walletId}?tab=transactions` /
`?tab=subscriptions`; recurring → `?tab=subscriptions`; invite → `/dashboard`.

- [x] **Step 1: Failing tests**

`NotificationCopyTest` (pure, exhaustive — pins the exact user-approved copy):
```java
@Test
void newTransactionCopy() {
  var copy = NotificationCopy.transactionActivity(
      Notification.NotificationType.TRANSACTION_CREATED,
      "nicola", "Food", new BigDecimal("12.50"), "EUR", "Casa", walletId);
  assertEquals("New transaction by @nicola", copy.title());
  assertEquals("Food · 12.50 EUR · Casa", copy.body());
  assertEquals("/dashboard/" + walletId + "?tab=transactions", copy.url());
}
// + updated/deleted titles ("Transaction updated by @nicola", "Transaction deleted by @nicola"),
// + subscription variants ("New subscription by @...", "Subscription updated/deleted by @..."),
// + recurring: title "Recurring transaction executed", body "Netflix · 9.99 EUR · Casa",
// + invite: title "Wallet invitation", body "@nicola invited you to \"Casa\"", url "/dashboard",
// + null tag name renders as "Untagged" in the body.
```
`NotificationServiceTest` (Mockito): `notifyUser` saves a `Notification` with the copy
fields and calls `webPushSender.sendToUser(recipient.getId(), <json containing the
persisted id>)` (capture the payload, assert it contains `"notificationId"`);
`ack` deletes only when the row belongs to the user (verify `deleteByIdAndUserId`), and
is silent when nothing matches.
Run → compile FAIL.

- [x] **Step 2: Implement**

Entity (same Lombok/JPA style as `PushSubscription`; `body` is
`@Column(columnDefinition = "TEXT")`; `type` is `@Enumerated(EnumType.STRING)
@Column(nullable = false)`). Repository:
```java
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
  List<Notification> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
  long countByUserIdAndReadAtIsNull(UUID userId);
  void deleteByIdAndUserId(UUID id, UUID userId);
  @Modifying
  @Query("update Notification n set n.readAt = :now where n.user.id = :userId and n.readAt is null")
  int markAllRead(UUID userId, Instant now);
  void deleteAllByUserIdAndReadAtIsNotNull(UUID userId);
  void deleteAllByUserId(UUID userId);
  void deleteAllByCreatedAtBefore(Instant cutoff);
}
```
(`AccountDeletionService` also calls `deleteAllByUserId`.)

`NotificationController` (Phase-1 surface only):
```java
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
  private final NotificationService notificationService;

  @PostMapping("/{id}/ack")
  public ResponseEntity<Void> ack(@PathVariable UUID id, @AuthenticationPrincipal User user) {
    notificationService.ack(id, user.getId());
    return ResponseEntity.noContent().build();
  }
}
```

- [x] **Step 3: Run, format, commit**

```bash
./gradlew spotlessApply test
git add backend/src
git commit -m "feat(backend): notification entity, copy builder, service and ack endpoint"
```

---

### Task 3: preference storage + endpoints (global, per-wallet, device)

**Files:**
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/model/User.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/model/WalletAccess.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/repository/WalletAccessRepository.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/NotificationPreferencesResponse.java`,
  `.../dto/NotificationPreferencesRequest.java`, `.../dto/WalletMuteRequest.java`,
  `.../dto/PushSubscriptionRequest.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/NotificationPreferenceService.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/PushController.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/NotificationPreferencesController.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/WalletController.java` (mute mapping)
- Test: `.../service/NotificationPreferenceServiceTest.java`, `.../controller` covered via
  service tests (controllers are thin, repo convention).

**Interfaces (Produces):**
```java
// User — four new columns (Lombok @Builder.Default + backfill defaults):
@Column(nullable = false, columnDefinition = "boolean default true") @Builder.Default
private boolean notifyInvites = true;
@Column(nullable = false, columnDefinition = "boolean default true") @Builder.Default
private boolean notifyTransactions = true;
@Column(nullable = false, columnDefinition = "boolean default true") @Builder.Default
private boolean notifySubscriptions = true;
@Column(nullable = false, columnDefinition = "boolean default true") @Builder.Default
private boolean notifyRecurringExecutions = true;

// WalletAccess — one new column:
@Column(nullable = false, columnDefinition = "boolean default false")
private boolean notificationsMuted = false;

// WalletAccessRepository — new derived query (the dispatcher's recipient source):
List<WalletAccess> findAllByWalletIdAndStatus(UUID walletId, WalletAccess.InvitationStatus status);

// Endpoints
GET  /api/users/me/notification-preferences
     → {invites, transactions, subscriptions, recurringExecutions,
        walletMutes: [{walletId, walletName, muted}]}   // one entry per ACCEPTED access
PUT  /api/users/me/notification-preferences   {invites, transactions, subscriptions, recurringExecutions}
PUT  /api/wallets/{walletId}/notification-mute  {muted}   // caller's own WalletAccess; requires ACCEPTED membership
GET  /api/push/public-key                     → {"publicKey": "<b64 or empty>"}
POST /api/push/subscriptions                  {endpoint, p256dh, auth, userAgent}  // upsert by endpoint (endpoint may move to a new user)
DELETE /api/push/subscriptions                body {endpoint}  // only the caller's row
```
Preference endpoints live on a small `NotificationPreferenceService` (+ the existing
`UserController` pattern of `/users/me/...` — put the two prefs mappings in
`PushController`? NO — keep REST cohesion: prefs mappings go in a new
`NotificationPreferencesController` under `/api/users/me/notification-preferences`, the
wallet-mute mapping in `WalletController`, push endpoints in `PushController`).

- [x] **Step 1: Failing service tests** — cover: `getPreferences` maps the four booleans
  and builds `walletMutes` from `findAllByUserIdAndStatus(userId, ACCEPTED)` (walletName
  from `access.getWallet().getName()`); `updatePreferences` persists all four;
  `setWalletMute` flips `notificationsMuted` on the caller's access row and throws
  `WalletNotFoundException` when no ACCEPTED access exists; push subscribe upserts by
  endpoint (existing endpoint re-registered by ANOTHER user → row is re-assigned to the
  new user with fresh keys); unsubscribe deletes only the caller's row.
  Run → compile FAIL.

- [x] **Step 2: Implement** entities/repo/DTOs/service/controllers per the interfaces.
  `PushController.getPublicKey()` returns `webPushGateway.getPublicKey()` (empty string
  when unconfigured — the frontend reads that as "server has push disabled").

- [x] **Step 3: Run, format, commit**

```bash
./gradlew spotlessApply test
git add backend/src
git commit -m "feat(backend): notification preferences (global + per-wallet mute) and push subscription endpoints"
```

---

### Task 4: async event dispatcher

**Files:**
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/config/AsyncConfig.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/push/WalletActivityEvent.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/push/WalletInviteEvent.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/push/NotificationDispatcher.java`
- Test: `.../push/NotificationDispatcherTest.java`

**Interfaces (Produces):**
```java
@Configuration @EnableAsync
public class AsyncConfig {}   // NOTE: this also activates the pre-existing @Async on
                              // PatService.updateLastUsedAsync — intended, harmless.

/** Published by domain services AFTER their JPA writes, consumed after commit. */
public record WalletActivityEvent(
    Notification.NotificationType type,
    UUID walletId, String walletName, String currency,
    UUID actorId, String actorUsername,
    String tagName,          // nullable → copy renders "Untagged"
    BigDecimal amount,
    String entityName) {}    // subscription/tx name; used by RECURRING_EXECUTED copy

public record WalletInviteEvent(
    UUID invitedUserId, String inviterUsername, UUID walletId, String walletName) {}

@Component
public class NotificationDispatcher {
  @Async
  @Transactional(propagation = Propagation.REQUIRES_NEW) // own tx: lazy-load members + write rows
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  public void onWalletActivity(WalletActivityEvent event) { ... }

  @Async
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  public void onWalletInvite(WalletInviteEvent event) { ... }
}
```
Dispatch rules (`onWalletActivity`):
1. `members = walletAccessRepository.findAllByWalletIdAndStatus(walletId, ACCEPTED)`.
2. Skip the actor (`access.getId().getUserId().equals(event.actorId())` — actorId may be
   null for cron events → skip nobody).
3. Skip `access.isNotificationsMuted()`.
4. Skip by global pref: `TRANSACTION_*` → `notifyTransactions`; `SUBSCRIPTION_*` →
   `notifySubscriptions`; `RECURRING_EXECUTED` → `notifyRecurringExecutions`.
5. Build copy via `NotificationCopy` (transaction/subscription/recurring variant by type)
   and call `notificationService.notifyUser(access.getUser(), type, walletId, copy)`.

`onWalletInvite`: load the invited user (`userRepository.findById`), check
`notifyInvites`, build `NotificationCopy.walletInvite(...)`, notify. No mute check (the
access row was just created as PENDING).

- [x] **Step 1: Failing dispatcher tests** (Mockito; call the listener methods directly —
  the async/after-commit plumbing is annotation config, not logic):
  - notifies every ACCEPTED member except the actor;
  - respects `notificationsMuted`;
  - respects each of the three global toggles (one test per event family);
  - cron event (`actorId == null`) notifies ALL accepted members;
  - invite event respects `notifyInvites` and targets only the invitee.
  Run → compile FAIL.

- [x] **Step 2: Implement** config, records, dispatcher.

- [x] **Step 3: Run, format, commit**

```bash
./gradlew spotlessApply test
git add backend/src
git commit -m "feat(backend): async after-commit notification dispatcher"
```

---

### Task 5: publish events from the domain services

**Files:**
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/TransactionService.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/SubscriptionService.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/MemberService.java`
- Test: extend `TransactionServiceTest`, `SubscriptionServiceTest`, `MemberServiceTest`.

**Interfaces:**
- Consumes: `WalletActivityEvent`, `WalletInviteEvent` (Task 4). Each service gains
  `private final ApplicationEventPublisher eventPublisher;` (constructor-injected via
  Lombok `@RequiredArgsConstructor` — Mockito `@Mock` slots in automatically).

Publishing points (publish INSIDE the `@Transactional` method, after the JPA write — the
listener only fires if the tx commits):
1. `TransactionService.createTransaction` / `updateTransaction` / `deleteTransaction` →
   `TRANSACTION_CREATED/UPDATED/DELETED`. Actor username: the services already load or
   can load the acting user via the injected `userRepository`
   (`userRepository.findById(userId)`) — reuse the entity already fetched where present.
   `tagName = tx.getTag() != null ? tx.getTag().getName() : null`; amount/currency from
   the entity + `wallet.getCurrency()`; walletName from the loaded wallet.
   **Skip publishing on the bulk import path** (`createTransactionsBulk` loop): one
   import would flood members — publish nothing for bulk (documented behavior).
2. `SubscriptionService.createSubscription` / `updateSubscription` / `deleteSubscription`
   → `SUBSCRIPTION_CREATED/UPDATED/DELETED`, **only when the subscription involved is
   ACTIVE** (`sub.getStatus() == Subscription.Status.ACTIVE`; for delete: the status it
   had when deleted). Same bulk exclusion.
3. `SubscriptionService.executeSubscription` (cron, private): after saving the generated
   transaction publish `RECURRING_EXECUTED` with `actorId = null`,
   `entityName = transaction.getName()`. NOTE: `processDueSubscriptions` is
   `@Transactional`; the events fire after that whole batch commits — acceptable.
4. `MemberService.inviteMember`: only when a real `WalletAccess` row is persisted (NOT
   for the synthetic no-account response) publish
   `WalletInviteEvent(invitedUser.getId(), inviter.getUsername(), walletId, wallet.getName())`
   (the inviter's username: load via `userRepository.findById(userId)` — the method
   already resolves wallet + invited user).

- [x] **Step 1: Failing tests** — per service, `ArgumentCaptor<Object>` on
  `eventPublisher.publishEvent(...)`:
  - create/update/delete transaction publishes the right type with actor + wallet fields;
  - bulk import publishes nothing;
  - PAUSED subscription create publishes nothing; ACTIVE one does;
  - `processDueSubscriptions` with one due ACTIVE subscription publishes
    `RECURRING_EXECUTED` with null actor;
  - `inviteMember` publishes `WalletInviteEvent` for a real invite and nothing for the
    synthetic (unknown-user) case.
  Run → FAIL.

- [x] **Step 2: Implement the publish calls.** Keep each to 3-5 lines; extract a private
  helper per service (`publishActivity(type, wallet, actor, tag, amount, name)`) to stay
  DRY.

- [x] **Step 3: Full suite + coverage, format, commit**

```bash
./gradlew spotlessApply check
git add backend/src
git commit -m "feat(backend): publish wallet activity and invite events for notifications"
```

---

## Phase 1 — Frontend

### Task 6: service-worker migration `generateSW` → `injectManifest` (`src/sw.ts`)

**Files:**
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/package.json` (workbox deps)
- Create: `frontend/src/sw.ts`
- Create: `frontend/src/push/swPayload.ts` (pure helpers shared/testable)
- Test: `frontend/src/__tests__/push/swPayload.test.ts`

**Interfaces (Produces):**
```ts
// swPayload.ts
export interface PushPayload { title: string; body: string; url: string; notificationId: string; }
export function notificationTargetUrl(p: Pick<PushPayload, "url" | "notificationId">): string;
// "/dashboard/w1?tab=transactions" → "/dashboard/w1?tab=transactions&notif=<id>"
// "/dashboard"                     → "/dashboard?notif=<id>"
```

- [x] **Step 1: deps + failing helper test**

```bash
cd frontend && npm install -D workbox-precaching workbox-routing workbox-strategies workbox-expiration workbox-cacheable-response
```
Test `notificationTargetUrl` for both query cases + missing url fallback to
`/dashboard`. Run: `npm test -- swPayload` → FAIL. Implement the tiny module → PASS.

- [x] **Step 2: vite.config.ts — switch strategies**

Replace the `VitePWA({...})` options: keep `registerType: "prompt"`, `includeAssets`,
`manifest` **unchanged**; DELETE the whole `workbox: {...}` block; ADD:
```ts
strategies: "injectManifest",
srcDir: "src",
filename: "sw.ts",
injectManifest: {
  // config.js is generated at runtime by the container — never precache it.
  globIgnores: ["config.js", "**/config.js"],
},
```

- [x] **Step 3: write `src/sw.ts`** (replicates the two runtime-cache behaviors the old
  generateSW config had, adds push):

```ts
/// <reference lib="WebWorker" />
// Custom service worker (injectManifest). Replaces the generated one to add
// Web Push handling; precache + runtime caching replicate the old generateSW config.
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { notificationTargetUrl, type PushPayload } from "./push/swPayload";

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// vite-plugin-pwa "prompt" flow: the page asks us to activate the new version.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

// Runtime config (/config.js): network-first-ish with cache fallback for offline.
registerRoute(
  ({ url }) => url.pathname === "/config.js",
  new StaleWhileRevalidate({ cacheName: "runtime-config" }),
);
const fontsPlugins = () => [
  new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
  new CacheableResponsePlugin({ statuses: [0, 200] }),
];
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({ cacheName: "google-fonts-cache", plugins: fontsPlugins() }),
);
registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({ cacheName: "gstatic-fonts-cache", plugins: fontsPlugins() }),
);

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const payload = event.data.json() as PushPayload;
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const visible = clients.filter((c) => c.visibilityState === "visible");
      if (visible.length > 0) {
        // App in foreground: hand over to the page (in-app toast) instead of a system notification.
        visible.forEach((c) => c.postMessage({ type: "PUSH_RECEIVED", payload }));
        return;
      }
      await self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: "/pwa-192x192.png",
        badge: "/pwa-64x64.png",
        tag: payload.notificationId,
        data: payload,
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const payload = (event.notification.data ?? {}) as PushPayload;
  const target = notificationTargetUrl(payload);
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = clients[0];
      if (existing) {
        await existing.focus();
        existing.postMessage({ type: "OPEN_NOTIFICATION", url: target });
        return;
      }
      await self.clients.openWindow(target);
    })(),
  );
});
```

- [x] **Step 4: verify the build + SW output**

Run: `npm run build`
Expected: build green; `dist/sw.js` exists and contains `notificationclick`;
`dist/sw.js` does NOT precache `config.js` (grep). `PWAPrompt`'s
`useRegisterSW` needs no change (virtual module works for both strategies). If `tsc`
complains about SW types, the `/// <reference lib="WebWorker" />` line plus the
`declare let self` cast are the sanctioned fix — do not add `WebWorker` to the global
tsconfig `lib`.

- [x] **Step 5: Commit**

```bash
git add frontend
git commit -m "feat(frontend): custom injectManifest service worker with push handlers"
```

---

### Task 7: push client + app-side bootstrap (foreground toast, click-ack)

**Files:**
- Create: `frontend/src/push/pushClient.ts`
- Create: `frontend/src/push/usePushMessages.ts`
- Modify: `frontend/src/App.tsx`
- Test: `frontend/src/__tests__/push/pushClient.test.ts`,
  `frontend/src/__tests__/push/usePushMessages.test.tsx`

**Interfaces (Produces):**
```ts
// pushClient.ts
export function isPushSupported(): boolean;   // 'serviceWorker' in navigator && 'PushManager' in window
export type PushEnrollment = "subscribed" | "unsupported" | "denied" | "disabled-server" | "unsubscribed";
export async function getEnrollment(): Promise<PushEnrollment>;
export async function subscribeThisDevice(): Promise<PushEnrollment>;
// requests permission → GET /push/public-key (empty ⇒ "disabled-server") →
// registration.pushManager.subscribe({userVisibleOnly:true, applicationServerKey}) →
// POST /push/subscriptions {endpoint, p256dh, auth, userAgent}
export async function unsubscribeThisDevice(): Promise<void>;
// pushManager unsubscribe + DELETE /push/subscriptions {data:{endpoint}}
export function urlBase64ToUint8Array(base64: string): Uint8Array;    // exported for tests
export function keyToBase64(key: ArrayBuffer | null): string;          // exported for tests

// usePushMessages.ts — mounted once in App
export function usePushMessages(): void;
// navigator.serviceWorker 'message' listener:
//  PUSH_RECEIVED  → triggerToast(`${payload.title} — ${payload.body}`, true)
//  OPEN_NOTIFICATION → navigate(url)   (react-router useNavigate)
// plus on mount: if location.search has notif=<id> → api.post(`/notifications/${id}/ack`)
//  → strip the param via history.replaceState (ack is fire-and-forget, errors ignored)
```

- [x] **Step 1: Failing tests** — `urlBase64ToUint8Array` round-trips a known vector;
  `keyToBase64` encodes an ArrayBuffer; `subscribeThisDevice` returns
  `"disabled-server"` when the public key is empty (mock api) and posts the subscription
  JSON on success (mock `navigator.serviceWorker.ready` + `pushManager.subscribe` with
  `vi.stubGlobal`); `usePushMessages` acks `?notif=` on mount and toasts on a simulated
  `PUSH_RECEIVED` message event.

- [x] **Step 2: Implement; mount in `App.tsx`** — add a tiny inner component (needs
  Router context for `useNavigate`):
```tsx
const PushMessagesBridge: React.FC = () => {
  usePushMessages();
  return null;
};
// rendered next to <PWAPrompt /> inside the provider tree
```

- [x] **Step 3: Full gate** — `npm run lint && npm test && npm run build` → green.

- [x] **Step 4: Commit**

```bash
git add frontend/src
git commit -m "feat(frontend): push client, foreground toast bridge and click-ack"
```

---

### Task 8: Settings → Notifications section

**Files:**
- Modify: `frontend/src/settings/sections.ts`
- Modify: `frontend/src/settings/SettingsPage.tsx` (import + render branch)
- Create: `frontend/src/settings/sections/NotificationsSection.tsx`
- Test: `frontend/src/__tests__/settings/sections/NotificationsSection.test.tsx`

**Interfaces:**
- Consumes: `pushClient` (Task 7), `GET/PUT /users/me/notification-preferences`,
  `PUT /wallets/{id}/notification-mute` (Task 3), `Card`/`Toggle`/`Button` primitives,
  `triggerToast`.

- [x] **Step 1: sections.ts entry** (before `about`):
```ts
{ id: "notifications", label: "Notifications", icon: faBell,
  description: "Push notifications and activity alerts" },
```
(`faBell` from `@fortawesome/free-solid-svg-icons`.) SettingsPage:
`{s.id === "notifications" && <NotificationsSection />}`.

- [x] **Step 2: Failing component test** — mock `api` and `pushClient`; assert: renders
  the three cards; device toggle calls `subscribeThisDevice`/`unsubscribeThisDevice`;
  a global toggle PUTs the four booleans; a wallet-mute toggle PUTs
  `/wallets/w1/notification-mute` with `{muted:true}`; `"unsupported"` enrollment
  renders the fallback copy instead of the toggle.

- [x] **Step 3: Implement `NotificationsSection`** — three `<Card>`s:
  1. **This device** — status line + `Toggle` (`Enable push notifications on this
     device`). States: `unsupported` → muted copy `Push is not supported in this
     browser.`; `denied` → `Notifications are blocked — allow them in your browser
     settings.`; `disabled-server` → `Push is not configured on this server.`
     (toggle disabled). iOS note (static, muted, small): `On iPhone/iPad, install the
     app to your Home Screen first (iOS 16.4+).`
  2. **What you get notified about** — four `Toggle` rows, optimistic update + PUT,
     revert on error with toast: `Wallet invitations`, `Transactions in shared wallets`,
     `Subscriptions in shared wallets`, `Recurring executions`.
  3. **Per-wallet** — one row per `walletMutes` entry: wallet name + `Toggle` labeled
     `Mute this wallet` (checked = muted). Empty state: `You have no shared wallets yet.`
  All copy English; wallet accent NOT used here (global settings page → brand tokens).

- [x] **Step 4: Full gate + commit**

```bash
npm run lint && npm test && npm run build
git add frontend/src
git commit -m "feat(frontend): notification settings section (device, global, per-wallet mute)"
```

---

### Task 9: Phase-1 end-to-end verification (manual, documented)

- [ ] With VAPID keys in `.env`, run the stack (`docker-compose up -d` or bootRun + dev
  server), **build+preview the frontend** (`npm run build && npm run preview`) because
  the SW is not active in the Vite dev server; subscribe the device in Settings; from a
  second user (or MCP/PAT call) create a transaction in a shared wallet → system
  notification arrives with the exact copy `New transaction by @user / Tag · 12.50 EUR ·
  Wallet`; click → app opens on the wallet, the `?notif=` ack fires (row deleted — check
  DB or the Phase-2 center later); with the app focused the same event arrives as a
  toast instead. Toggle each preference + wallet mute and verify suppression. Record
  any deviation as a fix-task before Phase 2.

> **Verification status (auto-checks done; interactive push pending user):** the
> automatable parts pass — `./gradlew check` green (copy pinned byte-for-byte, actor never
> self-notified, PAUSED/bulk silent, cron notifies all members respecting toggles, keyless
> boot loads the full Spring context in the @SpringBootTest suite with push disabled) and
> `npm run lint && npm test && npm run build` green with `dist/sw.js` containing
> `notificationclick` and NOT precaching `config.js`. The **interactive closed-app flow**
> (real VAPID keys → subscribe device → send from a 2nd user → receive system notification
> → click opens the wallet + acks → foreground toast) must be run by hand in a browser; it
> cannot be exercised headlessly here.

---

## Phase 2 — Notification center (history)

### Task 10: backend — list / mark-read / purge-read + retention job

**Files:**
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/NotificationController.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/NotificationService.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/NotificationResponse.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/CronJob/NotificationCleanupCronJob.java`
- Test: extend `NotificationServiceTest` + `.../CronJob/NotificationCleanupCronJobTest.java`

**Interfaces (Produces):**
```java
// DTO
public class NotificationResponse { UUID id; String type; UUID walletId; String title;
  String body; String url; Instant createdAt; boolean read; }

// endpoints (all on /api/notifications)
GET    /api/notifications            → List<NotificationResponse> (caller's, newest first)
GET    /api/notifications/unread-count → {"count": <long>}
POST   /api/notifications/mark-read  → 204; sets readAt=now on all unread of the caller
DELETE /api/notifications/read       → 204; deletes the caller's read notifications

// service additions
public List<NotificationResponse> list(UUID userId);
public long unreadCount(UUID userId);
@Transactional public void markAllRead(UUID userId);
@Transactional public void purgeRead(UUID userId);
```
`NotificationCleanupCronJob` (`ManagedJob`): `key() = "notification-cleanup"`,
`displayName() = "Notification Cleanup"`, defaults `DAILY 03:30`, `run()` deletes
notifications older than 30 days (`deleteAllByCreatedAtBefore(now - 30d)`) and returns
a short summary string — keeps never-opened histories bounded.

- [x] **Step 1: Failing tests** — list maps fields + `read` flag; `markAllRead` calls the
  modifying query; `purgeRead` deletes read-only; cron job wiring test (defaults + run
  delegates and returns a message) mirroring an existing `CronJob` test.
- [x] **Step 2: Implement.**
- [x] **Step 3: `./gradlew spotlessApply check` → green; commit**

```bash
git add backend/src
git commit -m "feat(backend): notification center endpoints and cleanup job"
```

---

### Task 11: frontend — bell + yellow dot + center overlay with read/purge lifecycle

**Files:**
- Create: `frontend/src/header/notifications/useNotifications.ts`
- Create: `frontend/src/header/notifications/NotificationBell.tsx`
- Create: `frontend/src/header/notifications/NotificationCenterOverlay.tsx`
- Modify: `frontend/src/header/AppHeader.tsx`
- Test: `frontend/src/__tests__/header/notifications/useNotifications.test.tsx`,
  `.../header/notifications/NotificationCenterOverlay.test.tsx`

**Interfaces (Produces):**
```ts
export interface AppNotification { id: string; type: string; walletId?: string;
  title: string; body: string; url: string; createdAt: string; read: boolean; }
export const PURGE_DELAY_MS = 10_000;
export function useNotifications(): {
  notifications: AppNotification[];
  unreadCount: number;          // derived
  open: boolean;
  openCenter: () => void;       // opens + POST /notifications/mark-read (optimistic read=true)
  closeCenter: () => void;      // closes + starts the 10 s purge timer
  refresh: () => Promise<void>; // GET /notifications
};
```
Lifecycle (user-approved semantics — pin ALL of these in tests with fake timers):
1. Fetch on mount and on every `PUSH_RECEIVED` SW message (listener inside the hook).
2. `openCenter()`: cancel any running purge timer, show overlay, mark-read (optimistic:
   all local items `read: true`; fire-and-forget POST).
3. `closeCenter()`: hide overlay, `setTimeout(PURGE_DELAY_MS)` → `DELETE
   /notifications/read` + drop read items locally.
4. Re-opening within 10 s cancels the timer — the read items are still visible.
5. A push click-ack already deleted its row server-side; the next refresh simply won't
   include it.

UI:
- **`NotificationBell`** in `AppHeader`, next to `SyncStatusBadge` (left of the user
  menu): ghost icon button with lucide `Bell` (size 18); when `unreadCount > 0` a small
  **amber dot** `absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-400`
  (no count number, no glow). `aria-label="Notifications"`.
- **`NotificationCenterOverlay`**: `ResponsiveOverlay title="Notifications"` (width 420).
  Rows: title (semibold, `text-app-text`), body (`text-sm text-app-muted`), relative
  time (`date-fns formatDistanceToNow`), unread rows get a leading amber dot; row click
  → `navigate(notification.url)` + close. Empty state: `You're all caught up.`
  No per-item buttons (user decision — reading IS opening the center).

- [x] **Step 1: Failing tests** (vi.useFakeTimers): open marks read + cancels purge;
  close → advance 10 s → DELETE called + read items dropped; reopen at 9.9 s → no DELETE;
  bell dot rendered only with unread items; row click navigates.
- [x] **Step 2: Implement hook + components; mount `<NotificationBell />` in AppHeader.**
- [x] **Step 3: Full gate** — `npm run lint && npm test && npm run build` → green.
- [x] **Step 4: Commit**

```bash
git add frontend/src
git commit -m "feat(frontend): notification center with unread dot and read-then-purge lifecycle"
```

---

### Task 12: docs

- [x] Update root `CLAUDE.md`: add Web Push to the backend architecture bullets (VAPID
  env vars, `push/` package, dispatcher) and the SW note in the frontend section
  (`injectManifest`, `src/sw.ts`). Update the MCP section only if tool behavior changed
  (it did not). Commit `docs: document web push notifications`.

---

## Self-review checklist (run after implementation)

- [x] Notification copy matches the approved format byte-for-byte (see Task 2 tests).
- [x] Actor never notifies themselves; PAUSED-subscription events are silent; bulk
      import is silent; cron events reach all members and respect their toggle.
- [x] Keyless boot (empty VAPID vars): backend starts, tests green, Settings shows
      "not configured on this server", nothing crashes.
- [x] SW still precaches the app shell, still never caches `config.js`, update-prompt
      (PWAPrompt) still works after the injectManifest migration.
- [ ] Push click on closed app opens the right wallet tab and the notification is gone
      from the center; center read/10-s-purge behaves per spec.
- [x] `./gradlew check` and frontend lint/test/build green.
