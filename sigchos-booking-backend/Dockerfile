# ─────────────────────────────────────────────────────────────
# Stage 1: Build — usa Maven + JDK 21 para compilar el JAR
# ─────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21-alpine AS build

WORKDIR /app

# Copia el pom.xml primero para aprovechar el cache de capas de Docker
# (si solo cambia el código Java, Maven no re-descarga dependencias)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copia el código fuente y compila
COPY src ./src
RUN mvn clean package -DskipTests -B

# ─────────────────────────────────────────────────────────────
# Stage 2: Runtime — imagen mínima solo con JRE 21
# ─────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime

WORKDIR /app

# Copia solo el JAR generado desde la etapa de build
COPY --from=build /app/target/sigchos-booking-backend-0.0.1-SNAPSHOT.jar app.jar

# Render inyecta PORT como variable de entorno (normalmente 10000)
EXPOSE 8080

# Arranca la app. Spring tomará PORT del entorno automáticamente
ENTRYPOINT ["java", "-jar", "app.jar"]
