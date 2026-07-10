package dev.busato.FinanceWebApp.backend.persistence;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.hibernate.annotations.IdGeneratorType;

/** UUIDv7 id generator that keeps a client-assigned id when one is already set. */
@IdGeneratorType(AssignableUuidV7Generator.class)
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.FIELD, ElementType.METHOD})
public @interface AssignableUuidV7 {}
