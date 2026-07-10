package dev.busato.FinanceWebApp.backend.persistence;

import com.github.f4b6a3.uuid.UuidCreator;
import java.util.EnumSet;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.generator.BeforeExecutionGenerator;
import org.hibernate.generator.EventType;
import org.hibernate.generator.EventTypeSets;

/**
 * Id generator for {@link AssignableUuidV7}: keeps a client-assigned {@code UUID} when the entity's
 * id is already set (e.g. an offline-created entity replayed to the server), and otherwise
 * generates a UUIDv7 (same mechanism as {@link UuidV7Generator}). This allows client-generated ids
 * to survive the round trip for idempotent offline replay.
 */
public class AssignableUuidV7Generator implements BeforeExecutionGenerator {

  @Override
  public Object generate(
      SharedSessionContractImplementor session,
      Object owner,
      Object currentValue,
      EventType eventType) {
    return currentValue != null ? currentValue : UuidCreator.getTimeOrderedEpoch();
  }

  @Override
  public EnumSet<EventType> getEventTypes() {
    return EventTypeSets.INSERT_ONLY;
  }

  @Override
  public boolean allowAssignedIdentifiers() {
    return true;
  }
}
