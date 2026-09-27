# Multi-stage Dockerfile for Women Safety Portal Spring Boot Backend

# Stage 1: Build
FROM maven:3.9.9-eclipse-temurin-17-alpine AS builder
WORKDIR /build

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build production jar
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create upload directory
RUN mkdir -p /app/uploads

# Copy built application jar
COPY --from=builder /build/target/women-safety-portal-backend-1.0.0.jar /app/app.jar

ENV PORT=5000
ENV UPLOAD_DIR=/app/uploads

EXPOSE 5000

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "/app/app.jar"]
