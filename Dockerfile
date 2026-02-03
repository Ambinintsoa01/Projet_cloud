# Stage 1: Build
FROM maven:3.9.5-eclipse-temurin-17 AS build
WORKDIR /app

# Copier le pom.xml et télécharger les dépendances (cache layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copier le code source
COPY src ./src

# Builder l'application (skip tests pour build plus rapide)
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:17-jre
WORKDIR /app

# Installer wget pour healthcheck
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

# Créer un utilisateur non-root pour la sécurité
RUN groupadd -r spring && useradd -r -g spring spring

# Copier le JAR depuis le stage build
COPY --from=build /app/target/identity-provider.jar app.jar

# Créer le dossier pour Firebase (vide, le fichier sera monté par Docker Compose)
RUN mkdir -p /app/firebase && chown -R spring:spring /app

USER spring:spring
EXPOSE 8080

ENV JAVA_OPTS="-Xms256m -Xmx512m" \
    SPRING_PROFILES_ACTIVE="docker"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Djava.security.egd=file:/dev/./urandom -jar app.jar"]
