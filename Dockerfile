# 1. Set the base image
FROM eclipse-temurin:21-jdk-alpine AS dependencies

# 2. Download the dependencies 
RUN apk add --no-cache maven
WORKDIR /build
COPY /server/pom.xml .
RUN mvn dependency:go-offline

# 3. Build the application
FROM dependencies AS builder
COPY /server/src ./src
RUN mvn clean package -DskipTests

# 4. Run the application
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app
COPY --from=builder /build/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
