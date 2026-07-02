package dev.busato.FinanceWebApp.backend.persistence;

import com.github.f4b6a3.uuid.UuidCreator;
import java.util.UUID;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.id.uuid.UuidValueGenerator;

/**
 * Generates RFC 9562 UUID version 7 (time-ordered, Unix epoch millisecond prefix) for entity
 * primary keys. Time-ordered keys keep B-tree index inserts sequential, avoiding the page-split
 * fragmentation caused by fully random UUIDv4 keys. Wired via {@code @UuidGenerator(algorithm =
 * UuidV7Generator.class)} on {@code @Id} fields.
 */
public class UuidV7Generator implements UuidValueGenerator {

  @Override
  public UUID generateUuid(SharedSessionContractImplementor session) {
    return UuidCreator.getTimeOrderedEpoch();
  }
}
