package dev.busato.FinanceWebApp.backend.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Caffeine cache configuration for high-performance PAT token validation.
 * <p>
 * Cache spec:
 * - Max 50 entries (prevents unbounded memory growth)
 * - Expire after write: 10 minutes (auto-refresh from DB on cache miss)
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("patTokens", "tokenVersions");
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(200)
                .expireAfterWrite(2, TimeUnit.MINUTES)
                .recordStats() // Useful for monitoring cache hit ratios
        );
        return cacheManager;
    }
}
