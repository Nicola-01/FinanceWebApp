package dev.busato.FinanceWebApp.backend.openbanking;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** {@code privateKeyPath} must point to an RSA private key PEM (PKCS#8 or PKCS#1). */
@ConfigurationProperties("application.enablebanking")
public record EnableBankingProperties(String appId, String privateKeyPath, String apiUrl) {}
