# 1. Build Stage: Use an image with Java 17 and Gradle pre-installed
FROM gradle:9-jdk21 AS builder
WORKDIR /app

# Copy configuration files first to leverage Docker cache
COPY build.gradle settings.gradle ./
# Copy source code
COPY src ./src

# Build the application, skipping tests to speed up the build process
RUN gradle build -x test --no-daemon

# 2. Runtime Stage: Use a slim image just for running the application
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the JAR file generated in the previous step
# We use a wildcard *.jar because the version name might change
COPY --from=builder /app/build/libs/*.jar app.jar

# Expose port 8080
EXPOSE 8080

# Command to start the application
ENTRYPOINT ["java", "-jar", "app.jar"]