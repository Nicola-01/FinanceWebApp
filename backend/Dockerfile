# Stage 1: Base & Dependencies
FROM gradle:9-jdk21 AS base
WORKDIR /app
COPY build.gradle settings.gradle ./
RUN gradle dependencies --no-daemon

# Stage 2: Sviluppo (development)
FROM base AS development
COPY src ./src
EXPOSE 8080
CMD ["gradle", "bootRun", "--no-daemon"]

# Stage 3: Build (production)
FROM base AS builder
COPY src ./src
RUN gradle build -x test --no-daemon

# Stage 4: Runtime (Target: production)
FROM eclipse-temurin:21-jre-alpine AS production
WORKDIR /app
# Install pg_dump / psql (postgresql-client), openssl, gzip needed for backup
RUN apk add --no-cache postgresql-client openssl gzip
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]